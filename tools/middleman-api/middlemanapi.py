import asyncio
import json
import os
import signal
import sys
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

try:
    import pyperclip
    PYPERCLIP_AVAILABLE = True
except ImportError:
    PYPERCLIP_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
HOST = os.getenv("MIDDLEMAN_HOST", "127.0.0.1")
PORT = int(os.getenv("MIDDLEMAN_PORT", "8000"))
DEBUG = os.getenv("MIDDLEMAN_DEBUG", "false").lower() == "true"

app = FastAPI(title="Manual Middleman API", version="1.0.0")

# Store for active requests (for potential future cancellation feature)
active_requests: List[str] = []


def estimate_tokens(text: str) -> int:
    """Roughly estimate token count (approx 4 chars per token for English)."""
    if not text:
        return 0
    return max(1, len(text) // 4)


def format_conversation_context(messages: List[Dict[str, Any]]) -> str:
    """Format the conversation history for human operator."""
    output = "\n" + "="*60 + "\n"
    output += "CONVERSATION CONTEXT (Latest messages first):\n"
    output += "="*60 + "\n\n"
    
    for i, msg in enumerate(reversed(messages[-5:]), 1):  # Show last 5 messages
        role = msg.get('role', 'unknown')
        content = msg.get('content', '')[:500]  # Limit content length for readability
        output += f"[{i}] {role.upper()}:\n{content}\n"
        if len(msg.get('content', '')) > 500:
            output += "... (truncated)\n"
        output += "\n"
    
    output += "="*60
    return output


def copy_to_clipboard(text: str) -> bool:
    """Copy text to clipboard if pyperclip is available."""
    if not PYPERCLIP_AVAILABLE:
        return False
    
    try:
        pyperclip.copy(text)
        return True
    except Exception as e:
        logger.warning(f"Failed to copy to clipboard: {e}")
        return False


@app.get("/v1/models")
async def list_models():
    """List available models (OpenAI compatibility)."""
    return {"object": "list", "data": [{"id": "manual-bridge"}]}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/v1/chat/completions")
async def chat_proxy(request: Request):
    """
    Main endpoint that accepts chat completion requests from Cline
    and allows a human operator to manually provide responses.
    """
    request_id = str(uuid.uuid4())[:8]
    active_requests.append(request_id)
    
    try:
        logger.info(f"[{request_id}] Request received from Cline")
        
        # Parse and validate request
        try:
            data = await request.json()
        except Exception as e:
            logger.error(f"[{request_id}] Failed to parse JSON: {e}")
            return JSONResponse(
                status_code=400,
                content={"error": {"message": f"Invalid JSON: {e}", "type": "invalid_request_error"}}
            )
        
        # Validate messages structure
        messages = data.get("messages")
        if not messages or not isinstance(messages, list) or len(messages) == 0:
            logger.error(f"[{request_id}] Invalid messages format")
            return JSONResponse(
                status_code=400,
                content={"error": {"message": "Missing or invalid 'messages' field", "type": "invalid_request_error"}}
            )
        
        # Extract latest user message
        latest_message = messages[-1]
        if not isinstance(latest_message, dict) or 'content' not in latest_message:
            logger.error(f"[{request_id}] Invalid message structure")
            return JSONResponse(
                status_code=400,
                content={"error": {"message": "Invalid message structure", "type": "invalid_request_error"}}
            )
        
        user_prompt = latest_message.get('content', '')
        logger.info(f"[{request_id}] User prompt: {user_prompt[:100]}{'...' if len(user_prompt) > 100 else ''}")
        
        # Copy request JSON to clipboard for operator convenience
        request_json = json.dumps(data, indent=2)
        if copy_to_clipboard(request_json):
            print("\n" + "!"*60)
            logger.info(f"[{request_id}] Request JSON copied to clipboard!")
            print("!"*60)
            print("You can paste this into your external tool/application.")
            print("!"*60)
        else:
            logger.warning(f"[{request_id}] Clipboard not available (pyperclip not installed)")
        
        # Show conversation context to human operator
        print("\n" + "!"*60)
        logger.info(f"[{request_id}] ======= REQUEST FROM CLINE =======")
        print(format_conversation_context(messages))
        
        # Get manual input from operator
        print("\n[MANUAL INPUT] Paste your response below.")
        print("Type 'SEND' on a new line and press Enter when done.")
        print("Type 'SKIP' to skip this request (return empty).")
        print("Type 'EXIT' to shutdown the server.")
        print("-" * 60)
        
        lines = []
        while True:
            try:
                line = sys.stdin.readline()
                if not line:  # EOF
                    logger.warning(f"[{request_id}] EOF detected, treating as EXIT")
                    return JSONResponse(
                        status_code=500,
                        content={"error": {"message": "Server shutdown", "type": "server_error"}}
                    )
                
                stripped = line.strip()
                if stripped.upper() == "SEND":
                    break
                elif stripped.upper() == "SKIP":
                    lines = []
                    logger.info(f"[{request_id}] Request skipped by operator")
                    break
                elif stripped.upper() == "EXIT":
                    logger.info(f"[{request_id}] Shutdown requested by operator")
                    lines = []
                    # Trigger graceful shutdown
                    asyncio.create_task(shutdown_server())
                    break
                else:
                    lines.append(line)
            except KeyboardInterrupt:
                logger.info(f"[{request_id}] Interrupted by user")
                return JSONResponse(
                    status_code=500,
                    content={"error": {"message": "Interrupted", "type": "server_error"}}
                )
        
        # Clean up the pasted content
        full_content = "".join(lines).strip()
        
        # Calculate actual token counts
        prompt_tokens = estimate_tokens(str(messages))
        completion_tokens = estimate_tokens(full_content)
        total_tokens = prompt_tokens + completion_tokens
        
        # Build response
        if not full_content:
            full_content = "I am ready. Please provide instructions."
            logger.info(f"[{request_id}] Empty response, using default")
        
        response_body = {
            "id": f"chatcmpl-{request_id}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": "manual-bridge",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": full_content
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens
            }
        }
        
        logger.info(f"[{request_id}] Response sent to Cline ({len(full_content)} chars, {completion_tokens} tokens)")
        print(f"--- Response delivered to Cline ---\n")
        
        return response_body
        
    finally:
        if request_id in active_requests:
            active_requests.remove(request_id)


@app.on_event("startup")
async def startup_event():
    logger.info("="*60)
    logger.info("MANUAL MIDDLEMAN API STARTED")
    logger.info(f"Server running at: http://{HOST}:{PORT}")
    logger.info(f"Health check: http://{HOST}:{PORT}/health")
    logger.info("Configure Cline to use: http://{HOST}:{PORT}/v1/chat/completions")
    if PYPERCLIP_AVAILABLE:
        logger.info("Clipboard support: ENABLED (requests auto-copied)")
    else:
        logger.info("Clipboard support: DISABLED (install pyperclip to enable)")
    logger.info("="*60)


shutdown_event = asyncio.Event()


async def shutdown_server():
    """Graceful shutdown."""
    logger.info("Shutting down server...")
    shutdown_event.set()


if __name__ == "__main__":
    # Handle signals for graceful shutdown
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    def signal_handler():
        shutdown_event.set()
    
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)
    
    config = uvicorn.Config(
        app=app,
        host=HOST,
        port=PORT,
        log_level="info" if DEBUG else "warning",
        loop="asyncio"
    )
    server = uvicorn.Server(config)
    
    try:
        loop.run_until_complete(server.serve())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        logger.info("Server shutdown complete")
# Manual Middleman API - Documentation

## Overview

The Manual Middleman API is an OpenAI-compatible server that acts as a bridge between Cline (an AI assistant) and a human operator. It allows you to manually review and craft responses to Cline's queries before they are sent back.

## How It Works

1. Cline sends a chat completion request to this API server
2. The server displays the conversation context and the latest user message
3. A human operator reads the context and crafts a response manually
4. The operator types `SEND` to deliver the response back to Cline
5. Cline receives the response as if it came from an AI model

## Setup & Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Install Dependencies

```bash
cd project/ai_scripts
pip install fastapi uvicorn
```

#### Optional: Clipboard Support

For automatic clipboard copying (recommended):

```bash
pip install pyperclip
```

On Linux, you may also need:
```bash
sudo apt-get install xclip  # or xsel
```

### Run the Server

```bash
python middlemanapi.py
```

Or with custom configuration:

```bash
export MIDDLEMAN_HOST=127.0.0.1
export MIDDLEMAN_PORT=8000
export MIDDLEMAN_DEBUG=true
python middlemanapi.py
```

The server will start at `http://127.0.0.1:8000` by default.

### Configure Cline

In Cline's settings, set the API base URL to:

```
http://127.0.0.1:8000/v1
```

And set the model to:

```
manual-bridge
```

## Operator Workflow

When a request arrives from Cline, you'll see output like this:

```
!================================================== REQUEST RECEIVED FROM CLINE ==================================================!

=============================================================
CONVERSATION CONTEXT (Latest messages first):
=============================================================

[1] USER:
Can you help me debug this Python code?

[2] ASSISTANT:
I'd be happy to help! Please share the code you'd like me to review.

=============================================================

[MANUAL INPUT] Paste your response below.
Type 'SEND' on a new line and press Enter when done.
Type 'SKIP' to skip this request (return empty).
Type 'EXIT' to shutdown the server.
------------------------------------------------------------
```

### Clipboard Feature

If `pyperclip` is installed, the full request JSON will be **automatically copied to your clipboard** when a request arrives. You'll see:

```
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Request JSON copied to clipboard!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
You can paste this into your external tool/application.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

This allows you to:
- Paste the raw Cline request into an external AI model (ChatGPT, Claude, etc.)
- Get a response from that model
- Copy the response and paste it into the middleman terminal
- Type `SEND` to deliver it back to Cline

This effectively lets you use any external AI as a "middleman" for Cline.

### Commands

| Command | Description |
|---------|-------------|
| `SEND` | Submit your typed/pasted response to Cline |
| `SKIP` | Return a default response ("I am ready. Please provide instructions.") |
| `EXIT` | Gracefully shut down the server |
| `Ctrl+C` | Immediately interrupt/stop the server |

### Best Practices for Responding

1. **Read the full context**: The server shows the last 5 messages. Review the conversation history to understand the context.

2. **Match the expected format**: Your response should be natural, helpful text that Cline can process. You can include:
   - Code blocks (wrapped in triple backticks)
   - Markdown formatting
   - Bullet points and numbered lists
   - Explanations and instructions

3. **Be concise but thorough**: Cline users expect direct, actionable responses.

4. **Example responses**:

   **For a coding question:**
   ```
   Here's the fix for your code:

   ```python
   def calculate_total(items):
       return sum(item['price'] * item['quantity'] for item in items)
   ```

   The main issue was that you weren't multiplying by quantity.
   ```

   **For a file operation:**
   ```
   I've analyzed the file structure. Here are the key observations:

   1. The configuration file is missing a required field
   2. The dependencies are outdated
   3. There's a syntax error on line 42

   Would you like me to provide specific fixes?
   ```

5. **When in doubt**: If you're unsure what Cline needs, you can ask clarifying questions just as an AI assistant would.

## API Endpoints

### `GET /v1/models`

Returns the available model list. Should return `manual-bridge` as the model ID.

**Response:**
```json
{
  "object": "list",
  "data": [{"id": "manual-bridge"}]
}
```

### `POST /v1/chat/completions`

Main endpoint for chat completions. Expects OpenAI-compatible request format.

**Request format:**
```json
{
  "model": "manual-bridge",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant..."},
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi, how can I help?"},
    {"role": "user", "content": "What's the weather?"}
  ],
  "stream": false
}
```

**Response format:**
```json
{
  "id": "chatcmpl-xxxxxxxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "manual-bridge",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Your manually crafted response here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  }
}
```

### `GET /health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-16T06:00:00.000000"
}
```

## Logging & Diagnostics

The server logs:
- All incoming requests with request IDs
- The user's prompt (truncated to 100 chars in logs)
- Operator actions (SEND, SKIP, EXIT)
- Response delivery confirmations
- Clipboard availability status

Logs are output to stdout in the format:

```
2026-03-16 06:00:00,123 [INFO] [req123] Message logged
```

Set `MIDDLEMAN_DEBUG=true` for more verbose logging (shows all request details).

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Successful response
- `400`: Invalid request (missing/invalid JSON, invalid messages)
- `500`: Server error (shutdown, interruption)

## Multi-Request Handling

- The server handles one request at a time (synchronous operator input)
- If multiple requests arrive while you're typing, they'll queue and be processed sequentially
- Request IDs help track individual requests in logs

## Shutdown Gracefully

Always use `EXIT` command or `Ctrl+C` to shut down the server properly. This ensures:
- Active requests complete
- Resources are cleaned up
- No data corruption

## Troubleshooting

### "Connection refused" when Cline tries to connect
- Ensure the server is running (`python middlemanapi.py`)
- Check the host and port configuration
- Verify there are no firewall blocking the port

### No output when request arrives
- Check that stdin is working properly (the server reads from terminal input)
- Ensure you're running the server in an interactive terminal, not as a background daemon

### Clipboard not working
- Install pyperclip: `pip install pyperclip`
- On Linux, install xclip or xsel: `sudo apt-get install xclip`
- The server will log a warning if clipboard is unavailable

### Server crashes on malformed request
- The server validates all requests and returns proper error responses
- Check logs for error details
- The request will fail gracefully and Cline may retry

## Advanced Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MIDDLEMAN_HOST` | `127.0.0.1` | Host address to bind |
| `MIDDLEMAN_PORT` | `8000` | Port number |
| `MIDDLEMAN_DEBUG` | `false` | Enable verbose logging |

### Running as a System Service (Linux)

Create a systemd service file at `/etc/systemd/system/middleman-api.service`:

```ini
[Unit]
Description=Manual Middleman API
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/KwekKwekQuiz/project/ai_scripts
ExecStart=/usr/bin/python /path/to/KwekKwekQuiz/project/ai_scripts/middlemanapi.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable middleman-api
sudo systemctl start middleman-api
sudo systemctl status middleman-api
```

## Security Considerations

⚠️ **Important**: This server exposes no authentication. Only run it on localhost (127.0.0.1) and never expose it to public networks.

The server:
- Binds to localhost only by default
- Has no authentication or authorization
- Accepts requests from any client that can reach it

Only use this in a trusted, local development environment.

## Contributing

This is a utility script for local development. Modify as needed for your workflow.

## License

Part of the KwekKwekQuiz project.
/**
 * @fileoverview Gemini Service module for KwekKwekQuiz
 * Handles AI-powered quiz generation using Google's Gemini API.
 * @module geminiService
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as DOM from './dom.js';
import { jsonStateManager } from './jsonStateManager.js';
import { showError, showSuccess, clearError } from './utils.js';

/**
 * Gemini Service for handling AI-powered quiz generation
 * 
 * SECURITY WARNING: This client-side application stores API keys in localStorage.
 * While keys are obfuscated for casual exposure prevention, they remain accessible
 * to any script running in the browser. For production use, consider a backend proxy.
 * 
 * Configuration: Default API key can be set via VITE_GEMINI_API_KEY environment variable.
 * @class GeminiService
 * @todo Implement rate limiting to prevent API abuse
 * @toimprove Add support for different AI models and providers
 * @tofix Ensure proper error handling for all API interactions
 */
export class GeminiService {
  /**
   * Creates a new GeminiService instance
   * @param {Object} options - Configuration options
   * @param {string} [options.modelName="models/gemini-flash-latest"] - Gemini model name
   * @param {string} [options.fallbackPrompt="Generate a quiz in JSON format based on the following topic: "] - Fallback prompt when prompt file fails
   * @param {string} [options.baseURL=import.meta.env.BASE_URL] - Base URL for prompt file
   */
  constructor(options = {}) {
    this.modelName = options.modelName || "models/gemini-flash-latest";
    this.fallbackPrompt = options.fallbackPrompt || "Generate a quiz in JSON format based on the following topic: ";
    this.baseURL = options.baseURL || import.meta.env.BASE_URL;
    this.client = null;
    this.apiKey = null;
    this.promptText = null;
    this.promptLoading = null;
  }

  // ==================== SECURITY UTILITIES ====================
  /**
   * Obfuscate API key for localStorage storage (simple XOR with fixed key)
   * @function obfuscateKey
   * @static
   * @param {string} key - The API key to obfuscate
   * @returns {string} The obfuscated API key
   * @todo Implement stronger encryption for API key storage
   * @toimprove Use a more secure method for client-side key storage
   * @tofix Consider moving sensitive operations to a backend service
   */
  static obfuscateKey(key) {
    if (!key) return '';
    const xorKey = 0x5A; // Simple obfuscation - not cryptographically secure
    return btoa(key.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ xorKey)
    ).join(''));
  }

  /**
   * Deobfuscate API key from localStorage
   * @function deobfuscateKey
   * @static
   * @param {string} obfuscated - The obfuscated API key
   * @returns {string} The deobfuscated API key
   * @todo Implement stronger decryption for API key retrieval
   * @toimprove Use a more secure method for client-side key retrieval
   * @tofix Consider moving sensitive operations to a backend service
   */
  static deobfuscateKey(obfuscated) {
    if (!obfuscated) return '';
    try {
      const xorKey = 0x5A;
      return atob(obfuscated).split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) ^ xorKey)
      ).join('');
    } catch (e) {
      console.error('Failed to deobfuscate API key:', e);
      return '';
    }
  }

  /**
   * Validate Gemini API key format (basic check for AIza... prefix)
   * @function validateKeyFormat
   * @static
   * @param {string} key - The API key to validate
   * @returns {boolean} Whether the key format is valid
   * @todo Add more comprehensive API key validation
   * @toimprove Implement verification against actual API endpoint
   * @tofix Ensure validation covers all valid key formats
   */
  static validateKeyFormat(key) {
    if (!key || typeof key !== 'string') return false;
    // Gemini API keys typically start with "AIza"
    return key.startsWith('AIza') && key.length >= 30;
  }

  // ==================== PROMPT LOADING ====================
  /**
   * Loads prompt engineering text with caching and error handling
   * Uses a "loading gate" pattern to ensure only one fetch occurs at a time.
   * All concurrent callers receive the same promise, preventing race conditions.
   * @async
   * @function loadPromptEngineeringText
   * @returns {Promise<string>} Resolved prompt text
   * @todo Add retry mechanism for failed requests
   * @toimprove Implement progressive loading for large prompt files
   * @tofix Ensure proper cleanup of loading state on errors
   */
  async loadPromptEngineeringText() {
    // Return cached text immediately if available
    if (this.promptText) {
      return this.promptText;
    }

    // If a load is already in progress, return that promise to all callers
    if (this.promptLoading) {
      return this.promptLoading;
    }

    // Create a single loading promise that all concurrent calls will share
    this.promptLoading = (async () => {
      try {
        const text = await this._fetchPromptText();
        this.promptText = text; // Cache successful result
        return text;
      } catch (error) {
        console.error('Error loading promptEngineeringText.txt:', error);
        showError('Failed to load internal prompt configuration. AI generation might be affected.');
        return this.fallbackPrompt; // Return fallback on error (not cached)
      } finally {
        // Always clear the loading flag, regardless of success or error
        this.promptLoading = null;
      }
    })();

    return await this.promptLoading;
  }

  /**
   * Fetches prompt text from file
   * @async
   * @private
   * @function _fetchPromptText
   * @returns {Promise<string>} Prompt text
   * @todo Add timeout mechanism for fetch requests
   * @toimprove Implement caching with expiration
   * @tofix Handle CORS errors appropriately
   */
  async _fetchPromptText() {
    const response = await fetch(`${this.baseURL}data/promptEngineeringText.txt`);
    if (!response.ok) {
      throw new Error(`File not found or network error: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Fetches JSON schema text from file
   * @async
   * @private
   * @function _getJsonSchemaText
   * @returns {Promise<string>} JSON schema text
   * @todo Add timeout mechanism for fetch requests
   * @toimprove Implement caching with expiration
   * @tofix Handle CORS errors appropriately
   */
  async _getJsonSchemaText() {
    const response = await fetch(`${this.baseURL}data/jsonSchema.txt`);
    if (!response.ok) {
      throw new Error(`JSON schema file not found or network error: ${response.statusText}`);
    }
    return await response.text();
  }

  // ==================== API KEY MANAGEMENT ====================
  /**
   * Validates API key and initializes client
   * @function validateAndInitializeClient
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Whether client is ready
   * @todo Add more comprehensive API key validation
   * @toimprove Implement automatic key refresh mechanisms
   * @tofix Ensure proper error handling for all client initialization scenarios
   */
  validateAndInitializeClient(apiKey) {
    if (!apiKey) {
      showError("API Key is required for AI generation. Please set it in Settings.");
      return false;
    }

    // Validate format before attempting to use
    if (!GeminiService.validateKeyFormat(apiKey)) {
      showError("Invalid API key format. Gemini keys start with 'AIza'.");
      return false;
    }

    if (this.client && this.apiKey === apiKey) {
      return true;
    }

    try {
      if (typeof GoogleGenerativeAI !== 'function') {
        throw new Error("GoogleGenerativeAI is not available. Check import.");
      }

      this.client = new GoogleGenerativeAI(apiKey);
      this.apiKey = apiKey;
      clearError();
      return true;
    } catch (error) {
      showError("Failed to initialize Gemini client: " + error.message);
      console.error("Initialization error:", error);
      this.client = null;
      this.apiKey = null;
      return false;
    }
  }

  // ==================== IMAGE HANDLING ====================
  /**
   * Reads image file as base64 with strict validation
   * Validates MIME type (JPEG/PNG/WebP only) and size (max 4MB)
   * @async
   * @function readImageAsBase64
   * @param {File} file - Image file to read
   * @returns {Promise<string>} Base64 string
   * @todo Add support for additional image formats
   * @toimprove Implement image compression before encoding
   * @tofix Ensure proper error handling for all image processing scenarios
   */
  async readImageAsBase64(file) {
    return new Promise((resolve, reject) => {
      // Validate file size (max 4MB - safe limit for API payload)
      if (file.size > 4 * 1024 * 1024) {
        const err = new Error('Image size must be less than 4MB');
        err.code = 'INVALID_INPUT';
        reject(err);
        return;
      }

      // Validate MIME type - only Gemini-supported formats
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        const err = new Error(`Invalid image format. Only ${allowedTypes.join(', ')} are supported.`);
        err.code = 'INVALID_INPUT';
        reject(err);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (!result || typeof result !== 'string') {
          const err = new Error('Failed to read image file');
          err.code = 'INVALID_INPUT';
          reject(err);
          return;
        }

        const commaIndex = result.indexOf(',');
        if (commaIndex === -1) {
          const err = new Error('Invalid image data format');
          err.code = 'INVALID_INPUT';
          reject(err);
          return;
        }

        resolve(result.slice(commaIndex + 1));
      };
      reader.onerror = () => {
        const err = new Error('Error reading image file');
        err.code = 'INVALID_INPUT';
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  }

  // ==================== INPUT SANITIZATION ====================
  /**
   * Sanitizes user prompt to prevent XSS and control character issues
   * Preserves prompt functionality while removing dangerous content
   * @private
   * @function _sanitizePrompt
   * @param {string} prompt - User-provided prompt
   * @returns {string} Sanitized prompt
   * @todo Add more comprehensive sanitization rules
   * @toimprove Implement context-aware sanitization
   * @tofix Ensure sanitization doesn't affect legitimate prompt content
   */
  _sanitizePrompt(prompt) {
    if (!prompt) return '';
    
    // Escape HTML entities to prevent XSS attacks
    let sanitized = prompt
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    // Remove control characters (ASCII 0-31 and 127) except line breaks and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
  }

 // ==================== PROMPT PREPARATION ====================
  /**
   * Prepares prompt content for API call
   * @private
   * @function _preparePrompt
   * @param {string} basePrompt - Base prompt text
   * @param {string} userPrompt - User-provided prompt
   * @param {File} [imageFile] - Optional image file
   * @returns {Object} Prepared prompt content
   * @todo Add more sophisticated prompt engineering techniques
   * @toimprove Implement dynamic prompt templates
   * @tofix Ensure proper formatting for all prompt variations
   */
  _preparePrompt(basePrompt, userPrompt, imageFile) {
    const sanitizedUserPrompt = this._sanitizePrompt(userPrompt);
    
    if (imageFile) {
      return {
        text: basePrompt + (sanitizedUserPrompt || "Generate a quiz based on this image."),
        image: imageFile
      };
    }
    return {
      text: basePrompt + sanitizedUserPrompt
    };
  }

  // ==================== API CALL ====================
  /**
   * Maps Gemini API errors to standardized types and user-friendly messages
   * @private
   * @function _mapApiError
   * @param {Error} error - The caught error object
   * @returns {{ type: string, message: string }} Standardized error info
   * @todo Add more specific error type mappings
   * @toimprove Implement error categorization for better reporting
   * @tofix Ensure all possible error scenarios are handled
   */
  _mapApiError(error) {
    const { message, code, status, details } = error;
    
    // Determine error type based on structured data when available
    let errorType = 'UNKNOWN';
    let userMessage = 'An unexpected error occurred. Please try again.';

    // Check for local validation errors (from readImageAsBase64, etc.)
    if (code === 'INVALID_INPUT') {
      errorType = 'INVALID_INPUT';
      userMessage = message || 'Invalid input. Please check your data and try again.';
    }
    // Check for API key issues
    else if (code === 'INVALID_ARGUMENT' || status === 400 || 
            message?.includes('API key not valid', 'API_KEY_INVALID')) {
      errorType = 'INVALID_KEY';
      userMessage = 'Your API key is invalid or not enabled for the Gemini API. Please check your key in Settings.';
    }
    // Check for quota/rate limiting
    else if (code === 'RESOURCE_EXHAUSTED' || status === 429 || 
             message?.includes('Quota exceeded', 'rate limit')) {
      errorType = 'QUOTA_LIMIT';
      userMessage = 'You have exceeded your API quota or rate limit. Please try again later or check your billing.';
    }
    // Check for network issues
    else if (status === 0 || status === 503 || 
             message?.includes('network', 'Network', 'fetch', 'ECONNREFUSED')) {
      errorType = 'NETWORK_ERROR';
      userMessage = 'Network error: Unable to connect to Gemini API. Please check your internet connection.';
    }
    // Default fallback
    else {
      errorType = 'UNKNOWN';
      userMessage = message || 'An unknown error occurred.';
    }

    return { type: errorType, message: userMessage };
  }

  /**
   * Calls Gemini API with proper error handling and JSON schema compliance
   * @async
   * @private
   * @function _callGeminiAPI
   * @param {string} prompt - Prompt text
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} API response
   * @todo Add retry mechanism for failed API calls
   * @toimprove Implement request/response logging for debugging
   * @tofix Ensure proper error propagation to calling functions
   */
  async _callGeminiAPI(prompt, options = {}) {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      let result;

      // Prepare prompt with JSON schema requirements
      const schemaText = await this._getJsonSchemaText();
      const enhancedPrompt = `${prompt}\n\n${schemaText}\n\nPlease ensure your response strictly follows this JSON schema and includes at least 20 questions covering all key points in the topic.`;

      if (options.image) {
        const imageBase64 = await this.readImageAsBase64(options.image);
        const promptParts = [
          { text: enhancedPrompt },
          {
            inlineData: {
              mimeType: options.image.type,
              data: imageBase64
            }
          }
        ];

        result = await model.generateContent({
          contents: [{ role: "user", parts: promptParts }]
        });
      } else {
        result = await model.generateContent(enhancedPrompt);
      }

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating text with AI:", error);
      
      // Use structured error mapping instead of string parsing
      const mappedError = this._mapApiError(error);
      throw new Error(mappedError.message);
    }
  }

  // ==================== RESPONSE PROCESSING ====================
  /**
   * Processes API response and extracts JSON
   * @private
   * @function _processResponse
   * @param {string} rawText - Raw text response
   * @returns {Object} Parsed JSON object
   * @todo Add more robust JSON parsing with recovery options
   * @toimprove Implement response validation against schema
   * @tofix Handle various JSON formatting inconsistencies
   */
  _processResponse(rawText) {
    let cleanedText = rawText.trim();
    
    const startsWithCodeBlock = cleanedText.startsWith('```');
    const endsWithCodeBlock = cleanedText.endsWith('```');
    
    if (startsWithCodeBlock && endsWithCodeBlock) {
      cleanedText = cleanedText.slice(3, -3).trim();
      cleanedText = cleanedText.replace(/^\w+\s*/, '');
    }

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error from AI:", parseError.message, "\nRaw AI output:", cleanedText);
      throw new Error(`AI generated invalid JSON: ${parseError.message}`);
    }
  }

  // ==================== UI STATE MANAGEMENT ====================
  /**
   * Updates UI state during processing.
   * Resolves the correct generate button based on current mode.
   * @private
   * @function _updateUIState
   * @param {boolean} processing - Whether processing is active
   * @param {string} [originalText] - Original button HTML to restore
   * @todo Add more comprehensive UI state management
   * @toimprove Implement loading indicators for different processing stages
   * @tofix Ensure UI state is properly restored after all processing scenarios
   */
  _updateUIState(processing, originalText) {
    // Resolve the active generate button based on mode
    const activeBtn = jsonStateManager.isBuilderMode()
      ? DOM.builderGenerateBtn
      : DOM.editorGenerateBtn;

    if (!activeBtn) return;

    if (processing) {
      activeBtn.disabled = true;
      if (!this._savedButtonText) {
        this._savedButtonText = activeBtn.innerHTML;
      }
      activeBtn.innerHTML = `
        <span class="loading-dots flex items-center gap-2">
          <span class="w-2 h-2 bg-white rounded-full animate-bounce"></span>
          <span class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: -0.3s"></span>
          <span class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: -0.1s"></span>
        </span>
        <span class="ml-2 whitespace-nowrap">Generating</span>
      `;
      activeBtn.classList.add('loading');
    } else {
      activeBtn.disabled = false;
      activeBtn.classList.remove('loading');
      activeBtn.innerHTML = originalText || this._savedButtonText || 'Generate More';
      this._savedButtonText = null;
    }
  }

  // ==================== MAIN REQUEST HANDLER ====================
  /**
   * Main method to handle quiz generation request.
   * Reads mode and data from jsonStateManager — no DOM mode checks needed.
   * @async
   * @function handleGenerateQuizRequest
   * @returns {Promise<void>}
   * @todo Add progress tracking for long-running requests
   * @toimprove Implement cancellation support for ongoing requests
   * @tofix Ensure proper cleanup of temporary UI states
   */
  async handleGenerateQuizRequest() {
    if (!DOM.apiKeySettingInput) {
      console.error("API key input not found");
      return;
    }

    const activeBtn = jsonStateManager.isBuilderMode()
      ? DOM.builderGenerateBtn
      : DOM.editorGenerateBtn;

    const imageFile = DOM.quizImageInput?.files?.[0] || null;
    const apiKey = DOM.apiKeySettingInput.value.trim();

    if (!this.validateAndInitializeClient(apiKey)) {
      return;
    }

    // Get user prompt: in editor mode it's the raw textarea text,
    // in builder mode it's empty (generation is context-based)
    const userPrompt = jsonStateManager.isEditorMode()
      ? jsonStateManager.getRawEditorText().trim()
      : '';

    if (!userPrompt && !imageFile && !jsonStateManager.hasQuestions()) {
      showError("Please enter a prompt or upload an image to generate a quiz.");
      return;
    }

    const basePrompt = await this.loadPromptEngineeringText();
    const originalButtonText = activeBtn?.innerHTML || '';

    try {
      this._updateUIState(true, originalButtonText);
      clearError();

      const promptData = this._prepareSmartPrompt(basePrompt, userPrompt, imageFile);
      const rawText = await this._callGeminiAPI(promptData.text, { image: promptData.image });
      const parsedJSON = this._processResponse(rawText);

      this._handleGeneratedData(parsedJSON);

      clearError();
      showSuccess("Quiz generated successfully!");
    } catch (error) {
      console.error("Quiz generation failed:", error);
      showError(error.message);
    } finally {
      this._updateUIState(false, originalButtonText);
    }
  }

  /**
   * Prepare smart prompt that considers existing context and mode.
   * @private
   * @function _prepareSmartPrompt
   * @param {string} basePrompt - Base prompt text
   * @param {string} userPrompt - User-provided prompt
   * @param {File} imageFile - Optional image file
   * @returns {Object} Prepared prompt content
   * @todo Add more intelligent context-aware prompting
   * @toimprove Implement adaptive prompt strategies based on quiz type
   * @tofix Ensure context is properly incorporated into all prompt variations
   */
  _prepareSmartPrompt(basePrompt, userPrompt, imageFile) {
    const context = jsonStateManager.getAIContext(userPrompt);

    let enhancedPrompt = basePrompt;

    if (context.hasExistingData) {
      enhancedPrompt = `I have ${context.existingQuestions.length} existing quiz questions. Please generate 3-5 additional questions based on this context and the following prompt:\n\nExisting Questions:\n${JSON.stringify(context.existingQuestions, null, 2)}\n\nNew Prompt:\n${userPrompt}\n\nPlease return only the new questions in JSON format, do not include the existing questions.`;
    } else {
      enhancedPrompt = basePrompt + (userPrompt || "Please generate 5 quiz questions.");
    }

    return this._preparePrompt(enhancedPrompt, '', imageFile);
  }

  /**
   * Handle generated data — always writes through jsonStateManager.
   * Subscribers (quizBuilder, uiController) update their own DOM.
   * @private
   * @function _handleGeneratedData
   * @param {Object|Array} generatedData - The data generated by the AI
   * @todo Add validation for generated quiz data
   * @toimprove Implement incremental updates for large datasets
   * @tofix Ensure data integrity during state updates
   */
  _handleGeneratedData(generatedData) {
    const newQuestions = Array.isArray(generatedData) ? generatedData : [generatedData];

    if (jsonStateManager.hasQuestions()) {
      // Merge with existing data
      jsonStateManager.appendQuestions(newQuestions);
    } else {
      // New quiz — set directly
      jsonStateManager.setQuestions(newQuestions);
    }

    // Sync the editor textarea with the updated state
    const jsonString = jsonStateManager.toJSONString();
    if (DOM.quizJsonInput) {
      DOM.quizJsonInput.value = jsonString;
    }
  }
}

// Export instance with default configuration
export const geminiService = new GeminiService();

// Export main handler function for backward compatibility
/**
 * Handles the quiz generation request using the default Gemini service instance
 * @async
 * @function handleGenerateQuizRequest
 * @returns {Promise<void>}
 * @todo Add proper error handling wrapper
 * @toimprove Implement centralized logging
 * @tofix Ensure consistent return types across all handlers
 */
export async function handleGenerateQuizRequest() {
  await geminiService.handleGenerateQuizRequest();
}

// Attach to window for global access (used by builder's generate bridge)
if (typeof window !== 'undefined') {
  window.handleGenerateQuizRequest = handleGenerateQuizRequest;
}

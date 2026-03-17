// js/modules/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as DOM from './dom.js';
import { jsonStateManager } from './jsonStateManager.js';
import { showError, showSuccess, clearError } from './utils.js';
import { loadQuestionsFromJson } from './quizBuilder.js';

/**
 * Gemini Service for handling AI-powered quiz generation
 * 
 * SECURITY WARNING: This client-side application stores API keys in localStorage.
 * While keys are obfuscated for casual exposure prevention, they remain accessible
 * to any script running in the browser. For production use, consider a backend proxy.
 * 
 * Configuration: Default API key can be set via VITE_GEMINI_API_KEY environment variable.
 */

export class GeminiService {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.modelName - Gemini model name
   * @param {string} options.fallbackPrompt - Fallback prompt when prompt file fails
   * @param {string} options.baseURL - Base URL for prompt file
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
  // Obfuscate API key for localStorage storage (simple XOR with fixed key)
  static obfuscateKey(key) {
    if (!key) return '';
    const xorKey = 0x5A; // Simple obfuscation - not cryptographically secure
    return btoa(key.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ xorKey)
    ).join(''));
  }

  // Deobfuscate API key from localStorage
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

  // Validate Gemini API key format (basic check for AIza... prefix)
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
   * @returns {Promise<string>} Resolved prompt text
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
   * @private
   * @returns {Promise<string>} Prompt text
   */
  async _fetchPromptText() {
    const response = await fetch(`${this.baseURL}data/promptEngineeringText.txt`);
    if (!response.ok) {
      throw new Error(`File not found or network error: ${response.statusText}`);
    }
    return await response.text();
  }

  // ==================== API KEY MANAGEMENT ====================
  /**
   * Validates API key and initializes client
   * @param {string} apiKey - API key to validate
   * @returns {boolean> Whether client is ready
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
   * @param {File} file - Image file to read
   * @returns {Promise<string>} Base64 string
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
   * @param {string} prompt - User-provided prompt
   * @returns {string} Sanitized prompt
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
   * @param {string} basePrompt - Base prompt text
   * @param {string} userPrompt - User-provided prompt
   * @param {File} [imageFile] - Optional image file
   * @returns {Object> Prepared prompt content
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
   * @param {Error} error - The caught error object
   * @returns {{ type: string, message: string }} Standardized error info
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
   * Calls Gemini API with proper error handling
   * @param {string} prompt - Prompt text
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>> API response
   */
  async _callGeminiAPI(prompt, options = {}) {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      let result;

      if (options.image) {
        const imageBase64 = await this.readImageAsBase64(options.image);
        const promptParts = [
          { text: prompt },
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
        result = await model.generateContent(prompt);
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
   * @param {string} rawText - Raw text response
   * @returns {Object} Parsed JSON object
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
   * Updates UI state during processing
   * @param {Object} ui - UI elements
   * @param {boolean} processing - Whether processing is active
   * @param {string} [message] - Optional message to display
   */
  _updateUIState(ui, processing, message = null) {
    if (!ui.generateBtn || !ui.quizJsonInput ) return;

    if (processing) {
      ui.generateBtn.disabled = true;
      ui.generateBtn.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span> Generating';
      ui.quizJsonInput.value = message || "Generating quiz content...";
    } else {
      ui.generateBtn.disabled = false;
      ui.generateBtn.innerHTML = ui.originalButtonText;
      if (message) {
        ui.quizJsonInput.value = message;
      }
    }
  }

  // ==================== MAIN REQUEST HANDLER ====================
  /**
   * Main method to handle quiz generation request with improved state management
   * @param {Object} ui - UI elements
   * @returns {Promise<void>>
   */
  async handleGenerateQuizRequest(ui) {
    if (!ui.apiKeySettingInput || !ui.generateBtn) {
      console.error("Required UI elements not found");
      return;
    }

    const imageFile = ui.quizImageInput?.files?.[0] || null;
    const apiKey = ui.apiKeySettingInput.value.trim();

    // Validate inputs
    if (!this.validateAndInitializeClient(apiKey)) {
      return;
    }

    // Get user prompt from appropriate source based on mode
    const userPrompt = this._getUserPrompt();
    
    if (!userPrompt && !imageFile) {
      showError("Please enter a prompt or upload an image to generate a quiz.");
      return;
    }

    const basePrompt = await this.loadPromptEngineeringText();
    const originalButtonText = ui.generateBtn.innerHTML;

    try {
      this._updateUIState(ui, true, "Generating quiz content...");
      clearError();

      // Prepare prompt with context-aware generation
      const promptData = this._prepareSmartPrompt(basePrompt, userPrompt, imageFile);
      const rawText = await this._callGeminiAPI(promptData.text, { image: promptData.image });
      const parsedJSON = this._processResponse(rawText);

      // Handle the generated data based on context
      await this._handleGeneratedData(parsedJSON, ui);
      
      clearError();
      showSuccess("Quiz generated successfully!");
    } catch (error) {
      console.error("Quiz generation failed:", error);
      showError(error.message);
    } finally {
      this._updateUIState(ui, false, null);
      ui.originalButtonText = originalButtonText;
    }
  }

  /**
   * Get user prompt from the appropriate source based on current mode
   * @private
   * @returns {string} User prompt
   */
  _getUserPrompt() {
    // Try to get prompt from JSON state manager first
    const currentState = jsonStateManager.getCurrentData();
    if (currentState && typeof currentState === 'string' && currentState.trim() !== '') {
      return currentState;
    }

    // Fall back to DOM element if state manager doesn't have data
    if (typeof DOM.quizJsonInput !== 'undefined' && DOM.quizJsonInput && DOM.quizJsonInput.value) {
      return DOM.quizJsonInput.value.trim();
    }

    return '';
  }

  /**
   * Prepare smart prompt that considers existing context and mode
   * @private
   * @param {string} basePrompt - Base prompt text
   * @param {string} userPrompt - User-provided prompt
   * @param {File} [imageFile] - Optional image file
   * @returns {Object} Prepared prompt content
   */
  _prepareSmartPrompt(basePrompt, userPrompt, imageFile) {
    const context = jsonStateManager.getAIContext(userPrompt);
    
    let enhancedPrompt = basePrompt;
    
    if (context.hasExistingData) {
      // Context-aware generation for existing quizzes
      if (context.mode === 'builder') {
        enhancedPrompt = `I have ${context.existingQuestions.length} existing quiz questions in builder mode. Please generate 3-5 additional questions based on this context and the following prompt:\n\nExisting Questions:\n${JSON.stringify(context.existingQuestions, null, 2)}\n\nNew Prompt:\n${userPrompt}\n\nPlease return only the new questions in JSON format, do not include the existing questions.`;
      } else {
        enhancedPrompt = `I have ${context.existingQuestions.length} existing quiz questions. Please generate 3-5 additional questions based on this context and the following prompt:\n\nExisting Questions:\n${JSON.stringify(context.existingQuestions, null, 2)}\n\nNew Prompt:\n${userPrompt}\n\nPlease return only the new questions in JSON format, do not include the existing questions.`;
      }
    } else {
      // Standard generation for new quizzes
      enhancedPrompt = basePrompt + (userPrompt || "Please generate 5 quiz questions.");
    }

    return this._preparePrompt(enhancedPrompt, '', imageFile);
  }

  /**
   * Handle generated data based on context and mode
   * @private
   * @param {Object|Array} generatedData - Generated quiz data
   * @param {Object} ui - UI elements
   */
  async _handleGeneratedData(generatedData, ui) {
    const context = jsonStateManager.getAIContext();
    
    if (context.hasExistingData) {
      // Merge with existing data
      const mergedData = jsonStateManager.mergeNewQuestions(Array.isArray(generatedData) ? generatedData : [generatedData]);
      const mergedJsonString = JSON.stringify(mergedData, null, 2);
      
      // Update UI based on current mode
      if (context.mode === 'builder') {
        // Update builder mode - convert to array and render
        loadQuestionsFromJson(mergedData);
        if (ui.quizJsonInput) {
          ui.quizJsonInput.value = mergedJsonString;
        }
      } else {
        // Update editor mode - update textarea
        if (ui.quizJsonInput) {
          ui.quizJsonInput.value = mergedJsonString;
        }
      }
    } else {
      // New quiz generation
      const jsonString = JSON.stringify(generatedData, null, 2);
      
      // Update state manager and UI
      jsonStateManager.setData(generatedData);
      
      if (ui.quizJsonInput) {
        ui.quizJsonInput.value = jsonString;
      }
    }
  }
}

// Export instance with default configuration
export const geminiService = new GeminiService();

// Export main handler function for backward compatibility
export async function handleGenerateQuizRequest() {
  const ui = {
    apiKeySettingInput: DOM.apiKeySettingInput,
    quizJsonInput: DOM.quizJsonInput,
    generateBtn: DOM.generateBtn,
    quizImageInput: DOM.quizImageInput,
    originalButtonText: DOM.generateBtn.innerHTML
  };

  await geminiService.handleGenerateQuizRequest(ui);
}

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.handleGenerateQuizRequest = handleGenerateQuizRequest;
}

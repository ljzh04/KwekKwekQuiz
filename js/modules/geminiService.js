// js/modules/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as DOM from './dom.js';
import { showError, clearError } from './utils.js'; // Assuming showError updates DOM.errorDiv

let genAIInstance = null;
let currentApiKeyForInstance = null;
const MODEL_NAME = "models/gemini-flash-latest";
let promptEngineeringText = '';

async function loadPromptEngineeringText() {
    if (promptEngineeringText) return promptEngineeringText;
    try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/promptEngineeringText.txt`);
        if (!response.ok) throw new Error(`File not found or network error: ${response.statusText}`);
        promptEngineeringText = await response.text();
        return promptEngineeringText;
    } catch (error) {
        console.error('Error loading promptEngineeringText.txt:', error);
        showError('Failed to load internal prompt configuration. AI generation might be affected.');
        return "Generate a quiz in JSON format based on the following topic: "; // Fallback prompt
    }
}

function readImageAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove "data:image/png;base64," prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getGenAIClient() {
    // Read from the settings page input directly
    if (!DOM.apiKeySettingInput || !DOM.errorDiv) { // CHANGED to apiKeySettingInput
        console.error("API Key input (settings) or errorDiv not found in DOM for Gemini client.");
        return null;
    }
    const apiKey = DOM.apiKeySettingInput.value.trim(); // CHANGED
    if (!apiKey) {
        showError("API Key is required for AI generation. Please set it in Settings."); // MODIFIED message
        return null;
    }

    if (!genAIInstance || currentApiKeyForInstance !== apiKey) {
        try {
            if (typeof GoogleGenerativeAI !== 'function') {
                throw new Error("GoogleGenerativeAI is not available. Check import.");
            }
            genAIInstance = new GoogleGenerativeAI(apiKey);
            currentApiKeyForInstance = apiKey;
            clearError(); // Clear previous init errors
            console.log("Gemini client initialized/re-initialized.");
        } catch (e) {
            showError("Failed to initialize Gemini client: " + e.message);
            console.error("Initialization error in getGenAIClient:", e);
            genAIInstance = null;
            currentApiKeyForInstance = null;
            return null;
        }
    }
    return genAIInstance;
}

export async function handleGenerateQuizRequest() {
     // Read from the settings page input directly
    if (!DOM.apiKeySettingInput || !DOM.quizJsonInput || !DOM.errorDiv || !DOM.generateBtn) return; // CHANGED

    const userPrompt = DOM.quizJsonInput.value.trim();
    const imageFile = DOM.quizImageInput?.files?.[0] || null;
    const apiKey = DOM.apiKeySettingInput.value.trim(); // CHANGED

    if (!apiKey) {
        showError("A Gemini API Key is required. Please set it in the Settings page. Get one from https://aistudio.google.com/"); // MODIFIED message
        return;
    }
    if (!userPrompt && !imageFile) {
        showError("Please enter a prompt or upload an image to generate a quiz.");
        return;
    }

    const client = getGenAIClient();
    if (!client) {
        DOM.quizJsonInput.value = "Failed to initialize AI client. Check API Key and errors.";
        return; // Error already set by getGenAIClient or initial checks
    }
    
    const basePrompt = await loadPromptEngineeringText();

    const originalButtonText = DOM.generateBtn.innerHTML;
    DOM.generateBtn.disabled = true;
    DOM.generateBtn.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span> Generating';
    const originalQuizJsonContent = DOM.quizJsonInput.value; // Save current content (which is the prompt)
    DOM.quizJsonInput.value = "Generating quiz content...";
    clearError();

    try {
        const model = client.getGenerativeModel({ model: MODEL_NAME });
        let result;
        if (imageFile) { // image +/ text mode
            const imageBase64 = await readImageAsBase64(imageFile);
            const promptParts = [
                {
                    text: basePrompt + (userPrompt || "Generate a quiz based on this image.")
                },
                {
                    inlineData: {
                    mimeType: imageFile.type,
                    data: imageBase64
                    }
                }
            ];
            result = await model.generateContent({
            contents: [{ role: "user", parts: promptParts }]
            });
        } else { // text-mode
            const fullPrompt = basePrompt + userPrompt;
            result = await model.generateContent(fullPrompt);
        }
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = rawText
            .replace(/```json\s*/gi, '')
            .replace(/```/g, '')
            .trim();

        let parsedJSON;
        try {
            parsedJSON = JSON.parse(cleanedText);
            DOM.quizJsonInput.value = JSON.stringify(parsedJSON, null, 2); // Pretty print
            clearError();
        } catch (parseError) {
            console.error("JSON Parse Error from AI:", parseError.message, "\nRaw AI output:", rawText);
            DOM.quizJsonInput.value = "Invalid JSON generated. Check console for raw output.\n\nOriginal prompt was:\n" + userPrompt + "\n\nRaw AI output:\n" + rawText;
            showError("AI generated invalid JSON: " + parseError.message);
        }
    } catch (error) {
        console.error("Error generating text with AI:", error);
        let errorMessageText = "Error generating text: " + (error.message || "Unknown AI error");
        if (error.toString().includes("API key not valid")) {
            errorMessageText += " Your API Key might be invalid or not enabled for the Gemini API.";
        } else if (error.toString().includes("Quota exceeded")) {
            errorMessageText += " You may have exceeded your API quota.";
        }
        DOM.quizJsonInput.value = `Error during AI generation. Original prompt: "${userPrompt}"`;
        showError(errorMessageText);
    } finally {
        DOM.generateBtn.disabled = false;
        DOM.generateBtn.innerHTML = originalButtonText;
    }
}

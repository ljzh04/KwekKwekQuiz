// js/modules/jsonStateManager.js
import * as State from './state.js';
import { validateQuizData, showError, clearError } from './utils.js';

/**
 * Centralized JSON State Manager
 * 
 * This module acts as the single source of truth for quiz data across the application.
 * It handles conversions between different formats and manages data flow between
 * builder mode, editor mode, and AI generation.
 */
class JSONStateManager {
    constructor() {
        this.currentMode = 'builder'; // 'builder' or 'editor'
        this.builderData = []; // Array format for builder mode
        this.editorData = null; // Parsed JSON object for editor mode
        this.rawJSONString = ''; // String format for textarea
    }

    /**
     * Set the current mode and update internal state accordingly
     * @param {string} mode - 'builder' or 'editor'
     */
    setMode(mode) {
        if (mode !== 'builder' && mode !== 'editor') {
            throw new Error('Invalid mode. Must be "builder" or "editor"');
        }
        this.currentMode = mode;
    }

    /**
     * Get the current mode
     * @returns {string} Current mode
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Set data from builder mode (array format)
     * @param {Array} questions - Array of question objects
     */
    setBuilderData(questions) {
        this.builderData = Array.isArray(questions) ? questions : [];
        this.currentMode = 'builder';
        this._syncToEditor();
    }

    /**
     * Set data from editor mode (JSON string)
     * @param {string} jsonString - JSON string from textarea
     */
    setEditorData(jsonString) {
        this.rawJSONString = jsonString || '';
        this.currentMode = 'editor';
        
        try {
            if (this.rawJSONString.trim() === '') {
                this.editorData = null;
                this.builderData = [];
            } else {
                this.editorData = JSON.parse(this.rawJSONString);
                this._syncToBuilder();
            }
        } catch (error) {
            showError('Invalid JSON format in editor. Please check your syntax.');
            console.error('JSON parse error:', error);
            this.editorData = null;
            this.builderData = [];
        }
    }

    /**
     * Set data from AI generation or other sources
     * @param {Object|Array} data - Quiz data in any format
     */
    setData(data) {
        if (Array.isArray(data)) {
            this.setBuilderData(data);
        } else if (typeof data === 'object' && data !== null) {
            this.setEditorData(JSON.stringify(data, null, 2));
        } else if (typeof data === 'string') {
            this.setEditorData(data);
        } else {
            showError('Invalid data format. Expected array, object, or JSON string.');
        }
    }

    /**
     * Get data in the format appropriate for the current mode
     * @returns {Object|Array|string} Data in appropriate format
     */
    getCurrentData() {
        switch (this.currentMode) {
            case 'builder':
                return this.getBuilderData();
            case 'editor':
                return this.getEditorData();
            default:
                return this.getJSONString();
        }
    }

    /**
     * Get data as array (for builder mode)
     * @returns {Array} Array of question objects
     */
    getBuilderData() {
        return [...this.builderData];
    }

    /**
     * Get data as parsed object (for editor mode)
     * @returns {Object|null} Parsed JSON object or null
     */
    getEditorData() {
        return this.editorData ? { ...this.editorData } : null;
    }

    /**
     * Get data as JSON string (for textarea)
     * @returns {string} JSON string
     */
    getJSONString() {
        if (this.currentMode === 'builder' && this.builderData.length > 0) {
            return JSON.stringify(this.builderData, null, 2);
        } else if (this.editorData) {
            return JSON.stringify(this.editorData, null, 2);
        }
        return this.rawJSONString || '';
    }

    /**
     * Get data suitable for AI generation (always array format)
     * @returns {Array} Array of question objects
     */
    getAIData() {
        if (this.currentMode === 'builder' && this.builderData.length > 0) {
            return this.builderData;
        } else if (this.editorData && Array.isArray(this.editorData)) {
            return this.editorData;
        } else if (this.editorData) {
            // Convert single object to array
            return [this.editorData];
        }
        return [];
    }

    /**
     * Validate current data
     * @returns {boolean} Whether data is valid
     */
    isValid() {
        const data = this.getAIData();
        return validateQuizData(data);
    }

    /**
     * Clear all data
     */
    clear() {
        this.builderData = [];
        this.editorData = null;
        this.rawJSONString = '';
    }

    /**
     * Sync builder data to editor format
     * @private
     */
    _syncToEditor() {
        if (this.builderData.length > 0) {
            this.editorData = this.builderData;
            this.rawJSONString = JSON.stringify(this.builderData, null, 2);
        } else {
            this.editorData = null;
            this.rawJSONString = '';
        }
    }

    /**
     * Sync editor data to builder format
     * @private
     */
    _syncToBuilder() {
        if (this.editorData) {
            if (Array.isArray(this.editorData)) {
                this.builderData = this.editorData;
            } else {
                // Convert single object to array
                this.builderData = [this.editorData];
            }
        } else {
            this.builderData = [];
        }
    }

    /**
     * Merge new questions with existing data (for AI generation)
     * @param {Array} newQuestions - New questions to add
     * @returns {Array} Combined questions array
     */
    mergeNewQuestions(newQuestions) {
        if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
            return this.getAIData();
        }

        const existingQuestions = this.getAIData();
        const combinedQuestions = [...existingQuestions, ...newQuestions];
        
        // Update internal state
        this.setBuilderData(combinedQuestions);
        
        return combinedQuestions;
    }

    /**
     * Get context for AI generation
     * @returns {Object} Context object with existing questions and prompt
     */
    getAIContext(userPrompt = '') {
        const existingQuestions = this.getAIData();
        const context = {
            existingQuestions,
            userPrompt: userPrompt.trim(),
            mode: this.currentMode,
            hasExistingData: existingQuestions.length > 0
        };
        
        return context;
    }
}

// Export singleton instance
export const jsonStateManager = new JSONStateManager();

// Export convenience functions for backward compatibility
export function getCurrentJSONData() {
    return jsonStateManager.getCurrentData();
}

export function setJSONData(data) {
    jsonStateManager.setData(data);
}

export function getJSONString() {
    return jsonStateManager.getJSONString();
}

export function getBuilderData() {
    return jsonStateManager.getBuilderData();
}

export function getEditorData() {
    return jsonStateManager.getEditorData();
}

export function getAIData() {
    return jsonStateManager.getAIData();
}

export function isValidJSONData() {
    return jsonStateManager.isValid();
}

export function clearJSONData() {
    jsonStateManager.clear();
}

export function mergeNewQuestions(newQuestions) {
    return jsonStateManager.mergeNewQuestions(newQuestions);
}

export function getAIContext(userPrompt = '') {
    return jsonStateManager.getAIContext(userPrompt);
}
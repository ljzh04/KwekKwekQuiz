/**
 * @fileoverview JSON State Manager module for KwekKwekQuiz
 * Centralized state management for quiz input data across builder and editor modes.
 * @module jsonStateManager
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import { validateQuizData, showError } from './utils.js';

/**
 * Centralized Input Mode State Manager
 *
 * Single source of truth for quiz input data across builder and editor modes.
 * Uses an observer pattern: modules subscribe to state changes and update
 * their own DOM/UI accordingly, eliminating scattered DOM-class checks.
 *
 * Data flow:
 *   Action → setMode() / setQuestions() / fromJSONString()
 *         → notifies all subscribers
 *         → each subscriber updates its own UI projection
 * @class JSONStateManager
 * @todo Add state persistence across browser sessions
 * @toimprove Implement undo/redo functionality for state changes
 * @tofix Ensure proper cleanup of subscribers to prevent memory leaks
 */
class JSONStateManager {
    constructor() {
        /** @type {'builder' | 'editor'} */
        this._mode = 'builder';

        /** @type {Array<Object>} Canonical question array (always normalized) */
        this._questions = [];

        /** @type {string} Raw text from the editor textarea (may not be valid JSON) */
        this._rawEditorText = '';

        /** @type {Set<Function>} Subscriber callbacks */
        this._subscribers = new Set();
    }

    // ─── Subscriber Pattern ───────────────────────────────────────────

    /**
     * Register a callback invoked on every state change.
     * @param {Function} callback - receives no arguments; reads state via getters
     * @returns {Function} unsubscribe function
     * @todo Add validation for callback function signature
     * @toimprove Implement batched notifications for performance
     * @tofix Ensure proper error isolation in subscriber callbacks
     */
    subscribe(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('subscribe() requires a function');
        }
        this._subscribers.add(callback);
        return () => this._subscribers.delete(callback);
    }

    /**
     * @private
     * Notify all subscribers
     * @todo Add error boundaries for individual subscriber failures
     * @toimprove Batch notifications to prevent excessive updates
     * @tofix Ensure notifications don't cause infinite loops
     */
    _notify() {
        for (const cb of this._subscribers) {
            try { cb(); } catch (e) { console.error('State subscriber error:', e); }
        }
    }

    // ─── Mode ─────────────────────────────────────────

    /**
     * Get the current mode
     * @returns {'builder' | 'editor'} The current mode
     */
    getMode() {
        return this._mode;
    }

    /**
     * Switch mode. Caller is responsible for syncing data BEFORE calling this
     * if switching from editor mode (call fromJSONString first to parse
     * textarea content into questions), or AFTER (builder auto-syncs).
     * @param {'builder' | 'editor'} mode - The mode to switch to
     * @throws {Error} If an invalid mode is provided
     * @todo Add transition animations when switching modes
     * @toimprove Validate data integrity before mode switching
     * @tofix Ensure proper state preservation during mode transitions
     */
    setMode(mode) {
        if (mode === this._mode) return;
        if (mode !== 'builder' && mode !== 'editor') {
            throw new Error('Invalid mode. Must be "builder" or "editor"');
        }

        // Sync data when leaving a mode
        if (this._mode === 'editor' && mode === 'builder') {
            // Editor text is already captured via fromJSONString() by the caller
            // Questions are already normalized
        }
        // When entering editor, caller should call syncToEditor() after

        this._mode = mode;
        this._notify();
    }

    /**
     * Check if currently in builder mode
     * @returns {boolean} True if in builder mode, false otherwise
     */
    isBuilderMode() {
        return this._mode === 'builder';
    }

    /**
     * Check if currently in editor mode
     * @returns {boolean} True if in editor mode, false otherwise
     */
    isEditorMode() {
        return this._mode === 'editor';
    }

    // ─── Questions (Canonical Data) ───────────────────────────

    /**
     * Get a shallow copy of the questions array.
     * Always returns an array — safe to use from any mode.
     * @returns {Array<Object>} A copy of the questions array
     * @todo Add deep cloning to prevent accidental mutations
     * @toimprove Implement memoization for performance
     * @tofix Ensure returned array is immutable
     */
    getQuestions() {
        return [...this._questions];
    }

    /**
     * Replace all questions. Triggers subscribers.
     * @param {Array<Object>} questions - The new questions array
     * @todo Add validation for question format before setting
     * @toimprove Optimize for large question sets
     * @tofix Prevent setting invalid question structures
     */
    setQuestions(questions) {
        this._questions = Array.isArray(questions) ? questions : [];
        this._rawEditorText = this._questions.length > 0
            ? JSON.stringify(this._questions, null, 2)
            : this._rawEditorText; // preserve prompt text if questions empty
        this._notify();
    }

    /**
     * Append new questions (e.g., from AI generation).
     * @param {Array<Object>} newQuestions - The questions to append
     * @todo Add validation for new question format
     * @toimprove Optimize for bulk additions
     * @tofix Prevent appending invalid question structures
     */
    appendQuestions(newQuestions) {
        if (!Array.isArray(newQuestions) || newQuestions.length === 0) return;
        this._questions = [...this._questions, ...newQuestions];
        this._rawEditorText = JSON.stringify(this._questions, null, 2);
        this._notify();
    }

    /**
     * Get the number of questions
     * @returns {number} The number of questions
     */
    getQuestionCount() {
        return this._questions.length;
    }

    /**
     * Check if there are any valid questions
     * @returns {boolean} True if there are questions, false otherwise
     */
    hasQuestions() {
        return this._questions.length > 0;
    }

    // ─── JSON String (Editor Textarea) ────────────────────────────────

    /**
     * Get the current editor text. In builder mode this is derived from questions;
     * in editor mode it's the raw textarea content.
     * @returns {string} The current editor text
     * @todo Add formatting options for the JSON string
     * @toimprove Cache formatted strings for performance
     * @tofix Ensure consistent formatting across modes
     */
    toJSONString() {
        if (this._mode === 'builder') {
            return this._questions.length > 0
                ? JSON.stringify(this._questions, null, 2)
                : '';
        }
        return this._rawEditorText;
    }

    /**
     * Parse a JSON string and update internal state.
     * Used when switching from editor → builder, loading saved quizzes, etc.
     * @param {string} jsonString - The JSON string to parse
     * @returns {boolean} Whether parsing succeeded
     * @todo Add more detailed error reporting for parsing failures
     * @toimprove Support for different JSON formats
     * @tofix Handle malformed JSON gracefully without losing state
     */
    fromJSONString(jsonString) {
        this._rawEditorText = jsonString || '';
        if (this._rawEditorText.trim() === '') {
            this._questions = [];
            return true;
        }
        try {
            const parsed = JSON.parse(this._rawEditorText);
            this._questions = Array.isArray(parsed) ? parsed : [parsed];
            return true;
        } catch (e) {
            // Text is not valid JSON — could be a prompt string
            this._questions = [];
            return false;
        }
    }

    /**
     * Set raw editor text without parsing (e.g., while user is typing a prompt).
     * Does NOT update questions or notify subscribers.
     * @param {string} text - The raw text to set
     * @todo Add rate limiting for frequent updates
     * @toimprove Optimize for large text changes
     * @tofix Prevent unnecessary state updates during typing
     */
    setRawEditorText(text) {
        this._rawEditorText = text || '';
        // Intentionally no _notify() — this is for live typing, not state changes
    }

    /**
     * Get raw editor text (may not be valid JSON).
     * @returns {string} The raw editor text
     */
    getRawEditorText() {
        return this._rawEditorText;
    }

    /**
     * Sync current questions to the editor text representation.
     * Call this when switching to editor mode to populate the textarea.
     * @returns {string} The JSON string
     * @todo Add formatting options for the synced text
     * @toimprove Optimize for large question sets
     * @tofix Ensure consistent formatting when syncing
     */
    syncToEditor() {
        this._rawEditorText = this._questions.length > 0
            ? JSON.stringify(this._questions, null, 2)
            : this._rawEditorText;
        return this._rawEditorText;
    }

    // ─── AI Context ───────────────────────────────────────────────────

    /**
     * Get data suitable for AI generation (always array format).
     * @returns {Array<Object>} The questions array for AI
     * @todo Add filtering options for AI context
     * @toimprove Optimize data structure for AI consumption
     * @tofix Ensure data format compatibility with AI services
     */
    getAIData() {
        return [...this._questions];
    }

    /**
     * Get context object for AI prompt construction.
     * @param {string} [userPrompt=''] - The user's prompt
     * @returns {Object} The AI context object
     * @todo Add more context parameters for better AI results
     * @toimprove Optimize context data for different AI models
     * @tofix Ensure context is properly formatted for AI services
     */
    getAIContext(userPrompt = '') {
        return {
            existingQuestions: this.getAIData(),
            userPrompt: userPrompt.trim(),
            mode: this._mode,
            hasExistingData: this._questions.length > 0,
        };
    }

    // ─── Validation ───────────────────────────────────────────

    /**
     * Validate current questions data.
     * @returns {boolean} Whether the data is valid
     * @todo Add more comprehensive validation rules
     * @toimprove Optimize validation for large datasets
     * @tofix Provide detailed validation error messages
     */
    isValid() {
        return validateQuizData(this._questions);
    }

    /**
     * Determine if the raw editor text is valid JSON (not a prompt).
     * @returns {boolean} Whether the text is valid JSON
     * @todo Add support for validating different JSON schemas
     * @toimprove Optimize validation for large JSON strings
     * @tofix Handle edge cases in JSON validation
     */
    isEditorTextValidJSON() {
        if (!this._rawEditorText || this._rawEditorText.trim() === '') return false;
        try {
            JSON.parse(this._rawEditorText);
            return true;
        } catch {
            return false;
        }
    }

    // ─── Reset ────────────────────────────────────────────────

    /**
     * Clear all data and reset to builder mode
     * @todo Add confirmation for clearing all data
     * @toimprove Preserve some user preferences during reset
     * @tofix Ensure complete cleanup of all state properties
     */
    clear() {
        this._mode = 'builder';
        this._questions = [];
        this._rawEditorText = '';
        this._notify();
    }
}

// Export singleton instance
export const jsonStateManager = new JSONStateManager();

// ─── Convenience Exports (backward compatibility) ─────────────────────

/**
 * Get the current JSON data
 * @function getCurrentJSONData
 * @returns {Array<Object>} The current questions array
 * @deprecated Use jsonStateManager.getQuestions() instead
 */
export function getCurrentJSONData() {
    return jsonStateManager.getQuestions();
}

/**
 * Set JSON data
 * @function setJSONData
 * @param {Array<Object>|string} data - The data to set
 * @deprecated Use jsonStateManager.setQuestions() or jsonStateManager.fromJSONString() instead
 */
export function setJSONData(data) {
    if (typeof data === 'string') {
        jsonStateManager.fromJSONString(data);
    } else {
        jsonStateManager.setQuestions(Array.isArray(data) ? data : [data]);
    }
}

/**
 * Get JSON string
 * @function getJSONString
 * @returns {string} The JSON string representation
 * @deprecated Use jsonStateManager.toJSONString() instead
 */
export function getJSONString() {
    return jsonStateManager.toJSONString();
}

/**
 * Get builder data
 * @function getBuilderData
 * @returns {Array<Object>} The questions array for builder mode
 * @deprecated Use jsonStateManager.getQuestions() instead
 */
export function getBuilderData() {
    return jsonStateManager.getQuestions();
}

/**
 * Get editor data
 * @function getEditorData
 * @returns {Array<Object>} The questions array for editor mode
 * @deprecated Use jsonStateManager.getQuestions() instead
 */
export function getEditorData() {
    return jsonStateManager.getQuestions();
}

/**
 * Get AI data
 * @function getAIData
 * @returns {Array<Object>} The questions array for AI processing
 * @deprecated Use jsonStateManager.getAIData() instead
 */
export function getAIData() {
    return jsonStateManager.getAIData();
}

/**
 * Check if JSON data is valid
 * @function isValidJSONData
 * @returns {boolean} Whether the data is valid
 * @deprecated Use jsonStateManager.isValid() instead
 */
export function isValidJSONData() {
    return jsonStateManager.isValid();
}

/**
 * Clear JSON data
 * @function clearJSONData
 * @deprecated Use jsonStateManager.clear() instead
 */
export function clearJSONData() {
    jsonStateManager.clear();
}

/**
 * Merge new questions
 * @function mergeNewQuestions
 * @param {Array<Object>} newQuestions - The questions to merge
 * @returns {Array<Object>} The updated questions array
 * @deprecated Use jsonStateManager.appendQuestions() instead
 */
export function mergeNewQuestions(newQuestions) {
    jsonStateManager.appendQuestions(newQuestions);
    return jsonStateManager.getQuestions();
}

/**
 * Get AI context
 * @function getAIContext
 * @param {string} [userPrompt=''] - The user's prompt
 * @returns {Object} The AI context object
 * @deprecated Use jsonStateManager.getAIContext() instead
 */
export function getAIContext(userPrompt = '') {
    return jsonStateManager.getAIContext(userPrompt);
}

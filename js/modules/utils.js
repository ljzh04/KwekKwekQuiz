/**
 * @fileoverview Utility functions module for KwekKwekQuiz
 * Contains common utility functions for data validation, sanitization, and UI feedback.
 * @module utils
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import { showToast } from './toastNotification.js';

/**
 * Fisher-Yates shuffle algorithm implementation.
 * Shuffles an array in place and returns a new shuffled array.
 * @function shuffleArray
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 * @todo Add support for shuffling with seed for reproducible results
 * @toimprove Optimize for larger arrays if performance becomes an issue
 * @tofix Ensure proper handling of edge cases like empty arrays
 */
export function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Validates the structure of quiz data.
 * Checks if the data is an array and each item has the required properties.
 * @function validateQuizData
 * @param {any} data - The data to validate
 * @returns {boolean} True if the data is valid, false otherwise
 * @todo Add more comprehensive validation for different question types
 * @toimprove Optimize for large quiz sets
 * @tofix Ensure proper validation of all question types and their specific requirements
 */
export function validateQuizData(data) {
    if (!Array.isArray(data)) {
        return false;
    }
    for (const item of data) {
        if (typeof item !== "object" || !item.type || !item.question || item.correct === undefined) {
            return false;
        }
        if (item.type === "multiple-choice" && (!Array.isArray(item.options) || item.options.length === 0)) {
            return false;
        }
        // Add more validation for other types if needed
    }
    return true;
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * Creates a temporary element and retrieves the text content to escape HTML.
 * @function sanitizeInput
 * @param {string} str - The string to sanitize
 * @returns {string} The sanitized string
 * @todo Add more comprehensive sanitization for different types of input
 * @toimprove Use a more robust sanitization library if needed
 * @tofix Ensure proper handling of all special characters
 */
export function sanitizeInput(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// export function showError(message) {
//     if (DOM.errorDiv) {
//         DOM.errorDiv.textContent = message;
//     } else {
//         console.error("Error display element not found, message:", message);
//     }
// }

// export function clearError() {
//     if (DOM.errorDiv) {
//         DOM.errorDiv.textContent = '';
//     }
// }

// export function showSaveStatus(show) {
//     if (DOM.saveStatus) {
//         DOM.saveStatus.classList.toggle('hidden', !show);
//     }
// }

/**
 * Returns CSS classes for feedback styling based on correctness.
 * @function getFeedbackClasses
 * @param {boolean} isCorrect - Whether the answer is correct
 * @returns {Array<string>} An array of CSS classes for styling
 * @todo Add support for more feedback types (e.g., warning, info)
 * @toimprove Optimize for performance if called frequently
 * @tofix Ensure proper styling in all themes and contexts
 */
export function getFeedbackClasses(isCorrect) {
    return isCorrect 
        ? ["bg-green-100", "border-green-600", "text-green-800", "dark:bg-green-900", "dark:border-green-500", "dark:text-green-200"]
        : ["bg-red-100", "border-red-600", "text-red-800", "dark:bg-red-900", "dark:border-red-500", "dark:text-red-200"];
}

/**
 * Shows an error message using toast notifications.
 * @function showError
 * @param {string} message - The error message to display
 * @returns {void}
 * @todo Add support for different error severity levels
 * @toimprove Provide more detailed error information when possible
 * @tofix Ensure proper error handling in all contexts
 */
export function showError(message) {
    showToast(message, 'error', 5000);
}

/**
 * Clears the error display.
 * @function clearError
 * @returns {void}
 * @todo Add animation effects when clearing errors
 * @toimprove Optimize for performance if called frequently
 * @tofix Ensure proper cleanup of error state in all contexts
 */
export function clearError() {
    // No action needed for toast system - they auto-dismiss
    if (DOM.errorDiv && !DOM.errorDiv.classList.contains('hidden')) {
        DOM.errorDiv.textContent = '';
        DOM.errorDiv.classList.add('hidden');
    }
}

/**
 * Shows a save status message.
 * @function showSaveStatus
 * @param {boolean} isLoading - Whether the save operation is in progress
 * @returns {void}
 * @todo Add more detailed status information during save operations
 * @toimprove Provide visual feedback for different save states
 * @tofix Ensure proper status updates in all save scenarios
 */
export function showSaveStatus(isLoading) {
    if (isLoading) {
        showToast('Saving quiz...', 'info', 0); // 0 duration means no auto-dismiss
    }
    // Success/error toasts will be shown by the calling functions
}

/**
 * Shows a success message using toast notifications.
 * @function showSuccess
 * @param {string} message - The success message to display
 * @returns {void}
 * @todo Add support for different success message types
 * @toimprove Provide more detailed success information when possible
 * @tofix Ensure proper success handling in all contexts
 */
export function showSuccess(message) {
    showToast(message, 'success', 3000);
}

/**
 * Shows an info message using toast notifications.
 * @function showInfo
 * @param {string} message - The info message to display
 * @returns {void}
 * @todo Add support for different info message types
 * @toimprove Provide more detailed info when possible
 * @tofix Ensure proper info handling in all contexts
 */
export function showInfo(message) {
    showToast(message, 'info', 3000);
}

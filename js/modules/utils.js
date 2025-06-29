// js/modules/utils.js
import * as DOM from './dom.js';
import { showToast } from './toastNotification.js';

// Fisher-Yates shuffle
export function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

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

export function getFeedbackClasses(isCorrect) {
    return isCorrect 
        ? ["bg-green-100", "border-green-600", "text-green-800", "dark:bg-green-900", "dark:border-green-500", "dark:text-green-200"]
        : ["bg-red-100", "border-red-600", "text-red-800", "dark:bg-red-900", "dark:border-red-500", "dark:text-red-200"];
}

// Replace DOM-based error display with toast notifications
export function showError(message) {
    showToast(message, 'error', 5000);
}

export function clearError() {
    // No action needed for toast system - they auto-dismiss
    if (DOM.errorDiv && !DOM.errorDiv.classList.contains('hidden')) {
        DOM.errorDiv.textContent = '';
        DOM.errorDiv.classList.add('hidden');
    }
}

export function showSaveStatus(isLoading) {
    if (isLoading) {
        showToast('Saving quiz...', 'info', 0); // 0 duration means no auto-dismiss
    }
    // Success/error toasts will be shown by the calling functions
}

// New success notification function
export function showSuccess(message) {
    showToast(message, 'success', 3000);
}

export function showInfo(message) {
    showToast(message, 'info', 3000);
}

/**
 * @fileoverview Storage management module for KwekKwekQuiz
 * Handles saving, loading, importing, and exporting of quizzes using localStorage.
 * @module storageManager
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import { validateQuizData, sanitizeInput, showError, clearError, showSuccess, showInfo } from './utils.js';
import { jsonStateManager } from './jsonStateManager.js';
import { loadQuestionsFromJson } from './quizBuilder.js';

/**
 * @constant {string}
 * @private
 * @description The storage key for saved quizzes
 */
const SAVED_QUIZZES_STORAGE_ID = "savedQuizzes";

/**
 * Retrieves the saved quizzes from localStorage.
 * @function getSavedQuizzes
 * @returns {Object} The saved quizzes object
 * @private
 * @todo Add error handling for malformed JSON in storage
 * @toimprove Optimize for large numbers of saved quizzes
 * @tofix Ensure proper error handling when localStorage is unavailable
 */
function getSavedQuizzes() {
    const saved = localStorage.getItem(SAVED_QUIZZES_STORAGE_ID);
    return saved ? JSON.parse(saved) : {};
}

/**
 * Stores the quizzes in localStorage.
 * @function storeQuizzes
 * @param {Object} quizzes - The quizzes object to store
 * @returns {void}
 * @private
 * @todo Add error handling for storage quota exceeded
 * @toimprove Optimize for large quiz sets
 * @tofix Ensure proper error handling when localStorage is unavailable
 */
function storeQuizzes(quizzes) {
    localStorage.setItem(SAVED_QUIZZES_STORAGE_ID, JSON.stringify(quizzes));
}

/**
 * Loads the saved quizzes into the dropdown menu.
 * @function loadSavedQuizzesToDropdown
 * @returns {void}
 * @todo Add pagination for large numbers of saved quizzes
 * @toimprove Optimize for performance with many saved quizzes
 * @tofix Ensure proper cleanup of dropdown options before loading
 */
export function loadSavedQuizzesToDropdown() {
    if (!DOM.savedQuizzesSelect) return;
    const saved = getSavedQuizzes();
    DOM.savedQuizzesSelect.innerHTML = '<option value="" disabled selected>Select a saved quiz</option>';
    Object.keys(saved).forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        DOM.savedQuizzesSelect.appendChild(option);
    });
}

/**
 * Handles saving the current quiz.
 * @function handleSaveQuiz
 * @returns {void}
 * @todo Add support for auto-saving drafts
 * @toimprove Provide more detailed feedback on save success/failure
 * @tofix Ensure proper validation of quiz data before saving
 */
export function handleSaveQuiz() {
    clearError();
    if (!DOM.quizNameInput) return;

    // Get data from the single source of truth — works for both modes
    let data = jsonStateManager.getQuestions();

    if (data.length === 0) {
        // No parsed questions — try parsing the raw editor text directly
        const rawText = jsonStateManager.getRawEditorText().trim();
        if (rawText) {
            try {
                data = JSON.parse(rawText);
                if (!Array.isArray(data)) data = [data];
            } catch (e) {
                showError("Invalid JSON format for quiz data. Please correct and try again.");
                return;
            }
        } else {
            showError("No quiz data to save. Add questions first.");
            return;
        }
    }

    if (!validateQuizData(data)) {
        showError("Invalid quiz data structure. Please check your questions.");
        return;
    }

    const quizName = DOM.quizNameInput.value.trim();
    if (!quizName) {
        showError("Quiz name is required to save.");
        return;
    }
    const sanitizedQuizName = sanitizeInput(quizName);

    const saved = getSavedQuizzes();
    if (saved[sanitizedQuizName] && !DOM.quizNameInput.dataset.editingExisting) { // Check if overwriting a different quiz
        if (!confirm(`A quiz named "${sanitizedQuizName}" already exists. Do you want to overwrite it?`)) {
            return;
        }
    }
    delete DOM.quizNameInput.dataset.editingExisting; // Clear flag after use

    try {
        saved[sanitizedQuizName] = data;
        storeQuizzes(saved);
        loadSavedQuizzesToDropdown();
        DOM.savedQuizzesSelect.value = sanitizedQuizName; // Select the newly saved/updated quiz
        showSuccess(`Quiz "${sanitizedQuizName}" saved successfully.`);
    } catch (e) {
        showError("Failed to save quiz. Storage might be full or an unexpected error occurred.");
        console.error("Save quiz error:", e);
    }
}

/**
 * Handles deleting a saved quiz.
 * @function handleDeleteQuiz
 * @returns {void}
 * @todo Add confirmation with quiz details before deletion
 * @toimprove Provide more detailed feedback on deletion success/failure
 * @tofix Ensure proper cleanup of UI elements after deletion
 */
export function handleDeleteQuiz() {
    clearError();
    if (!DOM.savedQuizzesSelect) return;
    const name = DOM.savedQuizzesSelect.value;
    if (!name) {
        showError("Please select a saved quiz to delete.");
        return;
    }
    if (confirm(`Are you sure you want to delete the quiz "${sanitizeInput(name)}"?`)) {
        try {
            const saved = getSavedQuizzes();
            if (saved[name]) {
                delete saved[name];
                storeQuizzes(saved);
                loadSavedQuizzesToDropdown(); // Refresh dropdown
                if (DOM.quizJsonInput) DOM.quizJsonInput.value = "";
                if (DOM.quizNameInput) DOM.quizNameInput.value = "";
                showSuccess(`Quiz "${sanitizeInput(name)}" deleted.`);
            }
        } catch (e) {
            showError("Failed to delete quiz.");
            console.error("Delete quiz error:", e);
        }
    }
}

/**
 * Handles the change event for the saved quiz selection dropdown.
 * @function handleSavedQuizSelectChange
 * @returns {void}
 * @todo Add loading indicator while quiz is being loaded
 * @toimprove Optimize for performance with large quiz sets
 * @tofix Ensure proper state management when switching between quizzes
 */
export function handleSavedQuizSelectChange() {
    clearError();
    if (!DOM.savedQuizzesSelect || !DOM.quizNameInput) return;
    const name = DOM.savedQuizzesSelect.value;
    if (!name) return;

    const saved = getSavedQuizzes();
    if (saved[name]) {
        const jsonString = JSON.stringify(saved[name], null, 2);

        // Load into state manager (single source of truth)
        jsonStateManager.fromJSONString(jsonString);

        // Update editor textarea
        if (DOM.quizJsonInput) {
            DOM.quizJsonInput.value = jsonString;
        }

        // If in builder mode, loadQuestionsFromJson will re-render via state subscription
        if (jsonStateManager.isBuilderMode()) {
            loadQuestionsFromJson(saved[name]);
        }

        DOM.quizNameInput.value = sanitizeInput(name);
        DOM.quizNameInput.dataset.editingExisting = "true";
    }
}

// --- New Data Management Functions for Settings Page ---
/**
 * Handles exporting all saved quizzes to a JSON file.
 * @function handleExportQuizzes
 * @returns {void}
 * @todo Add option to select specific quizzes for export
 * @toimprove Provide more detailed feedback on export success/failure
 * @tofix Ensure proper file naming and format
 */
export function handleExportQuizzes() {
    const savedQuizzes = getSavedQuizzes();
    if (Object.keys(savedQuizzes).length === 0) {
        showInfo("No quizzes saved to export.");
        return;
    }
    try {
        const jsonString = JSON.stringify(savedQuizzes, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "kwek-kwek-quizzes_export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess("All quizzes exported successfully!");
    } catch (e) {
        showError("Failed to export quizzes.");
        console.error("Export error:", e);
    }
}

/**
 * Handles importing quizzes from a JSON file.
 * @function handleImportQuizzes
 * @param {Event} event - The file input change event
 * @returns {void}
 * @todo Add support for importing from different formats
 * @toimprove Provide more detailed feedback on import success/failure
 * @tofix Ensure proper validation of imported quiz data
 */
export function handleImportQuizzes(event) {
    const file = event.target.files[0];
    if (!file) {
        showInfo("No file selected for import.");
        return;
    }
    if (file.type !== "application/json") {
        showError("Invalid file type. Please select a JSON file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            // Basic validation: check if it's an object (like our savedQuizzes structure)
            if (typeof importedData !== 'object' || Array.isArray(importedData) || importedData === null) {
                throw new Error("Imported JSON is not in the expected format (object of quizzes).");
            }

            let importedCount = 0;
            let overwrittenCount = 0;
            const currentQuizzes = getSavedQuizzes();
            let mergeConflicts = [];

            for (const quizName in importedData) {
                if (Object.prototype.hasOwnProperty.call(importedData, quizName)) {
                    // Further validate individual quiz structure before adding
                    if (!validateQuizData(importedData[quizName])) {
                        console.warn(`Skipping import of "${quizName}" due to invalid structure.`);
                        continue; 
                    }
                    if (currentQuizzes[quizName]) {
                        mergeConflicts.push(quizName);
                    }
                    currentQuizzes[quizName] = importedData[quizName]; // Add or overwrite
                    if (mergeConflicts.includes(quizName)) overwrittenCount++; else importedCount++;
                }
            }
            
            if (mergeConflicts.length > 0) {
                if (!confirm(`The following quizzes already exist and will be overwritten: ${mergeConflicts.join(', ')}. Continue?`)) {
                    showInfo("Import cancelled by user.");
                    DOM.importQuizzesInput.value = ""; // Reset file input
                    return;
                }
            }
            
            storeQuizzes(currentQuizzes);
            loadSavedQuizzesToDropdown();
            showSuccess(`${importedCount} new quizzes imported, ${overwrittenCount} quizzes overwritten.`);
            DOM.importQuizzesInput.value = ""; // Reset file input
        } catch (err) {
            showError(`Failed to import quizzes: ${err.message}`);
            console.error("Import error:", err);
            DOM.importQuizzesInput.value = ""; // Reset file input
        }
    };
    reader.onerror = () => {
        showError("Error reading the selected file.");
        DOM.importQuizzesInput.value = ""; // Reset file input
    };
    reader.readAsText(file);
}

/**
 * Handles clearing all saved quizzes.
 * @function handleClearAllQuizzes
 * @returns {void}
 * @todo Add additional confirmation for this destructive action
 * @toimprove Provide more detailed feedback on clear success/failure
 * @tofix Ensure complete removal of all quiz data from storage
 */
export function handleClearAllQuizzes() {
    if (Object.keys(getSavedQuizzes()).length === 0) {
        showInfo("No quizzes to clear.");
        return;
    }
    if (confirm("Are you sure you want to delete ALL saved quizzes? This action cannot be undone!")) {
        try {
            storeQuizzes({}); // Store an empty object
            loadSavedQuizzesToDropdown();
            if (DOM.quizJsonInput) DOM.quizJsonInput.value = "";
            if (DOM.quizNameInput) DOM.quizNameInput.value = "";
            showSuccess("All saved quizzes have been cleared.");
        } catch (e) {
            showError("Failed to clear all quizzes.");
            console.error("Clear all quizzes error:", e);
        }
    }
}

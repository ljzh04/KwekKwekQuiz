// js/modules/storageManager.js
import * as DOM from './dom.js';
import { validateQuizData, sanitizeInput, showError, clearError, showSuccess, showInfo } from './utils.js';
import { setQuizData as setStateQuizData } from './state.js';

const SAVED_QUIZZES_STORAGE_ID = "savedQuizzes";

function getSavedQuizzes() {
    const saved = localStorage.getItem(SAVED_QUIZZES_STORAGE_ID);
    return saved ? JSON.parse(saved) : {};
}

function storeQuizzes(quizzes) {
    localStorage.setItem(SAVED_QUIZZES_STORAGE_ID, JSON.stringify(quizzes));
}

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

export function handleSaveQuiz() {
    clearError();
    if (!DOM.quizJsonInput || !DOM.quizNameInput) return;

    let data;
    try {
        data = JSON.parse(DOM.quizJsonInput.value);
    } catch (e) {
        showError("Invalid JSON format for quiz data. Please correct and try again.");
        return;
    }
    if (!validateQuizData(data)) {
        showError("Invalid quiz data structure. Please check your JSON.");
        return;
    }
    // setStateQuizData(data); // Not strictly needed here, only for starting quiz

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

export function handleSavedQuizSelectChange() {
    clearError();
    if (!DOM.savedQuizzesSelect || !DOM.quizJsonInput || !DOM.quizNameInput) return;
    const name = DOM.savedQuizzesSelect.value;
    if (!name) return;

    const saved = getSavedQuizzes();
    if (saved[name]) {
        DOM.quizJsonInput.value = JSON.stringify(saved[name], null, 2);
        DOM.quizNameInput.value = sanitizeInput(name);
        DOM.quizNameInput.dataset.editingExisting = "true"; // Flag that we are editing an existing quiz
    }
}

// --- New Data Management Functions for Settings Page ---
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
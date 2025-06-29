// js/modules/eventHandlers.js
import jsyaml from 'js-yaml';
import * as DOM from './dom.js';
import * as State from './state.js';
import { showError, clearError, validateQuizData, sanitizeInput, showSuccess } from './utils.js';
// import { toggleDarkMode, toggleAnimations } from './settingsController.js'; // Handled in settingsController.initSettings
import { 
    handleSaveQuiz, 
    handleDeleteQuiz, 
    handleSavedQuizSelectChange,
    handleExportQuizzes,      // NEW
    handleImportQuizzes,      // NEW
    handleClearAllQuizzes     // NEW
} from './storageManager.js';
// import { showQuizSetupScreen } from './uiController.js'; // showQuizSetupScreen is for app internal, not global home
import { handleGenerateQuizRequest } from './geminiService.js';
import { startQuiz, handleSubmitAnswer, goToPrevQuestion, goToNextQuestion, restartCurrentQuiz } from './quizEngine.js';
import { showQuizSetupScreen as showAppSetupScreen } from './uiController.js'; // For backToSetupBtn

function handleLoadQuizBtn() {
    clearError();
    if (!DOM.quizJsonInput) return;
    let data;
    try {
        data = JSON.parse(DOM.quizJsonInput.value);
    } catch (e) {
        showError("Invalid JSON format. Please correct and try again.");
        return;
    }
    if (!startQuiz(data)) {
        // Error already shown by startQuiz
    } else {
        showSuccess("Quiz loaded successfully!");
    }
}

function handleFormatJsonBtn() {
    clearError();
    if (!DOM.quizJsonInput) return;
    const input = DOM.quizJsonInput.value.trim();
    if (input === "") {
        showError("Textarea is empty. Nothing to format.");
        return;
    }
    try {
        const parsedJson = JSON.parse(input);
        DOM.quizJsonInput.value = JSON.stringify(parsedJson, null, 2);
        showSuccess("JSON formatted successfully!");
    } catch (jsonError) {
        try {
            const parsedYaml = jsyaml.load(input);
            DOM.quizJsonInput.value = JSON.stringify(parsedYaml, null, 2);
            showSuccess("YAML converted to JSON successfully!");
        } catch (yamlError) {
            showError(`Invalid JSON or YAML.\nJSON Error: ${jsonError.message}\nYAML Error: ${yamlError.message}`);
        }
    }
}

function handleLoadSampleBtn() {
    clearError();
    if (DOM.quizJsonInput) {
        DOM.quizJsonInput.value = State.sampleQuizJson;
    }
    if (DOM.quizNameInput) {
        DOM.quizNameInput.value = "Sample Quiz";
        delete DOM.quizNameInput.dataset.editingExisting; // Clear editing flag
    }
    showSuccess("Sample quiz loaded!");
}

function handleApiKeyVisibility() {
    const input = DOM.apiKeySettingInput;
    const icon = DOM.apiKeyVisibilityIcon;
    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "visibility";
    } else {
        input.type = "password";
        icon.textContent = "visibility_off";
    }
}

function globalKeydownHandler(event) {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    const activeTag = activeElement.tagName;
    
    // Don't interfere if user is typing in any input/textarea globally
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
        // Allow Enter for submit button in quiz player text input
        if (DOM.quizContainer && !DOM.quizContainer.classList.contains('hidden') &&
            activeElement === DOM.quizContainer.querySelector("input[type='text']") && event.key === "Enter") {
            // Let quizPlayer's input handler deal with Enter
        } else {
             return; // Otherwise, don't process global keydowns
        }
    }


    // Quiz player specific shortcuts
    if (DOM.quizContainer && !DOM.quizContainer.classList.contains('hidden')) {
        if (event.key === "ArrowLeft") {
            if (DOM.prevBtn && !DOM.prevBtn.disabled) {
                event.preventDefault();
                goToPrevQuestion();
            }
        } else if (event.key === "ArrowRight") {
            if (DOM.nextBtn && !DOM.nextBtn.disabled) {
                event.preventDefault();
                goToNextQuestion();
            }
        } else {
            const currentQuestion = State.getCurrentQuestion();
            if (!currentQuestion || State.isSubmittedAtIndex(State.getCurrentQuestionIndex())) return;

            if (currentQuestion.type === "multiple-choice") {
                const optionIndex = parseInt(event.key, 10) - 1;
                if (optionIndex >= 0 && currentQuestion.options && optionIndex < currentQuestion.options.length) {
                    const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
                    if (optionButtons[optionIndex] && !optionButtons[optionIndex].disabled) {
                        event.preventDefault();
                        optionButtons[optionIndex].click();
                    }
                }
            } else if (currentQuestion.type === "true-false") {
                if (event.key === "1" || event.key === "0") {
                    const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
                    const targetButton = Array.from(optionButtons).find(btn => {
                        const labelSpan = btn.querySelector("span.font-semibold");
                        return labelSpan && labelSpan.textContent === event.key;
                    });
                    if (targetButton && !targetButton.disabled) {
                        event.preventDefault();
                        targetButton.click();
                    }
                }
            }
        }
    }
}

export function attachAllEventHandlers() {
    // Global Header Toggles (Listeners attached in settingsController.initSettings)
    // if (DOM.darkModeToggle) DOM.darkModeToggle.addEventListener("click", toggleDarkMode);
    // if (DOM.animationToggle) DOM.animationToggle.addEventListener("click", toggleAnimations);
    
    // Home button (now a sidebar link, handled by navigationController)
    // if (DOM.homeBtn) DOM.homeBtn.addEventListener("click", showQuizSetupScreen); 

    // App Section Event Handlers
    if (DOM.loadQuizBtn) DOM.loadQuizBtn.addEventListener("click", handleLoadQuizBtn);
    if (DOM.formatBtn) DOM.formatBtn.addEventListener("click", handleFormatJsonBtn);
    if (DOM.sampleBtn) DOM.sampleBtn.addEventListener("click", handleLoadSampleBtn);
    if (DOM.saveQuizBtn) DOM.saveQuizBtn.addEventListener("click", handleSaveQuiz);
    if (DOM.deleteQuizBtn) DOM.deleteQuizBtn.addEventListener("click", handleDeleteQuiz);
    if (DOM.savedQuizzesSelect) DOM.savedQuizzesSelect.addEventListener("change", handleSavedQuizSelectChange);
    if (DOM.generateBtn) DOM.generateBtn.addEventListener("click", handleGenerateQuizRequest);

    // Quiz Player Handlers
    if (DOM.prevBtn) DOM.prevBtn.addEventListener("click", goToPrevQuestion);
    if (DOM.nextBtn) DOM.nextBtn.addEventListener("click", goToNextQuestion);
    if (DOM.submitBtn) DOM.submitBtn.addEventListener("click", handleSubmitAnswer);

    // Quiz Results Handlers
    if (DOM.restartBtn) DOM.restartBtn.addEventListener("click", restartCurrentQuiz);
    if (DOM.backToSetupBtn) DOM.backToSetupBtn.addEventListener("click", showAppSetupScreen); // Use specific app setup

    // Settings Page Data Management Handlers
    if (DOM.exportQuizzesBtn) DOM.exportQuizzesBtn.addEventListener("click", handleExportQuizzes);
    if (DOM.importQuizzesInput) DOM.importQuizzesInput.addEventListener("change", handleImportQuizzes);
    if (DOM.clearAllQuizzesBtn) DOM.clearAllQuizzesBtn.addEventListener("click", handleClearAllQuizzes);
    if (DOM.toggleApiKeyVisibilityBtn && DOM.apiKeySettingInput && DOM.apiKeyVisibilityIcon) DOM.toggleApiKeyVisibilityBtn.addEventListener('click', handleApiKeyVisibility);

    document.addEventListener("keydown", globalKeydownHandler);

    console.log("All event listeners dynamically attached/verified.");
}
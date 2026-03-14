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
import {
    initializePeer,
    startListening,
    stopListening,
    connectToPeer,
    getReceivedData,
    clearReceivedData
} from './p2pShare.js';
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

function handleQuizImageChange(event){
    const file = event.target.files?.[0];
    const previewImg = document.getElementById("preview");
    if (!file || !previewImg) {
        if (previewImg) previewImg.style.display = "none";
        return;
    }
    if (!file.type.startsWith("image/")) {
        previewImg.style.display = "none";
        showError("Please select a valid image file.");
        return;
    }
    clearError();
    const reader = new FileReader();
    reader.onload = () => {
        previewImg.src = reader.result;
        previewImg.style.display = "block";
    };
    reader.readAsDataURL(file);
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
    if (DOM.quizImageInput) DOM.quizImageInput.addEventListener("change", handleQuizImageChange);
    if (DOM.loadQuizBtn) DOM.loadQuizBtn.addEventListener("click", handleLoadQuizBtn);
    if (DOM.formatBtn) DOM.formatBtn.addEventListener("click", handleFormatJsonBtn);
    if (DOM.sampleBtn) DOM.sampleBtn.addEventListener("click", handleLoadSampleBtn);
    if (DOM.saveQuizBtn) DOM.saveQuizBtn.addEventListener("click", handleSaveQuiz);
    if (DOM.deleteQuizBtn) DOM.deleteQuizBtn.addEventListener("click", handleDeleteQuiz);
    if (DOM.savedQuizzesSelect) DOM.savedQuizzesSelect.addEventListener("change", handleSavedQuizSelectChange);
    if (DOM.generateBtn) DOM.generateBtn.addEventListener("click", handleGenerateQuizRequest);

    // P2P Share Modal Event Handlers
    if (DOM.shareQuizBtn) DOM.shareQuizBtn.addEventListener("click", handleOpenShareModal);
    if (DOM.downloadQuizBtn) DOM.downloadQuizBtn.addEventListener("click", handleOpenDownloadModal);
    if (DOM.closeShareModalBtn) DOM.closeShareModalBtn.addEventListener("click", handleCloseShareModal);
    if (DOM.startReceivingBtn) DOM.startReceivingBtn.addEventListener("click", handleStartReceiving);
    if (DOM.stopReceivingBtn) DOM.stopReceivingBtn.addEventListener("click", handleStopReceiving);
    if (DOM.closeDownloadModalBtn) DOM.closeDownloadModalBtn.addEventListener("click", handleCloseDownloadModal);
    if (DOM.connectToPeerBtn) DOM.connectToPeerBtn.addEventListener("click", handleConnectToPeer);

    // Add "Use Quiz" button dynamically after receiving
    if (DOM.receivedJsonContainer) {
        const useBtn = document.createElement('button');
        useBtn.id = 'use-received-quiz-btn';
        useBtn.className = 'md-filled-button bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md-xl w-full mt-3 flex items-center justify-center gap-2';
        useBtn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span><span>Use This Quiz</span>';
        useBtn.addEventListener("click", handleUseReceivedQuiz);
        DOM.receivedJsonContainer.appendChild(useBtn);
    }

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

    // Initialize P2P system
    initializePeer();

    console.log("All event listeners dynamically attached/verified.");
}

// P2P Share Modal Handlers
export function handleOpenShareModal() {
    if (!DOM.p2pShareModal) return;
    clearReceivedData();
    stopListening();
    DOM.p2pShareModal.classList.remove('hidden');
}

export function handleCloseShareModal() {
    if (DOM.p2pShareModal) {
        DOM.p2pShareModal.classList.add('hidden');
        stopListening();
    }
}

export function handleStartReceiving() {
    startListening();
}

export function handleStopReceiving() {
    stopListening();
}

export function handleOpenDownloadModal() {
    if (!DOM.p2pDownloadModal) return;
    clearReceivedData();
    DOM.p2pDownloadModal.classList.remove('hidden');
}

export function handleCloseDownloadModal() {
    if (DOM.p2pDownloadModal) {
        DOM.p2pDownloadModal.classList.add('hidden');
        clearReceivedData();
    }
}

export function handleConnectToPeer() {
    if (!DOM.targetPeerId) return;
    const targetId = DOM.targetPeerId.value.trim().toUpperCase();
    connectToPeer(targetId);
}

export function handleUseReceivedQuiz() {
    const data = getReceivedData();
    if (data && DOM.quizJsonInput) {
        DOM.quizJsonInput.value = JSON.stringify(data, null, 2);
        if (DOM.quizNameInput) {
            DOM.quizNameInput.value = "";
            delete DOM.quizNameInput.dataset.editingExisting;
        }
        showSuccess('Quiz loaded into editor!');
        handleCloseDownloadModal();
    } else {
        showError('No quiz data received yet.');
    }
}

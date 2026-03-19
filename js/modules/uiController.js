/**
 * @fileoverview UI Controller module for KwekKwekQuiz
 * Manages the UI state and synchronization with the application state.
 * @module uiController
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import * as State from './state.js';
import { jsonStateManager } from './jsonStateManager.js';

/**
 * Subscribe to state manager changes to keep DOM in sync.
 * Called once during initialization.
 * @function initInputModeUI
 * @returns {void}
 * @todo Add error handling for state manager subscription failures
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of subscriptions when component is destroyed
 */
export function initInputModeUI() {
    jsonStateManager.subscribe(_syncModeUI);
}

/**
 * Switch input mode (builder ↔ editor) with proper data sync.
 * This is the single entry point for mode switches — all other code
 * should call this instead of manipulating DOM classes directly.
 * @function switchInputMode
 * @param {'builder' | 'editor'} targetMode - The mode to switch to
 * @returns {void}
 * @todo Add validation to ensure targetMode is valid
 * @toimprove Optimize data synchronization between modes
 * @tofix Ensure proper state preservation when switching modes
 */
export function switchInputMode(targetMode) {
    if (targetMode === jsonStateManager.getMode()) return;

    if (targetMode === 'editor') {
        // Sync builder questions → editor textarea before switching
        const editorText = jsonStateManager.syncToEditor();
        if (DOM.quizJsonInput) {
            DOM.quizJsonInput.value = editorText;
        }
    } else {
        // Parse editor textarea → questions before switching
        const editorText = DOM.quizJsonInput ? DOM.quizJsonInput.value : '';
        jsonStateManager.fromJSONString(editorText);
    }

    jsonStateManager.setMode(targetMode);
    // _syncModeUI is called automatically via subscriber
}

/**
 * @private Sync DOM visibility and indicators to current state.
 * @function _syncModeUI
 * @returns {void}
 * @todo Add animation effects when switching modes
 * @toimprove Optimize DOM queries for better performance
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
function _syncModeUI() {
    const mode = jsonStateManager.getMode();
    const isBuilder = mode === 'builder';

    // Toggle panels
    if (DOM.quizBuilder) {
        isBuilder ? DOM.quizBuilder.classList.remove('hidden') : DOM.quizBuilder.classList.add('hidden');
    }
    if (DOM.editorUnit) {
        isBuilder ? DOM.editorUnit.classList.add('hidden') : DOM.editorUnit.classList.remove('hidden');
    }

    // Update mode indicators
    if (DOM.builderModeIndicator) {
        DOM.builderModeIndicator.textContent = 'Mode: Visual Builder';
    }
    if (DOM.editorModeIndicator) {
        const rawText = jsonStateManager.getRawEditorText();
        if (rawText.trim() === '') {
            DOM.editorModeIndicator.textContent = 'Mode: Prompt';
        } else if (jsonStateManager.isEditorTextValidJSON()) {
            DOM.editorModeIndicator.textContent = 'Mode: Editor';
        } else {
            DOM.editorModeIndicator.textContent = 'Mode: Prompt';
        }
    }
}

/**
 * Shows the quiz setup screen.
 * @function showQuizSetupScreen
 * @returns {void}
 * @todo Add animation effects when showing the setup screen
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
export function showQuizSetupScreen() { // This is the function now aliased as showAppSetupScreen
    if (!DOM.appSection || DOM.appSection.classList.contains('hidden')) return; // Check if app section is active

    if (DOM.quizSetup) DOM.quizSetup.classList.remove("hidden");
    if (DOM.quizContainer) DOM.quizContainer.classList.add("hidden");
    if (DOM.resultContainer) DOM.resultContainer.classList.add("hidden");
    if (DOM.progressBar) DOM.progressBar.classList.add("hidden");
    if (DOM.navigationButtons) DOM.navigationButtons.classList.add("hidden");
    
    // Reset input mode state when returning to setup
    jsonStateManager.clear();
    if (DOM.quizJsonInput) DOM.quizJsonInput.value = "";
    if (DOM.savedQuizzesSelect) DOM.savedQuizzesSelect.value = "";
    if (DOM.quizNameInput) {
        DOM.quizNameInput.value = "";
        delete DOM.quizNameInput.dataset.editingExisting; // Ensure this flag is cleared
    }
}

/**
 * Shows the quiz player screen within the app section.
 * @function showQuizPlayerScreen
 * @returns {void}
 * @todo Add animation effects when showing the player screen
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
// This function now specifically refers to showing the player screen WITHIN the #app-section
export function showQuizPlayerScreen() {
     if (!DOM.appSection.classList.contains('hidden')) {
        if (DOM.quizSetup) DOM.quizSetup.classList.add("hidden");
        if (DOM.quizContainer) DOM.quizContainer.classList.remove("hidden");
        if (DOM.resultContainer) DOM.resultContainer.classList.add("hidden");
        if (DOM.progressBar) DOM.progressBar.classList.remove("hidden");
        if (DOM.navigationButtons) DOM.navigationButtons.classList.remove("hidden");
        // if (DOM.homeBtn) DOM.homeBtn.classList.remove("hidden"); // homeBtn removed

        if (DOM.prevBtn) DOM.prevBtn.classList.remove("hidden");
        if (DOM.nextBtn) DOM.nextBtn.classList.remove("hidden");
    }
}

/**
 * Shows the results screen within the app section.
 * @function showResultsScreen
 * @returns {void}
 * @todo Add animation effects when showing the results screen
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
// This function now specifically refers to showing the results screen WITHIN the #app-section
export function showResultsScreen() {
    if (!DOM.appSection.classList.contains('hidden')) {
        if (DOM.quizSetup) DOM.quizSetup.classList.add("hidden");
        if (DOM.quizContainer) DOM.quizContainer.classList.add("hidden");
        if (DOM.resultContainer) DOM.resultContainer.classList.remove("hidden");
        if (DOM.progressBar) DOM.progressBar.classList.add("hidden");
        if (DOM.navigationButtons) DOM.navigationButtons.classList.add("hidden");

        if (DOM.scoreText) DOM.scoreText.textContent = `You scored ${State.getScore()} out of ${State.getQuizData().length}.`;
    }
}

/**
 * Updates the progress bar based on the current question index.
 * @function updateProgressBar
 * @returns {void}
 * @todo Add animation effects when updating the progress bar
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
export function updateProgressBar() {
    // No change needed if elements are correctly scoped within #app-section
    if (!DOM.progressText || !DOM.progressMeter) return;
    const quizData = State.getQuizData();
    const currentIndex = State.getCurrentQuestionIndex();
    if (!quizData || quizData.length === 0) return;

    DOM.progressText.textContent = `${currentIndex + 1}/${quizData.length}`;
    const progressPercent = ((currentIndex + 1) / quizData.length) * 100;
    DOM.progressMeter.style.width = `${progressPercent}%`;
}

/**
 * Updates the navigation buttons state based on the current question index.
 * @function updateNavigationButtonsState
 * @returns {void}
 * @todo Add animation effects when updating the navigation buttons
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
export function updateNavigationButtonsState() {
    // No change needed
    if (!DOM.prevBtn || !DOM.nextBtn || !DOM.submitBtn) return;
    const currentIndex = State.getCurrentQuestionIndex();
    const quizDataLength = State.getQuizData().length;

    DOM.prevBtn.disabled = currentIndex === 0;
    DOM.nextBtn.disabled = !State.isSubmittedAtIndex(currentIndex);
    DOM.submitBtn.disabled = State.isSubmittedAtIndex(currentIndex);

    const nextBtnSpans = DOM.nextBtn.querySelectorAll('span'); // Get all spans
    if (nextBtnSpans.length > 0) { // Find the text span (not the icon span)
        const textSpan = Array.from(nextBtnSpans).find(s => !s.classList.contains('material-symbols-outlined'));
        if (textSpan) {
             textSpan.textContent = currentIndex === quizDataLength - 1 ? "Finish" : "Next";
        }
    }
}

/**
 * Resets the summary container.
 * @function resetSummaryContainer
 * @returns {void}
 * @todo Add animation effects when resetting the summary container
 * @toimprove Optimize DOM updates to minimize reflows
 * @tofix Ensure proper cleanup of event listeners when component is destroyed
 */
export function resetSummaryContainer() {
    // No change needed
    if (DOM.summaryContainer) DOM.summaryContainer.innerHTML = "";
}

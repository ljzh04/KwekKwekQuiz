// js/modules/uiController.js
import * as DOM from './dom.js';
import * as State from './state.js';

export function showQuizSetupScreen() { // This is the function now aliased as showAppSetupScreen
    if (!DOM.appSection || DOM.appSection.classList.contains('hidden')) return; // Check if app section is active

    if (DOM.quizSetup) DOM.quizSetup.classList.remove("hidden");
    if (DOM.quizContainer) DOM.quizContainer.classList.add("hidden");
    if (DOM.resultContainer) DOM.resultContainer.classList.add("hidden");
    if (DOM.progressBar) DOM.progressBar.classList.add("hidden");
    if (DOM.navigationButtons) DOM.navigationButtons.classList.add("hidden");
    
    if (DOM.quizJsonInput) DOM.quizJsonInput.value = "";
    if (DOM.savedQuizzesSelect) DOM.savedQuizzesSelect.value = "";
    if (DOM.quizNameInput) {
        DOM.quizNameInput.value = "";
        delete DOM.quizNameInput.dataset.editingExisting; // Ensure this flag is cleared
    }
}

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

export function resetSummaryContainer() {
    // No change needed
    if (DOM.summaryContainer) DOM.summaryContainer.innerHTML = "";
}
// js/modules/quizEngine.js
import * as DOM from './dom.js';
import * as State from './state.js';
import { shuffleArray, validateQuizData, showError, clearError } from './utils.js';
import { showQuizPlayerScreen, showResultsScreen, updateNavigationButtonsState, resetSummaryContainer } from './uiController.js';
import { renderCurrentQuestion, renderFeedbackForQuestion, renderQuizResults } from './quizPlayer.js';

export function startQuiz(quizContent) {
    if (!validateQuizData(quizContent)) {
        showError("Invalid quiz data structure. Cannot start quiz.");
        return false;
    }
    State.setQuizData(shuffleArray(quizContent));
    State.resetQuizState(State.getQuizData().length); // Pass length for array initialization
    
    resetSummaryContainer();
    showQuizPlayerScreen();
    renderCurrentQuestion();
    updateNavigationButtonsState();
    return true;
}

export function calculateScore() {
    State.resetScore();
    const quizData = State.getQuizData();
    const userAnswers = State.getUserAnswers();

    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer === undefined) return; // Skip unanswered

        let isCorrect = false;
        if (question.type === "multiple-choice" || question.type === "true-false") {
            isCorrect = userAnswer === question.correct;
        } else if (question.type === "fill-in-the-blank" || question.type === "identification") {
            isCorrect = typeof userAnswer === "string" && 
                        userAnswer.trim().toLowerCase() === String(question.correct).trim().toLowerCase();
        }
        if (isCorrect) {
            State.incrementScore();
        }
    });
}

export function handleSubmitAnswer() {
    clearError();
    const currentIndex = State.getCurrentQuestionIndex();
    const currentQuestion = State.getCurrentQuestion();

    // For text input, ensure answer from input field is in state
    if (currentQuestion.type === "fill-in-the-blank" || currentQuestion.type === "identification") {
        const inputField = DOM.quizContainer.querySelector("input[type='text']");
        if (inputField) {
            State.setUserAnswerAtIndex(currentIndex, inputField.value);
        }
    }

    const userAnswer = State.getUserAnswerAtIndex(currentIndex);
    if (userAnswer === undefined || (typeof userAnswer === "string" && userAnswer.trim() === "")) {
        showError("Please enter an answer before submitting.");
        return;
    }

    State.setSubmittedAtIndex(currentIndex, true);
    renderFeedbackForQuestion(userAnswer);
    calculateScore(); // Recalculate score
    updateNavigationButtonsState();
}

export function goToPrevQuestion() {
    clearError();
    const currentIndex = State.getCurrentQuestionIndex();
    if (currentIndex > 0) {
        State.setCurrentQuestionIndex(currentIndex - 1);
        renderCurrentQuestion();
        updateNavigationButtonsState();
    }
}

export function goToNextQuestion() {
    clearError();
    const currentIndex = State.getCurrentQuestionIndex();
    const quizDataLength = State.getQuizData().length;

    if (!State.isSubmittedAtIndex(currentIndex)) {
        showError("Please submit your answer before proceeding.");
        // For MC/TF, this check might be redundant due to auto-submit, but good for FITB
        return;
    }

    if (currentIndex < quizDataLength - 1) {
        State.setCurrentQuestionIndex(currentIndex + 1);
        renderCurrentQuestion();
        updateNavigationButtonsState();
    } else {
        // Reached end of quiz
        calculateScore(); // Final score calculation
        renderQuizResults();
        showResultsScreen();
    }
}

export function restartCurrentQuiz() {
    // Assumes quizData is already loaded and valid
    State.resetQuizState(); // Resets index, score, answers for the current quizData
    showQuizPlayerScreen();
    renderCurrentQuestion();
    updateNavigationButtonsState();
}
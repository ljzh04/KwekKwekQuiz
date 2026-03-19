/**
 * @fileoverview Quiz Engine module for KwekKwekQuiz
 * Manages the core quiz functionality including starting, scoring, and navigation.
 * @module quizEngine
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import * as State from './state.js';
import { shuffleArray, validateQuizData, showError, clearError } from './utils.js';
import { showQuizPlayerScreen, showResultsScreen, updateNavigationButtonsState, resetSummaryContainer } from './uiController.js';
import { renderCurrentQuestion, renderFeedbackForQuestion, renderQuizResults, shakeElementOnce, sparkleBurstOnce } from './quizPlayer.js';

/**
 * Starts a quiz with the provided content.
 * @function startQuiz
 * @param {Array} quizContent - The quiz questions and settings
 * @returns {boolean} True if the quiz started successfully, false otherwise
 * @todo Add support for timed quizzes
 * @toimprove Implement better error handling for invalid quiz data
 * @tofix Ensure proper cleanup of previous quiz state
 */
export function startQuiz(quizContent) {
    if (!validateQuizData(quizContent)) {
        showError("Invalid quiz data structure. Cannot start quiz.");
        return false;
    }
    
    // Apply randomization based on settings
    let randomizedQuizContent = [...quizContent]; // Create a copy to avoid modifying original
    
    // Check if we should randomize question order
    const randomizeQuestions = localStorage.getItem("randomizeQuestions") === "true";
    if (randomizeQuestions) {
        randomizedQuizContent = shuffleArray(randomizedQuizContent);
    }
    
    // Check if we should randomize choice order for each question
    const randomizeChoices = localStorage.getItem("randomizeChoices") === "true";
    if (randomizeChoices) {
        randomizedQuizContent = randomizedQuizContent.map(question => {
            if (question.type === "multiple-choice" && Array.isArray(question.options)) {
                // Store the original correct answer index before shuffling
                const originalCorrect = question.correct;
                
                // Create an array of [originalIndex, option] pairs to track original indices
                const indexedOptions = question.options.map((option, index) => ({ 
                    option, 
                    index 
                }));
                
                // Shuffle the indexed options
                const shuffledIndexedOptions = shuffleArray(indexedOptions);
                
                // Extract the new options and update the correct answer index
                const newOptions = shuffledIndexedOptions.map(item => item.option);
                const newCorrectIndex = shuffledIndexedOptions.findIndex(item => item.index === originalCorrect);
                
                // Return the question with shuffled options and updated correct answer index
                return {
                    ...question,
                    options: newOptions,
                    correct: newCorrectIndex
                };
            }
            return question; // Return unchanged for non-multiple-choice questions
        });
    }
    
    State.setQuizData(randomizedQuizContent);
    State.resetQuizState(State.getQuizData().length); // Pass length for array initialization
    
    resetSummaryContainer();
    showQuizPlayerScreen();
    renderCurrentQuestion();
    updateNavigationButtonsState();
    return true;
}

/**
 * Calculates the current score based on user answers.
 * @function calculateScore
 * @returns {void}
 * @todo Add support for partial credit scoring
 * @toimprove Optimize for large quiz sets
 * @tofix Ensure accurate scoring for all question types
 */
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

/**
 * Handles the submission of an answer for the current question.
 * @function handleSubmitAnswer
 * @returns {void}
 * @todo Add support for essay-type questions with manual grading
 * @toimprove Provide more detailed feedback for incorrect answers
 * @tofix Ensure proper state management when submitting answers
 */
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

    // For text-input questions, provide subtle animation feedback for both correct and incorrect results.
    if ((currentQuestion.type === "fill-in-the-blank" || currentQuestion.type === "identification") && userAnswer) {
        const normalizedUser = String(userAnswer).trim().toLowerCase();
        const normalizedCorrect = String(currentQuestion.correct).trim().toLowerCase();
        const inputField = DOM.quizContainer?.querySelector("input[type='text']");
        if (inputField) {
            if (normalizedUser !== normalizedCorrect) {
                shakeElementOnce(inputField);
            } else if (!State.wasSparkleBurstShownAtIndex(currentIndex)) {
                sparkleBurstOnce(inputField);
                State.setSparkleBurstShownAtIndex(currentIndex, true);
            }
        }
    }

    calculateScore(); // Recalculate score
    updateNavigationButtonsState();
}

/**
 * Navigates to the previous question in the quiz.
 * @function goToPrevQuestion
 * @returns {void}
 * @todo Add animation when transitioning between questions
 * @toimprove Optimize navigation performance
 * @tofix Ensure proper state management when navigating backwards
 */
export function goToPrevQuestion() {
    clearError();
    const currentIndex = State.getCurrentQuestionIndex();
    if (currentIndex > 0) {
        State.setCurrentQuestionIndex(currentIndex - 1);
        renderCurrentQuestion();
        updateNavigationButtonsState();
    }
}

/**
 * Navigates to the next question in the quiz or finishes the quiz if at the end.
 * @function goToNextQuestion
 * @returns {void}
 * @todo Add option to skip questions and return later
 * @toimprove Implement smooth transitions between questions
 * @tofix Ensure proper quiz completion handling
 */
export function goToNextQuestion() {
    clearError();
    const currentIndex = State.getCurrentQuestionIndex();
    const quizDataLength = State.getQuizData().length;

    if (!State.isSubmittedAtIndex(currentIndex)) {
        showError("Please submit your answer before proceeding.");
        // For text-input questions, this check might be redundant due to auto-submit, but good for FITB
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

/**
 * Restarts the current quiz from the beginning.
 * @function restartCurrentQuiz
 * @returns {void}
 * @todo Add confirmation dialog before restarting
 * @toimprove Preserve user preferences during restart
 * @tofix Ensure complete state reset when restarting
 */
export function restartCurrentQuiz() {
    // Assumes quizData is already loaded and valid
    State.resetQuizState(); // Resets index, score, answers for the current quizData
    showQuizPlayerScreen();
    renderCurrentQuestion();
    updateNavigationButtonsState();
}

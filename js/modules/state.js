// js/modules/state.js
import sampleQuizData from '/data/sample_quiz.json' assert { type: 'json' }; // Adjusted path

export const sampleQuizJson = JSON.stringify(sampleQuizData, null, 2);

let quizData = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let submittedAnswers = []; // Tracks if a question's answer has been submitted

// Getters
export const getQuizData = () => quizData;
export const getCurrentQuestion = () => quizData[currentQuestionIndex];
export const getCurrentQuestionIndex = () => currentQuestionIndex;
export const getScore = () => score;
export const getUserAnswerAtIndex = (index) => userAnswers[index];
export const getUserAnswers = () => userAnswers;
export const isSubmittedAtIndex = (index) => submittedAnswers[index];
export const getSubmittedAnswers = () => submittedAnswers; // Get the whole array

// Setters & Modifiers
export function setQuizData(newQuizData) {
    quizData = newQuizData;
}

export function setCurrentQuestionIndex(index) {
    currentQuestionIndex = index;
}

export function incrementScore() {
    score++;
}
export function resetScore() {
    score = 0;
}

export function setUserAnswerAtIndex(index, answer) {
    userAnswers[index] = answer;
}

export function setSubmittedAtIndex(index, value) {
    submittedAnswers[index] = value;
}

export function resetQuizState(dataLength = 0) {
    // quizData is typically set by loadQuiz or startQuiz, so not reset here unless explicitly needed
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(dataLength || quizData.length);
    submittedAnswers = new Array(dataLength || quizData.length).fill(false);
}
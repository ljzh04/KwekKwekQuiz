/**
 * @fileoverview State management module for KwekKwekQuiz
 * Manages the application's state including quiz data, user answers, and scores.
 * @module state
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import sampleQuizData from '/data/sample_quiz.json' assert { type: 'json' }; // Adjusted path

/**
 * @constant {string}
 * @description Sample quiz data in JSON format
 */
export const sampleQuizJson = JSON.stringify(sampleQuizData, null, 2);

/**
 * @type {Array}
 * @private
 * @description The current quiz data
 */
let quizData = [];

/**
 * @type {number}
 * @private
 * @description The current question index
 */
let currentQuestionIndex = 0;

/**
 * @type {number}
 * @private
 * @description The current score
 */
let score = 0;

/**
 * @type {Array}
 * @private
 * @description The user's answers
 */
let userAnswers = [];

/**
 * @type {Array<boolean>}
 * @private
 * @description Tracks if a question's answer has been submitted
 */
let submittedAnswers = [];

/**
 * @type {Array<boolean>}
 * @private
 * @description Tracks whether success sparkle burst has already run per question
 */
let sparkleBurstShown = [];

// Getters
/**
 * Gets the current quiz data.
 * @function getQuizData
 * @returns {Array} The current quiz data
 * @todo Add validation to ensure quiz data is properly formatted
 * @toimprove Optimize for large quiz sets
 * @tofix Ensure proper error handling when quiz data is not available
 */
export const getQuizData = () => quizData;

/**
 * Gets the current question.
 * @function getCurrentQuestion
 * @returns {Object} The current question
 * @todo Add validation to ensure the current question exists
 * @toimprove Optimize for performance with large question sets
 * @tofix Ensure proper error handling when current question is not available
 */
export const getCurrentQuestion = () => quizData[currentQuestionIndex];

/**
 * Gets the current question index.
 * @function getCurrentQuestionIndex
 * @returns {number} The current question index
 */
export const getCurrentQuestionIndex = () => currentQuestionIndex;

/**
 * Gets the current score.
 * @function getScore
 * @returns {number} The current score
 */
export const getScore = () => score;

/**
 * Gets the user's answer at the specified index.
 * @function getUserAnswerAtIndex
 * @param {number} index - The index of the answer to retrieve
 * @returns {any} The user's answer at the specified index
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large answer sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export const getUserAnswerAtIndex = (index) => userAnswers[index];

/**
 * Gets all user answers.
 * @function getUserAnswers
 * @returns {Array} All user answers
 */
export const getUserAnswers = () => userAnswers;

/**
 * Checks if the answer at the specified index has been submitted.
 * @function isSubmittedAtIndex
 * @param {number} index - The index to check
 * @returns {boolean} Whether the answer at the specified index has been submitted
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large answer sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export const isSubmittedAtIndex = (index) => submittedAnswers[index];

/**
 * Gets all submitted answers.
 * @function getSubmittedAnswers
 * @returns {Array<boolean>} All submitted answers
 */
export const getSubmittedAnswers = () => submittedAnswers; // Get the whole array

/**
 * Checks if the sparkle burst has been shown for the question at the specified index.
 * @function wasSparkleBurstShownAtIndex
 * @param {number} index - The index to check
 * @returns {boolean} Whether the sparkle burst has been shown for the question at the specified index
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large answer sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export const wasSparkleBurstShownAtIndex = (index) => sparkleBurstShown[index];

/**
 * Gets the sparkle burst status for all questions.
 * @function getSparkleBurstShown
 * @returns {Array<boolean>} The sparkle burst status for all questions
 */
export const getSparkleBurstShown = () => sparkleBurstShown; // Get the whole array

// Setters & Modifiers
/**
 * Sets the quiz data.
 * @function setQuizData
 * @param {Array} newQuizData - The new quiz data
 * @todo Add validation to ensure the new quiz data is properly formatted
 * @toimprove Optimize for large quiz sets
 * @tofix Ensure proper error handling when setting new quiz data
 */
export function setQuizData(newQuizData) {
    quizData = newQuizData;
}

/**
 * Sets the current question index.
 * @function setCurrentQuestionIndex
 * @param {number} index - The new question index
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large question sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export function setCurrentQuestionIndex(index) {
    currentQuestionIndex = index;
}

/**
 * Increments the current score.
 * @function incrementScore
 * @todo Add validation to ensure the score doesn't exceed the maximum possible
 * @toimprove Optimize for performance with large scores
 * @tofix Ensure proper error handling when incrementing the score
 */
export function incrementScore() {
    score++;
}

/**
 * Resets the current score to zero.
 * @function resetScore
 * @todo Add validation to ensure the score is properly reset
 * @toimprove Optimize for performance with large scores
 * @tofix Ensure proper error handling when resetting the score
 */
export function resetScore() {
    score = 0;
}

/**
 * Sets the user's answer at the specified index.
 * @function setUserAnswerAtIndex
 * @param {number} index - The index to set the answer at
 * @param {any} answer - The answer to set
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large answer sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export function setUserAnswerAtIndex(index, answer) {
    userAnswers[index] = answer;
}

/**
 * Sets the submitted status at the specified index.
 * @function setSubmittedAtIndex
 * @param {number} index - The index to set the status at
 * @param {boolean} value - The status to set
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large answer sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export function setSubmittedAtIndex(index, value) {
    submittedAnswers[index] = value;
}

/**
 * Sets the sparkle burst shown status at the specified index.
 * @function setSparkleBurstShownAtIndex
 * @param {number} index - The index to set the status at
 * @param {boolean} value - The status to set
 * @todo Add validation to ensure the index is valid
 * @toimprove Optimize for performance with large answer sets
 * @tofix Ensure proper error handling when the index is out of bounds
 */
export function setSparkleBurstShownAtIndex(index, value) {
    sparkleBurstShown[index] = value;
}

/**
 * Resets the quiz state to its initial values.
 * @function resetQuizState
 * @param {number} [dataLength=0] - The length of the quiz data to initialize arrays with
 * @todo Add validation to ensure the data length is valid
 * @toimprove Optimize for performance with large quiz sets
 * @tofix Ensure proper error handling when resetting the quiz state
 */
export function resetQuizState(dataLength = 0) {
    // quizData is typically set by loadQuiz or startQuiz, so not reset here unless explicitly needed
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(dataLength || quizData.length);
    submittedAnswers = new Array(dataLength || quizData.length).fill(false);
    sparkleBurstShown = new Array(dataLength || quizData.length).fill(false);
}

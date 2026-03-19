/**
 * @fileoverview Quiz Builder module for KwekKwekQuiz
 * Renders the visual question editor UI and manages question creation/editing.
 * @module quizBuilder
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import * as State from './state.js';
import { jsonStateManager } from './jsonStateManager.js';
import { showError, validateQuizData, showSuccess, clearError } from './utils.js';
import { startQuiz } from './quizEngine.js';
import { switchInputMode } from './uiController.js';

/**
 * Quiz Builder Module
 *
 * Renders the visual question editor UI. All question data is read from
 * and written to jsonStateManager — this module owns NO private state.
 * It subscribes to state changes to re-render when questions are updated
 * externally (e.g., AI generation, saved quiz load).
 * @todo Add validation for question content before saving
 * @toimprove Implement drag-and-drop reordering of questions
 * @tofix Ensure proper cleanup of event listeners when switching modes
 */

/** @type {Function|null} Unsubscribe callback */
let _unsubscribe = null;

/**
 * Initialize the quiz builder: subscribe to state, attach DOM events.
 * @function initializeQuizBuilder
 * @returns {void}
 * @todo Add error handling for missing DOM elements
 * @toimprove Optimize rendering for large numbers of questions
 * @tofix Ensure proper cleanup of event listeners on initialization failure
 */
export function initializeQuizBuilder() {
    if (!DOM.addQuestionBtn || !DOM.questionsContainer) {
        console.warn("Quiz builder elements not found, skipping initialization");
        return;
    }

    // Subscribe to state changes for re-rendering
    _unsubscribe = jsonStateManager.subscribe(() => {
        if (jsonStateManager.isBuilderMode()) {
            renderQuestions();
        }
    });

    // DOM event listeners
    DOM.addQuestionBtn.addEventListener('click', addNewQuestion);
    DOM.switchToEditorBtn.addEventListener('click', () => switchInputMode('editor'));
    DOM.switchToBuilderBtn.addEventListener('click', () => switchInputMode('builder'));
    DOM.previewQuizBtn.addEventListener('click', previewQuiz);
}

// ─── Question CRUD ────────────────────────────────────────────────────

/**
 * Adds a new question to the quiz with default values.
 * @function addNewQuestion
 * @returns {void}
 * @todo Add validation to ensure minimum question requirements
 * @toimprove Implement question templates for faster creation
 * @tofix Ensure unique IDs are generated even in rapid succession
 */
function addNewQuestion() {
    const questions = jsonStateManager.getQuestions();
    const newQuestion = {
        id: Date.now(),
        type: "multiple-choice",
        question: "",
        options: ["", "", "", ""],
        correct: 0
    };
    questions.push(newQuestion);
    jsonStateManager.setQuestions(questions);

    // Focus the new question's text input after render
    setTimeout(() => {
        const el = document.querySelector(`[data-question-id="${newQuestion.id}"] .question-text`);
        if (el) el.focus();
    }, 100);
}

/**
 * Removes a question by its ID.
 * @function removeQuestion
 * @param {number} questionId - The ID of the question to remove
 * @returns {void}
 * @todo Add confirmation dialog for question deletion
 * @toimprove Update correct answer indices after removal
 * @tofix Ensure proper state update when removing the last question
 */
function removeQuestion(questionId) {
    const questions = jsonStateManager.getQuestions()
        .filter(q => q.id !== questionId);
    jsonStateManager.setQuestions(questions);
}

/**
 * Updates a specific field of a question.
 * @function updateQuestion
 * @param {number} questionId - The ID of the question to update
 * @param {string} field - The field name to update
 * @param {any} value - The new value for the field
 * @returns {void}
 * @todo Add validation for field updates
 * @toimprove Optimize for performance with large question sets
 * @tofix Ensure proper state synchronization after updates
 */
function updateQuestion(questionId, field, value) {
    const questions = jsonStateManager.getQuestions();
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    q[field] = value;
    // Write back without triggering full re-render (to preserve focus)
    jsonStateManager._questions = questions;
}

/**
 * Changes the type of a question and adjusts its structure accordingly.
 * @function changeQuestionType
 * @param {number} questionId - The ID of the question to modify
 * @param {string} newType - The new question type
 * @returns {void}
 * @todo Add support for more question types
 * @toimprove Implement smooth transitions when changing question types
 * @tofix Ensure correct answer is properly adjusted when changing types
 */
function changeQuestionType(questionId, newType) {
    const questions = jsonStateManager.getQuestions();
    const q = questions.find(q => q.id === questionId);
    if (!q || q.type === newType) return;

    const oldType = q.type;
    q.type = newType;

    // Reset options/answers for the new type
    if (newType === 'multiple-choice') {
        q.options = ["", ""];
        q.correct = 0;
    } else if (newType === 'true-false') {
        q.options = ["True", "False"];
        q.correct = true;
    } else {
        delete q.options;
        q.correct = "";
    }

    // Full re-render needed when type changes (options structure changes)
    jsonStateManager.setQuestions(questions);
}

/**
 * Updates an option value for a multiple-choice question.
 * @function updateOption
 * @param {number} questionId - The ID of the question
 * @param {number} optIdx - The index of the option to update
 * @param {string} value - The new value for the option
 * @returns {void}
 * @todo Add validation for option values
 * @toimprove Optimize for performance with many options
 * @tofix Ensure proper state synchronization after updates
 */
function updateOption(questionId, optIdx, value) {
    const questions = jsonStateManager.getQuestions();
    const q = questions.find(q => q.id === questionId);
    if (!q || !q.options) return;
    q.options[optIdx] = value;
    jsonStateManager._questions = questions;
}

/**
 * Sets the correct option for a question.
 * @function setCorrectOption
 * @param {number} questionId - The ID of the question
 * @param {string|number} value - The correct option value
 * @returns {void}
 * @todo Add validation for correct option values
 * @toimprove Provide visual feedback for correct answer selection
 * @tofix Ensure proper type conversion for different question types
 */
function setCorrectOption(questionId, value) {
    const questions = jsonStateManager.getQuestions();
    const q = questions.find(q => q.id === questionId);
    if (!q) return;

    if (q.type === 'multiple-choice') {
        q.correct = parseInt(value, 10);
    } else if (q.type === 'true-false') {
        q.correct = value === 'true';
    }
    jsonStateManager._questions = questions;
}

/**
 * Adds a new option to a multiple-choice question.
 * @function addOption
 * @param {number} questionId - The ID of the question
 * @returns {void}
 * @todo Add validation to prevent too many options
 * @toimprove Provide immediate visual feedback after adding option
 * @tofix Ensure proper state synchronization after adding option
 */
function addOption(questionId) {
    const questions = jsonStateManager.getQuestions();
    const q = questions.find(q => q.id === questionId);
    if (!q || !q.options) return;
    q.options.push("");
    jsonStateManager.setQuestions(questions); // full re-render
}

/**
 * Removes an option from a multiple-choice question.
 * @function removeOption
 * @param {number} questionId - The ID of the question
 * @param {number} optIdx - The index of the option to remove
 * @returns {void}
 * @todo Add confirmation for option deletion
 * @toimprove Update correct answer index after removal
 * @tofix Ensure proper state synchronization after removing option
 */
function removeOption(questionId, optIdx) {
    const questions = jsonStateManager.getQuestions();
    const q = questions.find(q => q.id === questionId);
    if (!q || !q.options) return;

    q.options.splice(optIdx, 1);
    // Adjust correct answer index if needed
    if (typeof q.correct === 'number' && q.correct >= optIdx) {
        q.correct = Math.max(0, q.correct - 1);
    }
    jsonStateManager.setQuestions(questions); // full re-render
}

// ─── Rendering ────────────────────────────────────────────────────────

/**
 * Renders all questions in the questions container.
 * @function renderQuestions
 * @returns {void}
 * @todo Add virtual scrolling for large question sets
 * @toimprove Optimize rendering performance
 * @tofix Ensure proper cleanup of old event listeners during re-render
 */
function renderQuestions() {
    if (!DOM.questionsContainer) return;

    const questions = jsonStateManager.getQuestions();

    if (questions.length === 0) {
        DOM.questionsContainer.innerHTML = `
            <div class="empty-state text-center py-12 text-md-on-surface-variant dark:text-gray-400">
                <div class="material-symbols-outlined text-4xl mb-2 mx-auto opacity-50">quiz</div>
                <p class="text-lg font-medium">No questions yet</p>
                <p class="text-sm mt-1">Click "Add Question" to get started building your quiz</p>
            </div>
        `;
        return;
    }

    DOM.questionsContainer.innerHTML = questions.map((q, index) => createQuestionHTML(q, index)).join('');
    questions.forEach((q) => attachQuestionListeners(q.id));
}

/**
 * Creates the HTML for a single question based on its type.
 * @function createQuestionHTML
 * @param {Object} question - The question object to render
 * @param {number} index - The index of the question in the list
 * @returns {string} The HTML string for the question
 * @todo Add support for more question types
 * @toimprove Optimize HTML generation for performance
 * @tofix Ensure proper escaping of user content to prevent XSS
 */
function createQuestionHTML(question, index) {
    let optionsHTML = '';

    if (question.type === 'multiple-choice') {
        optionsHTML = (question.options || []).map((opt, optIdx) => `
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${question.id}" value="${optIdx}" 
                    id="correct-${question.id}-${optIdx}" 
                    ${question.correct == optIdx ? 'checked' : ''} 
                    class="correct-option">
                <label for="correct-${question.id}-${optIdx}" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="${escapeAttr(opt || '')}" 
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                        placeholder="Option ${optIdx + 1}">
                    <button type="button" class="remove-option-btn text-red-500 hover:text-red-700 p-1" 
                        data-question-id="${question.id}" data-option-idx="${optIdx}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </label>
            </div>
        `).join('');
    } else if (question.type === 'true-false') {
        const trueChecked = question.correct === true || question.correct === "true" ? 'checked' : '';
        const falseChecked = question.correct === false || question.correct === "false" ? 'checked' : '';

        optionsHTML = `
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${question.id}" value="true" 
                    id="correct-${question.id}-true" ${trueChecked} class="correct-option">
                <label for="correct-${question.id}-true" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="True" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="True">
                </label>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${question.id}" value="false" 
                    id="correct-${question.id}-false" ${falseChecked} class="correct-option">
                <label for="correct-${question.id}-false" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="False" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="False">
                </label>
            </div>
        `;
    } else {
        optionsHTML = `
            <div class="mb-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Correct Answer</label>
                <input type="text" value="${escapeAttr(question.correct || '')}" 
                    class="answer-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    placeholder="Enter the correct answer">
            </div>
        `;
    }

    return `
        <div class="question-card border border-md-outline dark:border-gray-600 rounded-lg p-4 bg-md-surface dark:bg-gray-800" data-question-id="${question.id}">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-md-on-surface dark:text-gray-200">Question ${index + 1}</h4>
                <div class="flex gap-1">
                    <select class="question-type-select text-sm p-1 border border-md-outline rounded-md dark:bg-gray-800 dark:text-white">
                        <option value="multiple-choice" ${question.type === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
                        <option value="true-false" ${question.type === 'true-false' ? 'selected' : ''}>True/False</option>
                        <option value="fill-in-the-blank" ${question.type === 'fill-in-the-blank' ? 'selected' : ''}>Fill-in-the-blank</option>
                        <option value="identification" ${question.type === 'identification' ? 'selected' : ''}>Identification</option>
                        <option value="short-answer" ${question.type === 'short-answer' ? 'selected' : ''}>Short Answer</option>
                    </select>
                    <button type="button" class="remove-question-btn text-red-500 hover:text-red-700 p-1" data-question-id="${question.id}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            
            <div class="mb-3">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Question Text</label>
                <textarea class="question-text w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    rows="2" placeholder="Enter your question here...">${escapeHTML(question.question || '')}</textarea>
            </div>
            
            <div class="options-section">
                <label class="block text-sm font-medium mb-2 text-md-on-surface dark:text-gray-300">
                    ${question.type === 'multiple-choice' ? 'Options' : 
                      question.type === 'true-false' ? 'Options' : 
                      'Answer'}
                </label>
                ${optionsHTML}
                
                ${question.type === 'multiple-choice' ? `
                <button type="button" class="add-option-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                    data-question-id="${question.id}">
                    <span class="material-symbols-outlined text-xs">add</span>
                    <span>Add Option</span>
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Attaches event listeners to a question's DOM elements.
 * @function attachQuestionListeners
 * @param {number} questionId - The ID of the question
 * @returns {void}
 * @todo Add more comprehensive event handling
 * @toimprove Optimize event listener attachment for performance
 * @tofix Ensure proper cleanup of event listeners when question is removed
 */
function attachQuestionListeners(questionId) {
    const card = document.querySelector(`[data-question-id="${questionId}"]`);
    if (!card) return;

    // Question text
    const textEl = card.querySelector('.question-text');
    if (textEl) {
        textEl.addEventListener('input', (e) => updateQuestion(questionId, 'question', e.target.value));
    }

    // Type select
    const typeEl = card.querySelector('.question-type-select');
    if (typeEl) {
        typeEl.addEventListener('change', (e) => changeQuestionType(questionId, e.target.value));
    }

    // Option inputs
    card.querySelectorAll('.option-input').forEach((input, optIdx) => {
        if (!input.readOnly) {
            input.addEventListener('input', (e) => updateOption(questionId, optIdx, e.target.value));
        }
    });

    // Answer input (text-based questions)
    const answerEl = card.querySelector('.answer-input');
    if (answerEl) {
        answerEl.addEventListener('input', (e) => updateQuestion(questionId, 'correct', e.target.value));
    }

    // Correct option radios
    card.querySelectorAll('.correct-option').forEach(radio => {
        radio.addEventListener('change', (e) => setCorrectOption(questionId, e.target.value));
    });

    // Remove question
    const removeBtn = card.querySelector('.remove-question-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeQuestion(questionId));
    }

    // Add option
    const addOptBtn = card.querySelector('.add-option-btn');
    if (addOptBtn) {
        addOptBtn.addEventListener('click', () => addOption(questionId));
    }

    // Remove option buttons
    card.querySelectorAll('.remove-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const optIdx = parseInt(e.currentTarget.dataset.optionIdx, 10);
            removeOption(questionId, optIdx);
        });
    });
}

// ─── Data Conversion ──────────────────────────────────────────────────

/**
 * Convert questions from state manager to clean quiz format (strips internal `id`).
 * @function convertQuestionsToCleanJson
 * @returns {Array<Object>} Clean questions array without internal IDs
 * @todo Add validation for the converted data
 * @toimprove Optimize for large question sets
 * @tofix Ensure all question types are properly converted
 */
function convertQuestionsToCleanJson() {
    return jsonStateManager.getQuestions()
        .filter(q => q.question && q.question.trim() !== "")
        .map(q => {
            const obj = { type: q.type, question: q.question };

            if (q.type === 'multiple-choice') {
                obj.options = (q.options || []).filter(opt => opt && opt.trim() !== '');
                obj.correct = q.correct;
            } else if (q.type === 'true-false') {
                obj.options = ["True", "False"];
                obj.correct = q.correct;
            } else {
                obj.correct = q.correct;
            }

            return obj;
        });
}

/**
 * Load questions from an external JSON source into the builder.
 * Assigns new IDs to each question for DOM tracking.
 * @function loadQuestionsFromJson
 * @param {Array|Object} jsonData - The JSON data containing questions
 * @returns {void}
 * @todo Add validation for the input JSON structure
 * @toimprove Handle different JSON formats more gracefully
 * @tofix Ensure proper error handling for malformed JSON
 */
export function loadQuestionsFromJson(jsonData) {
    const arr = Array.isArray(jsonData) ? jsonData : [jsonData];
    const questions = arr.map((q, idx) => ({
        id: Date.now() + idx,
        type: q.type || "multiple-choice",
        question: q.question || "",
        ...(q.type === 'multiple-choice' ? {
            options: q.options || [""],
            correct: q.correct !== undefined ? q.correct : 0,
        } : q.type === 'true-false' ? {
            options: ["True", "False"],
            correct: q.correct !== undefined ? q.correct : true,
        } : {
            correct: q.correct || "",
        }),
    }));

    jsonStateManager.setQuestions(questions);
}

// ─── AI Generation Bridge ─────────────────────────────────────────────

/**
 * Called when the builder's "Generate More" button is clicked.
 * Ensures state manager is up-to-date before delegating to geminiService.
 * @function handleGenerateInBuilderMode
 * @returns {void}
 * @todo Add loading indicators during generation
 * @toimprove Optimize state synchronization before generation
 * @tofix Ensure proper error handling during AI generation
 */
export function handleGenerateInBuilderMode() {
    // Sync current builder state (questions are already in state manager
    // via updateQuestion/setQuestions calls, so nothing extra needed)
    if (window.handleGenerateQuizRequest) {
        window.handleGenerateQuizRequest();
    }
}

// ─── Preview ──────────────────────────────────────────

/**
 * Previews the current quiz by starting the quiz engine.
 * @function previewQuiz
 * @returns {void}
 * @todo Add validation before starting the preview
 * @toimprove Show loading state during quiz preparation
 * @tofix Ensure proper cleanup after quiz preview ends
 */
function previewQuiz() {
    const quizJson = convertQuestionsToCleanJson();

    if (quizJson.length === 0) {
        showError("Cannot preview: No valid questions found. Please add at least one question.");
        return;
    }

    if (!validateQuizData(quizJson)) {
        showError("Invalid quiz data. Please check your questions and try again.");
        return;
    }

    // Sync to editor textarea for quiz engine consumption
    const jsonString = JSON.stringify(quizJson, null, 2);
    if (DOM.quizJsonInput) {
        DOM.quizJsonInput.value = jsonString;
    }
    jsonStateManager.setRawEditorText(jsonString);

    startQuiz(quizJson);
}

// ─── Utilities ────────────────────────────────────────

/**
 * Escapes HTML characters in a string.
 * @function escapeHTML
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 * @todo Add more comprehensive HTML escaping
 * @toimprove Optimize for performance with large strings
 * @tofix Ensure all potentially dangerous characters are escaped
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escapes attribute characters in a string.
 * @function escapeAttr
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 * @todo Add more comprehensive attribute escaping
 * @toimprove Optimize for performance with large strings
 * @tofix Ensure all potentially dangerous characters are escaped
 */
function escapeAttr(str) {
    return str
        .replace(/&/g, '\x26amp;')
        .replace(/"/g, '\x26quot;')
        .replace(/'/g, '\x26#39;')
        .replace(/</g, '\x26lt;')
        .replace(/>/g, '\x26gt;');
}

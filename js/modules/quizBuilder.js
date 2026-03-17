// js/modules/quizBuilder.js
import * as DOM from './dom.js';
import * as State from './state.js';
import { jsonStateManager } from './jsonStateManager.js';
import { showError, clearError, validateQuizData, sanitizeInput, showSuccess } from './utils.js';
import { startQuiz } from './quizEngine.js';

let currentQuestions = [];

export function initializeQuizBuilder() {
    if (!DOM.addQuestionBtn || !DOM.questionsContainer) {
        console.warn("Quiz builder elements not found, skipping initialization");
        return;
    }

    // Add event listeners for quiz builder functionality
    DOM.addQuestionBtn.addEventListener('click', addNewQuestion);
    DOM.switchToEditorBtn.addEventListener('click', switchToEditorMode);
    DOM.switchToBuilderBtn.addEventListener('click', switchToBuilderMode);
    DOM.previewQuizBtn.addEventListener('click', previewQuiz);
    
    // Set initial state - show builder, hide editor
    showQuizBuilder();
}

function showQuizBuilder() {
    if (DOM.quizBuilder) DOM.quizBuilder.classList.remove('hidden');
    if (DOM.editorUnit) DOM.editorUnit.classList.add('hidden');
    if (DOM.builderModeIndicator) DOM.builderModeIndicator.textContent = 'Mode: Visual Builder';
}

function showEditor() {
    if (DOM.editorUnit) DOM.editorUnit.classList.remove('hidden');
    if (DOM.quizBuilder) DOM.quizBuilder.classList.add('hidden');
    if (DOM.modeIndicator) DOM.modeIndicator.textContent = 'Mode: Editor';
}

function switchToEditorMode() {
    // Convert current questions to JSON and populate the editor
    const quizJson = convertQuestionsToJson();
    if (DOM.quizJsonInput) {
        DOM.quizJsonInput.value = JSON.stringify(quizJson, null, 2);
    }
    showEditor();
}

function switchToBuilderMode() {
    // Parse JSON from editor and populate the builder
    if (DOM.quizJsonInput) {
        try {
            const jsonData = JSON.parse(DOM.quizJsonInput.value);
            loadQuestionsFromJson(jsonData);
        } catch (e) {
            console.warn("Could not parse JSON, starting with empty builder");
            currentQuestions = [];
            renderQuestions();
        }
    }
    showQuizBuilder();
}

export function handleGenerateInBuilderMode() {
    // Update state manager with current builder data
    const currentQuestions = convertQuestionsToJson();
    jsonStateManager.setBuilderData(currentQuestions);
    jsonStateManager.setMode('builder');
    
    // Get user prompt from appropriate source
    const userPrompt = jsonStateManager.getCurrentData();
    
    // Use the improved gemini service directly
    if (window.handleGenerateQuizRequest) {
        window.handleGenerateQuizRequest();
    }
}

function addNewQuestion() {
    const newQuestion = {
        id: Date.now(),
        type: "multiple-choice",
        question: "",
        options: ["", "", "", ""],
        correct: 0
    };
    
    currentQuestions.push(newQuestion);
    renderQuestions();
    
    // Focus on the new question's input
    setTimeout(() => {
        const newQuestionElement = document.querySelector(`[data-question-id="${newQuestion.id}"] .question-text`);
        if (newQuestionElement) {
            newQuestionElement.focus();
        }
    }, 100);
}

function renderQuestions() {
    if (!DOM.questionsContainer) return;
    
    if (currentQuestions.length === 0) {
        DOM.questionsContainer.innerHTML = `
            <div class="empty-state text-center py-12 text-md-on-surface-variant dark:text-gray-400">
                <div class="material-symbols-outlined text-4xl mb-2 mx-auto opacity-50">quiz</div>
                <p class="text-lg font-medium">No questions yet</p>
                <p class="text-sm mt-1">Click "Add Question" to get started building your quiz</p>
            </div>
        `;
        return;
    }
    
    DOM.questionsContainer.innerHTML = currentQuestions.map((q, index) => createQuestionHTML(q, index)).join('');
    
    // Add event listeners to the newly created elements
    currentQuestions.forEach((q, index) => {
        addQuestionEventListeners(q.id, index);
    });
}

function createQuestionHTML(question, index) {
    let optionsHTML = '';
    
    if (question.type === 'multiple-choice') {
        optionsHTML = question.options.map((opt, optIdx) => `
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${question.id}" value="${optIdx}" 
                    id="correct-${question.id}-${optIdx}" 
                    ${question.correct == optIdx ? 'checked' : ''} 
                    class="correct-option">
                <label for="correct-${question.id}-${optIdx}" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="${opt || ''}" 
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
                    id="correct-${question.id}-true" 
                    ${trueChecked} 
                    class="correct-option">
                <label for="correct-${question.id}-true" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="True" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="True">
                </label>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${question.id}" value="false" 
                    id="correct-${question.id}-false" 
                    ${falseChecked} 
                    class="correct-option">
                <label for="correct-${question.id}-false" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="False" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="False">
                </label>
            </div>
        `;
    } else { // fill-in-the-blank, identification, short-answer
        optionsHTML = `
            <div class="mb-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Correct Answer</label>
                <input type="text" value="${question.correct || ''}" 
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
            </div>
            
            <div class="mb-3">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Question Text</label>
                <textarea class="question-text w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    rows="2" placeholder="Enter your question here...">${question.question || ''}</textarea>
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

function addQuestionEventListeners(questionId, index) {
    // Question text input
    const questionTextEl = document.querySelector(`[data-question-id="${questionId}"] .question-text`);
    if (questionTextEl) {
        questionTextEl.addEventListener('input', (e) => {
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1) {
                currentQuestions[qIndex].question = e.target.value;
            }
        });
    }
    
    // Question type select
    const typeSelectEl = document.querySelector(`[data-question-id="${questionId}"] .question-type-select`);
    if (typeSelectEl) {
        typeSelectEl.addEventListener('change', (e) => {
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1) {
                const oldType = currentQuestions[qIndex].type;
                currentQuestions[qIndex].type = e.target.value;
                
                // Reset options/answers when type changes
                if (oldType !== e.target.value) {
                    if (e.target.value === 'multiple-choice') {
                        currentQuestions[qIndex].options = ["", ""];
                        currentQuestions[qIndex].correct = 0;
                    } else if (e.target.value === 'true-false') {
                        currentQuestions[qIndex].options = ["True", "False"];
                        currentQuestions[qIndex].correct = true;
                    } else {
                        currentQuestions[qIndex].correct = "";
                    }
                }
                
                renderQuestions();
            }
        });
    }
    
    // Option inputs for multiple choice
    const optionInputs = document.querySelectorAll(`[data-question-id="${questionId}"] .option-input`);
    optionInputs.forEach((input, optIdx) => {
        input.addEventListener('input', (e) => {
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1 && currentQuestions[qIndex].options) {
                currentQuestions[qIndex].options[optIdx] = e.target.value;
            }
        });
    });
    
    // Answer input for text-based questions
    const answerInput = document.querySelector(`[data-question-id="${questionId}"] .answer-input`);
    if (answerInput) {
        answerInput.addEventListener('input', (e) => {
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1) {
                currentQuestions[qIndex].correct = e.target.value;
            }
        });
    }
    
    // Correct option radio buttons
    const correctOptions = document.querySelectorAll(`[data-question-id="${questionId}"] .correct-option`);
    correctOptions.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1) {
                if (currentQuestions[qIndex].type === 'multiple-choice') {
                    currentQuestions[qIndex].correct = parseInt(e.target.value);
                } else if (currentQuestions[qIndex].type === 'true-false') {
                    currentQuestions[qIndex].correct = e.target.value === 'true';
                }
            }
        });
    });
    
    // Remove question button
    const removeBtn = document.querySelector(`[data-question-id="${questionId}"] .remove-question-btn`);
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            currentQuestions = currentQuestions.filter(q => q.id != questionId);
            renderQuestions();
        });
    }
    
    // Add option button for multiple choice
    const addOptionBtn = document.querySelector(`[data-question-id="${questionId}"] .add-option-btn`);
    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', () => {
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1) {
                currentQuestions[qIndex].options.push("");
                renderQuestions();
            }
        });
    }
    
    // Remove option button
    const removeOptionBtns = document.querySelectorAll(`[data-question-id="${questionId}"] .remove-option-btn`);
    removeOptionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const optionIdx = parseInt(e.currentTarget.dataset.optionIdx);
            const qIndex = currentQuestions.findIndex(q => q.id == questionId);
            if (qIndex !== -1) {
                currentQuestions[qIndex].options.splice(optionIdx, 1);
                // Adjust correct answer if needed
                if (currentQuestions[qIndex].correct >= optionIdx) {
                    currentQuestions[qIndex].correct = Math.max(0, currentQuestions[qIndex].correct - 1);
                }
                renderQuestions();
            }
        });
    });
}

function convertQuestionsToJson() {
    // Filter out questions with empty text
    const validQuestions = currentQuestions.filter(q => q.question && q.question.trim() !== "");
    
    return validQuestions.map(q => {
        const questionObj = {
            type: q.type,
            question: q.question
        };
        
        if (q.type === 'multiple-choice') {
            questionObj.options = q.options.filter(opt => opt && opt.trim() !== "");
            questionObj.correct = q.correct;
        } else if (q.type === 'true-false') {
            questionObj.options = ["True", "False"];
            questionObj.correct = q.correct;
        } else {
            // For text-based questions
            questionObj.correct = q.correct;
        }
        
        return questionObj;
    });
}

export function loadQuestionsFromJson(jsonData) {
    if (!Array.isArray(jsonData)) {
        console.error("Invalid JSON data format for quiz");
        return;
    }
    
    currentQuestions = jsonData.map((q, idx) => {
        const questionObj = {
            id: Date.now() + idx, // Generate new IDs
            type: q.type || "multiple-choice",
            question: q.question || ""
        };
        
        if (q.type === 'multiple-choice') {
            questionObj.options = q.options || [""];
            questionObj.correct = q.correct !== undefined ? q.correct : 0;
        } else if (q.type === 'true-false') {
            questionObj.options = ["True", "False"];
            questionObj.correct = q.correct !== undefined ? q.correct : true;
        } else {
            // For text-based questions
            questionObj.correct = q.correct || "";
        }
        
        return questionObj;
    });
    
    renderQuestions();
}

function previewQuiz() {
    const quizJson = convertQuestionsToJson();
    
    if (quizJson.length === 0) {
        showError("Cannot preview: No valid questions found. Please add at least one question.");
        return;
    }
    
    if (!validateQuizData(quizJson)) {
        showError("Invalid quiz data. Please check your questions and try again.");
        return;
    }
    
    // Temporarily populate the JSON input with the generated JSON for preview
    if (DOM.quizJsonInput) {
        DOM.quizJsonInput.value = JSON.stringify(quizJson, null, 2);
    }
    
    // Start the quiz preview
    startQuiz(quizJson);
}
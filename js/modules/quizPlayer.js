/**
 * @fileoverview Quiz Player module for KwekKwekQuiz
 * Handles the display and interaction of quiz questions during gameplay.
 * @module quizPlayer
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

//import *_ from 'lodash'; // If you decide to use it for deep cloning or other utilities
import * as DOM from './dom.js';
import * as State from './state.js';
import { renderMarkdownWithLaTeX, attachCopyHandlers} from './renderUtils.js';
import { getFeedbackClasses, showError, clearError } from './utils.js';
import { updateProgressBar, updateNavigationButtonsState } from './uiController.js';
import { calculateScore, goToNextQuestion } from './quizEngine.js'; // For auto-submit behavior

/**
 * @type {HTMLElement}
 * @private
 * @description Element for displaying the question text
 */
let questionEl;

/**
 * @type {HTMLElement}
 * @private
 * @description Element for displaying the options list
 */
let optionsList;

/**
 * @type {HTMLElement}
 * @private
 * @description Wrapper element for the input field
 */
let inputWrapper;

/**
 * @type {HTMLInputElement}
 * @private
 * @description Input field for text-based questions
 */
let inputField;

/**
 * Apply a single-run shake animation to an element (e.g., when user selects an incorrect answer).
 * This utility ensures the animation can be retriggered by reapplying the class.
 * @function animateElementOnce
 * @param {HTMLElement} element - The element to animate
 * @param {string} animationClass - The CSS class that defines the animation
 * @returns {void}
 * @todo Add support for custom animation durations
 * @toimprove Optimize performance for repeated animations
 * @tofix Ensure animations work properly with all element types
 */
export function animateElementOnce(element, animationClass) {
    if (!element) return;
    element.classList.remove(animationClass);
    // Force reflow so the animation can replay when the class is re-added
    void element.offsetWidth;
    element.classList.add(animationClass);
    const cleanup = () => {
        element.classList.remove(animationClass);
        element.removeEventListener('animationend', cleanup);
    };
    element.addEventListener('animationend', cleanup, { once: true });
}

/**
 * Applies a shake animation to an element once.
 * @function shakeElementOnce
 * @param {HTMLElement} element - The element to shake
 * @returns {void}
 * @todo Add configurable intensity levels
 * @toimprove Optimize for performance with many simultaneous animations
 * @tofix Ensure proper cleanup of event listeners
 */
export function shakeElementOnce(element) {
    animateElementOnce(element, 'shake-anim');
}

/**
 * Applies a pop animation to an element once.
 * @function popElementOnce
 * @param {HTMLElement} element - The element to pop
 * @returns {void}
 * @todo Add configurable scale factors
 * @toimprove Optimize for performance with many simultaneous animations
 * @tofix Ensure proper cleanup of event listeners
 */
export function popElementOnce(element) {
    animateElementOnce(element, 'pop-anim');
}

/**
 * Emit a three-particle sparkle burst from the center of an element.
 * Runs once per invocation and cleans up after the animation completes.
 * @function sparkleBurstOnce
 * @param {HTMLElement} element - The element to emit sparkles from
 * @returns {void}
 * @todo Add configurable particle count and angles
 * @toimprove Optimize for performance with many simultaneous animations
 * @tofix Ensure proper cleanup of all animation resources
 */
export function sparkleBurstOnce(element) {
    if (!element) return;

    // Do not run when animations are globally disabled (e.g., accessibility mode).
    if (element.closest('.animations-disabled') || document.documentElement.classList.contains('animations-disabled')) {
        return;
    }

    // Some elements (like <input>) cannot contain child nodes, so use their parent container instead.
    const host = (element instanceof HTMLElement && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'))
        ? (element.parentElement || element)
        : element;

    if (host.__sparkleBurstRunning) return;
    host.__sparkleBurstRunning = true;

    // Loot Grab Configuration: More particles for a lush fountain effect
    const particleCount = 12;
    const particles = [];

    // Ensure the parent is positioned so absolute children are anchored to its center
    const prevPosition = host.style.position;
    const shouldRestorePosition = getComputedStyle(host).position === 'static';
    if (shouldRestorePosition) {
        host.style.position = 'relative';
    }

    const sparklesContainer = document.createElement('span');
    sparklesContainer.className = 'sparkle-burst';
    sparklesContainer.setAttribute('aria-hidden', 'true');
    host.appendChild(sparklesContainer);

    const createSparkle = (angle, delay, distance, duration) => {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle-particle';
        sparkle.style.animationDelay = `${delay}ms`;
        sparkle.style.animationDuration = `${duration}ms`;

        // Calculate trajectory: angles 60-120 degrees create upward cone
        const radians = (angle * Math.PI) / 180;
        const dx = Math.round(Math.cos(radians) * distance);
        const dy = Math.round(-Math.sin(radians) * distance); // negative to go "up" for positive angles
        sparkle.style.setProperty('--dx', `${dx}px`);
        sparkle.style.setProperty('--dy', `${dy}px`);

        // Cute 4-pointed sparkle SVG (rounded corners using stroke-linecap)
        sparkle.innerHTML = `
            <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">
                <path
                    d="M16 2 L18 14 L30 16 L18 18 L16 30 L14 18 L2 16 L14 14 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                />
            </svg>
        `;

        sparklesContainer.appendChild(sparkle);
        particles.push(sparkle);

        sparkle.addEventListener('animationend', () => {
            sparkle.remove();
            const idx = particles.indexOf(sparkle);
            if (idx !== -1) particles.splice(idx, 1);
            if (particles.length === 0) {
                host.__sparkleBurstRunning = false;
                sparklesContainer.remove();
            }
        }, { once: true });
    };

    // Generate dynamic particles for fountain cone effect
    // Center angle: 90 (Straight Up). Spread: 60 degrees (60 to 120)
    for (let i = 0; i < particleCount; i++) {
        // Randomize angle within a 60-degree cone pointing up (Center 90°)
        const angle = 60 + Math.random() * 60;
        
        // Randomize distance for depth (close vs far particles)
        const distance = 30 + Math.random() * 40; // 30px to 70px
        
        // Randomize delay for the "staggered" eruption look
        const delay = Math.random() * 120;
        
        // Slight speed variation
        const duration = 500 + Math.random() * 300; // 500ms to 800ms

        createSparkle(angle, delay, distance, duration);
    }

    // Restore the element's position state after the animation has had time to complete
    setTimeout(() => {
        if (shouldRestorePosition) {
            host.style.position = prevPosition;
        }
    }, 1000); // Wait for all animations to finish
}

/**
 * Creates the necessary DOM elements for the quiz player.
 * @function createQuizPlayerElements
 * @returns {void}
 * @todo Add support for different question layouts
 * @toimprove Optimize element creation for performance
 * @tofix Ensure proper cleanup of created elements
 */
export function createQuizPlayerElements() {
    questionEl = document.createElement("div");
    // questionEl.className = "text-xl font-semibold mb-4 dark:text-gray-100"; // Example styling

    optionsList = document.createElement("ul");
    optionsList.className = "mt-4 space-y-2";

    inputWrapper = document.createElement("div");
    inputWrapper.className = "mt-4";

    inputField = document.createElement("input");
    inputField.type = "text";
    inputField.className =
        "w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-gray-900";
    inputWrapper.appendChild(inputField);

    let typingTimer;
    inputField.addEventListener("input", (e) => {
        if (State.isSubmittedAtIndex(State.getCurrentQuestionIndex())) return;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            State.setUserAnswerAtIndex(State.getCurrentQuestionIndex(), e.target.value);
            // Remove feedback while typing for FITB
            const currentQ = State.getCurrentQuestion();
            if (currentQ.type === "fill-in-the-blank" || currentQ.type === "identification") {
                inputField.classList.remove(
                    "border-green-600", "border-red-600",
                    "dark:border-green-500", "dark:border-red-500"
                );
            }
            // Note: calculateScore() is usually called on submit, not live typing for FITB
            updateNavigationButtonsState();
        }, 200);
    });

    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (DOM.submitBtn && !DOM.submitBtn.disabled) {
                DOM.submitBtn.click();
            }
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (DOM.prevBtn && !DOM.prevBtn.disabled) {
                DOM.prevBtn.click();
            }
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            if (DOM.nextBtn && !DOM.nextBtn.disabled) {
                DOM.nextBtn.click();
            }
        }
    });
}

/**
 * Injects a standard feedback icon into the parent element.
 * @function injectStandardIcon
 * @param {HTMLElement} parent - The parent element to inject the icon into
 * @param {string} status - The status of the answer ('success' or 'error')
 * @returns {void}
 * @private
 * @todo Add support for more icon types
 * @toimprove Optimize DOM manipulation for performance
 * @tofix Ensure proper positioning of the icon
 */
function injectStandardIcon(parent, status) {
    const oldIcon = parent.querySelector(".feedback-icon");
    if (oldIcon) oldIcon.remove();

    // Ensure the parent is the reference point
    parent.classList.add('relative');
    
    const icon = document.createElement("span");
    const isCorrect = status === 'success';
    
    icon.className = `material-symbols-outlined feedback-icon absolute right-3 
        inset-y-0 flex items-center justify-center pointer-events-none text-2xl
        ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`;
    
    icon.textContent = isCorrect ? 'check_circle' : 'error';
    parent.appendChild(icon);
}

/**
 * Renders the current question to the quiz container.
 * @function renderCurrentQuestion
 * @returns {void}
 * @todo Add support for rich media content in questions
 * @toimprove Optimize rendering for complex question layouts
 * @tofix Ensure proper cleanup of previous question elements
 */
export function renderCurrentQuestion() {
    if (!DOM.quizContainer || !questionEl) return;
    DOM.quizContainer.className = "max-w-2xl mx-auto py-8 px-4 sm:px-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300 fade-in";
    questionEl.className = "text-2xl font-bold leading-tight text-gray-800 dark:text-gray-100 mb-8";
    const currentQuestion = State.getCurrentQuestion();
    if (!currentQuestion) {
        console.error("No current question to render");
        showError("Error: Could not load question.");
        return;
    }

    DOM.quizContainer.innerHTML = ""; // Clear previous question
    [inputWrapper, ...DOM.quizContainer.querySelectorAll('li')].forEach(el => {
        if (!el) return;
        const icon = el.querySelector(".feedback-icon");
        if (icon) icon.remove();
        const correction = el.querySelector(".correction-label");
        if (correction) correction.remove();
        // Clean up sparkle burst elements and reset running state
        const sparkleBurst = el.querySelector(".sparkle-burst");
        if (sparkleBurst) sparkleBurst.remove();
        if (el.__sparkleBurstRunning) el.__sparkleBurstRunning = false;
    });
    // Clean up sparkle burst from input wrapper
    const inputSparkleBurst = inputWrapper.querySelector(".sparkle-burst");
    if (inputSparkleBurst) inputSparkleBurst.remove();
    if (inputWrapper.__sparkleBurstRunning) inputWrapper.__sparkleBurstRunning = false;
    inputField.classList.remove(
        "input-feedback-success", "input-feedback-error",
        "text-green-700", "dark:text-green-300",
        "text-red-700", "dark:text-red-300"
    );

    updateProgressBar();

    questionEl.innerHTML = renderMarkdownWithLaTeX(currentQuestion.question);
    DOM.quizContainer.appendChild(questionEl);

    // Show/hide submit button based on question type
    if (DOM.submitBtn) {
        const isTextEntry = currentQuestion.type === "fill-in-the-blank" || 
                           currentQuestion.type === "identification" ||
                           currentQuestion.type === "enumeration-any-order" ||
                           currentQuestion.type === "enumeration-ordered" ||
                           currentQuestion.type === "matching";
        DOM.submitBtn.classList.toggle("hidden", !isTextEntry);
    }


    if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false") {
        optionsList.innerHTML = "";
        const options = currentQuestion.type === "multiple-choice" ? currentQuestion.options : ["True", "False"];
        
        options.forEach((option, index) => {
            const optionItem = document.createElement("li");
            const optionButton = document.createElement("button");
            optionButton.type = "button";
            optionButton.className =
                "relative flex items-center space-x-3 border border-gray-400 dark:border-gray-600 rounded px-3 py-2 w-full text-left hover:bg-blue-100 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition";

            const answerValue = currentQuestion.type === "multiple-choice" ? index : (option === "True");

            if (State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) === answerValue) {
                optionButton.classList.add("bg-blue-200", "border-blue-600"); // User's selection highlight
            }
            optionButton.disabled = State.isSubmittedAtIndex(State.getCurrentQuestionIndex());
            optionButton.setAttribute("aria-pressed", State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) === answerValue ? "true" : "false");

            const optionLabel = document.createElement("span");
            optionLabel.className = "font-semibold w-6 flex-shrink-0";
            optionLabel.textContent = currentQuestion.type === "multiple-choice" ? (index + 1).toString() : (answerValue ? "1" : "0");

            const optionText = document.createElement("span");
            optionText.innerHTML = renderMarkdownWithLaTeX(String(option)); // Ensure option is string for render

            optionButton.appendChild(optionLabel);
            optionButton.appendChild(optionText);

            optionButton.addEventListener("click", () => {
                if (State.isSubmittedAtIndex(State.getCurrentQuestionIndex())) return;
                State.setUserAnswerAtIndex(State.getCurrentQuestionIndex(), answerValue);
                State.setSubmittedAtIndex(State.getCurrentQuestionIndex(), true); // Auto-submit for MC/TF

                // If the user selected an incorrect answer, give a subtle "head shake" feedback.
                if (answerValue !== currentQuestion.correct) {
                    shakeElementOnce(optionButton);
                }

                renderFeedbackForQuestion(answerValue);
                calculateScore(); // Update score immediately
                updateNavigationButtonsState();
                // Auto-advance if correct, or allow review
                // if (answerValue === currentQuestion.correct) { setTimeout(goToNextQuestion, 1000); }
            });
            optionItem.appendChild(optionButton);
            optionsList.appendChild(optionItem);
        });
        DOM.quizContainer.appendChild(optionsList);

        if (State.isSubmittedAtIndex(State.getCurrentQuestionIndex())) {
            renderFeedbackForQuestion(State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()));
        }
    } else if (currentQuestion.type === "fill-in-the-blank" || currentQuestion.type === "identification") {
        inputField.classList.remove(
            "input-feedback-success", "input-feedback-error",
            "text-green-700", "dark:text-green-300",
            "text-red-700", "dark:text-red-300",
            "text-gray-900", "dark:text-gray-100"
        );
        const oldIcon = inputWrapper.querySelector(".feedback-icon");
        if (oldIcon) oldIcon.remove();
        inputWrapper.className = "relative w-full"; 
    
    // 2. Add 'pr-10' to the inputField so the text doesn't go under the icon
        inputField.className = "w-full pr-10 border border-gray-400 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition bg-transparent text-gray-900 dark:text-gray-100";
        inputField.disabled = State.isSubmittedAtIndex(State.getCurrentQuestionIndex());
        inputField.value = State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) || "";
        DOM.quizContainer.appendChild(inputWrapper);

        if (State.isSubmittedAtIndex(State.getCurrentQuestionIndex())) {
            renderFeedbackForQuestion(State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()));
        }
        
        if (!inputField.disabled) {
            inputField.focus();
        }
    } else if (currentQuestion.type === "enumeration-any-order" || currentQuestion.type === "enumeration-ordered") {
        // Render enumeration question with numbered input fields
        const enumerationContainer = document.createElement("div");
        enumerationContainer.className = "enumeration-container space-y-3";
        
        const itemsCount = currentQuestion.items ? currentQuestion.items.length : 3;
        const userAnswer = State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) || [];
        const isSubmitted = State.isSubmittedAtIndex(State.getCurrentQuestionIndex());
        
        for (let i = 0; i < itemsCount; i++) {
            const itemRow = document.createElement("div");
            itemRow.className = "enumeration-item flex items-center gap-3";
            
            const itemNumber = document.createElement("span");
            itemNumber.className = "enumeration-number flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-sm";
            itemNumber.textContent = (i + 1).toString();
            
            const itemInput = document.createElement("input");
            itemInput.type = "text";
            itemInput.className = "enumeration-input flex-grow border border-gray-400 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition bg-transparent text-gray-900 dark:text-gray-100";
            itemInput.placeholder = `Item ${i + 1}`;
            itemInput.value = userAnswer[i] || "";
            itemInput.disabled = isSubmitted;
            itemInput.dataset.index = i.toString();
            
            itemInput.addEventListener("input", (e) => {
                if (isSubmitted) return;
                const idx = parseInt(e.target.dataset.index);
                const currentAnswer = State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) || [];
                const newAnswer = [...currentAnswer];
                newAnswer[idx] = e.target.value;
                State.setUserAnswerAtIndex(State.getCurrentQuestionIndex(), newAnswer);
            });
            
            itemRow.appendChild(itemNumber);
            itemRow.appendChild(itemInput);
            enumerationContainer.appendChild(itemRow);
        }
        
        DOM.quizContainer.appendChild(enumerationContainer);
        
        if (!isSubmitted) {
            const firstInput = enumerationContainer.querySelector("input");
            if (firstInput) firstInput.focus();
        }
    } else if (currentQuestion.type === "matching") {
        // Render matching question with two columns
        const matchingContainer = document.createElement("div");
        matchingContainer.className = "matching-container space-y-6";
        
        // Add instruction text
        const instruction = document.createElement("div");
        instruction.className = "text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800";
        instruction.innerHTML = `<span class="material-symbols-outlined text-sm align-middle mr-1">info</span> Select the matching item from the dropdown for each option on the right.`;
        matchingContainer.appendChild(instruction);
        
        const columnsContainer = document.createElement("div");
        columnsContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-6";
        
        const leftColumn = document.createElement("div");
        leftColumn.className = "left-column space-y-3";
        
        const rightColumn = document.createElement("div");
        rightColumn.className = "right-column space-y-3";
        
        const leftItems = currentQuestion.left || [];
        const rightItems = currentQuestion.right || [];
        const userAnswer = State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) || {};
        const isSubmitted = State.isSubmittedAtIndex(State.getCurrentQuestionIndex());
        
        // Left column header
        const leftHeader = document.createElement("div");
        leftHeader.className = "font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide";
        leftHeader.textContent = "Items to Match";
        leftColumn.appendChild(leftHeader);
        
        // Left column (fixed items)
        leftItems.forEach((item, index) => {
            const leftItem = document.createElement("div");
            leftItem.className = "matching-left-item p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600";
            leftItem.innerHTML = `<span class="font-medium text-gray-800 dark:text-gray-200">${index + 1}. ${item}</span>`;
            leftColumn.appendChild(leftItem);
        });
        
        // Right column header
        const rightHeader = document.createElement("div");
        rightHeader.className = "font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide";
        rightHeader.textContent = "Options (Select Match)";
        rightColumn.appendChild(rightHeader);
        
        // Right column (selectable options)
        rightItems.forEach((item, index) => {
            const rightItem = document.createElement("div");
            rightItem.className = "matching-right-item flex items-center gap-3";
            
            const select = document.createElement("select");
            select.className = "matching-select flex-grow border border-gray-400 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100";
            select.disabled = isSubmitted;
            select.dataset.rightIndex = index.toString();
            
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select match...";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);
            
            leftItems.forEach((leftItem, leftIndex) => {
                const option = document.createElement("option");
                option.value = leftIndex.toString();
                option.textContent = `${leftIndex + 1}. ${leftItem}`;
                select.appendChild(option);
            });
            
            // Set current selection only if user has actually selected something
            const currentMatch = Object.entries(userAnswer).find(([k, v]) => v === index);
            if (currentMatch && currentMatch[0] !== "") {
                select.value = currentMatch[0];
            }
            
            select.addEventListener("change", (e) => {
                if (isSubmitted) return;
                const rightIdx = parseInt(e.target.dataset.rightIndex);
                const leftIdx = parseInt(e.target.value);
                const currentAnswer = State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) || {};
                const newAnswer = { ...currentAnswer };
                
                // Remove any existing match for this right item
                Object.keys(newAnswer).forEach(key => {
                    if (newAnswer[key] === rightIdx) {
                        delete newAnswer[key];
                    }
                });
                
                // Set new match
                newAnswer[leftIdx] = rightIdx;
                State.setUserAnswerAtIndex(State.getCurrentQuestionIndex(), newAnswer);
            });
            
            const rightLabel = document.createElement("span");
            rightLabel.className = "text-gray-700 dark:text-gray-300";
            rightLabel.textContent = item;
            
            rightItem.appendChild(select);
            rightItem.appendChild(rightLabel);
            rightColumn.appendChild(rightItem);
        });
        
        columnsContainer.appendChild(leftColumn);
        columnsContainer.appendChild(rightColumn);
        matchingContainer.appendChild(columnsContainer);
        DOM.quizContainer.appendChild(matchingContainer);
    }

    attachCopyHandlers();
    addKeyboardNavigationToOptions();
}


/**
 * Renders feedback for a specific question based on the user's answer.
 * @function renderFeedbackForQuestion
 * @param {any} userAnswer - The answer provided by the user
 * @returns {void}
 * @todo Add more detailed feedback explanations
 * @toimprove Optimize feedback rendering for performance
 * @tofix Ensure proper feedback display for all question types
 */
export function renderFeedbackForQuestion(userAnswer) {
    const currentQuestion = State.getCurrentQuestion();
    const currentIndex = State.getCurrentQuestionIndex();
    if (!currentQuestion || !DOM.quizContainer) return;

    // Standard Logic for Button-based questions (MCQ / TF)
    if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false") {
        const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
        
        optionButtons.forEach((button, idx) => {
            // 1. Cleanup
            button.disabled = true;
            button.classList.remove(
                ...getFeedbackClasses(true), ...getFeedbackClasses(false),
                "pulse-green", "pulse-red", "bg-blue-200", "border-blue-600",
                "input-feedback-success", "input-feedback-error"
            );
            const oldIcon = button.querySelector(".feedback-icon");
            if (oldIcon) oldIcon.remove();

            // 2. Determine Boolean/Index values
            let isThisCorrectChoice = false;
            let isThisUserChoice = false;

            if (currentQuestion.type === "multiple-choice") {
                isThisCorrectChoice = (idx === currentQuestion.correct);
                isThisUserChoice = (idx === userAnswer);
            } else {
                const buttonText = button.querySelector("span:not(.font-semibold)")?.textContent.trim();
                const representsTrue = buttonText === "True";
                isThisCorrectChoice = (representsTrue === currentQuestion.correct);
                isThisUserChoice = (representsTrue === userAnswer);
            }

            const userIsCorrect = isThisCorrectChoice && isThisUserChoice;

            // 3. Apply Standardized Styles
            if (isThisCorrectChoice) {
                button.classList.add("input-feedback-success");
                injectStandardIcon(button, 'success');

                // Only show sparkle when the user actually got it right (not just showing the correct answer after a wrong choice)
                if (userIsCorrect && !State.wasSparkleBurstShownAtIndex(currentIndex)) {
                    sparkleBurstOnce(button);
                    State.setSparkleBurstShownAtIndex(currentIndex, true);
                }
            } else if (isThisUserChoice) {
                button.classList.add("input-feedback-error");
                injectStandardIcon(button, 'error');
            }
        });
    } 
    
    // Standard Logic for Input-based questions (FITB / Identification)
    else if (currentQuestion.type === "fill-in-the-blank" || currentQuestion.type === "identification") {
        if (!inputField || !inputWrapper) return;
        
        const normalizedUser = userAnswer ? String(userAnswer).trim().toLowerCase() : "";
        const normalizedCorrect = String(currentQuestion.correct).trim().toLowerCase();
        const isCorrect = normalizedUser === normalizedCorrect;

        // 1. Cleanup (Essential to prevent carry-over)
        inputField.classList.remove("input-feedback-success", "input-feedback-error");
        const oldIcon = inputWrapper.querySelector(".feedback-icon");
        if (oldIcon) oldIcon.remove();

        // 2. Apply Feedback only if user provided an answer
        if (normalizedUser !== "") {
            const status = isCorrect ? 'success' : 'error';
            inputField.classList.add(`input-feedback-${status}`);
            injectStandardIcon(inputWrapper, status);
            
            // Add correction label if wrong
            if (!isCorrect) {
                let correction = inputWrapper.querySelector(".correction-label");
                if (!correction) {
                    correction = document.createElement("div");
                    correction.className = "correction-label mt-2 text-xs font-bold text-md-primary dark:text-blue-400";
                    inputWrapper.appendChild(correction);
                }
                correction.innerHTML = `Expected: ${currentQuestion.correct}`;
            }
        }
        
        inputField.disabled = true;
    }
    
    // Enumeration questions (any-order and ordered)
    else if (currentQuestion.type === "enumeration-any-order" || currentQuestion.type === "enumeration-ordered") {
        const enumerationInputs = DOM.quizContainer.querySelectorAll(".enumeration-input");
        const isCorrect = checkIsCorrect(currentQuestion, userAnswer);
        
        enumerationInputs.forEach((input, idx) => {
            input.disabled = true;
            input.classList.remove("input-feedback-success", "input-feedback-error");
            
            const userVal = userAnswer && userAnswer[idx] ? userAnswer[idx].trim().toLowerCase() : "";
            const correctVal = currentQuestion.correct[idx] ? currentQuestion.correct[idx].trim().toLowerCase() : "";
            const itemIsCorrect = userVal === correctVal;
            
            if (userVal !== "") {
                const status = itemIsCorrect ? 'success' : 'error';
                input.classList.add(`input-feedback-${status}`);
                
                // Add sparkle effect for correct items
                if (itemIsCorrect) {
                    sparkleBurstOnce(input);
                }
            }
        });
        
        // Add overall feedback indicator only if incorrect
        const container = DOM.quizContainer.querySelector(".enumeration-container");
        if (container) {
            const oldIcon = container.querySelector(".feedback-icon");
            if (oldIcon) oldIcon.remove();
            
            if (!isCorrect) {
                const feedbackDiv = document.createElement("div");
                feedbackDiv.className = "mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30";
                feedbackDiv.innerHTML = `
                    <div class="text-sm font-medium text-red-800 dark:text-red-200">
                        Expected answers: ${currentQuestion.correct.join(", ")}
                    </div>
                `;
                container.appendChild(feedbackDiv);
            }
        }
    }
    
    // Matching questions
    else if (currentQuestion.type === "matching") {
        const selects = DOM.quizContainer.querySelectorAll(".matching-select");
        const isCorrect = checkIsCorrect(currentQuestion, userAnswer);
        
        selects.forEach((select) => {
            select.disabled = true;
            select.classList.remove("input-feedback-success", "input-feedback-error");
            
            const rightIdx = parseInt(select.dataset.rightIndex);
            const selectedLeftIdx = parseInt(select.value);
            const correctLeftIdx = Object.keys(currentQuestion.correct).find(
                key => currentQuestion.correct[key] === rightIdx
            );
            
            const itemIsCorrect = selectedLeftIdx.toString() === correctLeftIdx;
            
            if (select.value !== "") {
                const status = itemIsCorrect ? 'success' : 'error';
                select.classList.add(`input-feedback-${status}`);
            }
        });
        
        // Add overall feedback indicator
        const container = DOM.quizContainer.querySelector(".matching-container");
        if (container) {
            const oldFeedback = container.querySelector(".matching-feedback");
            if (oldFeedback) oldFeedback.remove();
            
            const feedbackDiv = document.createElement("div");
            feedbackDiv.className = `matching-feedback mt-4 p-3 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`;
            
            if (!isCorrect) {
                const correctMatches = Object.entries(currentQuestion.correct).map(
                    ([leftIdx, rightIdx]) => `${currentQuestion.left[leftIdx]} → ${currentQuestion.right[rightIdx]}`
                ).join(", ");
                
                feedbackDiv.innerHTML = `
                    <div class="text-sm font-medium ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}">
                        Correct matches: ${correctMatches}
                    </div>
                `;
            }
            
            container.appendChild(feedbackDiv);
        }
    }
}

/**
 * Handles keydown events for option buttons.
 * @function optionButtonKeydownHandler
 * @param {KeyboardEvent} event - The keydown event
 * @returns {void}
 * @private
 * @todo Add support for additional keyboard shortcuts
 * @toimprove Optimize event handling for performance
 * @tofix Ensure proper accessibility for keyboard navigation
 */
function optionButtonKeydownHandler(event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (event.target.disabled) return;
        event.target.click();
    }
}

/**
 * Adds keyboard navigation functionality to option buttons.
 * @function addKeyboardNavigationToOptions
 * @returns {void}
 * @todo Add support for arrow key navigation
 * @toimprove Optimize event listener management
 * @tofix Ensure proper cleanup of event listeners
 */
export function addKeyboardNavigationToOptions() {
    if (!DOM.quizContainer) return;
    const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
    optionButtons.forEach((button) => {
        button.removeEventListener("keydown", optionButtonKeydownHandler); // Prevent duplicates
        button.addEventListener("keydown", optionButtonKeydownHandler);
    });
}

/**
 * Renders the quiz results at the end of the quiz.
 * @function renderQuizResults
 * @returns {void}
 * @todo Add option to review incorrect answers
 * @toimprove Optimize rendering for large quiz sets
 * @tofix Ensure proper display of results on all screen sizes
 */
export function renderQuizResults() {
    if (!DOM.summaryContainer) return;
    DOM.summaryContainer.innerHTML = "";
    const quizData = State.getQuizData();
    const userAnswers = State.getUserAnswers();

    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = checkIsCorrect(question, userAnswer);

        const questionCard = document.createElement("details");
        questionCard.className = `group mb-4 overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm
            ${isCorrect 
                ? "bg-white dark:bg-gray-800 border-green-200 dark:border-green-900/30" 
                : "bg-white dark:bg-gray-800 border-red-200 dark:border-red-900/30"}`;

        // --- SUMMARY HEADER ---
        const summary = document.createElement("summary");
        summary.className = "flex items-center justify-between p-5 cursor-pointer list-none focus:outline-none";
        
        const statusColor = isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
        const statusBg = isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30";

        summary.innerHTML = `
            <div class="flex items-start gap-4 flex-grow">
                <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-500">
                    ${index + 1}
                </span>
                <div class="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 pr-4 mt-1">
                    ${renderMarkdownWithLaTeX(question.question)}
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="hidden sm:flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBg} ${statusColor}">
                    ${isCorrect ? 'Correct' : 'Incorrect'}
                </span>
                <span class="material-symbols-outlined ${statusColor}">
                    ${isCorrect ? 'check_circle' : 'cancel'}
                </span>
                <span class="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">expand_more</span>
            </div>
        `;

        // --- DETAILS CONTENT ---
        const contentDiv = document.createElement("div");
        contentDiv.className = "px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn";

        const userAnswerBox = createAnswerBox(
            "Your Answer", 
            formatAnswerDisplay(question, userAnswer), 
            isCorrect ? "success" : "error"
        );
        
        const correctAnswerBox = createAnswerBox(
            "Correct Answer", 
            formatAnswerDisplay(question, question.correct), 
            "info"
        );

        contentDiv.appendChild(userAnswerBox);
        contentDiv.appendChild(correctAnswerBox);
        
        questionCard.appendChild(summary);
        questionCard.appendChild(contentDiv);
        DOM.summaryContainer.appendChild(questionCard);
    });
    
    attachCopyHandlers();
}

/**
 * Helper function to format the answer strings for display
 * @function formatAnswerDisplay
 * @param {Object} question - The question object
 * @param {any} val - The answer value to format
 * @returns {string} The formatted answer string
 * @private
 * @todo Add support for more question types
 * @toimprove Optimize string formatting for performance
 * @tofix Ensure proper escaping of special characters
 */
function formatAnswerDisplay(question, val) {
    if (val === undefined || val === "") return "<em>No answer provided</em>";
    if (question.type === "multiple-choice") return question.options[val] || val;
    if (question.type === "true-false") return val ? "True" : "False";
    if (question.type === "enumeration-any-order" || question.type === "enumeration-ordered") {
        if (Array.isArray(val)) {
            return val.map((item, idx) => `${idx + 1}. ${item}`).join("<br>");
        }
        return String(val);
    }
    if (question.type === "matching") {
        if (typeof val === "object" && val !== null) {
            const leftItems = question.left || [];
            const rightItems = question.right || [];
            return Object.entries(val).map(([leftIdx, rightIdx]) => {
                const leftItem = leftItems[parseInt(leftIdx)] || `Item ${parseInt(leftIdx) + 1}`;
                const rightItem = rightItems[rightIdx] || `Option ${String.fromCharCode(65 + rightIdx)}`;
                return `${leftItem} → ${rightItem}`;
            }).join("<br>");
        }
        return String(val);
    }
    return val;
}

/**
 * Helper function to create a styled answer comparison box
 * @function createAnswerBox
 * @param {string} label - The label for the answer box
 * @param {string} value - The answer value to display
 * @param {string} type - The type of answer ('success', 'error', or 'info')
 * @returns {HTMLElement} The created answer box element
 * @private
 * @todo Add support for rich text formatting in answers
 * @toimprove Optimize DOM creation for performance
 * @tofix Ensure consistent styling across different browsers
 */
function createAnswerBox(label, value, type) {
    const box = document.createElement("div");
    const colors = {
        success: "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800/20 text-green-800 dark:text-green-200",
        error: "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/20 text-red-800 dark:text-red-200",
        info: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20 text-blue-800 dark:text-blue-200"
    };

    box.className = `p-3 rounded-xl border ${colors[type]}`;
    box.innerHTML = `
        <span class="block text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">${label}</span>
        <div class="text-sm font-semibold">${renderMarkdownWithLaTeX(String(value))}</div>
    `;
    return box;
}

/**
 * Helper function for correctness logic
 * @function checkIsCorrect
 * @param {Object} question - The question object
 * @param {any} userAnswer - The user's answer
 * @returns {boolean} Whether the answer is correct
 * @private
 * @todo Add support for partial credit scoring
 * @toimprove Optimize comparison logic for performance
 * @tofix Ensure accurate comparison for all data types
 */
function checkIsCorrect(question, userAnswer) {
    if (question.type === "multiple-choice" || question.type === "true-false") {
        return userAnswer === question.correct;
    } else if (question.type === "fill-in-the-blank" || question.type === "identification") {
        return typeof userAnswer === "string" && 
               userAnswer.trim().toLowerCase() === String(question.correct).trim().toLowerCase();
    } else if (question.type === "enumeration-any-order") {
        // For enumeration any-order: compare sorted arrays
        if (Array.isArray(userAnswer) && Array.isArray(question.correct)) {
            const sortedUser = [...userAnswer].map(s => s.trim().toLowerCase()).sort();
            const sortedCorrect = [...question.correct].map(s => s.trim().toLowerCase()).sort();
            return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
        }
        return false;
    } else if (question.type === "enumeration-ordered") {
        // For enumeration ordered: compare arrays element-by-element
        if (Array.isArray(userAnswer) && Array.isArray(question.correct)) {
            return userAnswer.length === question.correct.length &&
                userAnswer.every((ans, i) => 
                    ans.trim().toLowerCase() === question.correct[i].trim().toLowerCase()
                );
        }
        return false;
    } else if (question.type === "matching") {
        // For matching: compare userAnswer object against correct mapping
        if (typeof userAnswer === "object" && typeof question.correct === "object") {
            const userKeys = Object.keys(userAnswer);
            const correctKeys = Object.keys(question.correct);
            return userKeys.length === correctKeys.length &&
                userKeys.every(key => 
                    userAnswer[key] === question.correct[key]
                );
        }
        return false;
    }
    return false;
}

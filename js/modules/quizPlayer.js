// js/modules/quizPlayer.js
//import *_ from 'lodash'; // If you decide to use it for deep cloning or other utilities
import * as DOM from './dom.js';
import * as State from './state.js';
import { renderMarkdownWithLaTeX, attachCopyHandlers} from './renderUtils.js';
import { getFeedbackClasses, showError, clearError } from './utils.js';
import { updateProgressBar, updateNavigationButtonsState } from './uiController.js';
import { calculateScore, goToNextQuestion } from './quizEngine.js'; // For auto-submit behavior

let questionEl, optionsList, inputWrapper, inputField; // Module-level elements for reuse

/**
 * Apply a single-run shake animation to an element (e.g., when user selects an incorrect answer).
 * This utility ensures the animation can be retriggered by reapplying the class.
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

export function shakeElementOnce(element) {
    animateElementOnce(element, 'shake-anim');
}

export function popElementOnce(element) {
    animateElementOnce(element, 'pop-anim');
}

/**
 * Emit a three-particle sparkle burst from the center of an element.
 * Runs once per invocation and cleans up after the animation completes.
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

    const particleAngles = [45, 90, 135];
    const delays = [0, 50, 100];
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

    const createSparkle = (angle, delay) => {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle-particle';
        sparkle.style.animationDelay = `${delay}ms`;

        // Calculate the final translation based on angle and distance.
        const distance = 24; // pixels
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

    particleAngles.forEach((angle, idx) => createSparkle(angle, delays[idx]));

    // Restore the element's position state after the animation has had time to complete
    setTimeout(() => {
        if (shouldRestorePosition) {
            host.style.position = prevPosition;
        }
    }, 700);
}

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
    });
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
        const isTextEntry = currentQuestion.type === "fill-in-the-blank" || currentQuestion.type === "identification";
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
    }

    attachCopyHandlers();
    addKeyboardNavigationToOptions();
}


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
}

function optionButtonKeydownHandler(event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (event.target.disabled) return;
        event.target.click();
    }
}

export function addKeyboardNavigationToOptions() {
    if (!DOM.quizContainer) return;
    const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
    optionButtons.forEach((button) => {
        button.removeEventListener("keydown", optionButtonKeydownHandler); // Prevent duplicates
        button.addEventListener("keydown", optionButtonKeydownHandler);
    });
}

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

/** Helper to format the answer strings for display **/
function formatAnswerDisplay(question, val) {
    if (val === undefined || val === "") return "<em>No answer provided</em>";
    if (question.type === "multiple-choice") return question.options[val] || val;
    if (question.type === "true-false") return val ? "True" : "False";
    return val;
}

/** Helper to create a styled answer comparison box **/
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

/** Helper for correctness logic **/
function checkIsCorrect(question, userAnswer) {
    if (question.type === "multiple-choice" || question.type === "true-false") {
        return userAnswer === question.correct;
    }
    return typeof userAnswer === "string" && 
           userAnswer.trim().toLowerCase() === String(question.correct).trim().toLowerCase();
}
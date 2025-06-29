// js/modules/quizPlayer.js
//import *_ from 'lodash'; // If you decide to use it for deep cloning or other utilities
import * as DOM from './dom.js';
import * as State from './state.js';
import { renderMarkdownWithLaTeX, attachCopyHandlers} from './renderUtils.js';
import { getFeedbackClasses, showError, clearError } from './utils.js';
import { updateProgressBar, updateNavigationButtonsState } from './uiController.js';
import { calculateScore, goToNextQuestion } from './quizEngine.js'; // For auto-submit behavior

let questionEl, optionsList, inputWrapper, inputField; // Module-level elements for reuse

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


export function renderCurrentQuestion() {
    if (!DOM.quizContainer || !questionEl) return;
    const currentQuestion = State.getCurrentQuestion();
    if (!currentQuestion) {
        console.error("No current question to render");
        showError("Error: Could not load question.");
        return;
    }

    DOM.quizContainer.innerHTML = ""; // Clear previous question

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
                "flex items-center space-x-3 border border-gray-400 dark:border-gray-600 rounded px-3 py-2 w-full text-left hover:bg-blue-100 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition";

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
            "border-green-600", "border-red-600", "dark:border-green-500", "dark:border-red-500",
            "text-green-800", "text-red-800", "dark:text-green-200", "dark:text-red-200"
        );
        inputField.classList.add("text-gray-900", "dark:text-gray-100");
        inputField.disabled = State.isSubmittedAtIndex(State.getCurrentQuestionIndex());
        inputField.value = State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) !== undefined ? State.getUserAnswerAtIndex(State.getCurrentQuestionIndex()) : "";
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
    // const currentIndex = State.getCurrentQuestionIndex(); // Not directly used in this snippet, but good to have if needed
    if (!currentQuestion || !DOM.quizContainer) return;

    if (currentQuestion.type === "multiple-choice") { // Keep Multiple Choice logic separate for clarity
        const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
        optionButtons.forEach((button, idx) => {
            button.classList.remove(
                ...getFeedbackClasses(true), ...getFeedbackClasses(false),
                "pulse-green", "pulse-red", "bg-blue-200", "border-blue-600"
            );
            button.disabled = true; // Disable all options after submission
            const existingIcon = button.querySelector(".feedback-icon");
            if (existingIcon) existingIcon.remove();

            const optionValue = idx; // For MC, optionValue is its index
            
            const isCorrectAnswerForThisButton = (optionValue === currentQuestion.correct);
            const isThisButtonSelectedByUser = (optionValue === userAnswer);

            let iconHTML = '';
            let iconColorClasses = [];
            let pulseClass = '';

            if (isCorrectAnswerForThisButton) {
                button.classList.add(...getFeedbackClasses(true));
                iconHTML = "✔"; // Checkmark
                iconColorClasses = ["text-green-600", "dark:text-green-300"];
                if (isThisButtonSelectedByUser) { // User selected the correct option
                    pulseClass = "pulse-green";
                }
            } else if (isThisButtonSelectedByUser) { // This button is not the correct one, but user selected it (i.e. wrong choice)
                button.classList.add(...getFeedbackClasses(false));
                iconHTML = "✖"; // Cross
                iconColorClasses = ["text-red-600", "dark:text-red-300"];
                pulseClass = "pulse-red";
            }
            // If this button is not the correct option AND was not selected by user, it gets no special styling beyond cleanup.

            if (pulseClass) {
                button.classList.add(pulseClass);
            }

            if (iconHTML) {
                const icon = document.createElement("span");
                icon.className = "feedback-icon ml-auto";
                icon.classList.add(...iconColorClasses);
                icon.innerHTML = iconHTML;
                button.appendChild(icon);
            }
        });
    } else if (currentQuestion.type === "true-false") {
        const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
        optionButtons.forEach((button) => {
            // 1. Determine what boolean this specific button represents ("True" or "False")
            const buttonTextSpan = button.querySelector("span:not(.font-semibold)");
            if (!buttonTextSpan) {
                console.error("Feedback logic (TF): Could not find text span in button", button);
                return; // Skip this button if malformed
            }
            // .trim() is important here to avoid issues with leading/trailing whitespace
            const thisButtonRepresentsBooleanValue = (buttonTextSpan.textContent.trim() === "True");

            // 2. Get current question's correct answer (boolean) and user's answer (boolean)
            const correctAnswerBoolean = currentQuestion.correct; // This is already a boolean
            const userAnswerBoolean = userAnswer; // This is the boolean answer from the user

            // 3. Clear previous states and disable
            button.disabled = true;
            button.classList.remove(
                ...getFeedbackClasses(true), ...getFeedbackClasses(false),
                "pulse-green", "pulse-red", "bg-blue-200", "border-blue-600"
            );
            const existingIcon = button.querySelector(".feedback-icon");
            if (existingIcon) existingIcon.remove();

            // 4. Apply new state based on comparisons
            const isThisButtonTheCorrectOption = (thisButtonRepresentsBooleanValue === correctAnswerBoolean);
            const didUserSelectThisButton = (thisButtonRepresentsBooleanValue === userAnswerBoolean);

            let iconHTML = '';
            let iconColorClasses = [];
            let pulseClass = '';

            if (isThisButtonTheCorrectOption) {
                button.classList.add(...getFeedbackClasses(true));
                iconHTML = "✔"; // Checkmark
                iconColorClasses = ["text-green-600", "dark:text-green-300"];
                if (didUserSelectThisButton) { // User selected the correct option
                    pulseClass = "pulse-green";
                }
            } else if (didUserSelectThisButton) { // This button is not the correct one, but user selected it (i.e. wrong choice)
                button.classList.add(...getFeedbackClasses(false));
                iconHTML = "✖"; // Cross
                iconColorClasses = ["text-red-600", "dark:text-red-300"];
                pulseClass = "pulse-red";
            }
            // If this button is not the correct option AND was not selected by user, it remains neutral.

            if (pulseClass) {
                button.classList.add(pulseClass);
            }

            if (iconHTML) {
                const icon = document.createElement("span");
                icon.className = "feedback-icon ml-auto";
                icon.classList.add(...iconColorClasses);
                icon.innerHTML = iconHTML;
                button.appendChild(icon);
            }
        });
    } else if (currentQuestion.type === "fill-in-the-blank" || currentQuestion.type === "identification") {
        // ... (existing fill-in-the-blank logic remains the same)
        if (!inputField) return;
        const normalizedUserAnswer = userAnswer ? String(userAnswer).trim().toLowerCase() : "";
        const normalizedCorrectAnswer = String(currentQuestion.correct).trim().toLowerCase();

        inputField.classList.remove(
            "border-green-600", "border-red-600", "dark:border-green-500", "dark:border-red-500",
            "text-green-800", "text-red-800", "dark:text-green-200", "dark:text-red-200"
        );

        if (normalizedUserAnswer === "") { 
            inputField.classList.add("text-gray-900", "dark:text-gray-100"); 
        } else if (normalizedUserAnswer === normalizedCorrectAnswer) {
            inputField.classList.add(...getFeedbackClasses(true).filter(c => c.startsWith('border-') || c.startsWith('text-') || c.startsWith('dark:border-') || c.startsWith('dark:text-')));
        } else {
            inputField.classList.add(...getFeedbackClasses(false).filter(c => c.startsWith('border-') || c.startsWith('text-') || c.startsWith('dark:border-') || c.startsWith('dark:text-')));
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
    DOM.summaryContainer.innerHTML = ""; // Clear previous summary
    const quizData = State.getQuizData();
    const userAnswers = State.getUserAnswers();

    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;
        if (question.type === "multiple-choice" || question.type === "true-false") {
            isCorrect = userAnswer === question.correct;
        } else if (question.type === "fill-in-the-blank" || question.type === "identification") {
            isCorrect = typeof userAnswer === "string" && userAnswer.trim().toLowerCase() === String(question.correct).trim().toLowerCase();
        }

        const questionDiv = document.createElement("details");
        questionDiv.className = "mb-4 p-3 rounded border";
        questionDiv.classList.add(
            ...(isCorrect 
                ? ["bg-green-100", "dark:bg-gray-800", "border-green-400", "dark:border-green-600"] 
                : ["bg-red-100", "dark:bg-red-900", "border-red-400", "dark:border-red-600"])
        );

        const summary = document.createElement("summary");
        summary.className = "font-semibold cursor-pointer select-none flex items-center justify-between";
        
        // Create a container for the question text and number to ensure proper alignment with the icon
        const summaryTextContainer = document.createElement("div");
        summaryTextContainer.className = "flex-grow"; // Allow it to take available space
        summaryTextContainer.innerHTML = `
            <div class="flex items-start gap-2">
                <span class="font-semibold pt-1">${index + 1}.</span>
                <div class="flex-1 min-w-0">${renderMarkdownWithLaTeX(question.question)}</div>
            </div>`;
        
        const iconSpan = document.createElement("span");
        iconSpan.setAttribute("aria-label", isCorrect ? 'Correct' : 'Incorrect');
        iconSpan.className = "text-lg ml-2 flex-shrink-0"; // Added ml-2 for spacing
        iconSpan.innerHTML = isCorrect ? '✔' : '✖';

        summary.appendChild(summaryTextContainer);
        summary.appendChild(iconSpan);
        questionDiv.appendChild(summary);
        
        // Horizontal rule after summary, before details content
        const hr = document.createElement("hr");
        hr.className = "my-3 border-t border-gray-300 dark:border-gray-700";
        questionDiv.appendChild(hr);


        const userAnswerP = document.createElement("p");
        userAnswerP.className = "mb-1";
        let userAnswerDisplay = "No answer";
        if (userAnswer !== undefined) {
            if (question.type === "multiple-choice" && question.options && question.options[userAnswer] !== undefined) {
                userAnswerDisplay = question.options[userAnswer];
            } else if (question.type === "true-false") {
                userAnswerDisplay = userAnswer ? "True" : "False";
            }
             else {
                userAnswerDisplay = userAnswer;
            }
        }
        userAnswerP.innerHTML = `Your answer: ${renderMarkdownWithLaTeX(String(userAnswerDisplay))}`;
        questionDiv.appendChild(userAnswerP);

        const correctAnswerP = document.createElement("p");
        let correctAnswerContent = `Correct answer: `;
        if (question.type === "multiple-choice" && question.options && question.options[question.correct] !== undefined) {
            correctAnswerContent += `<strong>${renderMarkdownWithLaTeX(String(question.options[question.correct]))}</strong>`;
        } else if (question.type === "true-false") {
            correctAnswerContent += `<em>${question.correct ? "True" : "False"}</em>`;
        } else {
            correctAnswerContent += `<em>${renderMarkdownWithLaTeX(String(question.correct))}</em>`;
        }
        correctAnswerP.innerHTML = correctAnswerContent;
        questionDiv.appendChild(correctAnswerP);

        DOM.summaryContainer.appendChild(questionDiv);
    });
    attachCopyHandlers(); // For any code blocks in questions/answers
}
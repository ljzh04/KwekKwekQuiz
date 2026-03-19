/**
 * @fileoverview Event handlers module for KwekKwekQuiz
 * Contains all event handler functions for the application.
 * @module eventHandlers
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import jsyaml from 'js-yaml';
import * as DOM from './dom.js';
import * as State from './state.js';
import { showError, clearError, validateQuizData, sanitizeInput, showSuccess } from './utils.js';
import { jsonStateManager } from './jsonStateManager.js';
import { handleGenerateInBuilderMode } from './quizBuilder.js';
import {
    handleSaveQuiz,
    handleDeleteQuiz,
    handleSavedQuizSelectChange,
    handleExportQuizzes,
    handleImportQuizzes,
    handleClearAllQuizzes
} from './storageManager.js';
import {
    initializePeer,
    startListening,
    stopListening,
    connectToPeer,
    getReceivedData,
    clearReceivedData
} from './p2pShare.js';
import { handleGenerateQuizRequest } from './geminiService.js';
import { startQuiz, handleSubmitAnswer, goToPrevQuestion, goToNextQuestion, restartCurrentQuiz } from './quizEngine.js';
import { showQuizSetupScreen as showAppSetupScreen } from './uiController.js';

// ─── Editor Mode Handlers ─────────────────────────────────────

/**
 * Handles the load quiz button click event.
 * Parses the JSON input and starts the quiz if valid.
 * @function handleLoadQuizBtn
 * @returns {void}
 * @todo Add more detailed validation for quiz structure
 * @toimprove Consider adding a preview mode before loading
 * @tofix Ensure proper error handling for edge cases
 */
function handleLoadQuizBtn() {
    clearError();
    if (!DOM.quizJsonInput) return;

    const text = DOM.quizJsonInput.value.trim();
    if (!text) {
        showError("Editor is empty. Enter or paste quiz JSON first.");
        return;
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        showError("Invalid JSON format. Please correct and try again.");
        return;
    }

    if (!startQuiz(data)) {
        // Error already shown by startQuiz
    } else {
        showSuccess("Quiz loaded successfully!");
    }
}

/**
 * Handles the format JSON button click event.
 * Formats the JSON in the editor and converts YAML to JSON if needed.
 * @function handleFormatJsonBtn
 * @returns {void}
 * @todo Add support for other data formats like TOML
 * @toimprove Optimize for large JSON files to prevent UI blocking
 * @tofix Handle malformed YAML gracefully
 */
function handleFormatJsonBtn() {
    clearError();
    if (!DOM.quizJsonInput) return;
    const input = DOM.quizJsonInput.value.trim();
    if (input === "") {
        showError("Textarea is empty. Nothing to format.");
        return;
    }
    try {
        const parsedJson = JSON.parse(input);
        const formatted = JSON.stringify(parsedJson, null, 2);
        DOM.quizJsonInput.value = formatted;
        jsonStateManager.setRawEditorText(formatted);
        _updateEditorModeIndicator();
        showSuccess("JSON formatted successfully!");
    } catch (jsonError) {
        try {
            const parsedYaml = jsyaml.load(input);
            const formatted = JSON.stringify(parsedYaml, null, 2);
            DOM.quizJsonInput.value = formatted;
            jsonStateManager.setRawEditorText(formatted);
            _updateEditorModeIndicator();
            showSuccess("YAML converted to JSON successfully!");
        } catch (yamlError) {
            showError(`Invalid JSON or YAML.\nJSON Error: ${jsonError.message}\nYAML Error: ${yamlError.message}`);
        }
    }
}

/**
 * Handles the load sample button click event.
 * Loads the sample quiz into the editor and state manager.
 * @function handleLoadSampleBtn
 * @returns {void}
 * @todo Allow users to customize the sample quiz
 * @toimprove Add more diverse sample quizzes
 * @tofix Ensure consistent state synchronization
 */
function handleLoadSampleBtn() {
    clearError();
    const sampleJson = State.sampleQuizJson;

    // Always set data via state manager so both modes stay in sync
    jsonStateManager.fromJSONString(sampleJson);

    if (DOM.quizJsonInput) {
        DOM.quizJsonInput.value = sampleJson;
    }

    _updateEditorModeIndicator();

    if (DOM.quizNameInput) {
        DOM.quizNameInput.value = "Sample Quiz";
        delete DOM.quizNameInput.dataset.editingExisting;
    }
    showSuccess("Sample quiz loaded!");
}

// ─── Editor Textarea Input Tracking ───────────────────────────────────

/**
 * Handles the editor textarea input event.
 * Updates the raw editor text in the state manager and updates the mode indicator.
 * @function handleEditorInput
 * @returns {void}
 * @todo Implement debouncing to improve performance
 * @toimprove Add undo/redo functionality
 * @tofix Ensure proper synchronization with state manager
 */
function handleEditorInput() {
    if (!DOM.quizJsonInput) return;
    jsonStateManager.setRawEditorText(DOM.quizJsonInput.value);
    _updateEditorModeIndicator();
}

/**
 * Updates the editor mode indicator based on the content of the editor.
 * @function _updateEditorModeIndicator
 * @private
 * @returns {void}
 * @todo Add more detailed mode information
 * @toimprove Consider adding visual cues for different modes
 * @tofix Ensure accurate detection of editor states
 */
function _updateEditorModeIndicator() {
    if (!DOM.editorModeIndicator) return;
    const rawText = jsonStateManager.getRawEditorText();
    if (rawText.trim() === '') {
        DOM.editorModeIndicator.textContent = 'Mode: Prompt';
    } else if (jsonStateManager.isEditorTextValidJSON()) {
        DOM.editorModeIndicator.textContent = 'Mode: Editor';
    } else {
        DOM.editorModeIndicator.textContent = 'Mode: Prompt';
    }
}

// ─── Settings Handlers ────────────────────────────────────────────────

/**
 * Toggles the visibility of the API key in the settings input field.
 * @function handleApiKeyVisibility
 * @returns {void}
 * @todo Add password strength indicator
 * @toimprove Consider using a more secure method for storing API keys
 * @tofix Ensure proper accessibility for screen readers
 */
function handleApiKeyVisibility() {
    const input = DOM.apiKeySettingInput;
    const icon = DOM.apiKeyVisibilityIcon;
    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "visibility";
    } else {
        input.type = "password";
        icon.textContent = "visibility_off";
    }
}

// ─── Image Handlers ───────────────────────────────────────────────────

/**
 * Handles the quiz image change event.
 * Displays a preview of the selected image.
 * @function handleQuizImageChange
 * @param {Event} event - The change event from the file input
 * @returns {void}
 * @todo Add image compression to reduce file size
 * @toimprove Add support for more image formats
 * @tofix Ensure proper error handling for corrupted images
 */
function handleQuizImageChange(event) {
    const file = event.target.files?.[0];
    if (!file || !DOM.previewImg) {
        if (DOM.previewContainer) DOM.previewContainer.classList.add('hidden');
        return;
    }
    if (!file.type.startsWith("image/")) {
        if (DOM.previewContainer) DOM.previewContainer.classList.add('hidden');
        showError("Please select a valid image file.");
        return;
    }
    clearError();
    const reader = new FileReader();
    reader.onload = function (e) {
        DOM.previewImg.src = e.target.result;
        DOM.previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

/**
 * Handles the quiz image removal event.
 * Clears the selected image and hides the preview.
 * @function handleQuizImageRemove
 * @returns {void}
 * @todo Add confirmation dialog for image removal
 * @toimprove Add option to revert to previous image
 * @tofix Ensure proper cleanup of file input
 */
function handleQuizImageRemove() {
    if (DOM.quizImageInput) DOM.quizImageInput.value = '';
    if (DOM.previewContainer) DOM.previewContainer.classList.add('hidden');
}

// ─── Generate Button Dispatch ─────────────────────────────────────────

/**
 * Handles the generate button click event.
 * Routes the request to the appropriate handler based on the current mode.
 * @function handleGenerateButton
 * @returns {void}
 * @todo Add loading indicators during generation
 * @toimprove Optimize routing logic for better performance
 * @tofix Ensure consistent behavior across different modes
 */
function handleGenerateButton() {
    if (jsonStateManager.isBuilderMode()) {
        handleGenerateInBuilderMode();
    } else {
        handleGenerateQuizRequest();
    }
}

// ─── P2P Share Modal Handlers ─────────────────────────────────────────

/**
 * Handles the open share modal event.
 * Clears received data and stops listening before opening the modal.
 * @function handleOpenShareModal
 * @returns {void}
 * @todo Add validation for P2P connection readiness
 * @toimprove Improve modal UX with animations
 * @tofix Ensure proper cleanup of previous connections
 */
export function handleOpenShareModal() {
    if (!DOM.p2pShareModal) return;
    clearReceivedData();
    stopListening();
    DOM.p2pShareModal.classList.remove('hidden');
}

/**
 * Handles the close share modal event.
 * Stops listening and hides the modal.
 * @function handleCloseShareModal
 * @returns {void}
 * @todo Add confirmation for unsaved changes
 * @toimprove Add smooth transition animations
 * @tofix Ensure proper cleanup of modal state
 */
export function handleCloseShareModal() {
    if (DOM.p2pShareModal) {
        DOM.p2pShareModal.classList.add('hidden');
        stopListening();
    }
}

/**
 * Handles the start receiving event.
 * Starts the P2P listening process.
 * @function handleStartReceiving
 * @returns {void}
 * @todo Add status indicators for connection state
 * @toimprove Optimize connection establishment
 * @tofix Handle connection errors gracefully
 */
export function handleStartReceiving() {
    startListening();
}

/**
 * Handles the stop receiving event.
 * Stops the P2P listening process.
 * @function handleStopReceiving
 * @returns {void}
 * @todo Add confirmation for stopping active connections
 * @toimprove Provide feedback on connection termination
 * @tofix Ensure complete disconnection from peers
 */
export function handleStopReceiving() {
    stopListening();
}

/**
 * Handles the open download modal event.
 * Clears received data before opening the modal.
 * @function handleOpenDownloadModal
 * @returns {void}
 * @todo Add validation for download readiness
 * @toimprove Improve modal UX with animations
 * @tofix Ensure proper cleanup of previous downloads
 */
export function handleOpenDownloadModal() {
    if (!DOM.p2pDownloadModal) return;
    clearReceivedData();
    DOM.p2pDownloadModal.classList.remove('hidden');
}

/**
 * Handles the close download modal event.
 * Clears received data and hides the modal.
 * @function handleCloseDownloadModal
 * @returns {void}
 * @todo Add confirmation for unsaved downloads
 * @toimprove Add smooth transition animations
 * @tofix Ensure proper cleanup of modal state
 */
export function handleCloseDownloadModal() {
    if (DOM.p2pDownloadModal) {
        DOM.p2pDownloadModal.classList.add('hidden');
        clearReceivedData();
    }
}

/**
 * Handles the connect to peer event.
 * Initiates a connection to the specified peer ID.
 * @function handleConnectToPeer
 * @returns {void}
 * @todo Add validation for peer ID format
 * @toimprove Provide feedback during connection attempts
 * @tofix Handle connection timeouts appropriately
 */
export function handleConnectToPeer() {
    if (!DOM.targetPeerId) return;
    const targetId = DOM.targetPeerId.value.trim().toUpperCase();
    connectToPeer(targetId);
}

/**
 * Handles the use received quiz event.
 * Loads the received quiz data into the editor.
 * @function handleUseReceivedQuiz
 * @returns {void}
 * @todo Add validation for received quiz data
 * @toimprove Provide feedback during data processing
 * @tofix Ensure proper state synchronization after loading
 */
export function handleUseReceivedQuiz() {
    const data = getReceivedData();
    if (data && DOM.quizJsonInput) {
        const jsonString = JSON.stringify(data, null, 2);
        DOM.quizJsonInput.value = jsonString;
        jsonStateManager.fromJSONString(jsonString);
        _updateEditorModeIndicator();

        if (DOM.quizNameInput) {
            DOM.quizNameInput.value = "";
            delete DOM.quizNameInput.dataset.editingExisting;
        }
        showSuccess('Quiz loaded into editor!');
        handleCloseDownloadModal();
    } else {
        showError('No quiz data received yet.');
    }
}

// ─── Autocomplete ─────────────────────────────────────────────────────

/**
 * Initializes the autocomplete functionality for the quiz editor.
 * Sets up event listeners and suggestion logic for the JSON editor.
 * @function initAutocomplete
 * @returns {void}
 * @todo Add more comprehensive keyword suggestions
 * @toimprove Optimize performance for large documents
 * @tofix Handle edge cases with cursor positioning
 */
export function initAutocomplete() {
    if (!DOM.quizJsonInput || !DOM.autocompleteDropdown) return;

    const systemKeys = ["type", "question", "options", "correct"];
    const typeValues = ["true-false", "multiple-choice", "fill-in-the-blank", "short-answer"];
    const bracketPairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'" };

    let currentSuggestions = [];
    let selectedIndex = 0;

    function showSuggestions(suggestions) {
        if (suggestions.length === 0) {
            hideSuggestions();
            return;
        }

        currentSuggestions = suggestions;
        if (selectedIndex < 0 || selectedIndex >= suggestions.length) {
            selectedIndex = 0;
        }

        DOM.autocompleteDropdown.innerHTML = suggestions
            .map((s, index) => `
                <div class="autocomplete-item px-3 py-2 cursor-pointer text-sm font-mono dark:text-gray-200
                    ${index === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}">
                    ${s}
                </div>
            `)
            .join('');

        DOM.autocompleteDropdown.classList.remove('hidden');
        positionDropdown();
    }

    function hideSuggestions() {
        DOM.autocompleteDropdown.classList.add('hidden');
        currentSuggestions = [];
        selectedIndex = 0;
    }

    function getSuggestions(query) {
        const text = DOM.quizJsonInput.value;
        const pos = DOM.quizJsonInput.selectionStart;
        const textBefore = text.substring(0, pos).trim();
        const cleanQuery = query.replace(/['"]/g, '').toLowerCase();
        const structuralContext = textBefore.substring(0, textBefore.length - query.length).trim();
        const lastChar = structuralContext.slice(-1);

        if (lastChar === ':') {
            const matchKey = structuralContext.match(/"(\w+)"\s*:\s*$/);
            const currentKey = matchKey ? matchKey[1] : null;
            if (currentKey === 'type') {
                return typeValues.filter(v => v.includes(cleanQuery));
            }
            if (currentKey === 'correct') {
                return ["true", "false"].filter(v => v.includes(cleanQuery));
            }
            return [];
        }

        if (lastChar === '{' || lastChar === ',') {
            return systemKeys.filter(key => key.toLowerCase().includes(cleanQuery));
        }

        return systemKeys.filter(key => key.toLowerCase().includes(cleanQuery));
    }

    function positionDropdown() {
        const coords = getCaretCoordinates();
        DOM.autocompleteDropdown.style.top = `${coords.top + 20}px`;
        DOM.autocompleteDropdown.style.left = `${coords.left}px`;
    }

    function getCaretCoordinates() {
        const textarea = DOM.quizJsonInput;
        const pos = textarea.selectionStart;
        const mirror = document.createElement('div');
        const style = window.getComputedStyle(textarea);
        const properties = [
            'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
            'lineHeight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
            'borderWidth', 'boxSizing', 'width', 'whiteSpace', 'wordWrap'
        ];
        properties.forEach(prop => mirror.style[prop] = style[prop]);
        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.top = '0';
        mirror.style.left = '0';
        mirror.style.height = 'auto';
        mirror.textContent = textarea.value.substring(0, pos);
        const marker = document.createElement('span');
        marker.textContent = textarea.value.substring(pos) || '.';
        mirror.appendChild(marker);
        document.body.appendChild(mirror);
        const top = marker.offsetTop - textarea.scrollTop;
        const left = marker.offsetLeft - textarea.scrollLeft;
        document.body.removeChild(mirror);
        return { top, left };
    }

    function insertSelection(selected) {
        const text = DOM.quizJsonInput.value;
        const pos = DOM.quizJsonInput.selectionStart;
        const textBefore = text.substring(0, pos);
        const startOfWord = textBefore.search(/["'\w-]+$/);
        const textAfter = text.substring(pos);
        const endOfWord = textAfter.search(/[^"'\w-]/);
        const actualEnd = endOfWord === -1 ? text.length : pos + endOfWord;
        const replacement = `"${selected}"`;
        const newText = text.substring(0, startOfWord) + replacement + text.substring(actualEnd);
        DOM.quizJsonInput.value = newText;
        const newPos = startOfWord + replacement.length;
        DOM.quizJsonInput.setSelectionRange(newPos, newPos);
        hideSuggestions();
    }

    function handleInput(e) {
        const text = DOM.quizJsonInput.value;
        const pos = DOM.quizJsonInput.selectionStart;
        const lastChar = text[pos - 1];
        if (bracketPairs[lastChar] && e.inputType !== 'deleteContentBackward') {
            const nextChar = text[pos];
            if (nextChar !== bracketPairs[lastChar]) {
                DOM.quizJsonInput.value = text.substring(0, pos) + bracketPairs[lastChar] + text.substring(pos);
                DOM.quizJsonInput.setSelectionRange(pos, pos);
            }
        }
        const beforeCursor = text.substring(0, pos);
        const query = beforeCursor.split(/[\s{}[\],:]+/).pop();
        if (query.length > 0) {
            selectedIndex = 0;
            showSuggestions(getSuggestions(query));
        } else {
            hideSuggestions();
        }
    }

    function handleKeyDown(e) {
        const isDropdownOpen = !DOM.autocompleteDropdown.classList.contains('hidden');
        const textarea = DOM.quizJsonInput;
        const pos = textarea.selectionStart;
        const text = textarea.value;

        if (e.key === 'Backspace') {
            const charBefore = text[pos - 1];
            const charAfter = text[pos];
            if (bracketPairs[charBefore] === charAfter) {
                e.preventDefault();
                const newText = text.substring(0, pos - 1) + text.substring(pos + 1);
                textarea.value = newText;
                textarea.setSelectionRange(pos - 1, pos - 1);
                return;
            }
        }
        if (isDropdownOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
                showSuggestions(currentSuggestions);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
                showSuggestions(currentSuggestions);
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                insertSelection(currentSuggestions[selectedIndex]);
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const start = DOM.quizJsonInput.selectionStart;
            const end = DOM.quizJsonInput.selectionEnd;
            DOM.quizJsonInput.setRangeText("    ", start, end, 'end');
        }
    }

    function handleClickOutside(e) {
        if (!DOM.autocompleteDropdown.contains(e.target) && !DOM.quizJsonInput.contains(e.target)) {
            hideSuggestions();
        }
    }

    DOM.quizJsonInput.addEventListener('input', handleInput);
    DOM.quizJsonInput.addEventListener('keydown', handleKeyDown);
    DOM.autocompleteDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            const index = Array.from(DOM.autocompleteDropdown.children).indexOf(item);
            insertSelection(currentSuggestions[index]);
        }
    });
    document.addEventListener('click', handleClickOutside);
    console.log("Autocomplete initialized");
}

// ─── Global Keyboard Shortcuts ────────────────────────────────────────

/**
 * Handles global keydown events for keyboard shortcuts.
 * Provides navigation and interaction shortcuts throughout the app.
 * @function globalKeydownHandler
 * @param {KeyboardEvent} event - The keydown event
 * @returns {void}
 * @todo Add customizable keyboard shortcuts
 * @toimprove Optimize for accessibility compliance
 * @tofix Ensure shortcuts don't interfere with user input
 */
function globalKeydownHandler(event) {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    const activeTag = activeElement.tagName;

    if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
        if (DOM.quizContainer && !DOM.quizContainer.classList.contains('hidden') &&
            activeElement === DOM.quizContainer.querySelector("input[type='text']") && event.key === "Enter") {
            // Let quizPlayer's input handler deal with Enter
        } else {
            return;
        }
    }

    if (DOM.quizContainer && !DOM.quizContainer.classList.contains('hidden')) {
        if (event.key === "ArrowLeft") {
            if (DOM.prevBtn && !DOM.prevBtn.disabled) {
                event.preventDefault();
                goToPrevQuestion();
            }
        } else if (event.key === "ArrowRight") {
            if (DOM.nextBtn && !DOM.nextBtn.disabled) {
                event.preventDefault();
                goToNextQuestion();
            }
        } else {
            const currentQuestion = State.getCurrentQuestion();
            if (!currentQuestion || State.isSubmittedAtIndex(State.getCurrentQuestionIndex())) return;

            if (currentQuestion.type === "multiple-choice") {
                const optionIndex = parseInt(event.key, 10) - 1;
                if (optionIndex >= 0 && currentQuestion.options && optionIndex < currentQuestion.options.length) {
                    const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
                    if (optionButtons[optionIndex] && !optionButtons[optionIndex].disabled) {
                        event.preventDefault();
                        optionButtons[optionIndex].click();
                    }
                }
            } else if (currentQuestion.type === "true-false") {
                if (event.key === "1" || event.key === "0") {
                    const optionButtons = DOM.quizContainer.querySelectorAll("ul li button");
                    const targetButton = Array.from(optionButtons).find(btn => {
                        const labelSpan = btn.querySelector("span.font-semibold");
                        return labelSpan && labelSpan.textContent === event.key;
                    });
                    if (targetButton && !targetButton.disabled) {
                        event.preventDefault();
                        targetButton.click();
                    }
                }
            }
        }
    }
}

// ─── Attach All Event Handlers ────────────────────────────────────────

/**
 * Attaches all event handlers to their respective DOM elements.
 * This is the main initialization function for the event system.
 * @function attachAllEventHandlers
 * @returns {void}
 * @todo Add error handling for missing DOM elements
 * @toimprove Optimize for performance with many event listeners
 * @tofix Ensure proper cleanup of event listeners on destruction
 */
export function attachAllEventHandlers() {
    // App Section — Editor mode
    if (DOM.quizImageInput) DOM.quizImageInput.addEventListener("change", handleQuizImageChange);
    if (DOM.removeImgBtn) DOM.removeImgBtn.addEventListener("click", handleQuizImageRemove);
    if (DOM.loadQuizBtn) DOM.loadQuizBtn.addEventListener("click", handleLoadQuizBtn);

    // Editor textarea input tracking
    if (DOM.quizJsonInput) {
        DOM.quizJsonInput.addEventListener("input", handleEditorInput);
    }

    if (DOM.formatBtn) DOM.formatBtn.addEventListener("click", handleFormatJsonBtn);
    if (DOM.sampleBtn) DOM.sampleBtn.addEventListener("click", handleLoadSampleBtn);
    if (DOM.saveQuizBtn) DOM.saveQuizBtn.addEventListener("click", handleSaveQuiz);
    if (DOM.deleteQuizBtn) DOM.deleteQuizBtn.addEventListener("click", handleDeleteQuiz);
    if (DOM.savedQuizzesSelect) DOM.savedQuizzesSelect.addEventListener("change", handleSavedQuizSelectChange);

    // Generate buttons — both route through the same dispatcher
    if (DOM.builderGenerateBtn) DOM.builderGenerateBtn.addEventListener("click", handleGenerateButton);
    if (DOM.editorGenerateBtn) DOM.editorGenerateBtn.addEventListener("click", handleGenerateButton);

    // P2P Share Modal Event Handlers
    if (DOM.shareQuizBtn) DOM.shareQuizBtn.addEventListener("click", handleOpenShareModal);
    if (DOM.downloadQuizBtn) DOM.downloadQuizBtn.addEventListener("click", handleOpenDownloadModal);
    if (DOM.closeShareModalBtn) DOM.closeShareModalBtn.addEventListener("click", handleCloseShareModal);
    if (DOM.startReceivingBtn) DOM.startReceivingBtn.addEventListener("click", handleStartReceiving);
    if (DOM.stopReceivingBtn) DOM.stopReceivingBtn.addEventListener("click", handleStopReceiving);
    if (DOM.closeDownloadModalBtn) DOM.closeDownloadModalBtn.addEventListener("click", handleCloseDownloadModal);
    if (DOM.connectToPeerBtn) DOM.connectToPeerBtn.addEventListener("click", handleConnectToPeer);

    // Add "Use Quiz" button dynamically after receiving
    if (DOM.receivedJsonContainer) {
        const useBtn = document.createElement('button');
        useBtn.id = 'use-received-quiz-btn';
        useBtn.className = 'md-filled-button bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md-xl w-full mt-3 flex items-center justify-center gap-2';
        useBtn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span><span>Use This Quiz</span>';
        useBtn.addEventListener("click", handleUseReceivedQuiz);
        DOM.receivedJsonContainer.appendChild(useBtn);
    }

    // Quiz Player Handlers
    if (DOM.prevBtn) DOM.prevBtn.addEventListener("click", goToPrevQuestion);
    if (DOM.nextBtn) DOM.nextBtn.addEventListener("click", goToNextQuestion);
    if (DOM.submitBtn) DOM.submitBtn.addEventListener("click", handleSubmitAnswer);

    // Quiz Results Handlers
    if (DOM.restartBtn) DOM.restartBtn.addEventListener("click", restartCurrentQuiz);
    if (DOM.backToSetupBtn) DOM.backToSetupBtn.addEventListener("click", showAppSetupScreen);

    // Settings Page Data Management Handlers
    if (DOM.exportQuizzesBtn) DOM.exportQuizzesBtn.addEventListener("click", handleExportQuizzes);
    if (DOM.importQuizzesInput) DOM.importQuizzesInput.addEventListener("change", handleImportQuizzes);
    if (DOM.clearAllQuizzesBtn) DOM.clearAllQuizzesBtn.addEventListener("click", handleClearAllQuizzes);
    if (DOM.toggleApiKeyVisibilityBtn && DOM.apiKeySettingInput && DOM.apiKeyVisibilityIcon) DOM.toggleApiKeyVisibilityBtn.addEventListener('click', handleApiKeyVisibility);

    document.addEventListener("keydown", globalKeydownHandler);

    // Initialize P2P system
    initializePeer();

    // Initialize autocomplete
    initAutocomplete();

    console.log("All event listeners dynamically attached/verified.");
}

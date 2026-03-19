/**
 * @fileoverview Settings Controller module for KwekKwekQuiz
 * Handles theme, animation, and API key settings functionality.
 * @module settingsController
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import { showSuccess, showError } from './utils.js'; // Added showError
import { startQuiz } from './quizEngine.js';

/**
 * @constant {string}
 * @private
 * @description The storage key for the API key
 */
const API_KEY_STORAGE_ID = 'geminiApiKey';

/**
 * Updates the theme icons based on the current theme.
 * @function updateThemeIcons
 * @param {boolean} isDark - Whether the dark theme is currently active
 * @private
 * @todo Add support for more theme variants
 * @toimprove Optimize DOM queries for better performance
 * @tofix Ensure proper icon visibility in all themes
 */
function updateThemeIcons(isDark) {
    // Global header icons
    if (DOM.moonIcon && DOM.sunIcon) {
        DOM.moonIcon.classList.toggle('hidden', !isDark);
        DOM.sunIcon.classList.toggle('hidden', isDark);
    }
    // Settings page icons
    if (DOM.moonIconSetting && DOM.sunIconSetting) {
        DOM.moonIconSetting.classList.toggle('hidden', !isDark);
        DOM.sunIconSetting.classList.toggle('hidden', isDark);
    }
    // Update checkbox state
    if (DOM.darkModeToggleSetting) {
        DOM.darkModeToggleSetting.checked = isDark;
    }
}

/**
 * Updates the animation icons based on the current animation state.
 * @function updateAnimationIcons
 * @param {boolean} animationsEnabled - Whether animations are currently enabled
 * @private
 * @todo Add support for animation speed settings
 * @toimprove Optimize DOM queries for better performance
 * @tofix Ensure proper icon visibility in all themes
 */
function updateAnimationIcons(animationsEnabled) {
    // Global header icons
    if (DOM.boltOnIcon && DOM.boltOffIcon) {
        DOM.boltOnIcon.classList.toggle('hidden', !animationsEnabled);
        DOM.boltOffIcon.classList.toggle('hidden', animationsEnabled);
    }
    // Settings page icons
    if (DOM.boltOnIconSetting && DOM.boltOffIconSetting) {
        DOM.boltOnIconSetting.classList.toggle('hidden', !animationsEnabled);
        DOM.boltOffIconSetting.classList.toggle('hidden', animationsEnabled);
    }
    // Update checkbox state
    if (DOM.animationToggleSetting) {
        DOM.animationToggleSetting.checked = animationsEnabled;
    }
    // Update aria-pressed for all toggles
    if(DOM.animationToggle) DOM.animationToggle.setAttribute("aria-pressed", String(animationsEnabled));
}

/**
 * Updates the shuffle icons based on the current shuffle state.
 * @function updateShuffleIcons
 * @param {boolean} shuffleEnabled - Whether shuffling is currently enabled
 * @private
 * @todo Add support for more visual indicators
 * @toimprove Optimize DOM queries for better performance
 * @tofix Ensure proper icon visibility in all themes
 */
function updateShuffleIcons(shuffleEnabled) {
    // Settings page icons
    if (DOM.shuffleOnSetting && DOM.shuffleOffSetting) {
        DOM.shuffleOnSetting.classList.toggle('hidden', !shuffleEnabled);
        DOM.shuffleOffSetting.classList.toggle('hidden', shuffleEnabled);
    }
    // Update checkbox state
    if (DOM.randomizeQuestionsSetting) {
        DOM.randomizeQuestionsSetting.checked = shuffleEnabled;
    }
    // Update aria-pressed for the toggle
    if(DOM.randomizeQuestionsSetting && DOM.randomizeQuestionsSetting.tagName !== 'INPUT') {
        DOM.randomizeQuestionsSetting.setAttribute("aria-pressed", String(shuffleEnabled));
    }
}

/**
 * Updates the swap calls icons based on the current state.
 * @function updateSwapCallsIcons
 * @param {boolean} swapEnabled - Whether swapping choices is currently enabled
 * @private
 * @todo Add support for more visual indicators
 * @toimprove Optimize DOM queries for better performance
 * @tofix Ensure proper icon visibility in all themes
 */
function updateSwapCallsIcons(swapEnabled) {
    // Settings page icons
    if (DOM.swapCallsOnSetting && DOM.swapCallsOffSetting) {
        DOM.swapCallsOnSetting.classList.toggle('hidden', !swapEnabled);
        DOM.swapCallsOffSetting.classList.toggle('hidden', swapEnabled);
    }
    // Update checkbox state
    if (DOM.randomizeChoicesSetting) {
        DOM.randomizeChoicesSetting.checked = swapEnabled;
    }
    // Update aria-pressed for the toggle
    if(DOM.randomizeChoicesSetting && DOM.randomizeChoicesSetting.tagName !== 'INPUT') {
        DOM.randomizeChoicesSetting.setAttribute("aria-pressed", String(swapEnabled));
    }
}

/**
 * Initializes the settings controller by setting up event listeners and loading saved settings.
 * @function initSettings
 * @returns {void}
 * @todo Add support for more settings options
 * @toimprove Optimize initialization for better performance
 * @tofix Ensure proper initialization order of all settings
 */
export function initSettings() {
    // Theme persistence
    const isDark = localStorage.getItem("theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    updateThemeIcons(isDark);

    // Animation persistence
    const animationsEnabled = localStorage.getItem("animations") !== "disabled";
    document.documentElement.classList.toggle("animations-disabled", !animationsEnabled);
    updateAnimationIcons(animationsEnabled);

    // Quiz Settings persistence
    const randomizeQuestions = localStorage.getItem("randomizeQuestions") === "true";
    const randomizeChoices = localStorage.getItem("randomizeChoices") === "true";
    updateShuffleIcons(randomizeQuestions);
    updateSwapCallsIcons(randomizeChoices);

    // API Key persistence
    loadApiKeyToInputs();

    // --- Attach event listeners ---
    // Global Header Toggles
    if (DOM.darkModeToggle) { // Uses the global ID from dom.js
        DOM.darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    if (DOM.animationToggle) { // Uses the global ID from dom.js
        DOM.animationToggle.addEventListener('click', toggleAnimations);
    }

    // Settings Page Toggles (using 'change' for checkboxes)
    if (DOM.darkModeToggleSetting) {
        DOM.darkModeToggleSetting.addEventListener('change', toggleDarkMode);
    }
    if (DOM.animationToggleSetting) {
        DOM.animationToggleSetting.addEventListener('change', toggleAnimations);
    }

    // Quiz Settings Toggles
    if (DOM.randomizeQuestionsSetting) {
        DOM.randomizeQuestionsSetting.addEventListener('change', toggleRandomizeQuestions);
    }
    if (DOM.randomizeChoicesSetting) {
        DOM.randomizeChoicesSetting.addEventListener('change', toggleRandomizeChoices);
    }

    // API Key Management in Settings
    if (DOM.saveApiKeyBtn) {
        DOM.saveApiKeyBtn.addEventListener('click', handleSaveApiKeyFromSettings);
    }
    if (DOM.clearApiKeyBtn) {
        DOM.clearApiKeyBtn.addEventListener('click', handleClearApiKeyFromSettings);
    }
    // Sync API key inputs
    // if (DOM.apiKeySettingInput && DOM.apiKeyInput) {
    //     DOM.apiKeySettingInput.addEventListener('input', () => {
    //         DOM.apiKeyInput.value = DOM.apiKeySettingInput.value;
    //     });
    //     // If API key in App section is removed, this listener isn't needed:
    //     // DOM.apiKeyInput.addEventListener('input', () => {
    //     //     DOM.apiKeySettingInput.value = DOM.apiKeyInput.value;
    //     // });
    // }
    console.log("Settings controller initialized.");
}

/**
 * Toggles the dark mode setting.
 * @function toggleDarkMode
 * @returns {void}
 * @todo Add smooth transition effects
 * @toimprove Optimize theme switching for better performance
 * @tofix Ensure consistent theme application across all components
 */
export function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcons(isDark);
    showSuccess(`Dark mode ${isDark ? 'enabled' : 'disabled'}.`);
}

/**
 * Toggles the animations setting.
 * @function toggleAnimations
 * @returns {void}
 * @todo Add support for different animation presets
 * @toimprove Optimize animation toggling for better performance
 * @tofix Ensure proper cleanup of animations when disabled
 */
export function toggleAnimations() {
    // Check current state from the class, not aria-pressed, to be source of truth
    const currentlyDisabled = document.documentElement.classList.contains("animations-disabled");
    const animationsEnabled = currentlyDisabled; // if currently disabled, enabling them

    document.documentElement.classList.toggle("animations-disabled", !animationsEnabled);
    localStorage.setItem("animations", animationsEnabled ? "enabled" : "disabled");
    updateAnimationIcons(animationsEnabled);
    showSuccess(`Animations ${animationsEnabled ? 'enabled' : 'disabled'}.`);
}


// API Key Management Functions
/**
 * Loads the saved API key into the input fields.
 * @function loadApiKeyToInputs
 * @returns {void}
 * @todo Add validation for the loaded API key
 * @toimprove Optimize for better performance with large keys
 * @tofix Ensure proper loading of keys with special characters
 */
export function loadApiKeyToInputs() {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_ID);
    if (savedKey) {
        // if (DOM.apiKeyInput) DOM.apiKeyInput.value = savedKey; // REMOVE THIS if apiKeyInput is removed from app section
        if (DOM.apiKeySettingInput) DOM.apiKeySettingInput.value = savedKey;
    }
}

/**
 * Handles saving the API key from the settings page.
 * @function handleSaveApiKeyFromSettings
 * @returns {void}
 * @todo Add validation for the entered API key
 * @toimprove Provide more detailed feedback on save success/failure
 * @tofix Ensure proper sanitization of the API key before saving
 */
function handleSaveApiKeyFromSettings() {
    if (DOM.apiKeySettingInput && DOM.apiKeySettingInput.value.trim()) {
        const keyToSave = DOM.apiKeySettingInput.value.trim();
        localStorage.setItem(API_KEY_STORAGE_ID, keyToSave);
        // if (DOM.apiKeyInput) DOM.apiKeyInput.value = keyToSave; // REMOVE THIS
        showSuccess('API Key saved!');
    } else {
        showError('Please enter an API Key to save.');
    }
}

/**
 * Handles clearing the saved API key.
 * @function handleClearApiKeyFromSettings
 * @returns {void}
 * @todo Add additional confirmation for sensitive operations
 * @toimprove Provide more detailed feedback on clear success/failure
 * @tofix Ensure complete removal of the API key from storage
 */
function handleClearApiKeyFromSettings() {
    if (confirm('Are you sure you want to clear the saved API Key?')) {
        localStorage.removeItem(API_KEY_STORAGE_ID);
        // if (DOM.apiKeyInput) DOM.apiKeyInput.value = ''; // REMOVE THIS
        if (DOM.apiKeySettingInput) DOM.apiKeySettingInput.value = '';
        showSuccess('Saved API Key cleared.');
    }
}

// In initSettings():
// REMOVE the sync listeners if DOM.apiKeyInput is gone:
// if (DOM.apiKeySettingInput && DOM.apiKeyInput) {
//     DOM.apiKeySettingInput.addEventListener('input', () => {
//         DOM.apiKeyInput.value = DOM.apiKeySettingInput.value;
//     });
// }

/**
 * Toggles the randomize questions setting.
 * @function toggleRandomizeQuestions
 * @returns {void}
 * @todo Add smooth transition effects
 * @toimprove Optimize for better performance
 * @tofix Ensure consistent application across all components
 */
export function toggleRandomizeQuestions() {
    const randomizeQuestions = localStorage.getItem("randomizeQuestions") !== "true";
    localStorage.setItem("randomizeQuestions", String(randomizeQuestions));
    updateShuffleIcons(randomizeQuestions);
    showSuccess(`Randomize question order ${randomizeQuestions ? 'enabled' : 'disabled'}.`);
}

/**
 * Toggles the randomize choices setting.
 * @function toggleRandomizeChoices
 * @returns {void}
 * @todo Add smooth transition effects
 * @toimprove Optimize for better performance
 * @tofix Ensure consistent application across all components
 */
export function toggleRandomizeChoices() {
    const randomizeChoices = localStorage.getItem("randomizeChoices") !== "true";
    localStorage.setItem("randomizeChoices", String(randomizeChoices));
    updateSwapCallsIcons(randomizeChoices);
    showSuccess(`Randomize choice order ${randomizeChoices ? 'enabled' : 'disabled'}.`);
}

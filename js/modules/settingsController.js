// js/modules/settingsController.js
import * as DOM from './dom.js';
import { showSuccess, showError } from './utils.js'; // Added showError

const API_KEY_STORAGE_ID = 'geminiApiKey';

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
}

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
    // Update aria-pressed for all toggles
    if(DOM.animationToggle) DOM.animationToggle.setAttribute("aria-pressed", String(animationsEnabled));
    if(DOM.animationToggleSetting) DOM.animationToggleSetting.setAttribute("aria-pressed", String(animationsEnabled));
}

export function initSettings() {
    // Theme persistence
    const isDark = localStorage.getItem("theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    updateThemeIcons(isDark);

    // Animation persistence
    const animationsEnabled = localStorage.getItem("animations") !== "disabled";
    document.documentElement.classList.toggle("animations-disabled", !animationsEnabled);
    updateAnimationIcons(animationsEnabled);

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

    // Settings Page Toggles
    if (DOM.darkModeToggleSetting) {
        DOM.darkModeToggleSetting.addEventListener('click', toggleDarkMode);
    }
    if (DOM.animationToggleSetting) {
        DOM.animationToggleSetting.addEventListener('click', toggleAnimations);
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

export function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcons(isDark);
    showSuccess(`Dark mode ${isDark ? 'enabled' : 'disabled'}.`);
}

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
export function loadApiKeyToInputs() {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_ID);
    if (savedKey) {
        // if (DOM.apiKeyInput) DOM.apiKeyInput.value = savedKey; // REMOVE THIS if apiKeyInput is removed from app section
        if (DOM.apiKeySettingInput) DOM.apiKeySettingInput.value = savedKey;
    }
}
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
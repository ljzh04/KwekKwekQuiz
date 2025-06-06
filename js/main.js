// js/main.js
// import './modules/dom.js'; // DOM elements are accessed via * as DOM, side effect import not strictly needed if all modules import DOM
import { initSettings } from './modules/settingsController.js';
import { loadSavedQuizzesToDropdown } from './modules/storageManager.js';
import { createQuizPlayerElements } from './modules/quizPlayer.js';
import { attachAllEventHandlers } from './modules/eventHandlers.js';
// import { showQuizSetupScreen } from './modules/uiController.js'; // Initial screen is now handled by navigationController
import { initNavigation } from './modules/navigationController.js'; // NEW

function initializeApp() {
    console.log("MAIN.JS (Sidebar Refactor) LOADED.");
    initNavigation();             // Initialize sidebar and content switching first
    initSettings();               // Initialize theme, animations, API key
    loadSavedQuizzesToDropdown(); // For the app section's dropdown
    createQuizPlayerElements();   // Pre-create reusable elements for the quiz player
    attachAllEventHandlers();     // Attach event listeners for app functionalities
    // showQuizSetupScreen(); // Initial view (app-section) is handled by initNavigation via hash or default

    console.log("Quiz application initialized with sidebar navigation.");
}

// Ensure DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
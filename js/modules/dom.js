// js/modules/dom.js

// --- Sidebar & Navigation ---
export const sidebar = document.getElementById('sidebar');
export const sidebarToggle = document.getElementById('sidebar-toggle');
export const sidebarOverlay = document.getElementById('sidebar-overlay');
export const sidebarLinks = document.querySelectorAll('.sidebar-link');
export const contentSections = document.querySelectorAll('.content-section');
export const mainTitle = document.getElementById('main-title');

// --- App Section ---
export const appSection = document.getElementById('app-section'); // Main container for app
export const quizSetup = document.getElementById("quiz-setup");
export const quizJsonInput = document.getElementById("quiz-json-input");
export const quizImageInput = document.getElementById("quiz-image-input")
export const formatBtn = document.getElementById("format-json-btn");
// export const apiKeyInput = document.getElementById('api-key-input'); // In App section
export const generateBtn = document.getElementById("generate-json-btn");
export const errorDiv = document.getElementById("error-message");
export const loadQuizBtn = document.getElementById("load-quiz-btn");
export const sampleBtn = document.getElementById("load-sample-btn");
export const saveQuizBtn = document.getElementById("save-quiz-btn");
export const deleteQuizBtn = document.getElementById("delete-quiz-btn");
export const savedQuizzesSelect = document.getElementById("saved-quizzes");
export const quizNameInput = document.getElementById('quiz-name-input');
// export const homeBtn = document.getElementById("home-btn"); // Removed as sidebar 'App' link replaces it

// --- Quiz Player (within App Section) ---
export const quizContainer = document.getElementById("quiz-container");
export const prevBtn = document.getElementById("prev-btn");
export const nextBtn = document.getElementById("next-btn");
export const submitBtn = document.getElementById("submit-btn");
export const progressBar = document.getElementById("progress-bar");
export const navigationButtons = document.getElementById("navigation-buttons");
export const progressText = document.getElementById("progress-text");
export const progressMeter = document.getElementById("progress-meter");
export const scoreText = document.getElementById("score-text"); 

// --- Quiz End (within App Section) ---
export const resultContainer = document.getElementById("result-container");
export const summaryContainer = document.getElementById("summary-container");
export const restartBtn = document.getElementById("restart-btn");
export const backToSetupBtn = document.getElementById("back-to-setup-btn");

// --- Settings Section ---
export const settingsSection = document.getElementById('settings-section');
// Global Header Toggles
export const darkModeToggle = document.getElementById("dark-mode-toggle-global"); // Renamed from darkModeToggle
export const animationToggle = document.getElementById("animation-toggle-global"); // Renamed from animationToggle
export const moonIcon = document.getElementById("moon-icon-global"); // Renamed from moonIcon
export const sunIcon = document.getElementById("sun-icon-global"); // Renamed from sunIcon
export const boltOnIcon = document.getElementById("bolt-on-global"); // Renamed from boltOnIcon
export const boltOffIcon = document.getElementById("bolt-off-global"); // Renamed from boltOffIcon

// Settings Page Specific Toggles & Inputs
export const darkModeToggleSetting = document.getElementById("dark-mode-toggle-setting");
export const animationToggleSetting = document.getElementById("animation-toggle-setting");
export const moonIconSetting = document.getElementById("moon-icon-setting");
export const sunIconSetting = document.getElementById("sun-icon-setting");
export const boltOnIconSetting = document.getElementById("bolt-on-setting"); // Corrected ID
export const boltOffIconSetting = document.getElementById("bolt-off-setting"); // Corrected ID
export const apiKeySettingInput = document.getElementById('api-key-setting-input');
export const saveApiKeyBtn = document.getElementById('save-api-key-btn');
export const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
export const exportQuizzesBtn = document.getElementById('export-quizzes-btn');
export const importQuizzesInput = document.getElementById('import-quizzes-input');
export const clearAllQuizzesBtn = document.getElementById('clear-all-quizzes-btn');
export const toggleApiKeyVisibilityBtn = document.getElementById('toggle-api-key-visibility');
export const apiKeyVisibilityIcon = document.getElementById('api-key-visibility-icon');

// Check for critical missing elements (update this list as needed)
const criticalElements = {
    sidebar, sidebarToggle, sidebarLinks, contentSections, mainTitle,
    quizJsonInput, quizImageInput, formatBtn, generateBtn, errorDiv, loadQuizBtn,
    quizContainer, prevBtn, nextBtn, submitBtn, resultContainer,
    darkModeToggle, animationToggle, // Global toggles
    // apiKeyInput,
};

const missingCriticalElements = Object.entries(criticalElements)
    .filter(([, element]) => {
        if (element instanceof NodeList) return element.length === 0; // Check if NodeList is empty
        return !element;
    })
    .map(([name]) => name);

if (missingCriticalElements.length > 0) {
    const message = `Critical error: Page element(s) missing: ${missingCriticalElements.join(', ')}. App cannot function fully.`;
    console.error(message);
    if (errorDiv && errorDiv.classList.contains('hidden')) { // Show error if it exists
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else if (!errorDiv) {
        alert(message);
    }
}


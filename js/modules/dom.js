/**
 * @fileoverview DOM element references module for KwekKwekQuiz
 * Contains all DOM element selectors used throughout the application.
 * @module dom
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

/**
 * @namespace domElements
 * @description Collection of DOM element references organized by section
 */

// --- Sidebar & Navigation ---
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Main sidebar element
 */
export const sidebar = document.getElementById('sidebar');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Sidebar toggle button
 */
export const sidebarToggle = document.getElementById('sidebar-toggle');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Sidebar overlay element
 */
export const sidebarOverlay = document.getElementById('sidebar-overlay');

/**
 * @memberof domElements
 * @type {NodeList}
 * @description All sidebar link elements
 */
export const sidebarLinks = document.querySelectorAll('.sidebar-link');

/**
 * @memberof domElements
 * @type {NodeList}
 * @description All content section elements
 */
export const contentSections = document.querySelectorAll('.content-section');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Main title element
 */
export const mainTitle = document.getElementById('main-title');

// --- App Section ---
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Main container for the app section
 */
export const appSection = document.getElementById('app-section');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Quiz setup container
 */
export const quizSetup = document.getElementById("quiz-setup");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Textarea for JSON input
 */
export const quizJsonInput = document.getElementById("quiz-json-input");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description File input for quiz images
 */
export const quizImageInput = document.getElementById("quiz-image-input");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for image preview
 */
export const previewContainer = document.getElementById('image-preview-container');

/**
 * @memberof domElements
 * @type {HTMLImageElement|null}
 * @description Image preview element
 */
export const previewImg = document.getElementById('image-preview');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to remove selected image
 */
export const removeImgBtn = document.getElementById('remove-image-btn');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to format JSON
 */
export const formatBtn = document.getElementById("format-json-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Indicator for editor mode
 */
export const editorModeIndicator = document.getElementById('editor-mode-indicator');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Dropdown for autocomplete suggestions
 */
export const autocompleteDropdown = document.getElementById('autocomplete-dropdown');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Generate button for quiz builder mode
 */
export const builderGenerateBtn = document.getElementById("builder-generate-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Generate button for editor mode
 */
export const editorGenerateBtn = document.getElementById("editor-generate-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to load quiz from JSON
 */
export const loadQuizBtn = document.getElementById("load-quiz-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to load sample quiz
 */
export const sampleBtn = document.getElementById("load-sample-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to save current quiz
 */
export const saveQuizBtn = document.getElementById("save-quiz-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to delete selected quiz
 */
export const deleteQuizBtn = document.getElementById("delete-quiz-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to share quiz via P2P
 */
export const shareQuizBtn = document.getElementById("share-quiz-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to download quiz via P2P
 */
export const downloadQuizBtn = document.getElementById("download-quiz-btn");

/**
 * @memberof domElements
 * @type {HTMLSelectElement|null}
 * @description Select element for saved quizzes
 */
export const savedQuizzesSelect = document.getElementById("saved-quizzes");

/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Input for quiz name
 */
export const quizNameInput = document.getElementById('quiz-name-input');

// Quiz Editor
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for the editor unit
 */
export const editorUnit = document.getElementById('editor-unit');

// Quiz Builder Elements
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for the quiz builder
 */
export const quizBuilder = document.getElementById('quiz-builder');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to add a new question
 */
export const addQuestionBtn = document.getElementById('add-question-btn');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to switch to editor mode
 */
export const switchToEditorBtn = document.getElementById('switch-to-editor-btn');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to switch to builder mode
 */
export const switchToBuilderBtn = document.getElementById('switch-to-builder-btn');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for questions in the builder
 */
export const questionsContainer = document.getElementById('questions-container');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Indicator for builder mode
 */
export const builderModeIndicator = document.getElementById('builder-mode-indicator');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Button to preview the quiz
 */
export const previewQuizBtn = document.getElementById('preview-quiz-btn');

// Standardized interface elements
/**
 * @memberof domElements
 * @type {Element|null}
 * @description Menu bar element
 */
export const menuBar = document.querySelector('.menu-bar');

/**
 * @memberof domElements
 * @type {Element|null}
 * @description Ribbon bar element
 */
export const ribbonBar = document.querySelector('.ribbon-bar');

// --- Quiz Player (within App Section) ---
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for the quiz player
 */
export const quizContainer = document.getElementById("quiz-container");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Previous question button
 */
export const prevBtn = document.getElementById("prev-btn");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Next question button
 */
export const nextBtn = document.getElementById("next-btn");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Submit answer button
 */
export const submitBtn = document.getElementById("submit-btn");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Progress bar container
 */
export const progressBar = document.getElementById("progress-bar");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for navigation buttons
 */
export const navigationButtons = document.getElementById("navigation-buttons");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Element showing progress text
 */
export const progressText = document.getElementById("progress-text");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Element showing progress meter
 */
export const progressMeter = document.getElementById("progress-meter");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Element showing score text
 */
export const scoreText = document.getElementById("score-text"); 

// --- Quiz End (within App Section) ---
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for quiz results
 */
export const resultContainer = document.getElementById("result-container");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for quiz summary
 */
export const summaryContainer = document.getElementById("summary-container");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to restart the quiz
 */
export const restartBtn = document.getElementById("restart-btn");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to go back to setup
 */
export const backToSetupBtn = document.getElementById("back-to-setup-btn");

// --- P2P  Modals ---
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Modal for P2P sharing
 */
export const p2pShareModal = document.getElementById("p2p-share-modal");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Modal for P2P downloading
 */
export const p2pDownloadModal = document.getElementById("p2p-download-modal");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Element showing user's peer ID
 */
export const myPeerId = document.getElementById("my-peer-id");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Status indicator for sharing
 */
export const shareStatus = document.getElementById("share-status");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to start receiving
 */
export const startReceivingBtn = document.getElementById("start-receiving-btn");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to stop receiving
 */
export const stopReceivingBtn = document.getElementById("stop-receiving-btn");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to close share modal
 */
export const closeShareModalBtn = document.getElementById("close-share-modal");

/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Input for target peer ID
 */
export const targetPeerId = document.getElementById("target-peer-id");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Status indicator for downloading
 */
export const downloadStatus = document.getElementById("download-status");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to connect to peer
 */
export const connectToPeerBtn = document.getElementById("connect-to-peer-btn");

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to close download modal
 */
export const closeDownloadModalBtn = document.getElementById("close-download-modal");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Container for received JSON
 */
export const receivedJsonContainer = document.getElementById("received-json-container");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Preview for received JSON
 */
export const receivedJsonPreview = document.getElementById("received-json-preview");

// --- Settings Section ---
/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Settings section container
 */
export const settingsSection = document.getElementById('settings-section');

// Global Header Toggles
/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Dark mode toggle in global header
 */
export const darkModeToggle = document.getElementById("dark-mode-toggle-global");

/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Animation toggle in global header
 */
export const animationToggle = document.getElementById("animation-toggle-global");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Moon icon for dark mode in global header
 */
export const moonIcon = document.getElementById("moon-icon-global");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Sun icon for light mode in global header
 */
export const sunIcon = document.getElementById("sun-icon-global");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Bolt on icon for animations in global header
 */
export const boltOnIcon = document.getElementById("bolt-on-global");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Bolt off icon for animations in global header
 */
export const boltOffIcon = document.getElementById("bolt-off-global");

// Settings Page Specific Toggles & Inputs
/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Dark mode toggle in settings page
 */
export const darkModeToggleSetting = document.getElementById("dark-mode-toggle-setting");

/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Animation toggle in settings page
 */
export const animationToggleSetting = document.getElementById("animation-toggle-setting");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Moon icon for dark mode in settings page
 */
export const moonIconSetting = document.getElementById("moon-icon-setting");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Sun icon for light mode in settings page
 */
export const sunIconSetting = document.getElementById("sun-icon-setting");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Bolt on icon for animations in settings page
 */
export const boltOnIconSetting = document.getElementById("bolt-on-setting");

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Bolt off icon for animations in settings page
 */
export const boltOffIconSetting = document.getElementById("bolt-off-setting");

/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Input for API key in settings
 */
export const apiKeySettingInput = document.getElementById('api-key-setting-input');

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to save API key
 */
export const saveApiKeyBtn = document.getElementById('save-api-key-btn');

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to clear API key
 */
export const clearApiKeyBtn = document.getElementById('clear-api-key-btn');

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to export quizzes
 */
export const exportQuizzesBtn = document.getElementById('export-quizzes-btn');

/**
 * @memberof domElements
 * @type {HTMLInputElement|null}
 * @description Input for importing quizzes
 */
export const importQuizzesInput = document.getElementById('import-quizzes-input');

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to clear all quizzes
 */
export const clearAllQuizzesBtn = document.getElementById('clear-all-quizzes-btn');

// Quiz Settings
/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Toggle for randomizing question order
 */
export const randomizeQuestionsSetting = document.getElementById('randomize-questions-setting');

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Toggle for randomizing choice order
 */
export const randomizeChoicesSetting = document.getElementById('randomize-choices-setting');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description On icon for shuffle toggle
 */
export const shuffleOnSetting = document.getElementById('shuffle-on-setting');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Off icon for shuffle toggle
 */
export const shuffleOffSetting = document.getElementById('shuffle-off-setting');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description On icon for swap calls toggle
 */
export const swapCallsOnSetting = document.getElementById('swap-calls-on-setting');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Off icon for swap calls toggle
 */
export const swapCallsOffSetting = document.getElementById('swap-calls-off-setting');

/**
 * @memberof domElements
 * @type {HTMLButtonElement|null}
 * @description Button to toggle API key visibility
 */
export const toggleApiKeyVisibilityBtn = document.getElementById('toggle-api-key-visibility');

/**
 * @memberof domElements
 * @type {HTMLElement|null}
 * @description Icon for API key visibility toggle
 */
export const apiKeyVisibilityIcon = document.getElementById('api-key-visibility-icon');

// Check for critical missing elements (update this list as needed)
/**
 * @description Object containing critical DOM elements that must exist for the app to function
 * @type {Object}
 */
const criticalElements = {
    sidebar, sidebarToggle, sidebarLinks, contentSections, mainTitle,
    quizJsonInput, quizImageInput, formatBtn, builderGenerateBtn, loadQuizBtn,
    quizContainer, prevBtn, nextBtn, submitBtn, resultContainer,
    darkModeToggle, animationToggle, // Global toggles
    // apiKeyInput,
};

/**
 * @description Array of names of missing critical elements
 * @type {string[]}
 * @todo Implement a more robust error handling system for missing DOM elements
 * @toimprove Consider using a configuration-driven approach to define critical elements
 * @tofix Add more comprehensive checks for element functionality beyond just existence
 */
const missingCriticalElements = Object.entries(criticalElements)
    .filter(([, element]) => {
        if (element instanceof NodeList) return element.length === 0; // Check if NodeList is empty
        return !element;
    })
    .map(([name]) => name);

if (missingCriticalElements.length > 0) {
    const message = `Critical error: Page element(s) missing: ${missingCriticalElements.join(', ')}. App cannot function fully.`;
    console.error(message);
}


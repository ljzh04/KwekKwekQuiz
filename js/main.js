export async function initializeApp() {
  console.log("MAIN.JS (Sidebar Refactor) LOADED.");

  // Dynamically import all modules here
  const { initSettings } = await import('./modules/settingsController.js');
  const { loadSavedQuizzesToDropdown } = await import('./modules/storageManager.js');
  const { createQuizPlayerElements } = await import('./modules/quizPlayer.js');
  const { attachAllEventHandlers } = await import('./modules/eventHandlers.js');
  const { initNavigation } = await import('./modules/navigationController.js');

  initNavigation();             // Initialize sidebar and content switching first
  initSettings();               // Initialize theme, animations, API key
  loadSavedQuizzesToDropdown(); // For the app section's dropdown
  createQuizPlayerElements();   // Pre-create reusable elements for the quiz player
  attachAllEventHandlers();     // Attach event listeners for app functionalities

  console.log("Quiz application initialized with sidebar navigation.");
}

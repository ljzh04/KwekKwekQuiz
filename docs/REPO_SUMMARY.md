# Project Overview

KwekKwekQuiz is a lightweight, interactive web-based quiz application with integrated Google Gemini AI capabilities. The application allows users to browse quiz data in YAML/JSON format, take quizzes with real-time feedback, and leverage AI for personalized explanations and hints. Built with vanilla JavaScript and modern tooling (Vite, Tailwind CSS), it follows a modular architecture with clear separation of concerns.

# Core Modules

**`js/modules/`** - Core business logic modules
- `quizEngine.js` - Quiz state management and scoring logic
- `quizPlayer.js` - Quiz taking interface and interactions
- `geminiService.js` - Google Gemini AI integration for hints/explanations
- `state.js` - Global application state management
- `storageManager.js` - Local storage and data persistence
- `navigationController.js` - Routing and view switching
- `uiController.js` - UI rendering and DOM manipulation
- `eventHandlers.js` - Event binding and delegation

**`public/components/`** - HTML partials for views (sidebar, header, modals)

**`styles/`** - Tailwind CSS with custom design system (Material Web components, themes)

# Entry Points

- `index.html` - Main HTML entry point, loads app & app-section
- `js/main.js` - Application initialization, imports modules, bootstraps UI

# Key Dependencies

- **@google/generative-ai** - Gemini AI client
- **marked** - Markdown rendering
- **highlight.js** - Code syntax highlighting
- **katex** - Mathematical notation
- **dompurify** - XSS prevention
- **js-yaml** - YAML data parsing
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build/dev server

# Important Constraints

- **No frameworks** - Pure vanilla JS modules (ESM)
- **Material Web** - Uses `@material/web` components for UI
- **Offline-first** - Data stored locally; quizzes loaded from `data/` directory
- **Sanitization** - All AI and markdown content sanitized via DOMPurify
- **Responsive** - Mobile-first design with breakpoints
- **GitHub Pages** - Deployed via `gh-pages` to `dist/`
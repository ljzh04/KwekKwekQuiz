# KwekKwekQuiz — Quick & simple quiz maker app

KwekKwekQuiz is a lightweight, client-side single-page web app for creating, sharing, and taking quizzes. It focuses on simplicity and speed: quizzes are defined as JSON (or generated via an AI prompt), saved to the browser's localStorage, and played directly in the browser — no backend required. The UI is built with HTML/CSS (Tailwind), and the logic is split into ES modules so the app is easy to explore and extend.

Major components (brief)
- index.html / INDEX.HTML.B4REFACTOR.html
  - App shell, meta tags, links to assets, root containers for the SPA content sections.
- public/components/
  - HTML fragments (header, sidebar, app/docs/settings/about sections) loaded at runtime into the page.
- js/index.js
  - Small bootstrap that fetches component fragments and then imports/initializes the app.
- js/main.js
  - initializeApp() — primary startup orchestration (dynamic imports of modules, initialization order).
- js/modules/
  - dom.js — central DOM references for elements used across modules.
  - state.js — in-memory quiz state and getters/setters; imports sample quiz JSON.
  - quizEngine.js — core quiz lifecycle (startQuiz, navigate, scoring, submit handling).
  - quizPlayer.js — builds and renders the question UI and feedback.
  - storageManager.js — load/save/delete quizzes in localStorage (key: savedQuizzes).
  - settingsController.js — theme, animations, API key persistence and toggles.
  - geminiService.js — Google Gemini AI integration (generates quiz JSON from prompts; requires API key in settings).
  - renderUtils.js — Markdown + code highlighting + KaTeX rendering + DOMPurify sanitization.
  - uiController.js — show/hide screens, progress bar and navigation state updates.
  - utils.js — helpers: validation, sanitization, shuffle, toast wrappers.
  - eventHandlers.js (referenced) — attaches UI event listeners (load, save, submit, navigation, file import/export).
- data/
  - sample_quiz.json and promptEngineeringText.txt — example data used by state & gemini service.
- package.json & vite.config.js
  - Build/dev configuration (Vite, Tailwind, dependencies like marked, highlight.js, katex, js-yaml).
- assets (img/, manifest.json, etc.)
  - Icons and PWA manifest if present.

How it works (high level)
- On page load (index.html), js/index.js fetches the HTML fragments (header, sidebar, pages) into the DOM concurrently. After components load, it dynamically imports js/main.js and calls initializeApp().
- initializeApp() dynamically imports core modules and runs initialization in this order: navigation, settings, load saved quizzes, create quiz player elements, attach event handlers.
- A quiz is started via quizEngine.startQuiz(quizContent) which validates and shuffles questions (utils.validateQuizData + shuffleArray), sets state, resets runtime arrays in state.js, and then shows the player UI (uiController) and renders the first question (quizPlayer).
- The quiz player renders questions using renderUtils.renderMarkdownWithLaTeX (so Markdown, code highlighting, and KaTeX work), and responds to interactions via event handlers. quizEngine handles scoring, navigation, submission logic and final results rendering.
- Quizzes are persisted in localStorage through storageManager (namespace key: "savedQuizzes"). AI generation uses geminiService which requires a Gemini API key stored in the Settings page input; generated content is written into the quiz JSON textarea for review before saving.

Important entry points, scripts, and APIs
- Entry points
  - index.html — main HTML shell
  - js/index.js — component loader + bootstrap
  - js/main.js initializeApp() — app initialization orchestration
- Developer scripts (package.json)
  - npm run dev (or npm start) — start Vite dev server
  - npm run build — production build
  - npm run deploy — publishes dist via gh-pages (predeploy runs build)
- Local storage API
  - Key: "savedQuizzes" — store format is an object mapping quiz names → quiz JSON (array of question objects)
- AI generation
  - Uses @google/generative-ai (Gemini) client in js/modules/geminiService.js; requires user to paste an API key into the Settings page input before generating.
- Rendering libraries
  - marked, highlight.js, katex, DOMPurify are used in renderUtils.js for rendering question content safely and with syntax/LaTeX support.

Assumptions, constraints, and design decisions
- Client-side only: the app is intentionally backend-free and stores data in the user's browser (localStorage). This keeps the app simple but implies storage is per browser/device and has size limits.
- Module-based ESM design: modules are dynamically imported (main.js) for smaller initial bundles and easier developer comprehension.
- HTML fragment components: header/sidebar/sections are stored as standalone HTML files and loaded via fetch — this keeps index.html small and allows component reuse, but requires a static server (or Vite dev server) to serve those fragments (file:// may not work).
- Quiz format expectations: quizzes are arrays of question objects; utils.validateQuizData enforces required fields. Supported types include "multiple-choice", "true-false", "fill-in-the-blank", and "identification" (matching logic is case-insensitive for text types).
- AI generation safety: AI output is included in the UI as editable JSON; renderUtils sanitizes any rendered Markdown/HTML (DOMPurify) to reduce risk from untrusted content.
- UI and accessibility: keyboard navigation, enter/arrow keys, and focus handling are supported in quizPlayer (some a11y features included), but more accessibility improvements may be needed.
- Build & deployment: intended for static hosting (GitHub Pages is configured in package.json / vite.config.js with base '/KwekKwekQuiz/').

Where to look first (for new contributors)
1. index.html — app shell and root containers.
2. js/index.js — component loader & bootstrap.
3. js/main.js — initializeApp() (startup order; good place to add instrumentation or new startup steps).
4. js/modules/dom.js — central DOM IDs/refs used everywhere (helpful to understand how pieces find elements).
5. js/modules/state.js — shape of runtime state and sample quiz import.
6. js/modules/quizEngine.js — quiz lifecycle, scoring, navigation (core logic).
7. js/modules/quizPlayer.js — rendering and UI building for questions and inputs.
8. js/modules/storageManager.js — save/load/delete quiz persistence (localStorage).
9. js/modules/geminiService.js — AI generation flow (if you want to modify generation prompts or API handling).
10. js/modules/renderUtils.js — markdown/LaTeX/code rendering + copying utility.
11. public/components/ — the HTML fragments (header, sidebar, app-section, docs, settings, about) to see UI structure.
12. package.json & vite.config.js — dev/build scripts and Tailwind/Vite setup.

Quick getting started (dev)
- Prereqs: Node.js (modern LTS), npm
- Install & run
  - git clone https://github.com/ljzh04/KwekKwekQuiz.git
  - cd KwekKwekQuiz
  - npm install
  - npm run dev
  - Open the dev server URL (Vite prints the local host URL)
- Build & deploy
  - npm run build
  - npm run deploy (uses gh-pages to publish the dist folder — configured to the repo homepage)
- Testing AI generation
  - Open Settings after launching the app, paste your Gemini API key in the settings input, save; then in the App section enter a prompt and click Generate.

Developer notes & caution
- The repository is organized to be readable and modular; if you add new DOM elements used across modules, add references in js/modules/dom.js to centralize selectors.
- Because components are fetched at runtime, editing component file paths or names requires updating js/index.js calls.
- Search results used to prepare this summary may be limited; if you need to explore additional files, use the GitHub code search for the repo: https://github.com/ljzh04/KwekKwekQuiz/search



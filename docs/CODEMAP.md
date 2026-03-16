# Code Map

## Entry Points
- `index.html` → Loads main app container and sidebar
- `js/main.js` → Application bootstrap: initializes modules, renders UI, binds events

## Core Modules

### Quiz Management
- `js/modules/quizEngine.js` → Manages quiz state, question navigation, scoring
- `js/modules/quizPlayer.js` → Handles quiz-taking UI, answer collection, feedback display
- `js/modules/state.js` → Global reactive state store (publish-subscribe pattern)

### AI Integration
- `js/modules/geminiService.js` → Google Gemini AI client for hints and explanations
- `js/modules/utils.js` → Markdown rendering (marked), sanitization (DOMPurify), KaTeX math

### UI & Navigation
- `js/modules/navigationController.js` → View routing and page transitions
- `js/modules/uiController.js` → DOM rendering, component updates, theme management
- `js/modules/renderUtils.js` → Helper functions for rendering quiz content
- `js/modules/dom.js` → Low-level DOM manipulation utilities

### Data & Persistence
- `js/modules/storageManager.js` → Local storage, user settings, quiz history
- `data/sample_quiz.json` → Sample quiz data in JSON format

### Event Handling
- `js/modules/eventHandlers.js` → Centralized event binding and delegation

### Utilities
- `js/modules/docs.js` → Documentation and help rendering
- `js/modules/toastNotification.js` → Toast message system
- `js/modules/settingsController.js` → Settings management and UI
- `js/modules/p2pShare.js` → Peer-to-peer sharing (WebRTC)

## Web Components
- `public/components/` → HTML partials imported dynamically:
  - `sidebar.html` → Navigation sidebar
  - `header.html` → Top header bar
  - `app-section.html` → Main content area
  - `about-section.html` → About page
  - `docs-section.html` → Documentation page
  - `settings-section.html` → Settings panel
  - Modals for hints, confirmations

## Styling
- `styles/main.css` → Tailwind CSS imports + custom component styles
- `styles/base/` → Design tokens (variables, reset, typography, animations)
- `styles/components/` → Component-specific styles
- `styles/themes/` → Theme definitions (light/dark)
- `styles/utilities/` → Custom utilities (elevation, ripple, responsive)

## Configuration
- `vite.config.js` → Build configuration, dev server, plugins
- `tailwind.config.js` → Tailwind setup, custom colors, plugins
- `postcss.config.js` → PostCSS configuration
- `package.json` → Dependencies and scripts

## Tests
- `tests/` → Playwright and Vitest test suites
- `js/modules/geminiService.test.js` → Gemini service unit tests
- `test-autocomplete.html` → Manual testing page

## Dependency Flow

```
main.js
  ├─> state.js (global state)
  ├─> navigationController.js (routing)
  ├─> uiController.js (rendering)
  ├─> quizEngine.js (quiz logic)
  ├─> quizPlayer.js (quiz UI)
  ├─> geminiService.js (AI)
  ├─> storageManager.js (persistence)
  └─> eventHandlers.js (events)
       ├─> settingsController.js
       ├─> toastNotification.js
       ├─> docs.js
       └─> p2pShare.js
```

## Data Flow

1. **App Start**: `main.js` initializes state, loads UI, sets up navigation
2. **Quiz Load**: `quizEngine.js` parses quiz data → `quizPlayer.js` renders questions
3. **Answer Submission**: `quizPlayer.js` → `quizEngine.js` validates → updates state
4. **AI Hints**: `quizPlayer.js` → `geminiService.js` → response rendered with markdown/sanitization
5. **Persistence**: User settings/scores saved via `storageManager.js`

## Notes
- All modules are ESM (ES6 modules) with explicit imports
- State changes via publish-subscribe in `state.js`
- AI responses require sanitization via `dompurify` and `marked`
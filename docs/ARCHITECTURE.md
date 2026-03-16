# Architecture Documentation

## System Overview

KwekKwekQuiz follows a **modular, event-driven architecture** using vanilla JavaScript ES6 modules. The application is a single-page app (SPA) with dynamic HTML component loading and a reactive state management system.

---

## Architectural Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Publish-Subscribe Pattern**: Global state changes trigger reactive updates
3. **Progressive Enhancement**: Core functionality works without AI; Gemini is optional
4. **Security-First**: All AI and markdown content sanitized via DOMPurify
5. **Offline-First**: Data stored locally; quizzes loaded from static JSON
6. **Minimal Dependencies**: No frameworks; only utility libraries (marked, KaTeX, Gemini SDK)

---

## Module Breakdown

### Core Module Responsibilities

| Module | Responsibility | Public API |
|--------|----------------|------------|
| `state.js` | Global reactive state store | `getState()`, `setState()`, `subscribe()`, `publish()` |
| `navigationController.js` | View routing, history management | `navigateTo()`, `back()`, `forward()` |
| `uiController.js` | DOM rendering, theme management | `render()`, `update()`, `setTheme()` |
| `quizEngine.js` | Quiz logic: scoring, validation, navigation | `startQuiz()`, `submitAnswer()`, `getCurrentQuestion()`, `getScore()` |
| `quizPlayer.js` | Quiz UI: questions, answers, feedback | `renderQuestion()`, `handleAnswer()`, `showHint()` |
| `geminiService.js` | AI integration: hints, explanations | `generateHint()`, `generateExplanation()` |
| `storageManager.js` | LocalStorage, IndexedDB abstraction | `saveSetting()`, `loadSetting()`, `saveQuizProgress()` |
| `eventHandlers.js` | Global event delegation, binding | `init()`, `bindEvents()` |
| `utils.js` | Markdown rendering, sanitization, KaTeX | `renderMarkdown()`, `sanitizeHTML()`, `renderMath()` |
| `renderUtils.js` | Helper functions for quiz content rendering | `renderQuestionHTML()`, `renderAnswersHTML()` |
| `dom.js` | Low-level DOM manipulation utilities | `createElement()`, `appendChildren()`, `removeElement()` |

---

## Data Flow

### Initialization Flow

```
index.html
  └─> main.js
       ├─> state.js (create store)
       ├─> storageManager.js (load settings)
       ├─> navigationController.js (setup routes)
       ├─> uiController.js (render initial UI)
       ├─> quizEngine.js (initialize quiz logic)
       ├─> quizPlayer.js (setup quiz UI)
       ├─> geminiService.js (initialize Gemini)
       ├─> eventHandlers.js (bind all events)
       └─> settingsController.js (setup settings panel)
```

### Quiz Taking Flow

```
User clicks quiz → navigationController.navigateTo('quiz')
  └─> quizEngine.startQuiz(quizData)
       ├─> state.publish('quiz:started', { quizData })
       ├─> quizPlayer.renderQuestion()
       │    └─> renderUtils.renderQuestionHTML() → DOM
       └─> uiController.updateProgress()

User answers → quizPlayer.handleAnswer(answer)
  └─> quizEngine.validateAnswer(answer)
       ├─> state.publish('answer:submitted', { correct, answer })
       ├─> quizPlayer.showFeedback()
       └─> uiController.updateProgress()

User requests hint → quizPlayer.requestHint()
  └─> geminiService.generateHint(question)
       ├─> Call Gemini API
       ├─> utils.renderMarkdown(response)
       ├─> utils.sanitizeHTML()
       └─> quizPlayer.displayHint()
```

### State Management

**State structure** (`state.js`):
```javascript
{
  settings: {
    theme: 'light' | 'dark',
    fontSize: 'normal' | 'large',
    ...
  },
  quiz: {
    active: boolean,
    currentQuestionIndex: number,
    score: number,
    answers: [],
    timer: { remaining, total, active } // optional
  },
  ui: {
    currentView: string,
    isLoading: boolean,
    error: string | null
  }
}
```

**State updates**:
- Modules call `state.setState(partialState)` to update
- `state.publish(event, payload)` triggers reactive updates
- Subscribers (UI components) react to changes

---

## UI Architecture

### Component Structure

- **HTML partials** in `public/components/` loaded via `fetch()` and injected
- **CSS** in `styles/` using Tailwind + custom component styles
- **Material Web** components for UI controls (buttons, inputs, etc.)

### View Lifecycle

```
navigationController.navigateTo(viewName)
  ├─> Fetch component HTML from public/components/[view]-section.html
  ├─> Inject into DOM (app-section container)
  ├─> Initialize view-specific module (if needed)
  ├─> Bind view events (eventHandlers.js)
  └─> state.publish('view:changed', { viewName })
```

---

## Security Considerations

### XSS Prevention
- All AI responses (Gemini) sanitized with DOMPurify before insertion
- Markdown rendering (`marked`) followed by sanitization
- User-generated content (quiz answers) sanitized on display
- No `innerHTML` without prior sanitization

### API Key Management
- Gemini API key stored in `.env` (never committed)
- Loaded via `dotenv` in development; injected via Vite in build
- Never expose API key to client-side code directly (server proxy recommended for production)

---

## Performance Patterns

### Lazy Loading
- HTML components loaded on-demand (not in initial bundle)
- Gemini SDK loaded only when hint requested
- Heavy KaTeX rendering deferred until math appears

### Batching
- State updates batched to prevent excessive re-renders
- DOM updates in `requestAnimationFrame` where applicable

### Caching
- Quiz data cached in memory after first load
- Settings cached in localStorage with in-memory copy

---

## Testing Strategy

See `TEST_STRATEGY.md` for detailed testing approach.

### Test Pyramid
- **Unit tests** (Vitest): Individual modules in isolation
- **Integration tests**: Module interactions (quizEngine + quizPlayer)
- **E2E tests** (Playwright): Full user flows

### Mocking Strategy
- Gemini API mocked with fixtures
- localStorage mocked with jsdom
- Network requests stubbed

---

## Deployment Architecture

### Build Process
```
vite.config.js
  ├─> Bundle ESM modules
  ├─> Process CSS (Tailwind + PostCSS)
  ├─> Copy static assets (public/)
  └─> Output to dist/
```

### GitHub Pages
- `gh-pages` branch serves `dist/` folder
- `npm run predeploy` runs build
- `npm run deploy` pushes to gh-pages

---

## Extension Points

### Adding New Quiz Formats
1. Extend `quizEngine.js` with new parser
2. Add format validation in `storageManager.js`
3. Update `quizPlayer.js` to render new question types
4. Add tests for format parsing

### Adding New AI Features
1. Create new methods in `geminiService.js`
2. Sanitize all outputs with `utils.sanitizeHTML()`
3. Add rate limiting to prevent quota exhaustion
4. Provide fallback when API unavailable

### Theming
- Extend `styles/themes/` with new theme CSS
- Add theme selector in `settingsController.js`
- Persist choice in `storageManager.js`

---

## Known Limitations

- **No server-side rendering**: Initial load requires JS enabled
- **Single-user**: No multi-user, no sync across devices
- **Local storage limits**: Large quiz data may exceed 5MB limit
- **Gemini quota**: Free tier has rate limits; need caching strategy
- **No offline PWA**: Not yet a progressive web app (future enhancement)

---

## Future Architecture Considerations

- **IndexedDB**: For large quiz datasets (>5MB)
- **Service Worker**: For offline access and caching
- **WebRTC**: P2P quiz sharing (partially implemented in `p2pShare.js`)
- **Backend API**: For multi-user, cloud sync, analytics
- **Virtual Scrolling**: For quizzes with 500+ questions

---

**Last updated**: 2026-03-16 (Agent workflow setup)
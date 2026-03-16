# Testing Strategy for KwekKwekQuiz

This document outlines the comprehensive testing approach for the KwekKwekQuiz application. It serves as a guide for developers and AI agents to write effective tests and ensure code quality.

---

## Test Philosophy

- **Tests are required** for all new features and bug fixes
- **覆盖率目标**: Aim for >80% line coverage on new code
- **Tests are documentation**: They demonstrate expected behavior
- **Fast feedback**: Use watch mode during development (`npm run test:watch`)
- **CI integration**: All tests must pass before merge

---

## Testing Pyramid

```
   /\
  /  \   E2E Tests (Playwright)
 /    \  Integration Tests
/______\ Unit Tests (Vitest)
```

- **Unit tests** (base): ~70% of test suite, fast (<100ms), isolated
- **Integration tests**: ~20%, moderate speed (100-500ms), module interactions
- **E2E tests** (top): ~10%, slower (1-5s), full user flows

---

## Unit Testing (Vitest)

### Scope
Test individual modules in isolation, mocking external dependencies.

### Structure
- Co-located: `js/modules/[module].test.js`
- Central: `tests/[module].spec.js`

### What to Test
- Pure functions (utils, renderUtils)
- Module public API (quizEngine methods, state transitions)
- Error handling (invalid inputs, edge cases)
- Async operations (Gemini API calls, mocking with `vi.fn()`)

### Mocking Strategy

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quizEngine } from '../modules/quizEngine.js';

// Mock dependencies
vi.mock('../modules/state.js', () => ({
  state: {
    getState: vi.fn(() => ({ quiz: { score: 0 } })),
    setState: vi.fn(),
    publish: vi.fn()
  }
}));

describe('quizEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate score correctly for multiple choice', () => {
    const quizData = { questions: [{ correctAnswer: 'A', points: 1 }] };
    const result = quizEngine.validateAnswer('A', quizData.questions[0]);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
  });
});
```

### Test Files to Write

| Module | Test File | Coverage Focus |
|--------|-----------|----------------|
| `quizEngine.js` | `js/modules/quizEngine.test.js` | Scoring, navigation, validation |
| `quizPlayer.js` | `js/modules/quizPlayer.test.js` | UI rendering, answer handling |
| `geminiService.js` | `js/modules/geminiService.test.js` | API calls, error handling, sanitization |
| `state.js` | `js/modules/state.test.js` | Pub/sub, state updates |
| `storageManager.js` | `js/modules/storageManager.test.js` | localStorage mock, settings save/load |
| `navigationController.js` | `js/modules/navigationController.test.js` | Route handling, history |
| `utils.js` | `js/modules/utils.test.js` | Markdown, sanitization, KaTeX |
| `renderUtils.js` | `js/modules/renderUtils.test.js` | HTML generation |

---

## Integration Testing

### Scope
Test interactions between 2+ modules. Use real modules but mock external APIs (Gemini, localStorage).

### Structure
- Location: `tests/[feature]-integration.spec.js`
- Example: `tests/quizFlow-integration.spec.js`

### What to Test
- Module communication via state events
- Data flow: quizEngine → quizPlayer → state
- UI updates after state changes
- Error propagation

### Example

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { quizEngine } from '../js/modules/quizEngine.js';
import { quizPlayer } from '../js/modules/quizPlayer.js';
import { state } from '../js/modules/state.js';

describe('Quiz Flow Integration', () => {
  beforeEach(() => {
    // Reset state, clear DOM
  });

  it('should render question and update score on answer', async () => {
    // 1. Start quiz
    quizEngine.startQuiz(testQuizData);
    
    // 2. Render first question
    const questionHTML = quizPlayer.renderQuestion();
    expect(questionHTML).toContain('Question 1');
    
    // 3. Submit answer
    quizPlayer.handleAnswer('A');
    const score = quizEngine.getScore();
    expect(score).toBe(1);
    
    // 4. State should reflect answer
    const currentState = state.getState();
    expect(currentState.quiz.answers).toHaveLength(1);
  });
});
```

---

## End-to-End Testing (Playwright)

### Scope
Full user journeys in real browser environment.

### Location
- `tests/e2e/[feature].spec.js`
- Example: `tests/e2e/quiz-completion.spec.js`

### Setup
```javascript
import { test, expect } from '@playwright/test';

test.describe('Quiz Taking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete a quiz and see results', async ({ page }) => {
    // Click quiz
    await page.click('[data-testid="quiz-card-1"]');
    
    // Answer questions
    await page.click('[data-testid="answer-A"]');
    await page.click('[data-testid="submit-answer"]');
    
    // Navigate to next
    await page.click('[data-testid="next-question"]');
    
    // Complete and see score
    await page.waitForSelector('[data-testid="quiz-results"]');
    const score = await page.textContent('[data-testid="final-score"]');
    expect(score).toMatch(/\d+/);
  });
});
```

### Critical E2E Scenarios
- [ ] User can select and start a quiz
- [ ] Questions render correctly with all answer types
- [ ] Answer submission and feedback display
- [ ] Quiz completion and score display
- [ ] Navigation between views (sidebar, buttons)
- [ ] Settings change (theme, font size) persists
- [ ] Gemini hint request and display (with API key)
- [ ] Error handling (corrupt quiz data, network failure)

---

## Manual Testing Checklist

For UI changes or when E2E tests insufficient:

- [ ] **Cross-browser**: Chrome, Firefox, Safari (if available)
- [ ] **Responsive**: Mobile (375px), tablet (768px), desktop (1024px+)
- [ ] **Accessibility**: Keyboard navigation, ARIA labels, screen reader (VoiceOver/NVDA)
- [ ] **No console errors**: Open DevTools Console, ensure zero errors/warnings
- [ ] **Network conditions**: Test with throttling (Slow 3G) for offline behavior
- [ ] **Touch devices**: If possible, test on actual phone/tablet

---

## Performance Testing

### Metrics to Track
- **First Contentful Paint (FCP)**: < 1s
- **Time to Interactive (TTI)**: < 2s
- **Quiz load time**: < 500ms for 50 questions
- **Memory usage**: < 50MB steady state

### How to Measure
```bash
# Lighthouse via Chrome DevTools
# Performance tab recording
# Console timing
console.time('quizLoad');
// ... load quiz
console.timeEnd('quizLoad');
```

### Automated Performance Tests
Add to `tests/performance/` if critical:
```javascript
test('quiz load time should be < 500ms', async () => {
  const start = performance.now();
  await quizEngine.loadQuiz('large-quiz.json');
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(500);
});
```

---

## Test Data Management

### Fixtures
- `tests/fixtures/quizData.json` - Sample quiz for tests
- `tests/fixtures/gemini-responses.json` - Mock AI responses
- `tests/fixtures/settings.json` - Default settings

### Factories
Create test data programmatically:
```javascript
// tests/factories/quizFactory.js
export function createQuiz(options = {}) {
  return {
    title: options.title || 'Test Quiz',
    questions: Array.from({ length: options.questionCount || 5 }, (_, i) => ({
      id: i,
      text: `Question ${i + 1}`,
      type: 'multiple-choice',
      answers: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Because it is correct',
      points: 1
    }))
  };
}
```

---

## Mocking External Dependencies

### Gemini API
```javascript
vi.mock('../modules/geminiService.js', () => ({
  geminiService: {
    generateHint: vi.fn().mockResolvedValue('This is a mock hint'),
    generateExplanation: vi.fn().mockResolvedValue('**Mock** explanation')
  }
}));
```

### localStorage
Vitest runs in Node by default; use `jsdom`:
```javascript
import { beforeAll, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

beforeAll(() => {
  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  global.window = dom.window;
  global.localStorage = dom.window.localStorage;
});
```

Alternatively, use `vi.stubGlobal`:
```javascript
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
});
```

---

## Running Tests

### Commands
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (development)
npm run test:coverage # With coverage report
vitest run path/to/test.js  # Single test file
vitest run -t "test name"   # Single test by name
```

### Coverage Report
- Generated in `coverage/` directory
- Target: >80% lines, >80% functions, >80% branches for new code
- Don't obsess over 100%; focus on critical paths

---

## Writing Good Tests

### AAA Pattern (Arrange, Act, Assert)
```javascript
it('should return false for incorrect answer', () => {
  // Arrange
  const question = { correctAnswer: 'B', type: 'multiple-choice' };
  
  // Act
  const result = quizEngine.validateAnswer('A', question);
  
  // Assert
  expect(result.correct).toBe(false);
  expect(result.score).toBe(0);
});
```

### Descriptive Names
```javascript
// Good
it('should handle null answer as incorrect');
it('should update score when answer is correct');
it('should emit "quiz:completed" event on finish');

// Bad
it('should work');
it('should return correct value');
it('tests scoring');
```

### Edge Cases
- Empty inputs, null, undefined
- Boundary values (0, negative numbers, max values)
- Error conditions (network failure, invalid JSON)
- State transitions (quiz not started → started → completed)

---

## Continuous Integration

### CI Pipeline (GitHub Actions example)
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/
```

### PR Gate
- All tests must pass
- Coverage thresholds enforced (if configured)
- No new console errors in E2E tests

---

## Debugging Failing Tests

### Vitest Issues
```bash
# Clear cache
npx vitest --clearCache

# Run in debug mode
npx vitest --debug

# Show stack traces
npx vitest --reporter=verbose
```

### Playwright Issues
```bash
# Run headed (see browser)
npx playwright test --headed

# Run with trace
npx playwright test --trace on

# Show video
npx playwright test --video on
```

---

## Test Maintenance

- **Keep tests fast**: If test takes >500ms, consider mocking or splitting
- **Avoid flakiness**: Use `await` for async operations, add timeouts if needed
- **Don't test implementation details**: Test behavior, not internal state
- **Update tests with code**: When refactoring, update corresponding tests
- **Delete obsolete tests**: Remove tests for removed features

---

## AI Agent Testing Guidelines

When AI agents make changes:

1. **Always run tests** before submitting: `npm test`
2. **Add tests for new code** - at least one unit test per function
3. **Add regression tests** for bugs - test the exact failure scenario
4. **Update existing tests** if APIs change - don't leave broken tests
5. **Validate manually** for UI changes - run dev server, interact
6. **Report coverage** - indicate which files were tested and pass/fail status

### Test Template for AI Agents
```javascript
// In PR description, include:
Tests added:
- js/modules/newFeature.test.js (covers init(), process(), edge cases)
- tests/newFeature-integration.spec.js (module interaction)
Validation:
- npm test: PASSED (45 tests)
- Manual UI: verified feature works in Chrome/Firefox
- No console errors
```

---

## Coverage Goals

| Area | Target | Current (if known) |
|------|--------|-------------------|
| Core logic (quizEngine) | >85% | TBD |
| UI rendering (quizPlayer) | >75% | TBD |
| API services (geminiService) | >80% | TBD |
| Utilities (utils, dom) | >90% | TBD |
| Overall | >80% | TBD |

Coverage will be measured on CI and tracked over time.

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Testing](https://playwright.dev/)
- [Testing JavaScript Applications](https://testingjavascript.com/) (book)

---

**Remember**: Tests are your safety net. They enable confident refactoring, prevent regressions, and serve as living documentation. Write them early, keep them fast, and make them meaningful.

**Last updated**: 2026-03-16 (Agent workflow setup)
# Feature Implementation Template for AI Agents

Use this structured format when requesting new feature implementations. Ensures clear scope, minimal context overhead, and safe additive changes.

---

## Feature Description

**One-sentence summary**: 

**Full description**:

**User story** (if applicable): As a [user type], I want [goal] so that [benefit]

**Priority**: (Low/Medium/High/Critical)

---

## Affected Modules

Based on `docs/CODEMAP.md`, identify modules that will CHANGE:

- `js/modules/[module].js` - (reason: )
- `public/components/[component].html` - (reason: )
- `styles/components/[style].css` - (reason: )

Will you create **new modules**? If yes, list:
- `js/modules/[newModule].js` - (purpose: )
- `public/components/[newComponent].html` - (purpose: )
- `styles/components/[newStyle].css` - (purpose: )

---

## New Components

**UI components** to create (if any):
- Component name: [e.g., TimerDisplay]
- Location: `public/components/[name].html` + `styles/components/_[name].css`
- Props/Attributes: [list]
- Events: [dispatch events?]

**Logic modules** to create (if any):
- Module name: [e.g., quizTimer.js]
- Location: `js/modules/[name].js`
- Public API: [exported functions]
- Dependencies: [which existing modules?]

---

## Integration Points

**How will the feature integrate with existing code?**

1. **Entry point**: Which module will initialize this feature?
   - Likely: `main.js`, `navigationController.js`, or `quizPlayer.js`
   - Describe: "When [condition], call `newFeature.init()`"

2. **State changes**: Does this feature need global state?
   - If yes, add to `state.js` with reactive pattern
   - If no, keep state local to module

3. **Event flow**: What events are involved?
   - User actions → [which events?]
   - AI responses → [any changes?]
   - Navigation → [any impact?]

4. **Data persistence**: Should this feature save to localStorage?
   - Settings: save via `storageManager.js`
   - Quiz progress: save via `quizEngine.js`
   - Feature data: [describe]

---

## Backward Compatibility

**Will existing APIs change?**
- [ ] No - all changes are additive (preferred)
- [ ] Yes - list modified function signatures:

```
Function: quizEngine.startQuiz()
Before: startQuiz(quizData)
After: startQuiz(quizData, options = {})
```

**Breaking changes**: If any, provide migration strategy:
- How will existing code adapt?
- Can you deprecate old API with warning?

**UI changes**: 
- [ ] Additive only (new buttons/panels, don't remove existing)
- [ ] Modifies existing UI (describe what changes)
- [ ] Replaces UI component (ensure no regressions)

---

## Testing Requirements

**Unit tests** (required for new modules):
- Test file location: `js/modules/[module].test.js` or `tests/[feature].spec.js`
- Coverage targets: [e.g., 80%+ for new code]
- Mock dependencies: (Gemini API, localStorage, network)

**Integration tests** (if feature spans modules):
- Test file: `tests/[feature]-integration.spec.js`
- Scenario: [describe full user flow]

**E2E/Manual tests** (for UI features):
- Steps to verify:
  1. [action]
  2. [expected result]
- Browser compatibility: (Chrome, Firefox, Safari, mobile?)

**Performance tests** (if feature impacts performance):
- Baseline metric: [e.g., quiz load time < 1s]
- Memory usage: [no leaks, < X MB increase]

---

## Constraints

- **Token budget**: Max N file reads (default: 5)
- **Additive preference**: New functions/modules over modifying stable ones
- **Security**: Sanitize all user-generated/AI content with DOMPurify
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsive**: Mobile-first design; test on narrow viewport
- **No console errors**: Zero errors in browser console
- **Tests**: All existing tests must pass + new tests added

---

## Implementation Workflow (For Agent)

When you receive this template, follow this feature development protocol:

### 1. Scope assessment (5 min)
- Read `docs/REPO_SUMMARY.md`, `docs/CODEMAP.md`, `docs/ARCHITECTURE.md` (if exists)
- Identify existing modules that will interact with new feature
- Determine if new module is needed or can extend existing
- **Stop**: Don't read all files; only those directly relevant

### 2. Design minimal implementation (10 min)
- Sketch module structure (exported functions, internal state)
- Define clear interface boundaries (input → output)
- Plan integration point (where to call `init()` or bind events)
- Consider edge cases (empty data, network failures, AI errors)

### 3. Create new code (iterative)
- **If new module**: Create file skeleton with JSDoc comments first
- **If extending**: Read target file; make smallest change that enables feature
- Add unit tests alongside code (TDD style if possible)
- Keep functions small (< 30 lines); single responsibility

### 4. Integrate carefully
- Hook into existing initialization flow (likely `main.js` or `quizPlayer.js`)
- Bind UI events to module functions
- Ensure state flows correctly (publish-subscribe if needed)
- Add CSS in `styles/components/` with responsive design

### 5. Test aggressively
- Unit tests: `npm test` or `vitest run path/to/test.js`
- Manual UI test: `npm run dev` and interact with feature
- Edge case testing: What happens with bad data, no network?
- Cross-browser: Test in at least Chrome and Firefox

### 6. Document and update maps
- Update `docs/CODEMAP.md`:
  - Add new module to appropriate section
  - Update dependency flow diagram if needed
- Update `docs/REPO_SUMMARY.md` (only if architecture significantly changed)
- Update `AGENTS.md` if new patterns were introduced

### 7. Final validation
- [ ] All tests pass (`npm test`)
- [ ] No console errors in browser
- [ ] `git diff` shows only intended changes
- [ ] CODEMAP and other docs updated
- [ ] Feature works on sample data

---

## Output Format

When reporting completion, include:

1. **Implementation summary**: (2-3 sentences)
2. **Files created**:
   - `js/modules/[new].js` (N lines)
   - `public/components/[new].html` (M lines)
   - `styles/components/_[new].css` (P lines)
3. **Files modified**:
   - `[existing file]` - (specific changes, ~Q lines)
4. **Tests added**:
   - `[test file]` - covers [scenarios]
5. **Validation**:
   - `npm test`: pass/fail
   - Manual demo: [ describe working feature ]
   - Performance: [any metrics if applicable]
6. **Documentation updated**:
   - `docs/CODEMAP.md`: yes/no
   - `docs/REPO_SUMMARY.md`: yes/no
7. **Follow-up**: (any concerns, future enhancements?)

---

## Example Feature Request

```
Feature Description:
Add optional countdown timer per question in quiz mode.

User story:
As a quiz taker, I want to see a countdown timer for each question so I can manage my time.

Affected Modules:
- js/modules/quizEngine.js (add timer state management)
- js/modules/quizPlayer.js (render timer UI, auto-submit on timeout)
- js/modules/uiController.js (timer theme styling)
- NEW: js/modules/quizTimer.js (timer logic)
- styles/components/_progress.css (timer bar styles)

Integration Points:
- quizPlayer.js: on question render, initialize timer if quizData.time_limit exists
- quizEngine.js: add timerState { remaining, total, active } and methods startTimer, stopTimer, pauseTimer
- quizTimer.js: standalone module with setInterval, emits 'time-up' event
- State: publish timer updates to UI via state.subscribe

Backward Compatibility:
Additive only. quizEngine.startQuiz() gains optional `timeLimit` param (defaults undefined → no timer).

Testing Requirements:
- Unit: quizTimer.test.js (tick, pause, resume, time-up event)
- Integration: quizPlayer-timer.spec.js (render + auto-submit)
- Manual: npm run dev, take quiz with time_limit=30, verify auto-submit

Constraints:
- Max 6 file reads during implementation
- Accessible: timer announced via aria-live
- No console errors
- All existing tests must pass
```

---

**Key principle**: Provide sufficient detail that agent can implement without reading entire codebase. Be specific about integration points and avoid vague requirements.
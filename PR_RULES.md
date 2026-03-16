# Pull Request Rules for AI-Generated Changes

This document defines how AI-generated changes should be structured, described, and validated before submission. Following these rules ensures clean, reviewable, and deployable PRs.

## PR Requirements

Every PR (human- or AI-generated) must contain:

### 1. Description
- **Short title** (50 chars max): Clear summary of change
- **Detailed description** (200-500 chars): What changed, why, and how
- **Linked issues**: Reference GitHub issues or user reports
- **Breaking changes**: Explicitly call out any API/UI changes

### 2. Files Modified
List all changed files with brief explanation per file:
- `js/modules/quizEngine.js` - Fixed scoring bug (null handling)
- `tests/quizEngine.test.js` - Added regression test for null answers
- `docs/CODEMAP.md` - Updated to reflect new error handling pattern

### 3. Reason for Change
Explain the motivation:
- Bug fix: What was broken? Who reported it?
- Feature: What user need does this address?
- Optimization: What metric improved and by how much?
- Refactor: What problem does this solve (tech debt, maintainability)?

### 4. Validation Steps
Provide concrete verification steps:
- Automated: `npm test` passes (include test count)
- Manual: "Open dev server, navigate to quiz page, verify timer appears"
- Expected results: What should the user see/experience?
- Edge cases tested: List scenarios validated

### 5. Test Coverage
- [ ] All new code has unit tests
- [ ] Regression tests added for bugs
- [ ] Integration tests updated if APIs changed
- [ ] E2E tests modified if UI flow changed
- [ ] All tests pass locally (`npm test`)

---

## Diff Rules

### Keep Patches Small
- **Ideal PR**: 1-3 files changed, < 100 lines total
- **Maximum**: 500 lines (if larger, split into multiple PRs)
- **Rationale**: Small diffs are easier to review, test, and roll back

### No Unrelated Edits
- **DO NOT** include:
  - Formatting changes in unrelated files
  - "While I'm here" refactorings
  - Dependency version bumps unless required
  - Comment spelling corrections

- **DO** include:
  - Only changes directly related to the task
  - Updates to documentation that are necessary (CODEMAP, AGENTS.md)
  - Test files that validate the change

### Preserve Existing Code
- Don't delete comments unless they're obsolete or offensive
- Don't rename variables "for clarity" unless it's part of the task
- Don't reorder imports or add blank lines "for readability"
- Follow the existing style of the file you're editing

---

## Content Guidelines

### Commit Messages
Format: `type(scope): brief description`

Types:
- `fix`: bug fix
- `feat`: new feature
- `perf`: performance improvement
- `refactor`: code restructuring (no behavior change)
- `test`: test additions/modifications
- `docs`: documentation updates
- `chore`: build/CI changes

Examples:
```
fix(quizEngine): handle null answers in scoring
feat(quizPlayer): add countdown timer for timed quizzes
perf(render): batch DOM updates in renderQuestion()
```

### PR Title
Use same format as commit message, but can be slightly longer (70 chars max).

### PR Body
Structure:
```
## Summary
[2-3 sentence overview]

## Changes
- [File 1]: what changed and why
- [File 2]: ...

## Testing
- Unit tests: X added, Y modified
- Manual verification: [steps]
- All tests pass: yes/no

## Breaking Changes
- [List any, or "None"]
```

---

## Documentation Updates

### When to Update Docs
Update documentation if:
- **Architecture changes**: New modules, new patterns → update `docs/CODEMAP.md` and possibly `docs/REPO_SUMMARY.md`
- **New workflows**: New ways to use the app → update `docs/ARCHITECTURE.md` (if exists) or `public/components/docs-section.html`
- **Configuration changes**: New settings, environment variables → update relevant docs
- **Public API changes**: Modified function signatures → update `docs/API.md` (if exists)

### When NOT to Update Docs
- Internal refactoring with no user-facing impact
- Dependency version bumps (unless critical security fix)
- Temporary debug code (should be removed, not documented)

---

## Testing Standards

### Unit Tests
- Location: co-located (`module.test.js`) or in `tests/`
- Coverage: New code should be >80% covered
- Mocking: External dependencies (Gemini API, localStorage) mocked
- assertions: Test both success and failure cases

### Integration Tests
- Test module interactions (e.g., quizEngine → quizPlayer → state)
- Use real modules but mock external APIs
- Located in `tests/` with `.integration.spec.js` suffix

### E2E Tests
- Full user flows: "complete quiz and see results"
- Use Playwright in `tests/` directory
- Cover critical paths: quiz selection, answering, AI hints, settings

### Manual Verification
For UI changes, agent must:
1. Run `npm run dev`
2. Interact with changed feature
3. Verify no console errors
4. Test on mobile viewport (375px width)
5. Test in at least 2 browsers (Chrome, Firefox)

---

## Checklist Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint` if configured)
- [ ] No console warnings/errors in browser (UI changes)
- [ ] `git diff` shows ONLY intended changes
- [ ] CODEMAP.md updated if new modules created
- [ ] REPO_SUMMARY.md updated if architecture changed
- [ ] PR description filled with validation steps
- [ ] No merge conflicts with `main` branch
- [ ] Build succeeds (`npm run build`)
- [ ] For AI agents: token usage reported (files read, total tokens)

---

## Common Rejections (Avoid These)

1. **Too large**: "Split this into multiple PRs" - Keep changes focused
2. **Unrelated edits**: "Why did you change file X?" - Only edit what's needed
3. **Missing tests**: "Add test for new function" - Always include tests
4. **Broken build**: "Fix failing tests" - Don't submit broken code
5. **No validation**: "How did you test this?" - Provide steps
6. **Docs outdated**: "Update CODEMAP.md" - Keep maps current
7. **Speculative changes**: "Remove unused function Y" - Don't clean up unrelated code

---

## AI Agent Specific

When an AI agent creates a PR (or proposes changes), it must include in its report:

### Context Audit
```
Files read (with approximate tokens):
- docs/REPO_SUMMARY.md (200)
- docs/CODEMAP.md (300)
- js/modules/quizEngine.js (500)
Total: 1,000 tokens

Justification for >5 file reads:
- N/A (stayed within limit)
```

### Change Summary
```
Files changed: 3 (2 new, 1 modified)
Lines added: 45
Lines removed: 12
Test files: tests/quizTimer.spec.js (added)
Validation: npm test (passed), manual dev server (verified)
```

### Post-Merge Instructions
If PR requires post-merge actions (database migration, feature flag, etc.), list them clearly:
- [ ] Deploy to staging and verify
- [ ] Enable feature flag for 10% of users
- [ ] Monitor error rate in Sentry
- [ ] Update production after 24h if no issues

---

## Review Process

### Human Review
Reviewer checks:
- [ ] Changes match PR description
- [ ] No hidden modifications (check `git diff`)
- [ ] Tests are meaningful (not just `test('works')`)
- [ ] No security issues (XSS, injection)
- [ ] No performance regressions (if applicable)
- [ ] Documentation updated appropriately

### AI Self-Review
Before submitting, AI agents must:
- [ ] Run `git diff` and verify only intended changes
- [ ] Re-read PR description to ensure it matches work done
- [ ] Check `npm test` one more time
- [ ] Estimate token usage and report it
- [ ] Flag any concerns or follow-up work needed

---

**Remember**: PRs are permanent records. They should be clear, minimal, and complete. Future developers (human or AI) will read these to understand why changes were made. Write for your future self.
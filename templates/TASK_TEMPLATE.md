# Task Template for AI Agents

Use this structured format when requesting work from AI coding agents. This ensures clear, actionable tasks with minimal context overhead.

---

## TASK TYPE
Select one: `BUG_FIX` | `FEATURE` | `OPTIMIZATION` | `REFACTOR`

## CONTEXT
Brief background (1-2 sentences). Link to related issues, user reports, or architectural decisions.

## TARGET FILES
Specific files to modify. Use `CODEMAP.md` to identify relevant modules.
- Primary: `path/to/file.js`
- Secondary (dependencies): `path/to/dep.js` (if needed)

## EXPECTED BEHAVIOR
Describe the desired outcome precisely.
- What should change?
- What should remain the same?
- How to verify success?

## CONSTRAINTS
- Token limit: Max N file reads (default: 3-5)
- Backward compatibility: Must preserve existing API
- Performance: No regression (>100ms slowdown)
- Security: No XSS vulnerabilities; maintain DOMPurify sanitization
- Tests: All existing tests must pass; new tests required (yes/no)

## OUTPUT FORMAT
Specify expected deliverables:
- Code changes: list files and approximate diff size
- Documentation updates: `docs/CODEMAP.md`, `docs/REPO_SUMMARY.md`?
- Test additions: unit tests, integration tests?
- Validation steps: commands to run, manual checks

---

## Template Examples

### BUG_FIX Example
```
TASK TYPE: BUG_FIX

CONTEXT:
Quiz scoring fails when answer is null. User reports score shows NaN for unanswered questions.

TARGET FILES:
- js/modules/quizEngine.js (scoring logic)
- js/modules/quizPlayer.js (display)

EXPECTED BEHAVIOR:
Unanswered questions count as 0 points, not NaN. Score calculation handles null/undefined gracefully.

CONSTRAINTS:
- Max 3 file reads
- Keep diff under 20 lines
- Preserve existing scoring rules
- Add regression test

OUTPUT FORMAT:
- Fix in quizEngine.js (1-2 line change)
- Add test in quizEngine.test.js or tests/quiz-scoring.spec.js
- Run `npm test` to verify
```

### FEATURE Example
```
TASK TYPE: FEATURE

CONTEXT:
Add support for timed quizzes. Users want optional countdown timer per question.

TARGET FILES:
- js/modules/quizEngine.js (timer state)
- js/modules/quizPlayer.js (timer UI)
- js/modules/uiController.js (themes for timer)
- styles/components/_progress.css (timer styles)

EXPECTED BEHAVIOR:
When quiz data includes `time_limit: 30` (seconds), show countdown. Auto-submit when time expires. No timer if not specified.

CONSTRAINTS:
- Additive changes only (new functions, not modify existing signatures)
- Support multiple choice, true/false, and short answer types
- Accessible: timer announced to screen readers
- Tests: unit tests for timer logic, e2e test for auto-submit

OUTPUT FORMAT:
- New functions in existing modules (no new files preferred)
- CSS for timer component
- Update CODEMAP.md to note timer feature
- Demo: `npm run dev` and verify timer works on sample quiz
```

### OPTIMIZATION Example
```
TASK TYPE: OPTIMIZATION

CONTEXT:
Quiz load time is >2s on large quizzes (100+ questions). Profiling shows repeated DOM updates.

TARGET FILES:
- js/modules/quizPlayer.js (render loop)
- js/modules/uiController.js (DOM updates)

EXPECTED BEHAVIOR:
Reduce quiz load time by 40% through batch DOM updates or virtualization.

CONSTRAINTS:
- Measure baseline with devtools Performance tab
- Document before/after metrics
- No visual regressions
- Keep diff focused on optimization only

OUTPUT FORMAT:
- Optimized code in quizPlayer.js
- Comment explaining the performance gain
- Performance measurement report (screenshot or text)
```

### REFACTOR Example
```
TASK TYPE: REFACTOR

CONTEXT:
Quiz state management is scattered between quizEngine.js and state.js. Consolidate to reduce coupling.

TARGET FILES:
- js/modules/quizEngine.js
- js/modules/state.js
- js/modules/quizPlayer.js (callers)

EXPECTED BEHAVIOR:
Move all quiz-related state to quizEngine.js as single source of truth. state.js remains for global settings only.

CONSTRAINTS:
- Breaking changes allowed but must update all callers
- No functionality change; only internal structure
- Update CODEMAP.md to reflect new architecture
- All tests must pass

OUTPUT FORMAT:
- Refactored modules
- Updated call sites
- Migration notes if API changes
```

---

## Agent Instructions

When you receive a task in this format:

1. **Validate completeness** - If any section is missing, ask user to fill it
2. **Read bootstrap files** - `REPO_SUMMARY.md`, `CODEMAP.md`, `WORKFLOW.md`, `AGENTS.md`
3. **Estimate scope** - Check if task fits token budget; if not, split into subtasks
4. **Confirm before starting** - Echo understanding and ask for approval
5. **Execute workflow** - Follow appropriate workflow from `WORKFLOW.md`
6. **Report results** - Include:
   - Changes summary
   - Test results
   - Validation performed
   - Files modified (diff stats)
   - Any follow-up needed

**Do not proceed without this template properly filled.** Empty or vague tasks will be rejected.
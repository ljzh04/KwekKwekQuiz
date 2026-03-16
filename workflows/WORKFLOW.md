# Agent Workflow Protocol

## Purpose
Define efficient, token-minimal workflows for AI coding agents operating on the KwekKwekQuiz codebase. Agents must prioritize context efficiency and produce small, targeted changes.

## Core Principles

1. **Minimal context** - Read only necessary files; avoid full repository scans
2. **Small diffs** - Make focused, incremental changes
3. **Early stopping** - Stop exploration once sufficient context is gathered
4. **Validation-first** - Verify existing tests pass before making changes
5. **Safety-first** - Preserve backward compatibility; never break existing functionality

## Bug Fix Workflow

1. **Understand problem**
   - Read `REPO_SUMMARY.md` and `CODEMAP.md` first
   - Locate affected module using code map
   - Read only the specific files involved (max 3 files)
   - Identify root cause with minimal context

2. **Reproduce**
   - Run existing tests: `npm test`
   - Check if bug is covered by tests
   - If not, create minimal reproduction case

3. **Fix**
   - Make smallest possible change
   - Keep diff under 30 lines when possible
   - Avoid refactoring unrelated code
   - Preserve existing API contracts

4. **Validate**
   - Run tests: `npm test`
   - Manually verify in browser if UI change: `npm run dev`
   - Ensure no regressions

## Feature Workflow

1. **Assess scope**
   - Read `REPO_SUMMARY.md`, `CODEMAP.md`, `docs/ARCHITECTURE.md` (if exists)
   - Identify affected modules
   - Prefer additive changes over modifying stable modules

2. **Design minimal implementation**
   - Create new module if feature is isolated
   - Define clear interface boundaries
   - Keep changes localized to 1-2 directories

3. **Implement incrementally**
   - Start with skeleton/structure
   - Add functionality in small commits
   - Each change should be independently testable

4. **Integrate carefully**
   - Update `CODEMAP.md` if new modules added
   - Update `AGENTS.md` if new patterns introduced
   - Follow existing naming conventions

5. **Test**
   - Add unit tests for new code
   - Run full test suite
   - Manual validation for UI features

## Optimization Workflow

1. **Measure first**
   - Identify specific performance problem (e.g., slow quiz load)
   - Use browser devtools or profiling data
   - Quantify baseline (e.g., "quiz loads in 2.3s")

2. **Target optimization**
   - Optimize only when clear inefficiency exists
   - Look for: repeated computations, unnecessary re-renders, large loops
   - Avoid speculative optimization

3. **Implement minimal change**
   - Change only the identified bottleneck
   - Keep modifications focused (max 1-2 functions)

4. **Verify improvement**
   - Measure after change (e.g., "load time reduced to 1.1s")
   - Ensure no functionality regression
   - Document gain in code comment or PR

## Debugging Workflow

1. **Locate failing logic**
   - Read error message and stack trace
   - Identify file and function
   - Read only that file and its direct dependencies

2. **Trace execution**
   - Add temporary console.log or breakpoints
   - Follow data flow from entry point
   - Check state mutations in `state.js`

3. **Identify root cause**
   - Compare expected vs actual behavior
   - Check edge cases (null, undefined, empty data)
   - Verify data format (quiz JSON structure)

4. **Apply minimal fix**
   - Fix the specific bug without side changes
   - If underlying pattern is broken, consider small refactor
   - Document cause in commit message

## Editing Rules

- **Read minimal files** - Max 3 files per task unless absolutely necessary
- **Small patches** - Keep diffs under 50 lines; prefer under 30
- **No formatting-only changes** - Don't reformat code unrelated to the task
- **No speculative improvements** - Only implement what's required
- **Preserve comments** - Don't delete existing comments
- **Use existing patterns** - Follow established code style in the module

## Token Efficiency Rules

- **Stop early** - Once you have enough context to proceed, stop reading
- **Partial reads** - For large files, read only relevant sections (use search)
- **Avoid dependency trees** - Don't recursively read all imports
- **Summarize mentally** - Keep context in working memory, don't re-read
- **Use CODEMAP.md** - Trust the code map; don't verify every file location

## Failure Handling

- **Test failures** - Fix immediately; don't proceed with broken code
- **Unexpected behavior** - Stop and re-assess; don't guess
- **Missing context** - Ask user for clarification, don't over-explore
- **Ambiguous requirements** - Use `TASK_TEMPLATE.md` structure to clarify

## Post-Task Checklist

- [ ] All tests pass (`npm test`)
- [ ] No unused files added
- [ ] `CODEMAP.md` updated if new modules created
- [ ] `REPO_SUMMARY.md` updated if major architecture change
- [ ] Changes validated manually (for UI changes)
- [ ] Git diff shows only intended changes (review before push)
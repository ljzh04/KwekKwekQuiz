# Agent Rules for KwekKwekQuiz

This file instructs AI coding agents on how to work efficiently in this repository. Follow these guidelines to minimize token usage and avoid unnecessary work.

## Repository Architecture

KwekKwekQuiz is a vanilla JavaScript quiz application with Gemini AI integration:
- **Entry**: `index.html` → `js/main.js` bootstraps the app
- **Core modules**: ESM modules in `js/modules/` (quizEngine, quizPlayer, geminiService, state, storageManager, navigationController, uiController)
- **UI components**: HTML partials in `public/components/` loaded dynamically
- **Styling**: Tailwind CSS with custom design system
- **Build**: Vite dev server + production build to `dist/`

## Code Exploration Strategy

### BEFORE reading any code:
1. **Read bootstrap files first** (in order):
   - `docs/REPO_SUMMARY.md` (under 300 words)
   - `docs/CODEMAP.md` (module relationship map)
   - `workflows/WORKFLOW.md` (this repo's protocols)
   - `agents/AGENTS.md` (this file)

2. **Only after bootstrap**, read specific module files needed for the task
3. **Maximum files per task**: 3-5 files (exceeding requires justification)
4. **Stop reading** once you have enough context to proceed

### File selection rules:
- Use `CODEMAP.md` to locate relevant modules
- Read only the module directly related to the task + 1-2 dependencies
- For bugs: read the failing file + its immediate callers/callees
- For features: read related modules only; don't read entire codebase

## Editing Rules

### Safe editing practices:
- **Small diffs only**: Max 50 lines changed per task; prefer under 30
- **No formatting-only changes**: Don't reformat code unless fixing a bug
- **No speculative refactoring**: Only modify what's necessary
- **Preserve existing comments**: Don't delete or alter documentation comments
- **Follow established patterns**: Match the style of the module you're editing
- **Backward compatibility**: Don't change public APIs without deprecation

### Validation before committing:
- Run tests: `npm test`
- For UI changes: `npm run dev` and manually verify
- Check that no unrelated files were modified (`git diff`)

## Testing

### Test framework: Vitest + Playwright
- Unit tests: `npm test` or `npm run test:watch`
- E2E tests: Playwright in `tests/` directory
- Coverage: `npm run test:coverage`

### Writing tests:
- New features require unit tests
- Bug fixes should include regression test
- Place tests near code or in `tests/` directory
- Mock external dependencies (Gemini API) using fixtures

### Running tests efficiently:
- Use `test:watch` during development
- Run only affected tests if possible: `vitest run path/to/test.js`
- Don't commit without passing all tests

## Safety Checks

### Before making changes:
- [ ] Read `docs/REPO_SUMMARY.md` and `docs/CODEMAP.md`
- [ ] Identify all affected modules
- [ ] Confirm no breaking changes to existing APIs
- [ ] Check if change can be additive (new module) vs. modifying stable code

### After making changes:
- [ ] Run full test suite (`npm test`)
- [ ] Verify no console errors in browser (for UI changes)
- [ ] Check `git diff` to ensure only intended changes included
- [ ] Update `docs/CODEMAP.md` if new modules added
- [ ] Update `docs/REPO_SUMMARY.md` if architecture changed

## Token Optimization

- **Read functions, not files**: Use `search_files` to find specific functions
- **Stop exploration early**: Once you have context for 1-2 files, stop
- **Avoid loading dependency trees**: Don't recursively read all imports
- **Use `CODEMAP.md` as trusted reference**: Don't verify every file location manually
- **Mental summarization**: Keep context in working memory; avoid re-reading

## Example Scenarios

### Bug fix in quiz scoring:
1. Read `REPO_SUMMARY.md`, `CODEMAP.md`
2. Find `quizEngine.js` from code map
3. Read `quizEngine.js` + `state.js` (if state involved)
4. Identify bug, make minimal fix (< 10 lines)
5. Run `npm test`, verify with `npm run dev`

### Adding new quiz format support:
1. Read architecture docs
2. Identify where quiz data is parsed (`quizEngine.js` likely)
3. Read that file + `storageManager.js` if data loading
4. Implement new parser in new module if possible
5. Add integration, write tests, update `CODEMAP.md`

## Constraints

- **No full repo scans**: Never execute `ls -R` or `find` to list all files
- **No tree traversal**: Don't read entire directories; only target specific files
- **No speculative changes**: Don't "clean up" code unless task requires it
- **Respect existing architecture**: Don't introduce new patterns without need

## When in Doubt

- Stop and re-read `WORKFLOW.md` for guidance
- Ask user for clarification instead of over-exploring
- Prefer conservative (smaller) changes
- Document assumptions in code comments or PR description

---

**Remember**: Your token budget is limited. Every file read counts. Use the provided maps and templates to work efficiently.
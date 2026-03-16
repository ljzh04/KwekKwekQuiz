# Debug Template for AI Agents

Use this structured format when reporting or requesting help with debugging issues. Provides clear, reproducible information to minimize exploration time.

---

## Problem Description

**One-sentence summary**: 

**Full description**:

**Impact**: (Who is affected? How severe?)

---

## Error Output

**Console/terminal error** (copy exactly):
```
[error text here]
```

**Stack trace** (if available):
```
[stack trace here]
```

**Browser/Environment**:
- Browser: (Chrome, Firefox, Safari, mobile?)
- OS: 
- App version: (if known)
- Network state: (online/offline)

---

## Reproduction Steps

1. [First step]
2. [Second step]
3. [Third step]
4. [Expected vs actual result]

**Can this be reproduced consistently?** (yes/no/sometimes)

**Does it occur on:**
- [ ] Development build (`npm run dev`)
- [ ] Production build (`npm run build && npm run preview`)
- [ ] Both

---

## Relevant Files

Based on error message, these files are likely involved:
- `js/modules/[module].js` (reason: )
- `public/components/[component].html` (reason: )
- `styles/components/[style].css` (reason: )

**Data involved** (if applicable):
- Quiz file: `data/[filename].json`
- Settings in `localStorage`: [keys]
- User actions leading to bug: [describe]

---

## Expected Behavior

**What should happen**:
- [Describe correct behavior]

**What actually happens**:
- [Describe incorrect behavior]

**Edge cases to consider**:
- Null/undefined inputs
- Empty quiz data
- Network failures (Gemini API)
- Invalid YAML/JSON format

---

## Constraints

- **Max file reads**: 3-5 files
- **No speculative changes**: Fix the bug only; no refactoring unless necessary
- **Preserve UX**: Don't change user-facing behavior except to fix bug
- **Security**: Maintain DOMPurify sanitization; no XSS risks
- **Tests**: Add regression test; all existing tests must pass

---

## Debugging Workflow (For Agent)

When you receive this template, follow this optimized debugging protocol:

### 1. Locate failing logic (token-minimal)
- Read `docs/REPO_SUMMARY.md` and `docs/CODEMAP.md` first (< 1 min)
- Identify file from stack trace; read only that file
- If needed, read 1-2 direct dependencies (callers/callees)
- **Stop**: Don't read entire module chain

### 2. Trace execution
- Search for error message in code: `search_files("error text")`
- Identify exact line causing error
- Add temporary `console.log` or use debugger if running dev server
- Check state flow: is `state.js` involved?

### 3. Identify root cause
- Compare expected vs actual data at failure point
- Check for:
  - Null/undefined values
  - Incorrect data format (quiz JSON/YAML structure)
  - Missing event handlers
  - Sanitization issues (DOMPurify removing content)
  - Gemini API failures (network, quota, malformed prompt)
  - Async/await mistakes (unhandled promises)

### 4. Apply minimal fix
- Fix ONLY the specific bug
- Keep diff < 20 lines if possible
- Avoid changing adjacent code
- If underlying pattern is broken, consider small refactor but document reason

### 5. Validate
- **Immediate**: Does error disappear?
- **Regression**: Run `npm test`; add test that would have caught bug
- **Manual**: `npm run dev` and reproduce steps; verify fix
- **Side effects**: Check related functionality still works

---

## Output Format

When submitting fix, include:

1. **Root cause**: (1-2 sentences)
2. **Files changed**: 
   - `path/to/file.js` - (lines X-Y, size ~N lines)
3. **Test added**: 
   - `tests/[name].spec.js` or `js/modules/[module].test.js`
4. **Validation**:
   - `npm test` result: (pass/fail)
   - Manual reproduction: (works/doesn't work)
5. **Follow-up**: (any remaining concerns, further investigation needed?)

---

## Example Debug Report

```
Problem Description:
Quiz crashes when loading malformed JSON. Error: "Unexpected token" in console.

Error Output:
SyntaxError: Unexpected token } in JSON at position 123
    at parseQuizData (js/modules/quizEngine.js:45:15)
    at loadQuiz (js/modules/quizEngine.js:78:22)

Reproduction Steps:
1. Open index.html
2. Click "Quiz 3" (uses data/broken_quiz.json)
3. Console shows SyntaxError; quiz doesn't load

Expected Behavior:
Gracefully handle malformed JSON with error toast, not crash.

Relevant Files:
- js/modules/quizEngine.js (parseQuizData function)
- js/modules/storageManager.js (quiz loading)

Constraints:
- Max 3 file reads
- Add error handling; don't crash
- Show user-friendly error message
- Add test for malformed JSON

Output:
- Add try-catch in quizEngine.js parse function
- Call toastNotification.error() on failure
- Add unit test: quizEngine.test.js "should handle malformed JSON"
- npm test passes; manual test shows error toast instead of crash
```

---

**Key principle**: Provide enough information that an agent can start debugging without reading the entire codebase. Be precise, copy errors exactly, and list files you suspect.
# Token Usage Policy for AI Agents

This document defines strict token usage guidelines for AI coding agents operating in the KwekKwekQuiz repository. The goal is to maximize context efficiency and minimize unnecessary file reads.

## Maximum Context Limits

### Per Task
- **File reads**: Maximum 5 files per task (excluding bootstrap files)
- **Justification required** for exceeding 5 files
- **Token budget**: Aim to stay under 15K tokens of context per task

### File Read Rules
- **Bootstrap files** (no limit, mandatory):
  - `docs/REPO_SUMMARY.md`
  - `docs/CODEMAP.md`
  - `workflows/WORKFLOW.md`
  - `agents/AGENTS.md`
  - `agents/TOKEN_POLICY.md` (this file)

- **Target files**: Max 5 additional files
  - Read only files directly relevant to the task
  - Use `docs/CODEMAP.md` to identify which files to read
  - **Do NOT** read entire directories or all dependencies

### Large File Strategy
For files exceeding 300 lines:
- Use `search_files` to locate specific functions/patterns
- Read only the relevant section (show lines around match)
- If you need multiple sections, justify why full read is necessary
- Consider copying relevant snippet to working memory, then stop reading

## Partial File Reading

### Using search_files
Instead of reading a whole file, use regex search to find specific code:
```
search_files(path="js/modules", regex="function calculateScore")
```
This shows context around matches without loading entire file.

### Using replace_in_file
When editing, use SEARCH/REPLACE blocks that target specific lines:
- Include just enough surrounding lines to uniquely match
- Don't read the entire file first (you can infer content from context)
- After edit, system provides final file content; use that as reference for next edit

## Avoiding Dependency Trees

### DO NOT
- Recursively read all imported modules
- Execute `ls` or `find` on directories to inventory files
- Read configuration files unless you need a specific value
- Load entire test suite when only one test is relevant

### DO
- Trust `docs/CODEMAP.md` for module relationships
- Read only immediate dependencies (1 level deep)
- If you need a constant from `styles/base/_variables.css`, search for it instead of reading all CSS files
- Use `state.js` as single source of truth for global state; don't read all state consumers

## Mental Summarization

### Keep context in working memory
After reading a file, summarize its purpose and key functions mentally:
- "quizEngine.js: exports startQuiz(), submitAnswer(), getScore()"
- "state.js: reactive store with subscribe/publish pattern"
- Reuse this mental model; don't re-read files

### Stack discipline
- Bootstrap files → general understanding
- Target files → specific task context
- Dependencies → only if calling into them
- At any point, context should fit in ~10K tokens of working memory

## Token-Saving Techniques

1. **Read functions, not files**: Use `search_files` to find `functionName` and read just that function's context
2. **Stop early**: Once you have enough to implement, stop reading more files
3. **Use CODEMAP.md**: It's your map; trust it and navigate directly
4. **Batch operations**: If you need to modify multiple files, plan all changes first, then execute sequentially without re-reading
5. **Avoid re-reading**: After editing, use the returned file content as reference; don't read again

## When More Files Are Justified

You may exceed 5 files if:
- **Complex feature** spans >3 modules (document why each is needed)
- **Bug fix** requires understanding call stack (include caller + callee + test)
- **Refactoring** affects multiple layers (explain ripple effect)
- **Security issue** requires audit of all input points

**Always** provide justification in your response when exceeding limits.

## Enforcement

### Self-monitoring
Before each file read, ask:
- "Do I really need this file, or can I use CODEMAP.md?"
- "Am I reading this because it's imported, or because I actually need its code?"
- "Can I defer this read until after I've tried implementing?"

### Failure modes
- **Excessive reads** → Agent gets cut off (token limit exceeded) → task fails
- **Speculative exploration** → Wasted tokens → inefficient → reject tasks
- **Full repo scans** → Violation of core principle → immediate correction required

## Examples

### Good (token-efficient)
```
1. Read REPO_SUMMARY.md (200 tokens)
2. Read CODEMAP.md (300 tokens)
3. Search for "score" in quizEngine.js (find relevant function)
4. Read quizEngine.js around that function only (500 tokens)
5. Read state.js if state changes involved (400 tokens)
Total: ~1.4K tokens for entire task
```

### Bad (token-wasteful)
```
1. Read REPO_SUMMARY.md
2. Read CODEMAP.md
3. Read main.js (entire 500-line file)
4. Read quizEngine.js (entire file)
5. Read quizPlayer.js (entire file)
6. Read state.js (entire file)
7. Read storageManager.js (entire file)
8. Read uiController.js (entire file)
... continues reading everything
Total: ~10K+ tokens before even starting work
```

## Audit Trail

Agents should report in their final output:
- **Files read**: List with approximate token count per file
- **Total context used**: Sum of tokens
- **Justification for any limit exceedance**: Why each extra file was necessary

This allows users to evaluate agent efficiency and provide feedback.

---

**Remember**: Token efficiency is not optional; it's a hard constraint for this repository. The provided maps and templates exist specifically to reduce context load. Use them wisely.
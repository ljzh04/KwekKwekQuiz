# Agent Bootstrap Guide

**Ultra-efficient startup**: This file tells AI agents exactly which files to read first to minimize context usage (~80-90% reduction).

## Mandatory Reading Order

Agents **MUST** read these files in order before exploring any other code:

1. **`docs/REPO_SUMMARY.md`** (< 300 words)
   - Quick project overview
   - Core modules and their responsibilities
   - Entry points and key dependencies
   - Architectural constraints

2. **`docs/CODEMAP.md`** (~400 lines)
   - Module relationship map
   - Dependency flow diagram
   - Data flow explanation
   - File locations by category

3. **`workflows/WORKFLOW.md`**
   - Repository-specific protocols
   - Workflows for bugs, features, optimization, debugging
   - Editing rules and token efficiency guidelines
   - Failure handling

4. **`agents/AGENTS.md`**
   - Agent-specific rules and constraints
   - Exploration strategy (max files, stopping criteria)
   - Testing and safety checklists
   - Example scenarios

5. **`agents/TOKEN_POLICY.md`**
   - Strict token limits (max 5 files per task)
   - Partial file reading strategies
   - Avoiding dependency tree traversal
   - Context budget enforcement

6. **`templates/TASK_TEMPLATE.md`** (if task is provided)
   - Structured task format
   - Examples for each task type
   - Output expectations

7. **`templates/DEBUG_TEMPLATE.md`** (if debugging)
   - Debug report format
   - Optimization workflow
   - Validation requirements

8. **`templates/FEATURE_TEMPLATE.md`** (if implementing feature)
   - Feature specification format
   - Integration points guide
   - Testing requirements

9. **`PR_RULES.md`** (before proposing changes)
   - PR structure and content rules
   - Diff guidelines
   - Checklist before submission

## After Reading Bootstrap

Once you've read the mandatory files:

1. **Assess task scope** using the maps you've loaded
2. **Identify target files** (max 5 additional) using `CODEMAP.md`
3. **Execute task** following appropriate workflow from `WORKFLOW.md`
4. **Validate** using checklists in `AGENTS.md` and `PR_RULES.md`

## What NOT to Do (Before Bootstrap)

**DO NOT** read any of these before completing bootstrap:
- ❌ `js/modules/*.js` (any module file)
- ❌ `public/components/*.html` (any component)
- ❌ `styles/*` (any stylesheet)
- ❌ `package.json` (unless you need a specific script)
- ❌ `vite.config.js` or other config files
- ❌ `tests/*` (unless debugging test failures)
- ❌ Entire directory listings (`ls`, `find`)
- ❌ Any file not in the mandatory list above

**Violation**: Reading files before bootstrap wastes tokens and violates repository policy.

## Token Savings Estimate

**Without bootstrap** (bad):
- Read 10+ files to understand codebase: ~20K tokens
- High chance of reading irrelevant files
- Inefficient exploration

**With bootstrap** (good):
- Read 5 boot files (~3K tokens)
- Then read 3 target files (~1.5K tokens)
- Total: ~4.5K tokens (75% reduction)

## Bootstrap Checklist

Before starting any task, confirm:

- [ ] Read `REPO_SUMMARY.md`
- [ ] Read `CODEMAP.md`
- [ ] Read `WORKFLOW.md`
- [ ] Read `AGENTS.md`
- [ ] Read `TOKEN_POLICY.md`
- [ ] If task provided: read appropriate template
- [ ] Reviewed PR_RULES.md (if proposing changes)

**All items must be checked before reading any other files.**

---

**Key principle**: The bootstrap files exist to prevent wasteful exploration. Trust the maps, follow the workflows, and keep your token usage minimal. Your efficiency is measured and matters.
# Agent Integration INIT Prompt Pack

## Overview

This sequence generates the core files needed for an **efficient AI-agent workflow** in a codebase:

Core outputs:

```
WORKFLOW.md
AGENTS.md
CODEMAP.md
TASK_TEMPLATE.md
DEBUG_TEMPLATE.md
FEATURE_TEMPLATE.md
OPTIMIZATION_TEMPLATE.md
PR_RULES.md
TOKEN_POLICY.md
```

Optional but recommended:

```
REPO_SUMMARY.md
ARCHITECTURE.md
TEST_STRATEGY.md
```

---

# Prompt 1 — Repository Summary

**Goal:** produce a **short structural overview** agents can read instead of scanning the repo.

Prompt:

```
You are preparing a repository for AI coding agents that must operate with strict token limits.

Analyze the repository and produce a file named:

REPO_SUMMARY.md

Requirements:

1. Describe the project in under 300 words.
2. List the primary modules or directories and what they do.
3. Identify:
   - entry points
   - core services
   - shared utilities
   - configuration
4. Avoid listing every file.
5. Focus only on architecture and purpose.

Output format:

# Project Overview
(short summary)

# Core Modules
(directory → responsibility)

# Entry Points
(main files)

# Key Dependencies
(major libraries only)

# Important Constraints
(any architectural rules)

The result must be concise and optimized for AI agents with small context windows.
```

---

# Prompt 2 — Code Map

**Goal:** create a **token-efficient dependency map**.

Prompt:

```
Generate CODEMAP.md for this repository.

Purpose:
Provide a minimal map so AI coding agents can quickly locate relevant code without scanning the entire project.

Rules:

1. Only include important directories and files.
2. Show relationships between modules.
3. Limit explanations to one sentence per module.

Format:

# Code Map

## Entry Points
file → description

## Core Modules
module → purpose

## Utilities
module → purpose

## Tests
test directory → coverage scope

## Dependency Flow
show high-level module interaction

Example:

API → Services → Database

Keep the file under 400 lines.
```

---

# Prompt 3 — Agent Workflow

Generate the **core execution protocol**.

Prompt:

```
Create WORKFLOW.md defining how AI coding agents should operate in this repository.

Constraints:

The agents will run on limited or free models with strict token limits.

Define workflows for:

- bug fixes
- feature implementation
- code optimization
- debugging

Include rules for:

- minimal file reading
- small diffs
- avoiding full repo scans
- stopping when enough context is known

Sections required:

Purpose
Core Principles
Bug Fix Workflow
Feature Workflow
Optimization Workflow
Debugging Workflow
Editing Rules
Token Efficiency Rules
Failure Handling

The workflow must prioritize minimal context usage.
```

---

# Prompt 4 — AGENTS.md

This file is specifically used by tools like **Cursor / code agents**.

Prompt:

```
Create AGENTS.md.

This file instructs AI coding agents how to work inside this repository.

Requirements:

1. Summarize repository architecture.
2. Define rules for exploring code.
3. Define safe editing practices.
4. Explain how to run tests.
5. Explain how to validate changes.

Important constraints:

Agents must:
- minimize token usage
- avoid reading the entire repository
- prefer targeted file access
- produce small diffs

Structure:

# Agent Rules
# Code Exploration Strategy
# Editing Rules
# Testing
# Safety Checks
```

---

# Prompt 5 — Task Template

Agents perform best with structured prompts.

Prompt:

```
Create TASK_TEMPLATE.md.

Purpose:
Provide a standard prompt format for AI agents performing tasks.

The template must include structured fields:

TASK TYPE
CONTEXT
TARGET FILES
EXPECTED BEHAVIOR
CONSTRAINTS
OUTPUT FORMAT

Support these task types:

- BUG_FIX
- FEATURE
- OPTIMIZATION
- REFACTOR

Each section should contain clear instructions for minimizing token usage.
```

---

# Prompt 6 — Bug Debug Template

Prompt:

```
Create DEBUG_TEMPLATE.md.

This file provides a structured debugging request format for AI agents.

Include fields:

Problem description
Error output
Reproduction steps
Relevant files
Expected behavior
Constraints

Also include a short debugging workflow:

1. locate failing logic
2. trace execution
3. identify root cause
4. apply minimal fix
```

---

# Prompt 7 — Feature Implementation Template

Prompt:

```
Create FEATURE_TEMPLATE.md.

Purpose:
Guide AI agents when implementing new features.

Sections:

Feature description
Affected modules
New components
Integration points
Backward compatibility
Testing requirements

Rules:

- prefer additive changes
- avoid modifying stable modules
- create small isolated components
```

---

# Prompt 8 — Optimization Template

Prompt:

```
Create OPTIMIZATION_TEMPLATE.md.

Purpose:
Define how agents perform safe performance improvements.

Sections:

Performance problem
Current implementation
Proposed improvement
Expected gain
Risk assessment

Rules:

Only optimize when:
- clear inefficiency exists
- repeated computation exists
- measurable improvement expected

Avoid speculative optimization.
```

---

# Prompt 9 — Token Usage Policy

Prompt:

```
Create TOKEN_POLICY.md.

This document defines strict token usage guidelines for AI agents.

Include:

Maximum file reads per task
Maximum context size
Rules for partial file reading
Rules for summarizing large files

Also include strategies:

- read functions instead of files
- stop exploration early
- avoid loading dependency trees
```

---

# Prompt 10 — Pull Request Rules

Prompt:

```
Create PR_RULES.md.

Purpose:
Define how AI-generated changes should be structured.

Requirements:

PR must contain:

- short description
- reason for change
- files modified
- validation steps

Diff rules:

- prefer small patches
- avoid formatting-only changes
- avoid unrelated edits
```

---

# Recommended File Layout After Setup

Your repo ends up with:

```
/agents
    AGENTS.md
    TOKEN_POLICY.md

/docs
    REPO_SUMMARY.md
    CODEMAP.md
    ARCHITECTURE.md

/workflows
    WORKFLOW.md

/templates
    TASK_TEMPLATE.md
    DEBUG_TEMPLATE.md
    FEATURE_TEMPLATE.md
    OPTIMIZATION_TEMPLATE.md

PR_RULES.md
```

---

# Ultra-Efficient Trick (Highly Recommended)

Add a **single bootstrap prompt** agents always read first:

```
BOOTSTRAP.md
```

Prompt to generate it:

```
Create BOOTSTRAP.md.

This file tells AI agents exactly which files to read first.

Order:

1. REPO_SUMMARY.md
2. CODEMAP.md
3. WORKFLOW.md
4. AGENTS.md

Agents must not explore the repository before reading these files.
```

This **reduces agent context usage by ~80–90%**.

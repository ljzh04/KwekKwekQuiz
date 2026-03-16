# Optimization Template for AI Agents

Use this structured format when requesting performance improvements. Ensures data-driven, measurable optimizations with minimal risk.

---

## Performance Problem

**Specific issue**: (e.g., "Quiz load time exceeds 2 seconds for 100+ question quizzes")

**Metric baseline** (measured with devtools, Lighthouse, or profiling):
- Load time: X ms
- First contentful paint: Y ms
- Time to interactive: Z ms
- Memory usage: N MB
- CPU usage: M% during [specific operation]

**Affected user segment**: (all users, large quiz takers, mobile users, etc.)

**Frequency**: (every load, once per session, during specific operation)

---

## Current Implementation

**Code location** (specific function/module):
- `js/modules/[module].js` → `functionName()` (lines X-Y)
- `styles/components/[style].css` (if rendering bottleneck)

**Current approach**:
```javascript
// Current code pattern (simplified)
function currentImplementation() {
  // Describe what it does
  // Identify inefficiency: O(n²), repeated DOM updates, synchronous blocking, etc.
}
```

**Why it's slow** (root cause analysis):
- [e.g., "Loops through all questions to find current one (O(n))" ]
- [e.g., "Calls render() on every state change without batching" ]
- [e.g., "Synchronous fetch blocks UI thread" ]
- [e.g., "Unnecessary re-renders of entire quiz player" ]

**Profiling evidence** (if available):
- Chrome DevTools Performance tab: [describe flame chart findings]
- Lighthouse audit: [specific opportunity]
- Console timing: `console.time('quizLoad')` showed X ms

---

## Proposed Improvement

**Optimization strategy** (choose one or describe):
- [ ] Reduce algorithmic complexity (e.g., O(n²) → O(n) with hash map)
- [ ] Batch DOM updates (use DocumentFragment, requestAnimationFrame)
- [ ] Debounce/throttle event handlers
- [ ] Cache computed values/memoization
- [ ] Lazy load modules or data
- [ ] Virtualization for long lists (only render visible items)
- [ ] Web Worker for heavy computation
- [ ] IndexedDB instead of localStorage for large datasets
- [ ] Image compression/code splitting
- [ ] Other: [describe]

**Implementation plan** (code-level):
```javascript
// Proposed change (pseudocode)
function optimizedImplementation() {
  // What changes?
  // How does it improve?
}
```

**Expected gain** (quantitative):
- Load time reduction: X% or Y ms
- Memory reduction: Z MB
- CPU reduction: N%
- Frame rate improvement: from X fps to Y fps

**Risk assessment**:
- [ ] Low - well-tested pattern, isolated change
- [ ] Medium - introduces new logic but manageable
- [ ] High - complex change, many edge cases

**If high risk**, include:
- Rollback plan (revert commit)
- Feature flag (toggle on/off via `state.js`)
- Gradual rollout (only for users with large quizzes)

---

## Constraints

- **Token budget**: Max 3-5 file reads
- **Measure before and after**: Must include baseline and post-optimization metrics
- **No speculative optimization**: Only optimize confirmed bottleneck
- **No functionality change**: Behavior must remain identical (except performance)
- **No regressions**: All existing tests must pass; add performance test if possible
- **Maintainability**: Code should remain readable; don't obfuscate for micro-optimizations
- **Security**: No impact on sanitization or authentication

---

## Optimization Workflow (For Agent)

When you receive this template, follow this efficient optimization protocol:

### 1. Verify bottleneck (5 min)
- Read `docs/REPO_SUMMARY.md`, `docs/CODEMAP.md` to locate code
- Measure baseline independently (don't trust reported metric blindly)
- Use Chrome DevTools Performance tab to record operation
- Identify exact function/module causing slowdown (flame chart)
- **Stop**: Don't optimize code that isn't the bottleneck

### 2. Analyze current code (10 min)
- Read the identified file(s) (max 3 files)
- Understand the algorithm/data structure
- Search for known antipatterns:
  - Nested loops over same dataset
  - DOM manipulation inside loops
  - Synchronous JSON.parse on large payloads
  - Unnecessary array copies
  - Missing debouncing on scroll/resize
- Document specific inefficiency (line numbers)

### 3. Design minimal fix (5 min)
- Choose optimization technique that addresses root cause
- Prefer simple changes over complex rewrites
- Consider trade-offs: memory vs speed, readability vs performance
- If uncertain, implement two approaches quickly and benchmark

### 4. Implement and measure (15 min)
- Make change in isolate (small diff < 30 lines)
- Run dev server; repeat performance measurement
- Compare before/after metrics (same conditions)
- If improvement < 10%, reconsider approach
- If regression, revert immediately

### 5. Validate thoroughly
- Run tests: `npm test` (all must pass)
- Manual testing: Verify no visual/functional changes
- Edge cases: Test with empty data, large data, slow network
- Cross-browser: Chrome/Firefox/Safari if possible

### 6. Document
- Add code comment explaining optimization (why, not just what)
- Update `docs/CODEMAP.md` if new module created (unlikely for optimization)
- Record metrics in commit message: "Optimized X: from Y ms to Z ms (N% improvement)"

---

## Output Format

When reporting optimization results, include:

1. **Bottleneck identified**: 
   - File: `js/modules/[module].js`
   - Function: `functionName()` (lines X-Y)
   - Issue: [O(n²), DOM thrashing, etc.]

2. **Baseline metrics**:
   - Load time: X ms
   - [Other metric]: Y

3. **Optimization applied**:
   - Change: [1-2 sentence description]
   - Lines changed: N (diff size)

4. **After metrics**:
   - Load time: Z ms (improvement: N% or X ms faster)
   - [Other metric]: W

5. **Validation**:
   - `npm test`: pass/fail
   - Manual testing: [description]
   - No visual regressions: yes/no

6. **Risk assessment**: (low/medium/high) and mitigation if applicable

7. **Follow-up**: (any further optimizations suggested? other bottlenecks seen?)

---

## Example Optimization Request

```
Performance Problem:
Quiz load time is 2400ms for 150-question quizzes (measured via console.time('load') in main.js).

Current Implementation:
- quizPlayer.js: renderQuestion() rebuilds entire question DOM on every navigation (lines 120-156)
- uiController.js: updateProgress() re-renders progress bar on each answer (lines 89-102)
- Inefficient: quizPlayer calls renderQuestion() + updateUI() → full re-render each time

Profiling evidence:
- Performance tab: 65% of load time in quizPlayer.renderQuestion()
- Flame chart: repeated DOM insertion/removal

Proposed Improvement:
- Batch DOM updates: use DocumentFragment to build question once
- Only update changed answer feedback, not entire question
- Memoize quiz data parsing in quizEngine.js (already parsed JSON reused)
- Expected gain: 40-50% load time reduction (~1000ms)

Constraints:
- Must preserve existing behavior (feedback, animations)
- Add unit test for renderQuestion to verify batching
- No visual regressions (pixel-perfect)
- Use existing patterns (DocumentFragment used elsewhere?)

Output:
- Modify quizPlayer.js renderQuestion() to batch
- Modify uiController.js updateProgress() to only update changed parts
- Add performance test in tests/quizPlayer.perf.spec.js
- Report: before 2400ms → after 1300ms (46% faster)
```

---

**Key principle**: Optimize only when you have measured evidence. Don't guess. Document metrics pre- and post-change to justify the work.
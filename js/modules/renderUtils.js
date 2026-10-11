/**
 * @fileoverview Render utilities module for KwekKwekQuiz
 * Provides functions for rendering markdown with LaTeX support and code highlighting.
 * @module renderUtils
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import DOMPurify from "dompurify";

/**
 * Renders markdown text with LaTeX support and syntax highlighting.
 * @function renderMarkdownWithLaTeX
 * @param {string} markdownText - The markdown text to render
 * @returns {string} The rendered HTML string
 * @todo Add support for more LaTeX environments
 * @toimprove Optimize for large documents
 * @tofix Ensure proper sanitization of all outputs
 */
export function renderMarkdownWithLaTeX(markdownText) {
    // Extract math spans BEFORE marked.parse. marked HTML-escapes `<`, `>`, `&`,
    // which would corrupt expressions like $\operatorname{Cov}(X,Y)>0$ and make
    // KaTeX fail. Segments are held aside and re-inserted after markdown runs.
    const mathSegments = [];
    const source = String(markdownText ?? '').replace(
        /\$\$((?:[^$\\]|\\.)+?)\$\$|\$((?:[^$\\]|\\.)+?)\$/g,
        (match, displayMath, inlineMath) => {
            const index = mathSegments.length;
            mathSegments.push({
                math: displayMath !== undefined ? displayMath.trim() : inlineMath,
                displayMode: displayMath !== undefined,
            });
            // NUL-delimited placeholder survives markdown untouched.
            return `\u0000MATH${index}\u0000`;
        }
    );

    let html = marked.parse(source);

    html = html.replace(
        /<pre><code class="(.*?)">([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, code) => {
            const baseLang = lang.replace(/^language-/, '').split(' ')[0] || 'plaintext';
            const displayLang = baseLang.toUpperCase();
            
            let highlightedCode;
            try {
                highlightedCode = hljs.highlight(code, { language: baseLang }).value;
            } catch (e) {
                highlightedCode = hljs.highlightAuto(code).value;
            }
            
            return `
<div class="code-block bg-gray-900 rounded-lg overflow-hidden my-4" itemprop="code">
    <div class="code-header flex justify-between items-center px-4 py-2 bg-gray-800">
        <span class="text-sm text-gray-400 font-mono">${displayLang}</span>
        <button class="copy-btn text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1" 
                aria-label="Copy code to clipboard"
                data-lang="${baseLang}">
            <span class="copy-label">Copy</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
        </button>
    </div>
    <pre class="p-4 overflow-x-auto m-0"><code class="${lang} text-gray-100 text-sm">${highlightedCode}</code></pre>
</div>`;
        }
    );

    // Restore math segments as KaTeX-rendered HTML.
    html = html.replace(/\u0000MATH(\d+)\u0000/g, (match, index) => {
        const segment = mathSegments[Number(index)];
        if (!segment) return match;
        return katex.renderToString(segment.math, {
            displayMode: segment.displayMode,
            throwOnError: false,
        });
    });

    return DOMPurify.sanitize(html);
}

// ─── Plain-text LaTeX conversion (for <option> labels) ─────────────────

/**
 * Symbol replacements applied to LaTeX commands without arguments.
 * @type {Object<string, string>}
 * @private
 */
const LATEX_SYMBOLS = {
    leftrightarrow: '↔', longrightarrow: '⟹', Rightarrow: '⇒', rightarrow: '→', implies: '→',
    iff: '↔', to: '→', oplus: '⊕', ominus: '⊖', otimes: '⊗', circ: '∘',
    equiv: '≡', approx: '≈', ne: '≠', neq: '≠', sim: '∼', propto: '∝', cong: '≅',
    le: '≤', leq: '≤', ge: '≥', geq: '≥',
    land: '∧', wedge: '∧', lor: '∨', vee: '∨', lnot: '¬', neg: '¬',
    forall: '∀', exists: '∃', nexists: '∄',
    cap: '∩', cup: '∪', setminus: '∖', subset: '⊂', subseteq: '⊆', supset: '⊃',
    in: '∈', notin: '∉', ni: '∋',
    mid: '∣', nmid: '∤', perp: '⊥', parallel: '∥',
    emptyset: '∅', varnothing: '∅',
    sum: '∑', prod: '∏', coprod: '∐', integral: '∫',
    cdot: '·', times: '×', pm: '±', ast: '∗', bullet: '•',
    infty: '∞', partial: '∂', nabla: '∇',
    therefore: '∴', because: '∵', angle: '∠',
    ldots: '…', dots: '…', cdots: '⋯',
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ',
    tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
    Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω'
};

/**
 * Blackboard-bold letters used with `\mathbb{X}`.
 * @type {Object<string, string>}
 * @private
 */
const MATHBB_SYMBOLS = { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ', F: '𝔽' };

/**
 * Reads a balanced `{...}` group starting at (or after) `start`.
 * @function readBraceGroup
 * @param {string} text - Text to scan
 * @param {number} start - Index where the group is expected to begin
 * @returns {{content: string, end: number}|null} Group content and index after `}`, or null
 * @private
 */
function readBraceGroup(text, start) {
    let i = start;
    while (i < text.length && text[i] === ' ') i += 1;
    if (text[i] !== '{') return null;
    let depth = 0;
    for (let j = i; j < text.length; j += 1) {
        if (text[j] === '{') depth += 1;
        else if (text[j] === '}') {
            depth -= 1;
            if (depth === 0) return { content: text.slice(i + 1, j), end: j + 1 };
        }
    }
    return null;
}

/**
 * Repeatedly replaces `\command{A}{B}` occurrences using `mapper`.
 * Handles nested occurrences because the scan restarts at the replacement.
 * @function replaceTwoGroupCommand
 * @param {string} text - Text to process
 * @param {string} command - LaTeX command name (without backslash)
 * @param {Function} mapper - (groupA, groupB) => replacement string
 * @returns {string} Processed text
 * @private
 */
function replaceTwoGroupCommand(text, command, mapper) {
    const head = `\\${command}`;
    let out = text;
    let idx = out.indexOf(head);
    while (idx !== -1) {
        const first = readBraceGroup(out, idx + head.length);
        const second = first ? readBraceGroup(out, first.end) : null;
        if (!first || !second) {
            // Malformed usage: drop the backslash so the loop cannot spin.
            out = out.slice(0, idx) + out.slice(idx + 1);
            idx = out.indexOf(head, idx);
            continue;
        }
        out = out.slice(0, idx) + mapper(first.content, second.content) + out.slice(second.end);
        idx = out.indexOf(head, idx);
    }
    return out;
}

/**
 * Repeatedly replaces `\command{A}` occurrences using `mapper`.
 * @function replaceOneGroupCommand
 * @param {string} text - Text to process
 * @param {string} command - LaTeX command name (without backslash)
 * @param {Function} mapper - (group) => replacement string
 * @returns {string} Processed text
 * @private
 */
function replaceOneGroupCommand(text, command, mapper) {
    const head = `\\${command}`;
    let out = text;
    let idx = out.indexOf(head);
    while (idx !== -1) {
        const group = readBraceGroup(out, idx + head.length);
        if (!group) {
            out = out.slice(0, idx) + out.slice(idx + 1);
            idx = out.indexOf(head, idx);
            continue;
        }
        out = out.slice(0, idx) + mapper(group.content) + out.slice(group.end);
        idx = out.indexOf(head, idx);
    }
    return out;
}

/**
 * Converts a LaTeX math snippet (without `$` delimiters) to readable plain text.
 * Heuristic: known symbols become Unicode, `\frac`/`\binom`/`\sqrt` become
 * ASCII-ish structures, and unknown commands degrade to their name (no backslash).
 * @function mathToPlainText
 * @param {string} tex - LaTeX source without delimiters
 * @returns {string} Readable plain text
 * @private
 */
function mathToPlainText(tex) {
    let s = String(tex ?? '');

    s = s.replace(/\\mathbb\s*\{([A-Za-z])\}/g, (m, c) => MATHBB_SYMBOLS[c] || c);
    s = s.replace(/\\(?:operatorname|mathrm|mathbf|mathsf|textbf|textrm|text)\s*\{([^{}]*)\}/g, '$1');
    s = replaceTwoGroupCommand(s, 'frac', (a, b) => `(${a})/(${b})`);
    s = replaceTwoGroupCommand(s, 'binom', (a, b) => `(${a} choose ${b})`);
    s = replaceOneGroupCommand(s, 'sqrt', (a) => `√(${a})`);
    s = s.replace(/\\pmod\s*(?:\{([^{}]*)\}|(\S+))/g, (m, braced, plain) => `(mod ${braced ?? plain})`);
    s = s.replace(/\\\\/g, ' ');
    s = s.replace(/\\(?:qquad|quad|,|;|:|!| )/g, ' ');
    s = s.replace(/\\([a-zA-Z]+)/g, (m, name) => LATEX_SYMBOLS[name] ?? name);
    s = s.replace(/\\([^\w\s])/g, '$1');
    s = s.replace(/([_^])\{([^{}]*)\}/g, '$1$2');
    return s;
}

/**
 * Converts a string that may contain `$...$` / `$$...$$` LaTeX into readable
 * plain text for contexts that cannot render HTML (e.g. `<option>` labels).
 * Non-math text is passed through unchanged.
 * @function latexToPlainText
 * @param {string} text - Text possibly containing LaTeX math spans
 * @returns {string} Readable plain text
 * @todo Extend symbol table as new content needs it
 * @toimprove Handle unmatched currency dollars more gracefully
 * @tofix None known
 */
export function latexToPlainText(text) {
    const source = String(text ?? '');
    // Mask dollars produced inside math (from `\$`) so the leftover-dollars
    // cleanup below cannot strip them.
    const DOLLAR_MASK = '\uE000';
    const withMath = source.replace(
        /\$\$((?:[^$\\]|\\.)+?)\$\$|\$((?:[^$\\]|\\.)+?)\$/g,
        (match, displayMath, inlineMath) =>
            mathToPlainText(displayMath !== undefined ? displayMath : inlineMath)
                .replace(/\$/g, DOLLAR_MASK)
    );
    // Drop leftover unmatched dollar delimiters, then restore masked dollars.
    return withMath
        .replace(/\$\$?/g, ' ')
        .replace(/\s+/g, ' ')
        .split(DOLLAR_MASK)
        .join('$')
        .trim();
}

/**
 * Attaches copy handlers to all code blocks on the page.
 * @function attachCopyHandlers
 * @returns {void}
 * @todo Add support for custom copy success messages
 * @toimprove Optimize for pages with many code blocks
 * @tofix Ensure proper cleanup of event listeners
 */
export function attachCopyHandlers() {
    document.querySelectorAll('.copy-btn').forEach((btn) => {
        if (btn.dataset.copyHandlerAttached) return;
        btn.dataset.copyHandlerAttached = 'true';

        btn.addEventListener('click', () => {
            const labelSpan = btn.querySelector('.copy-label');
            const icon = btn.querySelector('svg');
            const originalLabel = labelSpan.textContent;
            const originalIconHTML = icon.outerHTML;
            const codeBlockDiv = btn.closest('.code-block');
            const codeElement = codeBlockDiv?.querySelector('pre code');
            if (!codeElement) {
                console.warn("Copy button clicked, but no code element found nearby.");
                return;
            }
            const codeToCopy = codeElement.textContent || "";

            navigator.clipboard.writeText(codeToCopy).then(() => {
                labelSpan.textContent = 'Copied';
                const copiedIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                copiedIcon.setAttribute("height", "20");
                copiedIcon.setAttribute("viewBox", "0 -960 960");
                copiedIcon.setAttribute("width", "20");
                copiedIcon.setAttribute("fill", "currentColor");
                copiedIcon.innerHTML = `<path d="M400-304 240-464l56-56 104 104 264-264 56 56-320 320Z"/>`;
                
                icon.replaceWith(copiedIcon);

                setTimeout(() => {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = originalIconHTML;
                    const restoredIcon = tempDiv.firstChild;
                    if (copiedIcon.parentNode) {
                       copiedIcon.replaceWith(restoredIcon);
                    }
                    labelSpan.textContent = originalLabel;
                }, 3000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                labelSpan.textContent = 'Error';
                 setTimeout(() => {
                    labelSpan.textContent = originalLabel;
                }, 3000);
            });
        });
    });
}

/**
 * Highlights all code blocks on the page using highlight.js.
 * @function highlightCode
 * @returns {void}
 * @todo Add support for lazy loading of code blocks
 * @toimprove Optimize for pages with many code blocks
 * @tofix Ensure proper highlighting after dynamic content updates
 */
export function highlightCode() {
    hljs.highlightAll();
}

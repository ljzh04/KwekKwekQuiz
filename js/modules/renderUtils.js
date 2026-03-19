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
    let html = marked.parse(markdownText);

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

    // LaTeX rendering
    html = html.replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (match, math) =>
        katex.renderToString(math, { displayMode: true, throwOnError: false })
    );

    html = html.replace(/\$(.+?)\$/g, (match, math) =>
        katex.renderToString(math, { displayMode: false, throwOnError: false })
    );

    return DOMPurify.sanitize(html);
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

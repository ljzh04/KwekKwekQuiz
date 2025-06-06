// js/modules/renderUtils.js
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import DOMPurify from "dompurify";

export function renderMarkdownWithLaTeX(markdownText) {
    let html = marked.parse(markdownText);

    // Fix code block rendering - extract just the language name
    html = html.replace(
        /<pre><code class="(.*?)">([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, code) => {
            // Extract the base language name (remove 'language-' prefix and any extra classes)
            const baseLang = lang.replace(/^language-/, '').split(' ')[0] || 'plaintext';
            
            let highlightedCode;
            try {
                highlightedCode = hljs.highlight(code, { 
                    language: baseLang, 
                    ignoreIllegals: true 
                }).value;
            } catch (e) {
                // Fallback to auto-detection if specific language fails
                try {
                    highlightedCode = hljs.highlightAuto(code).value;
                } catch (e2) {
                    // Final fallback to plain text
                    highlightedCode = code;
                }
            }
            
            return `
            <div class="code-container">
                <button class="copy-btn" title="Copy code">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                    <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/>
                </svg>
                <span class="copy-label">Copy</span>
                </button>
                <pre><code class="${lang}">${highlightedCode}</code></pre>
            </div>
            `;
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

export function attachCopyHandlers() {
    document.querySelectorAll('.copy-btn').forEach((btn) => {
        if (btn.dataset.copyHandlerAttached) return;
        btn.dataset.copyHandlerAttached = 'true';

        const labelSpan = btn.querySelector('.copy-label');
        const icon = btn.querySelector('svg');
        const originalLabel = labelSpan.textContent;
        const originalIconHTML = icon.outerHTML;

        btn.addEventListener('click', () => {
            const codeElement = btn.nextElementSibling?.querySelector('code');
            if (!codeElement) {
                console.warn("Copy button clicked, but no code element found nearby.");
                return;
            }
            const codeToCopy = codeElement.textContent || "";

            navigator.clipboard.writeText(codeToCopy).then(() => {
                labelSpan.textContent = 'Copied';
                const copiedIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                copiedIcon.setAttribute("height", "20");
                copiedIcon.setAttribute("viewBox", "0 -960 960 960");
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

export function highlightCode() {
    hljs.highlightAll();
}
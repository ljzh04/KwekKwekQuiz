// js/modules/renderUtils.js
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import DOMPurify from "dompurify";

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
        <button class="code-copy text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1" 
                aria-label="Copy code to clipboard" 
                onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
            <span class="material-symbols-outlined text-sm">content_copy</span>
            Copy
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
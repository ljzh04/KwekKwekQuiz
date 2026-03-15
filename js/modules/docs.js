// Export initialization function for docs section
import { renderMarkdownWithLaTeX, attachCopyHandlers } from './renderUtils.js';

export function initDocs() {
  // Search functionality
  const docsSearch = document.getElementById("docs-search");
  if (docsSearch) {
    docsSearch.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const sections = document.querySelectorAll(".docs-section");

      sections.forEach((section) => {
        const text = section.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          section.style.display = "block";
        } else {
          section.style.display = "none";
        }
      });
    });
  }

  // FAQ toggle functionality
  document.querySelectorAll(".docs-faq__question").forEach((button) => {
    button.addEventListener("click", function () {
      const answer = this.nextElementSibling;
      const icon = this.querySelector("span.material-symbols-outlined");

      if (answer.classList.contains("hidden")) {
        answer.classList.remove("hidden");
        icon.textContent = "expand_less";
      } else {
        answer.classList.add("hidden");
        icon.textContent = "expand_more";
      }
    });
  });

  // Copy code functionality - removed duplicate handler since renderUtils.js handles this

  // Progress tracking
  const progressBar = document.querySelector(".docs-progress__bar");
  const docsMain = document.querySelector(".docs-main");
  if (progressBar && docsMain) {
    // Show progress bar only on scrollable content
    const toggleProgressBarVisibility = () => {
      if (docsMain.scrollHeight > docsMain.clientHeight) {
        docsMain.querySelector(".docs-progress").classList.remove("hidden");
      } else {
        docsMain.querySelector(".docs-progress").classList.add("hidden");
      }
    };

    let scrollPosition = 0;
    let documentHeight = docsMain.scrollHeight;

    docsMain.addEventListener("scroll", function () {
      scrollPosition = docsMain.scrollTop;
      const progress = (scrollPosition / (documentHeight - docsMain.clientHeight)) * 100;
      progressBar.style.width = progress + "%";
    });

    // Update document height on load and resize
    const updateDocumentHeight = () => {
      documentHeight = docsMain.scrollHeight;
      toggleProgressBarVisibility();
    };
    
    updateDocumentHeight();
    window.addEventListener("resize", updateDocumentHeight);
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll(".docs-nav__link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Process documentation content with enhanced rendering
  processDocsContent();
}

function processDocsContent() {
  // Find all code blocks and enhance them
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach((codeBlock) => {
    const parentPre = codeBlock.parentElement;
    if (parentPre && parentPre.tagName === 'PRE') {
      // Replace the basic pre/code structure with enhanced code block
      const enhancedBlock = renderMarkdownWithLaTeX(`<pre><code>${codeBlock.innerHTML}</code></pre>`);
      parentPre.outerHTML = enhancedBlock;
    }
  });

  // Attach copy handlers after content is processed
  attachCopyHandlers();
}
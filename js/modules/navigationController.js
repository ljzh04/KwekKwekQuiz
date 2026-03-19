/**
 * @fileoverview Navigation Controller module for KwekKwekQuiz
 * Handles sidebar navigation and content switching functionality.
 * @module navigationController
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js'; 
import { showQuizSetupScreen as showAppSetupScreen } from './uiController.js';

/**
 * Initializes the navigation system by setting up event listeners for sidebar and content switching.
 * @function initNavigation
 * @returns {void}
 * @todo Add keyboard navigation support for accessibility
 * @toimprove Implement smooth transitions between sections
 * @tofix Ensure proper cleanup of event listeners on navigation changes
 */
export function initNavigation() {
    if (!DOM.sidebar || !DOM.sidebarToggle || !DOM.sidebarOverlay || !DOM.sidebarLinks.length || !DOM.contentSections.length || !DOM.mainTitle) {
        console.warn("Navigation elements not found, sidebar/navigation might not work.");
        return;
    }

    // --- Sidebar Toggle ---
    DOM.sidebarToggle.addEventListener('click', (e) => {
        console.log("Sidebar toggle clicked");
        e.stopPropagation();
        DOM.sidebar.classList.toggle('-translate-x-full');
        DOM.sidebar.classList.toggle('open');
        DOM.sidebarOverlay.classList.toggle('hidden');
    });

    DOM.sidebarOverlay.addEventListener('click', () => {
        DOM.sidebar.classList.add('-translate-x-full');
        DOM.sidebar.classList.remove('open');
        DOM.sidebarOverlay.classList.add('hidden');
    });

    // --- Content Switching ---
    /**
     * Switches the visible content section and updates the navigation state.
     * @function switchContent
     * @param {string} targetSectionId - The ID of the section to switch to
     * @param {boolean} [forceAppReset=false] - Whether to force a reset of the app section
     * @returns {void}
     * @todo Add animation effects when switching sections
     * @toimprove Optimize for better performance with many sections
     * @tofix Ensure proper cleanup of previous section states
     */
    function switchContent(targetSectionId, forceAppReset = false) {
        DOM.contentSections.forEach(section => {
            if (section.id === targetSectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        DOM.sidebarLinks.forEach(link => {
            if (link.dataset.section === targetSectionId) {
                link.classList.add('active-link');
                if (DOM.mainTitle) {
                    // Get text content, excluding the icon span's content
                    let linkText = "";
                    link.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            linkText += node.textContent.trim();
                        } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('material-symbols-outlined')) {
                            // In case the text is wrapped in another span for styling
                            linkText += node.textContent.trim();
                        }
                    });
                    linkText = linkText.trim(); // Final trim
                    DOM.mainTitle.textContent = linkText === 'App' ? 'Kwek Kwek Quiz' : linkText;
                }
            } else {
                link.classList.remove('active-link');
            }
        });

        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768 && DOM.sidebar.classList.contains('open')) {
            DOM.sidebar.classList.add('-translate-x-full');
            DOM.sidebar.classList.remove('open');
            DOM.sidebarOverlay.classList.add('hidden');
        }

        // Special handling for app section to re-center content if needed
        if (targetSectionId === 'app-section') {
            // If #main-content had items-center justify-center, ensure it's reapplied or handled
            // For now, assuming #app-section itself controls its centering if needed.
        }

        // Specifically reset the app view if 'app-section' is targeted OR forceAppReset is true
        if (targetSectionId === 'app-section' && forceAppReset) {
            showAppSetupScreen();
        } else if (targetSectionId === 'app-section' && !document.getElementById('quiz-setup').classList.contains('hidden') && !document.getElementById('quiz-container').classList.contains('hidden') && !document.getElementById('result-container').classList.contains('hidden')) {
            // If navigating to App and no specific quiz state is active, show setup
            // This condition might be too broad, the forceAppReset is more direct
        }

        console.log(`Switched to section: ${targetSectionId}`);
    }

    DOM.sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = link.dataset.section;
            const newHash = link.getAttribute('href');
            const isAppSectionClick = targetSectionId === 'app-section';

            // If clicking 'App' link, always treat it as wanting to go to the app's "home" (setup screen)
            // This means we call switchContent with forceAppReset = true
            // Also update hash, which will then re-call switchContent via hashchange,
            // but the important part is the direct call with forceAppReset.
            if (window.location.hash !== newHash) {
                window.location.hash = newHash.substring(1); // Update hash without triggering hashchange immediately
            }

            // If already on the app page and clicking app, or explicitly clicking app
            // ensure we reset the app view.
            switchContent(targetSectionId, isAppSectionClick); // Switch content directly
        });
    });

    // --- Handle Initial Page Load and Hash Changes ---
    /**
     * Loads content based on the current URL hash.
     * @function loadContentFromHash
     * @returns {void}
     * @todo Add error handling for invalid hash values
     * @toimprove Cache loaded sections for faster switching
     * @tofix Ensure proper handling of nested hash routes
     */
    function loadContentFromHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) {
            switchContent('app-section', true);
            return;
        }

        // 1. Check if it's a primary navigation link
        const activeLink = document.querySelector(`.sidebar-link[href="#${hash}"]`);
        
        if (activeLink && activeLink.dataset.section) {
            switchContent(activeLink.dataset.section, hash === 'app');
        } else {
            // 2. It's an internal anchor (e.g., #json-format)
            const targetElement = document.getElementById(hash);
            
            if (targetElement) {
                // Find which main content section this element lives inside
                const parentSection = targetElement.closest('.content-section');
                
                if (parentSection) {
                    // Show the parent container so the element is visible
                    switchContent(parentSection.id, false);
                    
                    targetElement.scrollIntoView();
                }
            } else {
                // 3. Fallback for broken hashes
                window.location.hash = 'app';
                switchContent('app-section', true);
            }
        }
    }

    window.addEventListener('hashchange', loadContentFromHash);
    loadContentFromHash(); // Load content on initial page load

    console.log("Navigation controller initialized.");
}

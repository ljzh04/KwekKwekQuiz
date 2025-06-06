// Loads DOM components
async function loadComponent(containerSelector, componentPath) {
  try {
    const response = await fetch(componentPath);
    const html = await response.text();
    document.querySelector(containerSelector).innerHTML = html;
  } catch (error) {
    console.error(`Failed to load component ${componentPath}:`, error);
  }
}

// Load all components
await Promise.all([
  loadComponent('#sidebar-container', 'components/sidebar.html'),
  loadComponent('#header-container', 'components/header.html'),
  loadComponent('#app-section-container', 'components/app-section.html'),
  loadComponent('#docs-section-container', 'components/docs-section.html'),
  loadComponent('#settings-section-container', 'components/settings-section.html'),
  loadComponent('#about-section-container', 'components/about-section.html')
]);

console.log("All DOM components initialized/loaded.")

import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/KwekKwekQuiz/');
  });

  test('should navigate through all sidebar sections and verify content', async ({ page }) => {
    const sections = [
      { selector: '[data-section="app-section"]', label: 'App', contentId: 'app-section' },
      { selector: '[data-section="docs-section"]', label: 'Docs', contentId: 'docs-section' },
      { selector: '[data-section="settings-section"]', label: 'Settings', contentId: 'settings-section' },
      { selector: '[data-section="about-section"]', label: 'About', contentId: 'about-section' }
    ];

    // Verify header/title is visible (acts as logo/branding)
    const headerTitle = page.locator('h1#main-title');
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toHaveText('Kwek Kwek Quiz');

    for (const section of sections) {
      // Click the section link in sidebar
      const sectionLink = page.locator(section.selector);
      await expect(sectionLink).toBeVisible();
      await expect(sectionLink).toBeEnabled();
      await sectionLink.click();

      // Wait a moment for navigation to complete
      await page.waitForTimeout(100);

      // Verify the corresponding content section is visible
      const contentSection = page.locator(`#${section.contentId}`);
      await expect(contentSection).toBeVisible();

      // Verify the section label in the sidebar is present and fully visible
      const sectionLabel = sectionLink.locator('.label');
      await expect(sectionLabel).toBeVisible();
      await expect(sectionLabel).toHaveText(section.label);

      // Check that the label is not truncated (scrollWidth should equal clientWidth)
      const isNotTruncated = await sectionLabel.evaluate((el) => el.scrollWidth <= el.clientWidth);
      expect(isNotTruncated).toBeTruthy();

      // Verify the label is in the viewport
      await expect(sectionLabel).toBeInViewport();

      // Verify header/title is still visible
      await expect(headerTitle).toBeVisible();
    }
  });
});
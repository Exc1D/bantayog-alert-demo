import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('Basic accessibility checks', async ({ page }) => {
    await page.goto('/');

    const mainNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(mainNav).toHaveAttribute('aria-label', 'Main navigation');

    const tabs = page.locator('button[role="tab"]');
    await expect(tabs).toHaveCount(4);

    for (const tab of await tabs.all()) {
      await expect(tab).toHaveAttribute('role', 'tab');
    }

    const activeTab = page.locator('button[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();

    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await expect(reportButton).toBeVisible();
    await expect(reportButton).toHaveAttribute('aria-label');
  });

  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    const reportButton = page.locator('button[aria-label="Report a hazard"]');

    await reportButton.focus();
    await expect(reportButton).toBeFocused();

    await reportButton.click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Tab panel accessibility', async ({ page }) => {
    await page.goto('/');

    const mapPanel = page.locator('#tabpanel-map');
    await expect(mapPanel).toBeVisible();

    const mapTab = page.locator('button[role="tab"]:has-text("Map")');
    await expect(mapTab).toHaveAttribute('aria-controls', 'tabpanel-map');

    await page.click('button[role="tab"]:has-text("Feed")');
    const feedPanel = page.locator('#tabpanel-feed');
    await expect(feedPanel).toBeVisible();

    const feedTab = page.locator('button[role="tab"]:has-text("Feed")');
    await expect(feedTab).toHaveAttribute('aria-controls', 'tabpanel-feed');
  });
});

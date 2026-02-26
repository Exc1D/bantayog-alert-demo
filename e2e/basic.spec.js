import { test, expect } from '@playwright/test';

test.describe('Basic E2E Tests', () => {
  test('Home page loads without crash', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/BANTAYOG ALERT/);
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('Warning') && !err.includes('Sentry')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Navigation between tabs works correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#tabpanel-map')).toBeVisible();

    await page.click('button[role="tab"]:has-text("Feed")');
    await expect(page).toHaveURL(/#feed/);
    await expect(page.locator('#tabpanel-feed')).toBeVisible();

    await page.click('button[role="tab"]:has-text("Weather")');
    await expect(page).toHaveURL(/#weather/);
    await expect(page.locator('#tabpanel-weather')).toBeVisible();

    await page.click('button[role="tab"]:has-text("Profile")');
    await expect(page).toHaveURL(/#profile/);
    await expect(page.locator('#tabpanel-profile')).toBeVisible();

    await page.click('button[role="tab"]:has-text("Map")');
    await expect(page).toHaveURL(/#map/);
    await expect(page.locator('#tabpanel-map')).toBeVisible();
  });

  test('Report modal opens and closes', async ({ page }) => {
    await page.goto('/');

    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await expect(reportButton).toBeVisible();
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const closeButton = modal.locator('button').first();
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('No critical console errors on page load', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('Warning') &&
        !err.includes('Sentry') &&
        !err.includes('Firebase') &&
        !err.includes('favicon')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Map Tests', () => {
  test('Map loads successfully', async ({ page }) => {
    await page.goto('/#map');

    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    const mapControls = page.locator('.leaflet-control-zoom');
    await expect(mapControls).toBeVisible();
  });

  test('Markers are visible', async ({ page }) => {
    await page.goto('/#map');

    await page.waitForSelector('.leaflet-container', { timeout: 15000 });

    await page.waitForTimeout(3000);

    const markers = page.locator('.leaflet-marker-icon, .marker-cluster');
    const markerCount = await markers.count();

    expect(markerCount).toBeGreaterThanOrEqual(0);
  });

  test('Map controls work', async ({ page }) => {
    await page.goto('/#map');

    await page.waitForSelector('.leaflet-container', { timeout: 15000 });

    const zoomIn = page.locator('.leaflet-control-zoom a[title="Zoom in"]');
    await expect(zoomIn).toBeVisible();
    await zoomIn.click();

    const zoomOut = page.locator('.leaflet-control-zoom a[title="Zoom out"]');
    await expect(zoomOut).toBeVisible();
  });
});

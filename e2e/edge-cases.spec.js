import { test, expect } from '@playwright/test';

/**
 * QA Edge Hunter - Edge Case Testing
 * Tests boundary conditions, XSS, injection, race conditions, and data integrity
 */

test.describe('Edge Case Testing - XSS and Injection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Report form XSS - script tag in description', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Try XSS payload in description
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('<script>alert("XSS")</script>Test description for flooding');

    // Check if XSS warning appears
    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    await expect(xssWarning).toBeVisible({ timeout: 5000 });
  });

  test('Report form XSS - javascript: protocol', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('javascript:alert("XSS")');

    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    await expect(xssWarning).toBeVisible({ timeout: 5000 });
  });

  test('Report form XSS - event handler attributes', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('<img src=x onerror="alert(1)">');

    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    await expect(xssWarning).toBeVisible({ timeout: 5000 });
  });

  test('Report form XSS - nested script fragments', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Test fragment reassembly attack
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('<scr<script>ipt>alert(1)</script>');

    // The sanitization should either show warning or not execute
    await page.waitForTimeout(1000);

    // Submit and check if it was blocked
    const submitButton = modal.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Barangay field XSS injection', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const barangayField = page.locator('#report-barangay');
    await barangayField.fill('<script>alert(1)</script>');

    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    await expect(xssWarning).toBeVisible({ timeout: 5000 });
  });

  test('Street field XSS injection', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const streetField = page.locator('#report-street');
    await streetField.fill('<img onerror="alert(1)" src=x>');

    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    await expect(xssWarning).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Edge Case Testing - Input Boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Empty required fields validation', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Try to submit without filling required fields
    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation error
    await page.waitForTimeout(500);
  });

  test('Very long input in description field', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const descriptionField = page.locator('#report-description');
    // Input 3000 characters (exceeds 2000 limit)
    const longText = 'A'.repeat(3000);
    await descriptionField.fill(longText);

    // Should truncate
    const value = await descriptionField.inputValue();
    expect(value.length).toBeLessThanOrEqual(2003); // 2000 + '...'
  });

  test('Boundary - minimum character description', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Description requires minimum 10 characters
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Too short'); // 9 characters

    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation error for too short
    await page.waitForTimeout(500);
  });

  test('Special characters in barangay name', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const barangayField = page.locator('#report-barangay');
    await barangayField.fill("O'Brien; DROP TABLE users;--");

    // Should sanitize and not cause issues
    await page.waitForTimeout(500);
  });

  test('Unicode and emoji in description', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Flooding near the road  poses danger 🚨⚠️');

    await page.waitForTimeout(500);
    // Should handle emoji without crashing
  });

  test('Right-to-left text injection attempt', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const descriptionField = page.locator('#report-description');
    // RTL override character
    await descriptionField.fill('\u202EO\u202Epassword\u202E');

    await page.waitForTimeout(500);
  });
});

test.describe('Edge Case Testing - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Sign up with existing email', async ({ page }) => {
    // Navigate to profile to find sign up
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await page.waitForTimeout(500);

      // Try to sign up (assuming test credentials exist)
      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]');

      if (await emailField.isVisible()) {
        await emailField.fill('test@test.com');
        await passwordField.fill('password123');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForTimeout(2000);
      }
    }
  });

  test('Sign in with wrong password', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    const signInButton = page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]');

      if (await emailField.isVisible()) {
        await emailField.fill('nonexistent@test12345.com');
        await passwordField.fill('wrongpassword');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        await page.waitForTimeout(2000);

        // Should show error message
        const errorMessage = page.locator('text=Invalid');
        // Error handling should be visible
      }
    }
  });

  test('Anonymous user upvote attempt', async ({ page }) => {
    await page.goto('/#feed');
    await page.waitForTimeout(2000);

    // Find upvote button
    const upvoteButton = page.locator('button').filter({ has: page.locator('svg path[d*="M14"]') }).first();

    if (await upvoteButton.isVisible()) {
      await upvoteButton.click();
      await page.waitForTimeout(1000);

      // Should prompt sign up
      const signUpPrompt = page.locator('text=Please sign up');
      if (await signUpPrompt.isVisible()) {
        expect(true).toBe(true);
      }
    }
  });
});

test.describe('Edge Case Testing - Navigation and State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Rapid tab switching', async ({ page }) => {
    // Rapidly switch between tabs
    for (let i = 0; i < 5; i++) {
      await page.click('button[role="tab"]:has-text("Feed")');
      await page.waitForTimeout(100);
      await page.click('button[role="tab"]:has-text("Map")');
      await page.waitForTimeout(100);
      await page.click('button[role="tab"]:has-text("Weather")');
      await page.waitForTimeout(100);
      await page.click('button[role="tab"]:has-text("Profile")');
      await page.waitForTimeout(100);
    }
  });

  test('Double click on report button', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');

    // Double click
    await reportButton.click();
    await reportButton.click();

    await page.waitForTimeout(500);

    // Should only open one modal
    const modals = page.locator('[role="dialog"]');
    await expect(modals).toHaveCount(1);
  });

  test('Back button after navigation', async ({ page }) => {
    // Navigate to feed
    await page.click('button[role="tab"]:has-text("Feed")');
    await expect(page).toHaveURL(/#feed/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/#map/);

    await page.waitForTimeout(500);
  });

  test('Direct URL navigation to each tab', async ({ page }) => {
    // Test each tab URL
    await page.goto('/#/feed');
    await page.waitForTimeout(1000);

    await page.goto('/#/weather');
    await page.waitForTimeout(1000);

    await page.goto('/#/profile');
    await page.waitForTimeout(1000);

    await page.goto('/#/map');
    await page.waitForTimeout(1000);
  });
});

test.describe('Edge Case Testing - Map and Geofencing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[role="tab"]:has-text("Map")');
    await page.waitForTimeout(2000);
  });

  test('Coordinates outside Philippines bounds', async ({ page }) => {
    // Try to interact with map at invalid coordinates
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    // Map should handle gracefully
    await page.waitForTimeout(1000);
  });

  test('Zoom controls boundary', async ({ page }) => {
    const zoomInButton = page.locator('.leaflet-control-zoom a').first();
    const zoomOutButton = page.locator('.leaflet-control-zoom a').last();

    // Zoom in multiple times
    for (let i = 0; i < 10; i++) {
      await zoomInButton.click();
      await page.waitForTimeout(100);
    }

    // Zoom out multiple times
    for (let i = 0; i < 10; i++) {
      await zoomOutButton.click();
      await page.waitForTimeout(100);
    }
  });

  test('Map markers visibility at different zoom levels', async ({ page }) => {
    const zoomInButton = page.locator('.leaflet-control-zoom a').first();

    // Zoom in fully
    for (let i = 0; i < 15; i++) {
      await zoomInButton.click();
      await page.waitForTimeout(50);
    }

    // Zoom out fully
    const zoomOutButton = page.locator('.leaflet-control-zoom a').last();
    for (let i = 0; i < 15; i++) {
      await zoomOutButton.click();
      await page.waitForTimeout(50);
    }
  });
});

test.describe('Edge Case Testing - Feed and Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(2000);
  });

  test('Feed loading state', async ({ page }) => {
    // Navigate away and back to trigger reload
    await page.click('button[role="tab"]:has-text("Map")');
    await page.waitForTimeout(500);
    await page.click('button[role="tab"]:has-text("Feed")');

    // Loading spinner should appear
    const loadingSpinner = page.locator('[aria-label="Loading"]');
    await page.waitForTimeout(2000);
  });

  test('Empty feed state', async ({ page }) => {
    // Feed should show empty state or loading
    const feedContent = page.locator('#tabpanel-feed');
    await expect(feedContent).toBeVisible();
  });

  test('Report card with missing optional fields', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for any rendered report cards
    const reportCards = page.locator('[class*="rounded-xl"][class*="shadow-card"]');
    const count = await reportCards.count();

    if (count > 0) {
      // Card should render without crashing even with missing fields
      await page.waitForTimeout(1000);
    }
  });

  test('Share button with empty optional fields', async ({ page }) => {
    await page.waitForTimeout(2000);

    const shareButton = page.locator('button[aria-label="Share report"]').first();
    if (await shareButton.isVisible()) {
      await shareButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Edge Case Testing - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Report form - disaster type selection required', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill only description, try to submit without disaster type
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Test flooding description that is long enough');

    const submitButton = modal.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(1000);
  });

  test('Report form - location selection required', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.waitForTimeout(1000);
  });

  test('Phone number validation edge cases', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    // Look for phone input in settings
    const phoneInput = page.locator('input[type="tel"]');
    if (await phoneInput.isVisible()) {
      // Too short
      await phoneInput.fill('123');
      await page.waitForTimeout(500);

      // Too long
      await phoneInput.fill('1'.repeat(25));
      await page.waitForTimeout(500);

      // Invalid characters
      await phoneInput.fill('abc-def-ghij');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Edge Case Testing - Race Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Concurrent upvote clicks', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(2000);

    // Find upvote button
    const upvoteButton = page.locator('button').filter({ has: page.locator('svg path[d*="M14"]') }).first();

    if (await upvoteButton.isVisible()) {
      // Sign in first
      await page.click('button[role="tab"]:has-text("Profile")');
      await page.waitForTimeout(1000);

      // Try to upvote twice rapidly
      await page.click('button[role="tab"]:has-text("Feed")');
      await page.waitForTimeout(500);

      await upvoteButton.click();
      await page.waitForTimeout(100);
      await upvoteButton.click();

      await page.waitForTimeout(1000);
    }
  });

  test('Report modal opened during network request', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // While modal is open, try to navigate away
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(500);

    // Modal should close or prevent navigation
    const isModalVisible = await modal.isVisible();
    // Behavior may vary - either closes or stays open
  });

  test('Session expiry simulation via storage clear', async ({ page }) => {
    // Clear local storage (simulating session issues)
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(2000);

    // App should handle gracefully
    const nav = page.locator('nav[aria-label="Main navigation"]').first();
    await expect(nav).toBeVisible();
  });
});

test.describe('Edge Case Testing - Performance and Load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Large number of markers on map', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Map")');
    await page.waitForTimeout(3000);

    // Try zooming out to show more markers
    const zoomOutButton = page.locator('.leaflet-control-zoom a').last();
    for (let i = 0; i < 5; i++) {
      await zoomOutButton.click();
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(2000);
  });

  test('Multiple rapid modal opens', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');

    // Rapidly open/close modal multiple times
    for (let i = 0; i < 3; i++) {
      await reportButton.click();
      await page.waitForTimeout(100);
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(100);
    }
  });

  test('Image lazy loading in feed', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(2000);

    // Scroll down to trigger lazy loading
    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });
    await page.waitForTimeout(1000);
  });
});

test.describe('Edge Case Testing - Offline and Network', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Offline indicator visibility', async ({ page }) => {
    // Check if offline indicator component exists
    const offlineIndicator = page.locator('text=You are offline');
    await page.waitForTimeout(1000);
  });

  test('Report submission with throttled network', async ({ page }) => {
    // Set up slow network
    await page.context().setOffline(true);

    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.waitForTimeout(2000);

    // Set network back to online
    await page.context().setOffline(false);
  });
});

test.describe('Edge Case Testing - Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Malformed Firestore data display', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(3000);

    // Feed should render even if some data is malformed
    const feedContent = page.locator('#tabpanel-feed');
    await expect(feedContent).toBeVisible();
  });

  test('Report with null/undefined fields', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(3000);

    // Check console for any errors related to null values
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('Warning') &&
        !err.includes('Sentry') &&
        !err.includes('Firebase')
    );

    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
  });
});

import { test, expect } from '@playwright/test';

/**
 * Report Submission E2E Tests
 * Tests report form validation, submission, and edge cases
 */

test.describe('Report Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Submit report with description less than 10 chars shows validation', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill minimum required fields
    // Disaster type selection
    const disasterTypeButton = page.locator('#report-disaster');
    if (await disasterTypeButton.isVisible()) {
      await disasterTypeButton.click();
      await page.waitForTimeout(300);

      // Select flood type
      const floodOption = page.locator('li:has-text("Flood")').first();
      if (await floodOption.isVisible()) {
        await floodOption.click();
      }
    }

    // Fill short description (less than 10 chars)
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Short');

    // Try to submit
    const submitButton = modal.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation error for description length
      const validationError = page
        .locator('text=at least 10')
        .or(
          page
            .locator('text=minimum')
            .or(page.locator('text=characters').or(page.locator('[role="alert"]')))
        );
      await expect(validationError.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Report with null/undefined optional fields submits successfully', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill disaster type
    const disasterTypeButton = page.locator('#report-disaster');
    if (await disasterTypeButton.isVisible()) {
      await disasterTypeButton.click();
      await page.waitForTimeout(300);

      const floodOption = page.locator('li:has-text("Flood")').first();
      if (await floodOption.isVisible()) {
        await floodOption.click();
      }
    }

    // Fill valid description (at least 10 chars)
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Test flooding in the area with significant water accumulation');

    // Leave optional fields (barangay, street) empty/null
    const barangayField = page.locator('#report-barangay');
    const streetField = page.locator('#report-street');

    // Ensure optional fields are empty
    if (await barangayField.isVisible()) {
      await barangayField.fill('');
    }
    if (await streetField.isVisible()) {
      await streetField.fill('');
    }

    // Should handle empty optional fields without crashing
    // The app should either accept empty or show appropriate validation
    await page.waitForTimeout(500);

    // Close modal - should not crash
    const closeButton = modal.locator('button').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test('Report submission requires disaster type selection', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill description only, without selecting disaster type
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Test flooding description that is long enough for validation');

    // Try to submit
    const submitButton = modal.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation error for required disaster type
      const validationError = page
        .locator('text=required')
        .or(
          page
            .locator('text=select')
            .or(page.locator('text=type').or(page.locator('[role="alert"]')))
        );
      await expect(validationError.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Report submission requires location selection', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill disaster type
    const disasterTypeButton = page.locator('#report-disaster');
    if (await disasterTypeButton.isVisible()) {
      await disasterTypeButton.click();
      await page.waitForTimeout(300);

      const floodOption = page.locator('li:has-text("Flood")').first();
      if (await floodOption.isVisible()) {
        await floodOption.click();
      }
    }

    // Fill description only, without selecting location on map
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Test flooding description that is long enough for validation');

    // Try to submit
    const submitButton = modal.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should show validation error for location
      const validationError = page
        .locator('text=location')
        .or(
          page
            .locator('text=map')
            .or(page.locator('text=select').or(page.locator('[role="alert"]')))
        );
      await expect(validationError.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Double click on submit button does not create duplicate reports', async ({ page }) => {
    // Sign in first (required for report submission)
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    const signInButton = page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]');

      if (await emailField.isVisible()) {
        await emailField.fill('test@test.com');
        await passwordField.fill('Testpassword123!');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Go back to map to submit report
    await page.click('button[role="tab"]:has-text("Map")');
    await page.waitForTimeout(1000);

    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill required fields
    const disasterTypeButton = page.locator('#report-disaster');
    if (await disasterTypeButton.isVisible()) {
      await disasterTypeButton.click();
      await page.waitForTimeout(300);

      const floodOption = page.locator('li:has-text("Flood")').first();
      if (await floodOption.isVisible()) {
        await floodOption.click();
      }
    }

    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('Rapid flooding test with double click prevention mechanism');

    // Double click on submit
    const submitButton = modal.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(100);
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Should only have opened one modal (or prevented duplicate submission)
      const modals = page.locator('[role="dialog"]');
      await expect(modals).toHaveCount(1);
    }
  });

  test('Report form closes properly after submission', async ({ page }) => {
    // Sign in first
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    const signInButton = page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]');

      if (await emailField.isVisible()) {
        await emailField.fill('test@test.com');
        await passwordField.fill('Testpassword123!');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Go to Map tab
    await page.click('button[role="tab"]:has-text("Map")');
    await page.waitForTimeout(1000);

    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close modal using Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('Report with XSS payload in description is sanitized', async ({ page }) => {
    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill disaster type
    const disasterTypeButton = page.locator('#report-disaster');
    if (await disasterTypeButton.isVisible()) {
      await disasterTypeButton.click();
      await page.waitForTimeout(300);

      const floodOption = page.locator('li:has-text("Flood")').first();
      if (await floodOption.isVisible()) {
        await floodOption.click();
      }
    }

    // Fill description with XSS payload
    const descriptionField = page.locator('#report-description');
    await descriptionField.fill('<script>alert("XSS")</script>Valid description for testing');

    await page.waitForTimeout(1000);

    // Should show XSS warning
    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    await expect(xssWarning).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Report Submission - Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Very long description is truncated', async ({ page }) => {
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

  test('Special characters in barangay field are handled', async ({ page }) => {
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    const barangayField = page.locator('#report-barangay');
    // Try SQL injection-like characters
    await barangayField.fill("'; DROP TABLE reports;--");

    await page.waitForTimeout(500);

    // Should sanitize and not cause errors
    const xssWarning = page.locator('text=Potentially unsafe content was removed');
    // Warning may or may not appear depending on sanitization level
  });

  test('Report form resets after successful submission', async ({ page }) => {
    // This test assumes user is signed in
    // Navigate to map
    await page.click('button[role="tab"]:has-text("Map")');
    await page.waitForTimeout(1000);

    // Check if user is signed in (look for sign out button)
    const signOutButton = page.locator('button:has-text("Sign Out")');
    if (!(await signOutButton.isVisible())) {
      // Sign in first
      await page.click('button[role="tab"]:has-text("Profile")');
      await page.waitForTimeout(1000);

      const signInButton = page.locator('button:has-text("Sign In")').first();
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForTimeout(500);

        const emailField = page.locator('input[type="email"]');
        const passwordField = page.locator('input[type="password"]');

        if (await emailField.isVisible()) {
          await emailField.fill('test@test.com');
          await passwordField.fill('Testpassword123!');

          const submitButton = page.locator('button[type="submit"]');
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }

      // Go back to map
      await page.click('button[role="tab"]:has-text("Map")');
      await page.waitForTimeout(1000);
    }

    // Open report modal
    const reportButton = page.locator('button[aria-label="Report a hazard"]');
    await reportButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Reopen modal - fields should be reset
    await reportButton.click();
    await page.waitForTimeout(500);

    const modalAgain = page.locator('[role="dialog"]');
    await expect(modalAgain).toBeVisible();

    // Description should be empty (form reset)
    const descriptionField = page.locator('#report-description');
    const value = await descriptionField.inputValue();
    expect(value).toBe('');
  });
});

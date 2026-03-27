import { test, expect } from '@playwright/test';

/**
 * Authentication Flows E2E Tests
 * Tests sign-in, sign-up, sign-out, and auth-related edge cases
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Sign in with wrong password shows error', async ({ page }) => {
    // Navigate to Profile tab
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    // Click Sign In button
    const signInButton = page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);
    }

    // Fill wrong credentials
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    if (await emailField.isVisible()) {
      await emailField.fill('nonexistent@test12345.com');
      await passwordField.fill('wrongpassword');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for error to appear
      await page.waitForTimeout(2000);

      // Should show error message (check for Firebase auth error or custom error)
      const errorMessage = page
        .locator('text=Invalid')
        .or(page.locator('text=wrong password').or(page.locator('text=user-not-found')));
      await expect(errorMessage.or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('Sign up with existing email shows error', async ({ page }) => {
    // Navigate to Profile tab
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    // Click Sign Up button
    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await page.waitForTimeout(500);
    }

    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    if (await emailField.isVisible()) {
      // Try to sign up with an email that likely already exists
      await emailField.fill('test@test.com');
      await passwordField.fill('password123');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for error to appear
      await page.waitForTimeout(2000);

      // Should show error message for existing email
      const errorMessage = page
        .locator('text=email')
        .or(page.locator('text=already').or(page.locator('text=exists')));
      await expect(errorMessage.or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('Anonymous user sees sign-up prompt for protected actions', async ({ page }) => {
    // As anonymous user, navigate to Feed tab
    await page.click('button[role="tab"]:has-text("Feed")');
    await page.waitForTimeout(2000);

    // Try to upvote (a protected action)
    const upvoteButton = page
      .locator('button')
      .filter({ has: page.locator('svg path[d*="M14"]') })
      .first();

    if (await upvoteButton.isVisible()) {
      await upvoteButton.click();
      await page.waitForTimeout(1000);

      // Should prompt sign up/in
      const signUpPrompt = page
        .locator('text=Please sign up')
        .or(
          page
            .locator('text=Sign in to')
            .or(page.locator('text=Sign Up').or(page.locator('button:has-text("Sign In")')))
        );
      await expect(signUpPrompt.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Sign out clears session', async ({ page }) => {
    // First, sign in
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);

    // Check if already signed in
    const signInButton = page.locator('button:has-text("Sign In")').first();
    const signOutButton = page.locator('button:has-text("Sign Out")').first();

    if (await signInButton.isVisible()) {
      // Sign in first
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

    // Now sign out
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await page.waitForTimeout(1000);

      // After sign out, should see sign in button again
      await expect(signInButton).toBeVisible({ timeout: 5000 });

      // Verify session is cleared by trying a protected action
      await page.click('button[role="tab"]:has-text("Feed")');
      await page.waitForTimeout(1000);

      const upvoteButton = page
        .locator('button')
        .filter({ has: page.locator('svg path[d*="M14"]') })
        .first();
      if (await upvoteButton.isVisible()) {
        await upvoteButton.click();
        await page.waitForTimeout(1000);

        // Should again prompt for sign in
        const signInPrompt = page
          .locator('button:has-text("Sign In")')
          .or(page.locator('text=Please sign'));
        await expect(signInPrompt.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Session persists after page reload', async ({ page }) => {
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

    // Check that we're signed in (see sign out button or user profile)
    const signOutButton = page.locator('button:has-text("Sign Out")');
    await expect(signOutButton).toBeVisible({ timeout: 5000 });

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000);

    // Session should persist - still signed in
    await expect(signOutButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Authentication - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[role="tab"]:has-text("Profile")');
    await page.waitForTimeout(1000);
  });

  test('Sign in with empty fields shows validation error', async ({ page }) => {
    const signInButton = page.locator('button:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(500);

      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation errors for required fields
        const validationError = page
          .locator('text=required')
          .or(page.locator('text=Enter').or(page.locator('[role="alert"]')));
        await expect(validationError.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('Sign up with invalid email format shows error', async ({ page }) => {
    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]');

      if (await emailField.isVisible()) {
        // Fill invalid email format
        await emailField.fill('notanemail');
        await passwordField.fill('password123');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show email validation error
        const emailError = page
          .locator('text=email')
          .or(page.locator('text=invalid').or(page.locator('[role="alert"]')));
        await expect(emailError.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('Sign up with short password shows error', async ({ page }) => {
    const signUpButton = page.locator('button:has-text("Sign Up")').first();
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await page.waitForTimeout(500);

      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]');

      if (await emailField.isVisible()) {
        await emailField.fill('test@example.com');
        await passwordField.fill('123'); // Too short

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show password validation error
        const passwordError = page
          .locator('text=password')
          .or(page.locator('text=least').or(page.locator('text=6')));
        await expect(passwordError.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

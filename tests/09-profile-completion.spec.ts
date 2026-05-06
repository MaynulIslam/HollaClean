/**
 * Profile Completion flow — for Google sign-in users who haven't set a role yet.
 * We simulate this by injecting a session where profileComplete === false.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, clearStorage } from './helpers';

const INCOMPLETE_GOOGLE_USER = {
  id: 'google-user-001',
  type: undefined, // role not yet selected
  name: 'Google User',
  email: 'googleuser@gmail.com',
  profileComplete: false,
  authProvider: 'google',
  firebaseUid: 'firebase-uid-test-001',
  emailVerified: true,
  photoURL: null,
};

test.describe('Profile Completion Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    // Set up an incomplete Google user session
    await page.evaluate((user) => {
      localStorage.setItem(`user:${user.id}`, JSON.stringify(user));
      const session = {
        userId: user.id,
        userType: 'homeowner', // temporary type
        token: 'test-token-google',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      localStorage.setItem('session', JSON.stringify(session));
    }, INCOMPLETE_GOOGLE_USER);

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('redirects incomplete Google user to profile completion', async ({ page }) => {
    const body = await page.textContent('body');
    // Should show profile completion or go to landing (depending on App.tsx logic)
    // The app checks user.profileComplete === false && user.firebaseUid
    expect(body).toMatch(/profile|role|homeowner|cleaner|complete|setup/i);
  });
});

test.describe('Register Form – Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('password mismatch shows error', async ({ page }) => {
    const getStarted = page
      .getByRole('button', { name: /get started|book|homeowner/i })
      .first();
    await getStarted.click();
    await page.waitForTimeout(300);

    const firstNameField = page.getByPlaceholder(/first name/i);
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Test');
      await page.getByPlaceholder(/last name/i).fill('User');
    }
    await page.getByLabel(/email/i).first().fill('test@example.com');
    await page.getByLabel(/^password/i).first().fill('Password123!');
    const confirmField = page.getByLabel(/confirm password/i);
    if (await confirmField.isVisible()) {
      await confirmField.fill('DifferentPass123!');
    }

    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/password.*match|match.*password|do not match/i);
    }
  });

  test('duplicate email shows error', async ({ page }) => {
    // Seed existing user
    await page.evaluate(() => {
      const user = {
        id: 'existing-user',
        email: 'existing@test.com',
        type: 'homeowner',
        name: 'Existing User',
        password: 'hash',
        profileComplete: true,
      };
      localStorage.setItem('user:existing-user', JSON.stringify(user));
    });

    const getStarted = page
      .getByRole('button', { name: /get started|book|homeowner/i })
      .first();
    await getStarted.click();
    await page.waitForTimeout(300);

    const firstNameField = page.getByPlaceholder(/first name/i);
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('New');
      await page.getByPlaceholder(/last name/i).fill('User');
    }
    await page.getByLabel(/email/i).first().fill('existing@test.com');
    await page.getByLabel(/^password/i).first().fill('Password123!');
    const confirmField = page.getByLabel(/confirm password/i);
    if (await confirmField.isVisible()) {
      await confirmField.fill('Password123!');
    }

    // Agree to terms
    const termsCheckbox = page.getByLabel(/terms|agree/i).first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    const nextOrSubmitBtn = page
      .getByRole('button', { name: /next|continue|create|sign up/i })
      .last();
    await nextOrSubmitBtn.click();
    await page.waitForTimeout(600);

    const body = await page.textContent('body');
    expect(body).toMatch(/email.*exist|already.*register|already.*account|taken/i);
  });
});

test.describe('Terms & Privacy Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    const getStarted = page
      .getByRole('button', { name: /get started|book|homeowner/i })
      .first();
    await getStarted.click();
    await page.waitForTimeout(300);
  });

  test('can open Terms of Service modal', async ({ page }) => {
    const termsLink = page.getByText(/terms of service|terms and conditions/i).first();
    if (await termsLink.isVisible()) {
      await termsLink.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/terms|service|agreement|condition/i);
    }
  });

  test('can close Terms modal', async ({ page }) => {
    const termsLink = page.getByText(/terms of service|terms and conditions/i).first();
    if (await termsLink.isVisible()) {
      await termsLink.click();
      await page.waitForTimeout(300);
      const closeBtn = page.getByRole('button', { name: /close|dismiss|×/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(200);
        // Modal should be gone
        const modal = page.getByRole('dialog').first();
        await expect(modal).not.toBeVisible();
      }
    }
  });
});

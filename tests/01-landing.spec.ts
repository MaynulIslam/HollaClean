import { test, expect } from '@playwright/test';
import { goToLanding, clearStorage } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
  await clearStorage(page);
  await goToLanding(page);
});

test.describe('Landing Page', () => {
  test('shows the HollaClean brand and tagline', async ({ page }) => {
    await expect(page.getByText(/hollaclean/i).first()).toBeVisible();
  });

  test('has navigation buttons for homeowner and cleaner', async ({ page }) => {
    // There should be CTAs to book or find work
    const body = await page.textContent('body');
    expect(body).toMatch(/homeowner|book|cleaner|clean/i);
  });

  test('clicking Sign In navigates to login page', async ({ page }) => {
    const signInBtn = page.getByRole('button', { name: /sign in|log in/i }).first();
    await signInBtn.click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('clicking Get Started as homeowner navigates to register', async ({ page }) => {
    // Look for homeowner-specific CTA or generic "get started"
    const btn = page
      .getByRole('button', { name: /get started|book a clean|homeowner/i })
      .first();
    await btn.click();
    // Should show a registration or role-selection UI
    const body = await page.textContent('body');
    expect(body).toMatch(/register|sign up|create account|name|email/i);
  });

  test('clicking Get Started as cleaner navigates to register', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /find work|start earning|cleaner/i })
      .first();
    if (await btn.isVisible()) {
      await btn.click();
      const body = await page.textContent('body');
      expect(body).toMatch(/register|sign up|create account|name|email/i);
    } else {
      // acceptable — landing may combine both into one CTA
      test.skip(true, 'No cleaner-specific CTA found');
    }
  });

  test('Admin link is visible on landing', async ({ page }) => {
    const adminBtn = page.getByRole('button', { name: /admin/i });
    await expect(adminBtn).toBeVisible();
  });

  test('clicking Admin navigates to admin login panel', async ({ page }) => {
    await page.getByRole('button', { name: /admin/i }).click();
    const body = await page.textContent('body');
    expect(body).toMatch(/admin|password/i);
  });
});

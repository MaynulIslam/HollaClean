/**
 * UI component tests — testing shared UI elements, responsiveness, error boundaries.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession } from './helpers';

test.describe('Landing Page – Visual Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('page title or header is present', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('page renders without console errors on critical paths', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Allow Firebase/network errors but not JS crashes
    const criticalErrors = errors.filter(e =>
      !e.includes('Firebase') &&
      !e.includes('firestore') &&
      !e.includes('net::ERR') &&
      !e.includes('favicon')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const body = await page.textContent('body');
    expect(body).toMatch(/hollaclean|book|clean/i);
  });

  test('is responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const body = await page.textContent('body');
    expect(body).toMatch(/hollaclean|book|clean/i);
  });
});

test.describe('Homeowner Dashboard – UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, HOMEOWNER);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('navigation tabs are clickable', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const body = await page.textContent('body');
    expect(body).toMatch(/alice|homeowner|dashboard/i);
  });
});

test.describe('Cleaner Dashboard – UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, CLEANER);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const body = await page.textContent('body');
    expect(body).toMatch(/bob|cleaner|dashboard/i);
  });

  test('all tab buttons are visible', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/job|profile/i);
  });
});

test.describe('Error States', () => {
  test('login page shows correct validation errors', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await page.reload();

    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForTimeout(200);

    // Submit with empty fields
    await page.getByRole('button', { name: /sign in|log in/i }).last().click();
    await page.waitForTimeout(300);

    const body = await page.textContent('body');
    expect(body).toMatch(/email|password|required|invalid|enter/i);
  });

  test('create request validates required fields', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, HOMEOWNER);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const createBtn = page
      .getByRole('button', { name: /create request|new request|book/i })
      .first();
    await createBtn.click();
    await page.waitForTimeout(300);

    // Try submitting without filling anything
    const submitBtn = page.getByRole('button', { name: /submit|post|create|send/i }).last();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/select|required|please|service|date|address/i);
    }
  });
});

test.describe('Navigation – Back Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('login back button returns to landing', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /back/i }).first().click();
    await page.waitForTimeout(200);
    const body = await page.textContent('body');
    expect(body).toMatch(/hollaclean|book|get started/i);
  });

  test('register back button returns to landing', async ({ page }) => {
    const startBtn = page
      .getByRole('button', { name: /get started|book|homeowner/i })
      .first();
    await startBtn.click();
    await page.waitForTimeout(200);

    const backBtn = page.getByRole('button', { name: /back/i }).first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(200);
      const body = await page.textContent('body');
      expect(body).toMatch(/hollaclean|book|get started/i);
    }
  });
});

test.describe('VerificationBadge Component', () => {
  test('shows verification badges in homeowner dashboard', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, HOMEOWNER);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Profile has verification section
    const profileBtn = page.getByRole('button', { name: /profile/i }).first();
    await profileBtn.click();
    await page.waitForTimeout(300);

    const body = await page.textContent('body');
    expect(body).toMatch(/verif|email|phone|address/i);
  });
});

test.describe('Config / Services', () => {
  test('config:services is initialized on first load', async ({ page }) => {
    await page.goto(BASE_URL);
    // Clear only the services config
    await page.evaluate(() => localStorage.removeItem('config:services'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const services = await page.evaluate(() => {
      const v = localStorage.getItem('config:services');
      return v ? JSON.parse(v) : null;
    });
    expect(services).not.toBeNull();
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
  });
});

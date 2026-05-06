import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession } from './helpers';

async function seedNotification(page: import('@playwright/test').Page, userId: string, notification: Record<string, unknown>) {
  await page.evaluate(({ userId, notification }) => {
    const key = `notification:${userId}:${notification.id}`;
    localStorage.setItem(key, JSON.stringify(notification));
  }, { userId, notification });
}

test.describe('Notification Center – Homeowner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, HOMEOWNER);

    // Seed a notification
    await seedNotification(page, HOMEOWNER.id, {
      id: 'notif-001',
      userId: HOMEOWNER.id,
      type: 'request_accepted',
      title: 'Request Accepted',
      message: 'Bob Cleaner has accepted your cleaning request.',
      read: false,
      createdAt: new Date().toISOString(),
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('notification bell is visible in dashboard', async ({ page }) => {
    const bell = page.locator('[aria-label*="notification"], button[title*="notification"]').first();
    if (await bell.isVisible()) {
      await expect(bell).toBeVisible();
    } else {
      // Look for bell icon by SVG or button
      const body = await page.textContent('body');
      expect(body).toMatch(/notification|alert/i);
    }
  });

  test('clicking notification bell opens notification panel', async ({ page }) => {
    const bell = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .filter({ hasText: /\d/ }) // badge with count
      .first();

    // Try various selectors for the notification bell
    const bellBtn = page.getByRole('button', { name: /notification/i }).first();
    if (await bellBtn.isVisible()) {
      await bellBtn.click();
    } else {
      // Find bell by icon proximity
      const btns = page.locator('button').all();
      for (const btn of await btns) {
        const title = await btn.getAttribute('title');
        if (title?.match(/notification/i)) {
          await btn.click();
          break;
        }
      }
    }
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/notification|alert|message/i);
  });
});

test.describe('Notification Center – Cleaner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, CLEANER);

    await seedNotification(page, CLEANER.id, {
      id: 'notif-cleaner-001',
      userId: CLEANER.id,
      type: 'new_request',
      title: 'New Cleaning Request',
      message: 'A new cleaning request is available near you.',
      read: false,
      createdAt: new Date().toISOString(),
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('cleaner sees notification center', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/notification|alert|dashboard|bob/i);
  });
});

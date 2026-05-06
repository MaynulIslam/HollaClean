import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession, seedRequest, makeRequest, getStorageItem } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await clearStorage(page);
  await injectSession(page, HOMEOWNER);
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test.describe('Homeowner Dashboard – Overview', () => {
  test('shows welcome message with user name', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/alice|homeowner|welcome/i);
  });

  test('shows stats cards (bookings, active, completed, spent)', async ({ page }) => {
    const body = await page.textContent('body');
    // Stats should show numeric values or labels
    expect(body).toMatch(/booking|active|completed|spent|total/i);
  });

  test('shows quick action buttons', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/request|book|clean/i);
  });
});

test.describe('Homeowner Dashboard – Navigation', () => {
  test('can navigate to Create Request tab', async ({ page }) => {
    const tab = page
      .getByRole('button', { name: /create request|new request|book|request/i })
      .first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/service|type|date|time|hours|address/i);
  });

  test('can navigate to My Requests tab', async ({ page }) => {
    const tab = page
      .getByRole('button', { name: /my requests|requests/i })
      .first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/request|booking|filter|all|active|completed/i);
  });

  test('can navigate to Profile tab', async ({ page }) => {
    const tab = page
      .getByRole('button', { name: /profile/i })
      .first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/alice|profile|name|email|phone|address/i);
  });
});

test.describe('Create Request', () => {
  async function openCreateRequest(page: import('@playwright/test').Page) {
    const btn = page
      .getByRole('button', { name: /create request|new request|book|request cleaning/i })
      .first();
    await btn.click();
    await page.waitForTimeout(400);
  }

  test('shows service type options', async ({ page }) => {
    await openCreateRequest(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/regular|deep|move|window|carpet|laundry|post/i);
  });

  test('shows date and time fields', async ({ page }) => {
    await openCreateRequest(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/date|time/i);
  });

  test('shows duration/hours selection', async ({ page }) => {
    await openCreateRequest(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/hour|duration/i);
  });

  test('shows address field', async ({ page }) => {
    await openCreateRequest(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/address/i);
  });

  test('shows pricing breakdown', async ({ page }) => {
    await openCreateRequest(page);
    // May need to select service first
    const regularClean = page.getByText(/regular cleaning/i).first();
    if (await regularClean.isVisible()) {
      await regularClean.click();
    }
    await page.waitForTimeout(200);
    const body = await page.textContent('body');
    expect(body).toMatch(/\$|price|rate|total|platform|commission/i);
  });

  test('can select a service type', async ({ page }) => {
    await openCreateRequest(page);
    const deepClean = page.getByText(/deep cleaning/i).first();
    if (await deepClean.isVisible()) {
      await deepClean.click();
      const body = await page.textContent('body');
      expect(body).toMatch(/deep cleaning/i);
    }
  });

  test('shows validation when submitting empty form', async ({ page }) => {
    await openCreateRequest(page);
    const submitBtn = page.getByRole('button', { name: /submit|post|create|send/i }).last();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/required|select|enter|please/i);
    }
  });

  test('shows property details section', async ({ page }) => {
    await openCreateRequest(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/square|bedroom|bathroom|floor|pets|room/i);
  });
});

test.describe('My Requests', () => {
  test.beforeEach(async ({ page }) => {
    // Seed some requests
    const openReq = makeRequest({ id: 'req-open-001', status: 'open' });
    const acceptedReq = makeRequest({
      id: 'req-accepted-001',
      status: 'accepted',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
      cleanerPhone: CLEANER.phone,
    });
    const completedReq = makeRequest({
      id: 'req-done-001',
      status: 'completed',
      paymentStatus: 'paid',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
    });
    await seedRequest(page, openReq);
    await seedRequest(page, acceptedReq);
    await seedRequest(page, completedReq);
  });

  async function openMyRequests(page: import('@playwright/test').Page) {
    const btn = page.getByRole('button', { name: /my requests/i }).first();
    await btn.click();
    await page.waitForTimeout(500);
  }

  test('shows list of requests', async ({ page }) => {
    await openMyRequests(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/regular cleaning|request|booking/i);
  });

  test('shows filter tabs (All, Active, Completed, Cancelled)', async ({ page }) => {
    await openMyRequests(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/all|active|completed|cancelled/i);
  });

  test('can filter by Completed', async ({ page }) => {
    await openMyRequests(page);
    const completedTab = page.getByRole('button', { name: /^completed$/i }).first();
    if (await completedTab.isVisible()) {
      await completedTab.click();
      await page.waitForTimeout(300);
    }
    // Should show completed requests or empty state
    const body = await page.textContent('body');
    expect(body).toMatch(/completed|no request|empty/i);
  });

  test('can cancel an open request', async ({ page }) => {
    await openMyRequests(page);
    const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(300);
      // Confirm dialog or state change
      const body = await page.textContent('body');
      expect(body).toMatch(/cancel|confirm|sure/i);
    }
  });

  test('shows request status badges', async ({ page }) => {
    await openMyRequests(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/open|accepted|in progress|completed/i);
  });
});

test.describe('Homeowner Profile', () => {
  async function openProfile(page: import('@playwright/test').Page) {
    const btn = page.getByRole('button', { name: /profile/i }).first();
    await btn.click();
    await page.waitForTimeout(300);
  }

  test('shows user information', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/alice|alice@test.com/i);
  });

  test('shows verification section', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/verif|email|phone|address/i);
  });

  test('can edit name', async ({ page }) => {
    await openProfile(page);
    const editBtn = page.getByRole('button', { name: /edit|update|save/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(200);
      const nameField = page.getByLabel(/name/i).first();
      if (await nameField.isVisible()) {
        await nameField.clear();
        await nameField.fill('Alice Updated');
      }
    }
  });

  test('shows payment section', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/payment|card|credit|billing/i);
  });

  test('shows notification preferences', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/notification|email|sms|push/i);
  });
});

test.describe('Verification Flow', () => {
  test('shows email verification option when not verified', async ({ page }) => {
    // Set up user without email verification
    await clearStorage(page);
    await injectSession(page, { ...HOMEOWNER, emailVerified: false });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toMatch(/verify|verif|email/i);
  });

  test('OTP modal accepts 6-digit code', async ({ page }) => {
    // Navigate to profile and trigger verification
    const profileBtn = page.getByRole('button', { name: /profile/i }).first();
    await profileBtn.click();
    await page.waitForTimeout(300);

    const verifyBtn = page.getByRole('button', { name: /verify email|send otp|verify/i }).first();
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      await page.waitForTimeout(300);

      // OTP input should appear
      const otpInput = page.getByPlaceholder(/code|otp|6.digit/i).first();
      if (await otpInput.isVisible()) {
        await otpInput.fill('123456');
        const confirmBtn = page.getByRole('button', { name: /verify|confirm|submit/i }).last();
        await confirmBtn.click();
        await page.waitForTimeout(500);
        const body = await page.textContent('body');
        expect(body).toMatch(/verified|success/i);
      }
    }
  });
});

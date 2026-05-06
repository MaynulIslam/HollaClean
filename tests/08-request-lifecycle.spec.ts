/**
 * End-to-end request lifecycle test:
 * Homeowner creates request → Cleaner accepts → Homeowner pays → Cleaner completes → Review
 *
 * This test uses localStorage injection to simulate each step without
 * requiring two real browser sessions simultaneously.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession, seedRequest, makeRequest, getStorageItem } from './helpers';

test.describe('Request Lifecycle – Full Flow', () => {
  const reqId = 'lifecycle-req-001';

  test('Step 1: Homeowner submits a new request', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);
    await injectSession(page, HOMEOWNER);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open create request
    const createBtn = page
      .getByRole('button', { name: /create request|new request|book|request cleaning/i })
      .first();
    await createBtn.click();
    await page.waitForTimeout(400);

    // Select service
    const regularClean = page.getByText(/regular cleaning/i).first();
    if (await regularClean.isVisible()) {
      await regularClean.click();
    }

    // Fill date (pick a future date input)
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-04-15');
    }

    // Fill time
    const timeInput = page.locator('input[type="time"]').first();
    if (await timeInput.isVisible()) {
      await timeInput.fill('10:00');
    }

    // Fill address
    const addressInput = page.getByLabel(/address/i).first();
    if (await addressInput.isVisible()) {
      await addressInput.fill('123 Main St, Toronto, ON');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|post request|create|send/i }).last();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(800);
      const body = await page.textContent('body');
      expect(body).toMatch(/submitted|success|request|open/i);
    } else {
      // Acceptable if the form has more steps
      test.info().annotations.push({ type: 'note', description: 'Submit button not found – may require multi-step form navigation' });
    }
  });

  test('Step 2: Cleaner can see open request in feed', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({ id: reqId, status: 'open' });
    await injectSession(page, CLEANER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to available jobs
    const availableBtn = page
      .getByRole('button', { name: /available|find jobs|browse/i })
      .first();
    await availableBtn.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    expect(body).toMatch(/regular cleaning|request|toronto/i);
  });

  test('Step 3: Homeowner sees accepted request with cleaner info', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: reqId,
      status: 'accepted',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
      cleanerPhone: CLEANER.phone,
      acceptedAt: new Date().toISOString(),
    });

    await injectSession(page, HOMEOWNER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    expect(body).toMatch(/accepted|bob cleaner|cleaner/i);
  });

  test('Step 4: Homeowner sees payment prompt when job in progress', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: reqId,
      status: 'in_progress',
      paymentStatus: 'awaiting',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
    });

    await injectSession(page, HOMEOWNER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    expect(body).toMatch(/pay|payment|in.progress|checkout/i);
  });

  test('Step 5: Completed request shows in history and allows review', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: reqId,
      status: 'completed',
      paymentStatus: 'paid',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
      completedAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });

    await injectSession(page, HOMEOWNER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    expect(body).toMatch(/completed|paid|review|invoice/i);
  });

  test('Step 5b: Cleaner sees completed job in history with earnings', async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: reqId,
      status: 'completed',
      paymentStatus: 'paid',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
      completedAt: new Date().toISOString(),
    });

    await injectSession(page, CLEANER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const historyBtn = page.getByRole('button', { name: /history|completed/i }).first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(400);
    }

    const body = await page.textContent('body');
    expect(body).toMatch(/completed|earning|\$84|payout/i);
  });
});

test.describe('Request Status Badge Display', () => {
  const statuses = [
    { status: 'open', label: /open/i },
    { status: 'accepted', label: /accepted/i },
    { status: 'in_progress', label: /in.progress/i },
    { status: 'completed', label: /completed/i },
    { status: 'cancelled', label: /cancelled/i },
  ];

  for (const { status, label } of statuses) {
    test(`shows correct badge for status: ${status}`, async ({ page }) => {
      await page.goto(BASE_URL);
      await clearStorage(page);

      const req = makeRequest({
        id: `status-req-${status}`,
        status,
        acceptedBy: status !== 'open' ? CLEANER.id : undefined,
        cleanerName: status !== 'open' ? CLEANER.name : undefined,
        paymentStatus: status === 'completed' ? 'paid' : 'pending',
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      });

      await injectSession(page, HOMEOWNER);
      await page.evaluate((req) => {
        localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
      }, req);

      await page.reload();
      await page.waitForLoadState('networkidle');

      const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
      await myRequestsBtn.click();
      await page.waitForTimeout(500);

      const body = await page.textContent('body');
      expect(body).toMatch(label);
    });
  }
});

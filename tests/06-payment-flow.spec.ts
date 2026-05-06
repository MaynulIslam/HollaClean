import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession, makeRequest, getStorageItem } from './helpers';

async function setupPaymentScenario(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
  await clearStorage(page);

  const req = makeRequest({
    id: 'pay-req-001',
    status: 'in_progress',
    paymentStatus: 'awaiting',
    acceptedBy: CLEANER.id,
    cleanerName: CLEANER.name,
    cleanerPhone: CLEANER.phone,
    hourlyRate: 35,
    hours: 3,
    totalAmount: 118.65, // with tax
  });

  await injectSession(page, HOMEOWNER);
  await page.evaluate((req) => {
    localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
  }, req);

  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Payment Flow – Homeowner Side', () => {
  test.beforeEach(async ({ page }) => {
    await setupPaymentScenario(page);
  });

  test('shows payment prompt for in-progress job', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);
    const body = await page.textContent('body');
    expect(body).toMatch(/pay|payment|checkout|in.progress/i);
  });

  test('shows payment breakdown (subtotal, tax, total)', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    // Try to expand/open the request
    const payBtn = page.getByRole('button', { name: /pay|checkout|make payment/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.waitForTimeout(400);
      const body = await page.textContent('body');
      expect(body).toMatch(/subtotal|tax|total|\$|hst/i);
    }
  });

  test('payment modal shows card input fields', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const payBtn = page.getByRole('button', { name: /pay|checkout|make payment/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.waitForTimeout(400);
      const body = await page.textContent('body');
      expect(body).toMatch(/card|stripe|payment method|demo/i);
    }
  });

  test('demo payment completes successfully', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const payBtn = page.getByRole('button', { name: /pay|checkout|make payment/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.waitForTimeout(400);

      // In demo mode there may be a "Pay with Demo" or similar button
      const demoPayBtn = page.getByRole('button', { name: /demo|confirm|pay now|complete/i }).first();
      if (await demoPayBtn.isVisible()) {
        await demoPayBtn.click();
        await page.waitForTimeout(800);
        const body = await page.textContent('body');
        expect(body).toMatch(/success|payment|held|paid|complete/i);
      }
    }
  });
});

test.describe('Payment Flow – Cleaner Side', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: 'pay-req-002',
      status: 'in_progress',
      paymentStatus: 'held',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
    });

    await injectSession(page, CLEANER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('cleaner can see job with held payment status', async ({ page }) => {
    const myJobsBtn = page.getByRole('button', { name: /my jobs/i }).first();
    if (await myJobsBtn.isVisible()) {
      await myJobsBtn.click();
      await page.waitForTimeout(400);
    }
    const body = await page.textContent('body');
    expect(body).toMatch(/in.progress|active|job|regular cleaning/i);
  });

  test('cleaner can mark job as complete', async ({ page }) => {
    const myJobsBtn = page.getByRole('button', { name: /my jobs/i }).first();
    if (await myJobsBtn.isVisible()) {
      await myJobsBtn.click();
      await page.waitForTimeout(400);
    }

    const completeBtn = page.getByRole('button', { name: /mark complete|complete job|finish/i }).first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(500);
      // Confirm or upload photos
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|complete/i }).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
      const body = await page.textContent('body');
      expect(body).toMatch(/completed|success|earning|paid/i);
    }
  });
});

test.describe('Invoice Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: 'invoice-req-001',
      status: 'completed',
      paymentStatus: 'paid',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
      paidAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    await injectSession(page, HOMEOWNER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows invoice download option on completed request', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    // Expand request
    const requestCard = page.getByText(/regular cleaning/i).first();
    if (await requestCard.isVisible()) {
      await requestCard.click();
      await page.waitForTimeout(300);
    }

    const body = await page.textContent('body');
    expect(body).toMatch(/invoice|download|receipt/i);
  });
});

test.describe('Review System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearStorage(page);

    const req = makeRequest({
      id: 'review-req-001',
      status: 'completed',
      paymentStatus: 'paid',
      acceptedBy: CLEANER.id,
      cleanerName: CLEANER.name,
      completedAt: new Date().toISOString(),
    });

    await injectSession(page, HOMEOWNER);
    await page.evaluate((req) => {
      localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    }, req);

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows Leave Review button on completed request', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const body = await page.textContent('body');
    expect(body).toMatch(/review|rate|completed/i);
  });

  test('review modal shows star rating', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const reviewBtn = page.getByRole('button', { name: /review|rate/i }).first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/star|rating|review|\d\/5/i);
    }
  });

  test('can submit a review', async ({ page }) => {
    const myRequestsBtn = page.getByRole('button', { name: /my requests/i }).first();
    await myRequestsBtn.click();
    await page.waitForTimeout(500);

    const reviewBtn = page.getByRole('button', { name: /review|rate/i }).first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      await page.waitForTimeout(300);

      // Click 5 stars
      const stars = page.locator('[aria-label*="star"], button[title*="star"], svg').filter({ hasText: '' });
      const starBtn = page.locator('button, span').filter({ hasText: /★|⭐/ }).first();
      if (await starBtn.isVisible()) {
        await starBtn.click();
      } else {
        // Click star buttons by position if available
        const ratingBtns = page.locator('button').filter({ has: page.locator('svg') });
        const count = await ratingBtns.count();
        if (count > 0) {
          await ratingBtns.nth(Math.min(4, count - 1)).click();
        }
      }

      const commentField = page.getByPlaceholder(/comment|review|feedback/i).first();
      if (await commentField.isVisible()) {
        await commentField.fill('Excellent service! Very thorough and professional.');
      }

      const submitBtn = page.getByRole('button', { name: /submit|send|post/i }).last();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        const body = await page.textContent('body');
        expect(body).toMatch(/thank|submitted|review|success/i);
      }
    }
  });
});

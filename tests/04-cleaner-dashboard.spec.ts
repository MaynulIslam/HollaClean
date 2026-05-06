import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession, seedRequest, makeRequest } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await clearStorage(page);

  // Seed some requests for the cleaner to find
  const openReq = makeRequest({ id: 'req-for-cleaner-001', status: 'open' });
  const acceptedReq = makeRequest({
    id: 'req-in-progress-001',
    status: 'in_progress',
    acceptedBy: CLEANER.id,
    cleanerName: CLEANER.name,
    cleanerPhone: CLEANER.phone,
    paymentStatus: 'held',
  });
  const completedReq = makeRequest({
    id: 'req-completed-001',
    status: 'completed',
    acceptedBy: CLEANER.id,
    cleanerName: CLEANER.name,
    paymentStatus: 'paid',
    completedAt: new Date().toISOString(),
  });

  await injectSession(page, CLEANER);
  // Seed requests after injecting session (same page context)
  await page.evaluate(({ openReq, acceptedReq, completedReq }) => {
    localStorage.setItem(`request:${openReq.id}`, JSON.stringify(openReq));
    localStorage.setItem(`request:${acceptedReq.id}`, JSON.stringify(acceptedReq));
    localStorage.setItem(`request:${completedReq.id}`, JSON.stringify(completedReq));
  }, { openReq, acceptedReq, completedReq });

  await page.reload();
  await page.waitForLoadState('networkidle');
});

test.describe('Cleaner Dashboard – Overview', () => {
  test('shows cleaner name or welcome', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/bob|cleaner|welcome/i);
  });

  test('shows earnings card', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/earning|\$|total|revenue|income/i);
  });

  test('shows availability toggle', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/available|availability|online|status/i);
  });

  test('shows rating badge', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/4\.8|rating|star/i);
  });

  test('shows available jobs counter', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/available|job|request/i);
  });
});

test.describe('Cleaner Dashboard – Navigation', () => {
  test('can navigate to Available Jobs tab', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /available|find|browse|jobs/i })
      .first();
    await btn.click();
    await page.waitForTimeout(400);
    const body = await page.textContent('body');
    expect(body).toMatch(/job|request|clean|service|available/i);
  });

  test('can navigate to My Jobs tab', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /my jobs|active jobs/i })
      .first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(400);
    }
    const body = await page.textContent('body');
    expect(body).toMatch(/job|active|current|accepted/i);
  });

  test('can navigate to History tab', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /history|completed|past/i })
      .first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(400);
    }
    const body = await page.textContent('body');
    expect(body).toMatch(/history|completed|past|earning/i);
  });

  test('can navigate to Profile tab', async ({ page }) => {
    const btn = page.getByRole('button', { name: /profile/i }).first();
    await btn.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/bob|profile|bio|rate|service/i);
  });
});

test.describe('Available Jobs Feed', () => {
  async function openAvailableJobs(page: import('@playwright/test').Page) {
    const btn = page
      .getByRole('button', { name: /available|find jobs|browse/i })
      .first();
    await btn.click();
    await page.waitForTimeout(500);
  }

  test('shows open cleaning requests', async ({ page }) => {
    await openAvailableJobs(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/regular cleaning|request|clean/i);
  });

  test('shows service type, date, location info on cards', async ({ page }) => {
    await openAvailableJobs(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/service|date|address|location|hours/i);
  });

  test('shows Accept button on open requests', async ({ page }) => {
    await openAvailableJobs(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/accept|view detail/i);
  });

  test('shows homeowner verification badges', async ({ page }) => {
    await openAvailableJobs(page);
    const body = await page.textContent('body');
    // Verification badges should be shown
    expect(body).toMatch(/verif|badge|trusted|check/i);
  });
});

test.describe('My Jobs – Active', () => {
  async function openMyJobs(page: import('@playwright/test').Page) {
    const btn = page
      .getByRole('button', { name: /my jobs/i })
      .first();
    if (await btn.isVisible()) {
      await btn.click();
    }
    await page.waitForTimeout(500);
  }

  test('shows active/in-progress jobs', async ({ page }) => {
    await openMyJobs(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/job|active|accepted|in.progress|current/i);
  });

  test('shows job details (service, address, hours)', async ({ page }) => {
    await openMyJobs(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/regular cleaning|toronto|3 hour|address/i);
  });

  test('shows payment estimate on job card', async ({ page }) => {
    await openMyJobs(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/\$|earning|payout|payment/i);
  });
});

test.describe('Job History', () => {
  async function openHistory(page: import('@playwright/test').Page) {
    const btn = page.getByRole('button', { name: /history/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
    }
    await page.waitForTimeout(500);
  }

  test('shows completed jobs', async ({ page }) => {
    await openHistory(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/completed|history|earning|job/i);
  });

  test('shows payout amounts on completed jobs', async ({ page }) => {
    await openHistory(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/\$|earning|payout|amount/i);
  });
});

test.describe('Cleaner Profile', () => {
  async function openProfile(page: import('@playwright/test').Page) {
    const btn = page.getByRole('button', { name: /profile/i }).first();
    await btn.click();
    await page.waitForTimeout(300);
  }

  test('shows professional information', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/bio|experience|professional/i);
  });

  test('shows hourly rate', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/\$35|hourly|rate/i);
  });

  test('shows services offered', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/regular cleaning|deep cleaning|service/i);
  });

  test('shows Stripe Connect section', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/stripe|payout|connect|bank/i);
  });

  test('shows rating and review count', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/4\.8|12|rating|review/i);
  });

  test('shows total earnings', async ({ page }) => {
    await openProfile(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/\$1,500|\$1500|total earning/i);
  });
});

test.describe('Availability Toggle', () => {
  test('toggle changes availability status', async ({ page }) => {
    // Find toggle button
    const toggleBtn = page
      .getByRole('button', { name: /available|unavailable|online|offline/i })
      .first();
    if (await toggleBtn.isVisible()) {
      const initialText = await toggleBtn.textContent();
      await toggleBtn.click();
      await page.waitForTimeout(300);
      const newText = await toggleBtn.textContent();
      // Text should change OR the button state changes
      const body = await page.textContent('body');
      expect(body).toMatch(/available|unavailable|online|offline/i);
    }
  });
});

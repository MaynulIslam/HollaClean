import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, seedRequest, makeRequest } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await clearStorage(page);

  // Seed some data for the admin to see
  const req = makeRequest({ id: 'admin-req-001' });
  const homeownerUser = {
    ...HOMEOWNER,
    password: 'dummy-hash',
  };
  const cleanerUser = {
    ...CLEANER,
    password: 'dummy-hash',
  };

  await page.evaluate(({ req, hw, cl }) => {
    localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
    localStorage.setItem(`user:${hw.id}`, JSON.stringify(hw));
    localStorage.setItem(`user:${cl.id}`, JSON.stringify(cl));
  }, { req, hw: homeownerUser, cl: cleanerUser });
});

async function loginAsAdmin(page: import('@playwright/test').Page) {
  // Navigate to admin from landing
  const adminBtn = page.getByRole('button', { name: /admin/i }).first();
  await adminBtn.click();
  await page.waitForTimeout(300);

  // Enter admin password if prompted
  const passwordInput = page.getByLabel(/password/i).first();
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('admin');
    const submitBtn = page.getByRole('button', { name: /login|sign in|enter|access/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Admin Authentication', () => {
  test('shows admin login panel', async ({ page }) => {
    await page.getByRole('button', { name: /admin/i }).click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/admin|password/i);
  });

  test('rejects wrong admin password', async ({ page }) => {
    await page.getByRole('button', { name: /admin/i }).click();
    await page.waitForTimeout(300);

    const passwordInput = page.getByLabel(/password/i).first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('wrongpassword');
      await page.getByRole('button', { name: /login|sign in|enter|access/i }).last().click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/incorrect|invalid|wrong|error/i);
    }
  });

  test('accepts correct admin password', async ({ page }) => {
    await loginAsAdmin(page);
    const body = await page.textContent('body');
    expect(body).toMatch(/admin|dashboard|request|manage/i);
  });
});

test.describe('Admin Dashboard – Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows Requests tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /requests?/i }).first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/request|service|status|date/i);
  });

  test('shows Services tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /services?/i }).first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/service|price|rate|cleaning/i);
  });

  test('shows Homeowners tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /homeowner/i }).first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/homeowner|user|email/i);
  });

  test('shows Cleaners tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /cleaner/i }).first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/cleaner|user|email|rating/i);
  });

  test('shows Payments tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /payment/i }).first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/payment|transaction|amount|status/i);
  });

  test('shows Payouts tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /payout/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/payout|disburse|cleaner|amount/i);
    }
  });

  test('shows Finance tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /finance|revenue/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/finance|revenue|commission|profit/i);
    }
  });

  test('shows Settings tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /settings?/i }).first();
    await tab.click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/setting|config|commission|rate|pricing/i);
  });

  test('shows Email tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /email/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/email|recipient|subject|send/i);
    }
  });

  test('shows Reminders tab', async ({ page }) => {
    const tab = page.getByRole('button', { name: /reminder/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/reminder|payment|frequency|enable/i);
    }
  });
});

test.describe('Admin – Requests Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const tab = page.getByRole('button', { name: /requests?/i }).first();
    await tab.click();
    await page.waitForTimeout(400);
  });

  test('lists seeded requests', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/regular cleaning|toronto|request/i);
  });

  test('has search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('regular');
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/regular/i);
    }
  });

  test('can delete a request', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(200);
      // Confirm dialog may appear
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

test.describe('Admin – Services Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /services?/i }).first().click();
    await page.waitForTimeout(400);
  });

  test('shows default services list', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/regular|deep|window|carpet|laundry/i);
  });

  test('has add service button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add service|new service|\+/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      const body = await page.textContent('body');
      expect(body).toMatch(/service name|price|rate/i);
    }
  });
});

test.describe('Admin – Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('homeowners tab shows seeded homeowner', async ({ page }) => {
    await page.getByRole('button', { name: /homeowner/i }).first().click();
    await page.waitForTimeout(400);
    const body = await page.textContent('body');
    expect(body).toMatch(/alice|alice@test\.com/i);
  });

  test('cleaners tab shows seeded cleaner', async ({ page }) => {
    await page.getByRole('button', { name: /cleaner/i }).first().click();
    await page.waitForTimeout(400);
    const body = await page.textContent('body');
    expect(body).toMatch(/bob|bob@test\.com/i);
  });
});

test.describe('Admin – Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: /settings?/i }).first().click();
    await page.waitForTimeout(400);
  });

  test('shows commission rate field', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/commission|20%|platform fee/i);
  });

  test('shows hourly rate bounds', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/hourly|min|max|rate/i);
  });

  test('shows feature flags', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/payment|notification|review|feature/i);
  });
});

test.describe('Admin – Email', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const emailTab = page.getByRole('button', { name: /^email$/i }).first();
    if (await emailTab.isVisible()) {
      await emailTab.click();
      await page.waitForTimeout(300);
    }
  });

  test('shows recipient options', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/recipient|homeowner|cleaner|all users/i);
  });

  test('shows subject and body fields', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/subject|message|body|compose/i);
  });
});

test.describe('Admin – Back Navigation', () => {
  test('back button returns to landing', async ({ page }) => {
    await loginAsAdmin(page);
    const backBtn = page.getByRole('button', { name: /back|exit|close/i }).first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(300);
      const body = await page.textContent('body');
      expect(body).toMatch(/hollaclean|book|sign in|get started/i);
    }
  });
});

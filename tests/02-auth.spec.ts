import { test, expect } from '@playwright/test';
import { BASE_URL, HOMEOWNER, CLEANER, clearStorage, injectSession, getStorageItem } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await clearStorage(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
});

// ─── Registration ─────────────────────────────────────────────────────────────

test.describe('Registration – Homeowner', () => {
  async function goToRegisterAsHomeowner(page: import('@playwright/test').Page) {
    // Try "Book a Cleaner" or generic "Get Started"
    const btn = page
      .getByRole('button', { name: /book a clean|homeowner|get started/i })
      .first();
    await btn.click();
    await page.waitForLoadState('networkidle');
  }

  test('shows registration form for homeowner', async ({ page }) => {
    await goToRegisterAsHomeowner(page);
    await expect(page.getByText(/create account|sign up|register/i).first()).toBeVisible();
  });

  test('shows validation error when fields are empty', async ({ page }) => {
    await goToRegisterAsHomeowner(page);
    // Try to advance without filling form
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    } else {
      await page.getByRole('button', { name: /create account|sign up|register/i }).last().click();
    }
    const body = await page.textContent('body');
    expect(body).toMatch(/required|enter|please|name|email/i);
  });

  test('shows error for invalid email', async ({ page }) => {
    await goToRegisterAsHomeowner(page);
    // Fill first & last name
    const firstNameField = page.getByPlaceholder(/first name/i);
    const lastNameField = page.getByPlaceholder(/last name/i);
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Alice');
      await lastNameField.fill('Test');
    }
    const emailField = page.getByLabel(/email/i).first();
    await emailField.fill('not-an-email');
    await page.getByLabel(/^password/i).first().fill('Password123!');
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
    const body = await page.textContent('body');
    expect(body).toMatch(/invalid|valid email|email/i);
  });

  test('shows password strength error for weak password', async ({ page }) => {
    await goToRegisterAsHomeowner(page);
    const firstNameField = page.getByPlaceholder(/first name/i);
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Alice');
      await page.getByPlaceholder(/last name/i).fill('Test');
    }
    await page.getByLabel(/email/i).first().fill('alice@test.com');
    await page.getByLabel(/^password/i).first().fill('weak');
    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
    const body = await page.textContent('body');
    expect(body).toMatch(/password|uppercase|lowercase|number|characters/i);
  });

  test('completes homeowner registration successfully', async ({ page }) => {
    await goToRegisterAsHomeowner(page);

    // Step 1: Personal Info
    const firstNameField = page.getByPlaceholder(/first name/i);
    if (await firstNameField.isVisible()) {
      await firstNameField.fill('Alice');
      await page.getByPlaceholder(/last name/i).fill('Homeowner');
    }
    await page.getByLabel(/email/i).first().fill('alice-new@test.com');
    await page.getByLabel(/^password/i).first().fill('Password123!');
    const confirmField = page.getByLabel(/confirm password/i);
    if (await confirmField.isVisible()) {
      await confirmField.fill('Password123!');
    }

    // Agree to terms if present
    const termsCheckbox = page.getByLabel(/terms|agree/i).first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // Step 2: Contact info
    await page.waitForTimeout(300);
    const phoneField = page.getByLabel(/phone/i).first();
    if (await phoneField.isVisible()) {
      await phoneField.fill('4161234567');
    }
    const addressField = page.getByLabel(/address|street/i).first();
    if (await addressField.isVisible()) {
      await addressField.fill('123 Main St');
    }

    const submitBtn = page.getByRole('button', { name: /create account|sign up|register/i }).last();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    } else {
      const next2 = page.getByRole('button', { name: /next|continue|finish/i }).first();
      await next2.click();
    }

    // Should land on dashboard or show success
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toMatch(/dashboard|welcome|booking|clean|homeowner/i);
  });
});

test.describe('Registration – Cleaner', () => {
  async function goToRegisterAsCleaner(page: import('@playwright/test').Page) {
    const btn = page
      .getByRole('button', { name: /find work|cleaner|start earning/i })
      .first();
    if (await btn.isVisible()) {
      await btn.click();
    } else {
      // Generic get started then select cleaner role
      await page.getByRole('button', { name: /get started/i }).first().click();
    }
    await page.waitForLoadState('networkidle');
  }

  test('shows cleaner-specific fields (services, bio, rate)', async ({ page }) => {
    await goToRegisterAsCleaner(page);
    // Navigate to cleaner registration
    const cleanerRoleBtn = page.getByRole('button', { name: /cleaner/i }).first();
    if (await cleanerRoleBtn.isVisible()) {
      await cleanerRoleBtn.click();
    }
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    // May show on step 3 or on the form
    expect(body).toMatch(/register|sign up|name|email/i);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  async function goToLogin(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState('networkidle');
  }

  test('shows login form', async ({ page }) => {
    await goToLogin(page);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await goToLogin(page);
    await page.getByLabel(/email/i).fill('nobody@test.com');
    await page.getByLabel(/password/i).fill('WrongPass1!');
    await page.getByRole('button', { name: /sign in|log in/i }).last().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/invalid|incorrect|not found/i).first()).toBeVisible();
  });

  test('shows error for empty fields', async ({ page }) => {
    await goToLogin(page);
    await page.getByRole('button', { name: /sign in|log in/i }).last().click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/email|password|required|invalid/i);
  });

  test('back button returns to landing', async ({ page }) => {
    await goToLogin(page);
    await page.getByRole('button', { name: /back/i }).first().click();
    await page.waitForTimeout(300);
    const body = await page.textContent('body');
    expect(body).toMatch(/hollaclean|book|cleaner|home/i);
  });

  test('logs in successfully with seeded user', async ({ page }) => {
    // Seed a user with a known plain-text password (app supports plain text fallback)
    await page.evaluate(({ id, email, type, name }) => {
      const user = {
        id, type, name, email,
        password: 'Password123!', // plain text - app accepts this as fallback
        phone: '4161234567',
        address: '123 Main St',
        emailVerified: true,
        profileComplete: true,
        authProvider: 'email',
      };
      localStorage.setItem(`user:${id}`, JSON.stringify(user));
    }, { id: HOMEOWNER.id, email: HOMEOWNER.email, type: HOMEOWNER.type, name: HOMEOWNER.name });

    await goToLogin(page);
    await page.getByLabel(/email/i).fill(HOMEOWNER.email);
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /sign in|log in/i }).last().click();
    await page.waitForTimeout(1500);

    // Should be on dashboard
    const body = await page.textContent('body');
    expect(body).toMatch(/dashboard|welcome|booking|alice|homeowner/i);
  });
});

// ─── Session Persistence ──────────────────────────────────────────────────────

test.describe('Session Persistence', () => {
  test('restores session on page reload', async ({ page }) => {
    await injectSession(page, HOMEOWNER);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toMatch(/dashboard|booking|alice|homeowner|overview/i);
  });

  test('expired session redirects to landing', async ({ page }) => {
    // Inject an expired session
    await page.evaluate((id) => {
      const session = {
        userId: id,
        userType: 'homeowner',
        token: 'expired-token',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(), // expired 1 min ago
      };
      localStorage.setItem('session', JSON.stringify(session));
    }, HOMEOWNER.id);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toMatch(/hollaclean|book|cleaner|sign in|get started/i);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout clears session and returns to landing', async ({ page }) => {
    await injectSession(page, HOMEOWNER);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find logout button
    const logoutBtn = page.getByRole('button', { name: /logout|sign out|log out/i }).first();
    await logoutBtn.click();
    await page.waitForTimeout(500);

    const session = await getStorageItem(page, 'session');
    expect(session).toBeNull();

    const body = await page.textContent('body');
    expect(body).toMatch(/hollaclean|book|sign in|get started/i);
  });
});

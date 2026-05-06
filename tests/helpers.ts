import { Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:3000';

// ─── User fixtures ────────────────────────────────────────────────────────────

export const HOMEOWNER = {
  id: 'test-homeowner-001',
  type: 'homeowner' as const,
  name: 'Alice Homeowner',
  email: 'alice@test.com',
  phone: '4161234567',
  address: '123 Main St, Toronto, ON',
  emailVerified: true,
  phoneVerified: true,
  addressVerified: true,
  profileComplete: true,
  authProvider: 'email',
};

export const CLEANER = {
  id: 'test-cleaner-001',
  type: 'cleaner' as const,
  name: 'Bob Cleaner',
  email: 'bob@test.com',
  phone: '4169876543',
  address: '456 Oak Ave, Toronto, ON',
  emailVerified: true,
  phoneVerified: true,
  addressVerified: true,
  profileComplete: true,
  authProvider: 'email',
  isAvailable: true,
  hourlyRate: 35,
  bio: 'Professional cleaner with 5 years experience',
  services: ['Regular Cleaning', 'Deep Cleaning'],
  rating: 4.8,
  reviewCount: 12,
  totalEarnings: 1500,
};

export const ADMIN_PASSWORD = 'admin';

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Clear all HollaClean data from localStorage */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  });
}

/**
 * Inject a user + valid session into localStorage so the app considers
 * the user logged in on next load (or reload).
 * Storage key format used by the app: `user:<id>` and `session`.
 */
export async function injectSession(
  page: Page,
  user: typeof HOMEOWNER | typeof CLEANER,
  passwordHash = 'dummy-hash'
) {
  await page.evaluate(({ user, passwordHash }) => {
    const fullUser = { ...user, passwordHash };
    localStorage.setItem(`user:${user.id}`, JSON.stringify(fullUser));
    localStorage.setItem('currentUser', JSON.stringify(fullUser));

    const session = {
      userId: user.id,
      userType: user.type,
      token: 'test-token-' + user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem('session', JSON.stringify(session));
  }, { user, passwordHash });
}

/** Seed a cleaning request into localStorage */
export async function seedRequest(page: Page, request: Record<string, unknown>) {
  await page.evaluate((req) => {
    localStorage.setItem(`request:${req.id}`, JSON.stringify(req));
  }, request);
}

/** Read a key from localStorage */
export async function getStorageItem<T>(page: Page, key: string): Promise<T | null> {
  return page.evaluate((k) => {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  }, key);
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

/** Go to the landing page */
export async function goToLanding(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

/** Inject session then reload so App.tsx reads it */
export async function loginAs(
  page: Page,
  user: typeof HOMEOWNER | typeof CLEANER
) {
  await page.goto(BASE_URL);
  await injectSession(page, user);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// ─── Request fixtures ─────────────────────────────────────────────────────────

export function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-req-001',
    homeownerId: HOMEOWNER.id,
    homeownerName: HOMEOWNER.name,
    homeownerPhone: HOMEOWNER.phone,
    homeownerEmail: HOMEOWNER.email,
    serviceType: 'Regular Cleaning',
    date: '2026-04-01',
    time: '10:00',
    hours: 3,
    address: HOMEOWNER.address,
    instructions: 'Please be thorough.',
    images: [],
    status: 'open',
    paymentStatus: 'pending',
    totalAmount: 105,
    platformCommission: 21,
    cleanerPayout: 84,
    hourlyRate: 35,
    taxAmount: 13.65,
    taxRate: 0.13,
    squareFootage: 1000,
    floorType: 'hardwood',
    numberOfRooms: 3,
    numberOfBedrooms: 2,
    numberOfBathrooms: 1,
    numberOfKitchens: 1,
    numberOfLivingRooms: 1,
    numberOfOtherRooms: 0,
    hasPets: false,
    ...overrides,
  };
}

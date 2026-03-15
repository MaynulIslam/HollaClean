/**
 * Payment API Client
 *
 * Handles all communication with the HollaClean payment server
 */

const API_BASE = 'http://localhost:3001/api';

// ==================== PAYMENT INTENTS ====================

export interface PaymentBreakdown {
  total: number;
  platformFee: number;
  cleanerPayout: number;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  breakdown: PaymentBreakdown;
}

/**
 * Create a payment intent for a cleaning job
 */
export async function createPaymentIntent(params: {
  amount: number;
  requestId: string;
  homeownerId: string;
  homeownerEmail?: string;
  cleanerId: string;
  description?: string;
  commissionRate?: number; // admin-configurable, e.g. 0.20 for 20%
}): Promise<CreatePaymentIntentResponse> {
  const response = await fetch(`${API_BASE}/payments/create-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentIntentId: string) {
  const response = await fetch(`${API_BASE}/payments/${paymentIntentId}`);
  if (!response.ok) throw new Error('Failed to get payment status');
  return response.json();
}

// ==================== STRIPE CONNECT (Cleaners) ====================

export interface ConnectStatus {
  connected: boolean;
  status: 'not_started' | 'pending' | 'active';
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  message: string;
}

/**
 * Create a Stripe Connect account for a cleaner
 */
export async function createConnectAccount(params: {
  cleanerId: string;
  email: string;
  name: string;
}): Promise<{ accountId: string; alreadyExists?: boolean }> {
  const response = await fetch(`${API_BASE}/connect/create-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create connect account');
  }

  return response.json();
}

/**
 * Get onboarding link for cleaner to complete Stripe setup
 */
export async function getOnboardingLink(cleanerId: string): Promise<{ url: string }> {
  const response = await fetch(`${API_BASE}/connect/onboarding-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleanerId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get onboarding link');
  }

  return response.json();
}

/**
 * Check if cleaner's Stripe account is fully set up
 */
export async function getConnectStatus(cleanerId: string): Promise<ConnectStatus> {
  const response = await fetch(`${API_BASE}/connect/status/${cleanerId}`);
  if (!response.ok) throw new Error('Failed to get connect status');
  return response.json();
}

/**
 * Get cleaner's Stripe dashboard link
 */
export async function getDashboardLink(cleanerId: string): Promise<{ url: string }> {
  const response = await fetch(`${API_BASE}/connect/dashboard-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleanerId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get dashboard link');
  }

  return response.json();
}

/**
 * Get cleaner's balance from Stripe
 */
export async function getCleanerBalance(cleanerId: string): Promise<{
  available: number;
  pending: number;
  currency: string;
}> {
  const response = await fetch(`${API_BASE}/connect/balance/${cleanerId}`);
  if (!response.ok) throw new Error('Failed to get balance');
  return response.json();
}

// ==================== TRANSFERS ====================

/**
 * Transfer cleaner's payout after job completion
 */
export async function transferToCleaner(params: {
  paymentIntentId?: string;
  cleanerId: string;
  amount: number;
}): Promise<{ transferId: string; amount: number; status: string }> {
  const response = await fetch(`${API_BASE}/payments/transfer-to-cleaner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to transfer to cleaner');
  }

  return response.json();
}

// ==================== ADMIN ====================

export interface AdminEarnings {
  summary: {
    totalRevenue: string;
    platformEarnings: string;
    cleanerPayouts: string;
    totalTransactions: number;
  };
  recentTransactions: Array<{
    id: string;
    requestId: string;
    amount: number;
    platformFee: number;
    cleanerPayout: number;
    status: string;
    completedAt?: string;
  }>;
}

// Admin secret — in production this should come from an env var or secure config
const ADMIN_SECRET = 'hollaclean-admin-secret';
const adminHeaders = { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_SECRET };

/**
 * Get platform earnings summary (Admin only)
 */
export async function getAdminEarnings(): Promise<AdminEarnings> {
  const response = await fetch(`${API_BASE}/admin/earnings`, { headers: adminHeaders });
  if (!response.ok) throw new Error('Failed to get admin earnings');
  return response.json();
}

/**
 * Get platform's Stripe balance
 */
export async function getAdminBalance(): Promise<{
  available: number;
  pending: number;
  currency: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE}/admin/balance`, { headers: adminHeaders });
  if (!response.ok) throw new Error('Failed to get admin balance');
  return response.json();
}

// ==================== HEALTH CHECK ====================

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

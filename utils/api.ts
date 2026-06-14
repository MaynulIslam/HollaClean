/**
 * HollaClean API client.
 *
 * This is the bridge that replaces localStorage as the data source. Every
 * marketplace read/write now goes through the shared backend (see server/).
 * Identity travels as a JWT in the Authorization header — the token is the only
 * thing we keep in the browser; the user record is fetched from the server.
 */
import { User, CleaningRequest, Review } from '../types';

const API_BASE =
  (process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3001') + '/api';

const TOKEN_KEY = 'hollaclean_token';

// ─── Token storage (the browser only ever holds the JWT) ────────────────────
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: any;
  auth?: boolean; // attach bearer token (default true)
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error — could not reach the server', 0);
  }

  // 401 means our token is missing/expired — drop it so the app re-auths.
  if (res.status === 401) {
    clearToken();
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  async register(payload: Record<string, any>): Promise<User> {
    const { token, user } = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    setToken(token);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const { token, user } = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setToken(token);
    return user;
  },

  async google(idToken: string, type?: string): Promise<User> {
    const { token, user } = await request<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: { idToken, type },
      auth: false,
    });
    setToken(token);
    return user;
  },

  /** Resolve the current user from the stored token. Null if not signed in. */
  async me(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      const { user } = await request<{ user: User }>('/auth/me');
      return user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  logout(): void {
    clearToken();
  },
};

// ─── Users ────────────────────────────────────────────────────────────────--
export const usersApi = {
  async get(id: string): Promise<User> {
    const { user } = await request<{ user: User }>(`/users/${id}`);
    return user;
  },

  async listCleaners(): Promise<User[]> {
    const { cleaners } = await request<{ cleaners: User[] }>('/users/cleaners');
    return cleaners;
  },

  async update(id: string, patch: Partial<User>): Promise<User> {
    const { user } = await request<{ user: User }>(`/users/${id}`, {
      method: 'PATCH',
      body: patch,
    });
    return user;
  },
};

// ─── Requests ─────────────────────────────────────────────────────────────--
export const requestsApi = {
  async create(payload: Partial<CleaningRequest>): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>('/requests', {
      method: 'POST',
      body: payload,
    });
    return r;
  },

  async listOpen(): Promise<CleaningRequest[]> {
    const { requests } = await request<{ requests: CleaningRequest[] }>('/requests/open');
    return requests;
  },

  /** The signed-in homeowner's own requests. */
  async listMine(): Promise<CleaningRequest[]> {
    const { requests } = await request<{ requests: CleaningRequest[] }>('/requests/mine');
    return requests;
  },

  /** The signed-in cleaner's accepted/active jobs. */
  async listJobs(): Promise<CleaningRequest[]> {
    const { requests } = await request<{ requests: CleaningRequest[] }>('/requests/jobs');
    return requests;
  },

  async get(id: string): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>(`/requests/${id}`);
    return r;
  },

  async accept(id: string): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>(`/requests/${id}/accept`, {
      method: 'POST',
    });
    return r;
  },

  async setStatus(id: string, status: string): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return r;
  },

  /** Cleaner returns an accepted job to the open marketplace. */
  async release(id: string): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>(`/requests/${id}/release`, {
      method: 'POST',
    });
    return r;
  },

  /** Cleaner asks an admin to approve starting a job from beyond the radius. */
  async requestLocationApproval(id: string, distance: number | null): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>(
      `/requests/${id}/location-approval`,
      { method: 'POST', body: { distance } }
    );
    return r;
  },
};

// ─── Reviews ──────────────────────────────────────────────────────────────--
export const reviewsApi = {
  async listForCleaner(cleanerId: string): Promise<Review[]> {
    const { reviews } = await request<{ reviews: Review[] }>(
      `/reviews?cleanerId=${encodeURIComponent(cleanerId)}`
    );
    return reviews;
  },

  async create(payload: { requestId: string; rating: number; comment?: string }): Promise<Review> {
    const { review } = await request<{ review: Review }>('/reviews', {
      method: 'POST',
      body: payload,
    });
    return review;
  },
};

// ─── Services (public catalog) ──────────────────────────────────────────────
export const servicesApi = {
  /** The shared service catalog (replaces the old localStorage 'config:services'). */
  async list(): Promise<Array<{ id: string; name: string; basePrice: number }>> {
    const { services } = await request<{
      services: Array<{ id: string; name: string; basePrice: number }>;
    }>('/services', { auth: false });
    return services;
  },
};

// ─── Admin console ──────────────────────────────────────────────────────────
// The admin console authenticates with a short-lived HMAC token (x-admin-token)
// minted from ADMIN_SECRET, NOT a user JWT. This mirrors AdminFinance/paymentApi
// so the whole console uses one mechanism. Token is cached until it nears expiry.
let _adminToken: string | null = null;
let _adminTokenExpiry = 0;

async function getAdminToken(): Promise<string> {
  if (_adminToken && Date.now() < _adminTokenExpiry - 30_000) return _adminToken;
  const secret = process.env.VITE_ADMIN_SECRET || process.env.ADMIN_SECRET || '';
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/admin-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
  } catch {
    throw new ApiError('Network error — could not reach the server', 0);
  }
  if (!res.ok) throw new ApiError('Admin authentication failed', res.status);
  const { token, expiresIn } = await res.json();
  _adminToken = token;
  _adminTokenExpiry = Date.now() + (expiresIn || 0);
  return token;
}

/** Like request<T>(), but authenticates with the admin HMAC token. */
async function adminRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = opts;
  const token = await getAdminToken();
  const headers: Record<string, string> = { 'x-admin-token': token };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error — could not reach the server', 0);
  }
  // A 401 means our cached admin token is stale — drop it so the next call re-mints.
  if (res.status === 401) {
    _adminToken = null;
    _adminTokenExpiry = 0;
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const adminApi = {
  // ── Overview lists ──
  async listRequests(): Promise<CleaningRequest[]> {
    const { requests } = await adminRequest<{ requests: CleaningRequest[] }>('/admin/requests');
    return requests;
  },
  async listUsers(): Promise<User[]> {
    const { users } = await adminRequest<{ users: User[] }>('/admin/users');
    return users;
  },

  // ── Service catalog CRUD ──
  async listServices(): Promise<Array<{ id: string; name: string; basePrice: number }>> {
    const { services } = await adminRequest<{
      services: Array<{ id: string; name: string; basePrice: number }>;
    }>('/admin/services');
    return services;
  },
  async createService(payload: { name: string; basePrice: number }) {
    const { service } = await adminRequest<{ service: any }>('/admin/services', {
      method: 'POST',
      body: payload,
    });
    return service;
  },
  async updateService(id: string, patch: { name?: string; basePrice?: number }) {
    const { service } = await adminRequest<{ service: any }>(`/admin/services/${id}`, {
      method: 'PATCH',
      body: patch,
    });
    return service;
  },
  async deleteService(id: string): Promise<void> {
    await adminRequest(`/admin/services/${id}`, { method: 'DELETE' });
  },

  // ── Users ──
  async updateUser(id: string, patch: Record<string, any>): Promise<User> {
    const { user } = await adminRequest<{ user: User }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: patch,
    });
    return user;
  },
  async deleteUser(id: string): Promise<void> {
    await adminRequest(`/admin/users/${id}`, { method: 'DELETE' });
  },

  // ── Requests ──
  async updateRequest(id: string, patch: Record<string, any>): Promise<CleaningRequest> {
    const { request: r } = await adminRequest<{ request: CleaningRequest }>(`/admin/requests/${id}`, {
      method: 'PATCH',
      body: patch,
    });
    return r;
  },
  async locationApproval(id: string, decision: 'approved' | 'denied'): Promise<CleaningRequest> {
    const { request: r } = await adminRequest<{ request: CleaningRequest }>(
      `/admin/requests/${id}/location-approval`,
      { method: 'POST', body: { decision } }
    );
    return r;
  },
  async payout(
    id: string,
    payload: { action: 'disburse' | 'adjust'; amount?: number }
  ): Promise<CleaningRequest> {
    const { request: r } = await adminRequest<{ request: CleaningRequest }>(
      `/admin/requests/${id}/payout`,
      { method: 'POST', body: payload }
    );
    return r;
  },
};

export const api = {
  auth: authApi,
  users: usersApi,
  requests: requestsApi,
  reviews: reviewsApi,
  services: servicesApi,
  admin: adminApi,
  getToken,
  setToken,
  clearToken,
};

export default api;

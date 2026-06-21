import { User, CleaningRequest, Review } from '../types';
import { signInWithEmail, createUserWithEmail, getCurrentIdToken } from './firebase';

const API_BASE =
  (process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3001') + '/api';

const TOKEN_KEY = 'hollaclean_token';

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
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const fresh = await getCurrentIdToken();
    const token = fresh || getToken();
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
    // Create Firebase Auth user first
    const { idToken } = await createUserWithEmail(payload.email, payload.password);
    // Send ID token + profile data to server to create Firestore user doc
    const { user } = await request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: { idToken, ...payload },
      auth: false,
    });
    setToken(idToken);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    // Sign in with Firebase Auth first
    const { idToken } = await signInWithEmail(email, password);
    // Send ID token to server to get user profile
    const { user } = await request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: { idToken },
      auth: false,
    });
    setToken(idToken);
    return user;
  },

  async google(idToken: string, type?: string): Promise<User> {
    const { user } = await request<{ user: User }>('/auth/google', {
      method: 'POST',
      body: { idToken, type },
      auth: false,
    });
    // Store the Firebase ID token (already in hand from calling signInWithGoogle)
    setToken(idToken);
    return user;
  },

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
    // Also sign out of Firebase
    import('./firebase').then(({ signOutFirebase }) => signOutFirebase()).catch(() => {});
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

  async listMine(): Promise<CleaningRequest[]> {
    const { requests } = await request<{ requests: CleaningRequest[] }>('/requests/mine');
    return requests;
  },

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

  async release(id: string): Promise<CleaningRequest> {
    const { request: r } = await request<{ request: CleaningRequest }>(`/requests/${id}/release`, {
      method: 'POST',
    });
    return r;
  },

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

// ─── Services ──────────────────────────────────────────────────────────────
export const servicesApi = {
  async list(): Promise<Array<{ id: string; name: string; basePrice: number }>> {
    const { services } = await request<{
      services: Array<{ id: string; name: string; basePrice: number }>;
    }>('/services', { auth: false });
    return services;
  },
};

// ─── Admin console ──────────────────────────────────────────────────────────
// Admin routes are protected server-side by requireRole('admin'): the caller
// must be a logged-in Firebase user whose profile has type === 'admin'. We just
// reuse the normal authenticated request() (which sends the Bearer ID token) —
// there is no separate admin secret in the client anymore.
const adminRequest = request;

export const adminApi = {
  async listRequests(): Promise<CleaningRequest[]> {
    const { requests } = await adminRequest<{ requests: CleaningRequest[] }>('/admin/requests');
    return requests;
  },
  async listUsers(): Promise<User[]> {
    const { users } = await adminRequest<{ users: User[] }>('/admin/users');
    return users;
  },

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

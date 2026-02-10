
/**
 * Authentication utilities for HollaClean
 *
 * NOTE: This is a client-side implementation for demonstration purposes.
 * In production, all authentication MUST happen on a secure backend server.
 *
 * Production requirements:
 * - Use a proper backend with JWT tokens
 * - Store passwords with bcrypt/argon2 on the server
 * - Implement refresh tokens
 * - Add rate limiting
 * - Use HTTPS only
 * - Implement 2FA
 */

// Simple hash function for client-side password hashing
// WARNING: This is NOT cryptographically secure for production
// In production, passwords should be hashed on the server with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hollaclean_salt_v1'); // Add a static salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// Session management
export interface Session {
  userId: string;
  userType: string;
  createdAt: string;
  expiresAt: string;
  token: string;
}

// Generate a simple session token
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Create a session with expiry
export function createSession(userId: string, userType?: string): Session {
  const now = new Date();
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    userId,
    userType: userType || 'user',
    createdAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    token: generateSessionToken()
  };
}

// Check if session is valid
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  const now = new Date();
  const expiry = new Date(session.expiresAt);
  return now < expiry;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate phone number (Canadian format)
export function isValidPhone(phone: string): boolean {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Canadian phone numbers are 10 digits (or 11 with leading 1)
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate postal code (Canadian format)
export function isValidPostalCode(postalCode: string): boolean {
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
}

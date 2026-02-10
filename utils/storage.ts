
/**
 * Storage Utility for HollaClean
 *
 * NOTE: This uses localStorage for demonstration purposes.
 * In production, this should be replaced with:
 * - A proper backend database (PostgreSQL, MongoDB, etc.)
 * - API calls to a secure server
 * - Proper data encryption
 *
 * Current limitations:
 * - Data is only stored in the browser
 * - Data is lost if browser storage is cleared
 * - No cross-device sync
 * - Limited to ~5-10MB storage
 * - No encryption (sensitive data is at risk)
 */

// Storage error types
export class StorageError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Check if localStorage is available
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Get storage usage info
export function getStorageInfo(): { used: number; available: boolean } {
  if (!isStorageAvailable()) {
    return { used: 0, available: false };
  }

  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length * 2; // UTF-16 uses 2 bytes per character
    }
  }

  return { used, available: true };
}

export const storage = {
  /**
   * Get an item from storage
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!isStorageAvailable()) {
      console.error('localStorage is not available');
      return null;
    }

    try {
      const result = localStorage.getItem(key);
      if (!result) return null;

      const parsed = JSON.parse(result);
      return parsed as T;
    } catch (error) {
      console.error(`Error reading from storage (key: ${key}):`, error);
      return null;
    }
  },

  /**
   * Set an item in storage
   */
  async set(key: string, value: any): Promise<boolean> {
    if (!isStorageAvailable()) {
      console.error('localStorage is not available');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error: any) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('Storage quota exceeded. Please clear some data.');
        throw new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED');
      }
      console.error(`Error writing to storage (key: ${key}):`, error);
      return false;
    }
  },

  /**
   * Delete an item from storage
   */
  async delete(key: string): Promise<boolean> {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error deleting from storage (key: ${key}):`, error);
      return false;
    }
  },

  /**
   * List all keys with a given prefix
   */
  async list(prefix: string): Promise<string[]> {
    if (!isStorageAvailable()) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error(`Error listing keys with prefix ${prefix}:`, error);
      return [];
    }
  },

  /**
   * Clear all app data (use with caution)
   */
  async clearAll(): Promise<boolean> {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      // Only clear HollaClean related keys
      const prefixes = ['user:', 'request:', 'review:', 'notification:', 'session:', 'config:'];
      for (const prefix of prefixes) {
        const keys = await this.list(prefix);
        for (const key of keys) {
          localStorage.removeItem(key);
        }
      }
      // Clear special keys
      localStorage.removeItem('currentUser');
      localStorage.removeItem('session');
      localStorage.removeItem('hollaclean_initialized');
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Export all data as JSON (for backup)
   */
  async exportData(): Promise<string> {
    if (!isStorageAvailable()) {
      return '{}';
    }

    const data: Record<string, any> = {};
    const prefixes = ['user:', 'request:', 'review:', 'config:'];

    for (const prefix of prefixes) {
      const keys = await this.list(prefix);
      for (const key of keys) {
        const value = await this.get(key);
        if (value) {
          // Remove sensitive data from export
          if (key.startsWith('user:') && value.password) {
            delete value.password;
          }
          data[key] = value;
        }
      }
    }

    return JSON.stringify(data, null, 2);
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!isStorageAvailable()) {
      return false;
    }
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get multiple items at once
   */
  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  },

  /**
   * Set multiple items at once
   */
  async setMany(items: Array<{ key: string; value: any }>): Promise<boolean[]> {
    return Promise.all(items.map(({ key, value }) => this.set(key, value)));
  },
};

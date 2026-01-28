
export const storage = {
  async get(key: string) {
    try {
      const result = localStorage.getItem(key);
      return result ? JSON.parse(result) : null;
    } catch {
      return null;
    }
  },
  
  async set(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Storage error:', err);
      return false;
    }
  },
  
  async delete(key: string) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  async list(prefix: string) {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      return keys;
    } catch {
      return [];
    }
  }
};

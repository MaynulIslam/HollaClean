// Storage utility using Browser Storage API (window.storage)
// Falls back to localStorage if window.storage is not available

const useLocalStorageFallback = typeof window === 'undefined' || !window.storage;

export const storage = {
  async get(key) {
    try {
      if (useLocalStorageFallback) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }
      const result = await window.storage.get(key);
      return result ? JSON.parse(result.value) : null;
    } catch (err) {
      console.error('Storage get error:', err);
      return null;
    }
  },

  async set(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      if (useLocalStorageFallback) {
        localStorage.setItem(key, stringValue);
        return true;
      }
      await window.storage.set(key, stringValue);
      return true;
    } catch (err) {
      console.error('Storage set error:', err);
      return false;
    }
  },

  async delete(key) {
    try {
      if (useLocalStorageFallback) {
        localStorage.removeItem(key);
        return true;
      }
      await window.storage.delete(key);
      return true;
    } catch (err) {
      console.error('Storage delete error:', err);
      return false;
    }
  },

  async list(prefix) {
    try {
      if (useLocalStorageFallback) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keys.push(key);
          }
        }
        return keys;
      }
      const result = await window.storage.list(prefix);
      return result.keys || [];
    } catch (err) {
      console.error('Storage list error:', err);
      return [];
    }
  },

  async clear() {
    try {
      if (useLocalStorageFallback) {
        localStorage.clear();
        return true;
      }
      // Clear all keys with our prefixes
      const prefixes = ['user:', 'request:', 'review:', 'currentUser'];
      for (const prefix of prefixes) {
        const keys = await this.list(prefix);
        for (const key of keys) {
          await this.delete(key);
        }
      }
      await this.delete('currentUser');
      await this.delete('sampleDataCreated');
      return true;
    } catch (err) {
      console.error('Storage clear error:', err);
      return false;
    }
  }
};

// Helper functions for common operations
export const userStorage = {
  async getCurrentUser() {
    return await storage.get('currentUser');
  },

  async setCurrentUser(user) {
    return await storage.set('currentUser', user);
  },

  async logout() {
    return await storage.delete('currentUser');
  },

  async getUser(userId) {
    return await storage.get(`user:${userId}`);
  },

  async saveUser(user) {
    return await storage.set(`user:${user.id}`, user);
  },

  async getAllUsers() {
    const keys = await storage.list('user:');
    const users = [];
    for (const key of keys) {
      const user = await storage.get(key);
      if (user) users.push(user);
    }
    return users;
  },

  async findUserByEmail(email) {
    const users = await this.getAllUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
};

export const requestStorage = {
  async getRequest(requestId) {
    return await storage.get(`request:${requestId}`);
  },

  async saveRequest(request) {
    return await storage.set(`request:${request.id}`, request);
  },

  async getAllRequests() {
    const keys = await storage.list('request:');
    const requests = [];
    for (const key of keys) {
      const request = await storage.get(key);
      if (request) requests.push(request);
    }
    return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getOpenRequests() {
    const all = await this.getAllRequests();
    return all.filter(r => r.status === 'open');
  },

  async getRequestsByHomeowner(homeownerId) {
    const all = await this.getAllRequests();
    return all.filter(r => r.homeownerId === homeownerId);
  },

  async getRequestsByCleaner(cleanerId) {
    const all = await this.getAllRequests();
    return all.filter(r => r.acceptedBy === cleanerId);
  }
};

export const reviewStorage = {
  async saveReview(review) {
    return await storage.set(`review:${review.id}`, review);
  },

  async getReviewsForCleaner(cleanerId) {
    const keys = await storage.list('review:');
    const reviews = [];
    for (const key of keys) {
      const review = await storage.get(key);
      if (review && review.cleanerId === cleanerId) {
        reviews.push(review);
      }
    }
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getReviewForRequest(requestId) {
    const keys = await storage.list('review:');
    for (const key of keys) {
      const review = await storage.get(key);
      if (review && review.requestId === requestId) {
        return review;
      }
    }
    return null;
  }
};

// Initialize sample data if none exists
export const initializeSampleData = async () => {
  const sampleCreated = await storage.get('sampleDataCreated');
  if (sampleCreated) return;

  // Sample cleaners
  const cleaners = [
    {
      id: 'cleaner_1',
      type: 'cleaner',
      name: 'Sarah Mitchell',
      email: 'sarah@example.com',
      password: 'password123',
      phone: '416-555-0101',
      address: '123 Queen St W, Toronto, ON',
      bio: 'Professional cleaner with 5 years experience. Specialized in deep cleaning and move-in/out services.',
      hourlyRate: 35,
      experience: 5,
      services: ['Deep Cleaning', 'Regular Cleaning', 'Move-in/Move-out Cleaning'],
      rating: 4.9,
      reviewCount: 47,
      totalEarnings: 12500,
      isAvailable: true,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cleaner_2',
      type: 'cleaner',
      name: 'Maria Lopez',
      email: 'maria@example.com',
      password: 'password123',
      phone: '905-555-0202',
      address: '456 Dundas St, Mississauga, ON',
      bio: 'Eco-friendly cleaning specialist. I use only green products that are safe for your family and pets.',
      hourlyRate: 30,
      experience: 3,
      services: ['Regular Cleaning', 'Laundry Service', 'Window Cleaning'],
      rating: 4.8,
      reviewCount: 32,
      totalEarnings: 8200,
      isAvailable: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'cleaner_3',
      type: 'cleaner',
      name: 'Jennifer Kim',
      email: 'jennifer@example.com',
      password: 'password123',
      phone: '647-555-0303',
      address: '789 Main St N, Brampton, ON',
      bio: 'Detail-oriented cleaner focusing on residential and small office spaces. Customer satisfaction guaranteed!',
      hourlyRate: 40,
      experience: 7,
      services: ['Deep Cleaning', 'Regular Cleaning', 'Carpet Cleaning', 'Ironing'],
      rating: 5.0,
      reviewCount: 28,
      totalEarnings: 15800,
      isAvailable: true,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Sample homeowners
  const homeowners = [
    {
      id: 'homeowner_1',
      type: 'homeowner',
      name: 'John Davis',
      email: 'john@example.com',
      password: 'password123',
      phone: '416-555-1001',
      address: '100 Front St W, Toronto, ON M5J 1E3',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'homeowner_2',
      type: 'homeowner',
      name: 'Emily Wilson',
      email: 'emily@example.com',
      password: 'password123',
      phone: '905-555-2002',
      address: '200 Lakeshore Blvd, Oakville, ON L6J 1H8',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Sample requests
  const requests = [
    {
      id: 'req_1',
      homeownerId: 'homeowner_1',
      homeownerName: 'John Davis',
      homeownerPhone: '416-555-1001',
      homeownerEmail: 'john@example.com',
      serviceType: 'Deep Cleaning',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      hours: 4,
      address: '100 Front St W, Toronto, ON M5J 1E3',
      instructions: 'Please focus on the kitchen and bathrooms. Key under the mat.',
      status: 'open',
      acceptedBy: null,
      cleanerName: null,
      cleanerPhone: null,
      hourlyRate: null,
      acceptedAt: null,
      completedAt: null,
      totalAmount: 0,
      platformCommission: 0,
      cleanerPayout: 0,
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'req_2',
      homeownerId: 'homeowner_2',
      homeownerName: 'Emily Wilson',
      homeownerPhone: '905-555-2002',
      homeownerEmail: 'emily@example.com',
      serviceType: 'Regular Cleaning',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '14:00',
      hours: 3,
      address: '200 Lakeshore Blvd, Oakville, ON L6J 1H8',
      instructions: 'Weekly cleaning service. No pets in the house.',
      status: 'open',
      acceptedBy: null,
      cleanerName: null,
      cleanerPhone: null,
      hourlyRate: null,
      acceptedAt: null,
      completedAt: null,
      totalAmount: 0,
      platformCommission: 0,
      cleanerPayout: 0,
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'req_3',
      homeownerId: 'homeowner_1',
      homeownerName: 'John Davis',
      homeownerPhone: '416-555-1001',
      homeownerEmail: 'john@example.com',
      serviceType: 'Move-in/Move-out Cleaning',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '09:00',
      hours: 6,
      address: '100 Front St W, Toronto, ON M5J 1E3',
      instructions: 'Moving out cleaning. Need everything spotless for inspection.',
      status: 'accepted',
      acceptedBy: 'cleaner_1',
      cleanerName: 'Sarah Mitchell',
      cleanerPhone: '416-555-0101',
      hourlyRate: 35,
      acceptedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      completedAt: null,
      totalAmount: 210,
      platformCommission: 42,
      cleanerPayout: 168,
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'req_4',
      homeownerId: 'homeowner_2',
      homeownerName: 'Emily Wilson',
      homeownerPhone: '905-555-2002',
      homeownerEmail: 'emily@example.com',
      serviceType: 'Deep Cleaning',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '11:00',
      hours: 4,
      address: '200 Lakeshore Blvd, Oakville, ON L6J 1H8',
      instructions: 'Spring cleaning!',
      status: 'completed',
      acceptedBy: 'cleaner_2',
      cleanerName: 'Maria Lopez',
      cleanerPhone: '905-555-0202',
      hourlyRate: 30,
      acceptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 120,
      platformCommission: 24,
      cleanerPayout: 96,
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Sample review
  const reviews = [
    {
      id: 'review_1',
      requestId: 'req_4',
      cleanerId: 'cleaner_2',
      homeownerId: 'homeowner_2',
      rating: 5,
      comment: 'Maria did an amazing job! The house has never been cleaner. Will definitely book again!',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Save all sample data
  for (const cleaner of cleaners) {
    await storage.set(`user:${cleaner.id}`, cleaner);
  }
  for (const homeowner of homeowners) {
    await storage.set(`user:${homeowner.id}`, homeowner);
  }
  for (const request of requests) {
    await storage.set(`request:${request.id}`, request);
  }
  for (const review of reviews) {
    await storage.set(`review:${review.id}`, review);
  }

  await storage.set('sampleDataCreated', true);
  console.log('Sample data initialized successfully');
};

export default storage;

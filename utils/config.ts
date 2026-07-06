
/**
 * Application Configuration
 *
 * All configurable values should be defined here instead of being hardcoded
 * In production, these would come from environment variables or a config service
 */

export const CONFIG = {
  // App Info
  app: {
    name: 'HollaClean',
    version: '1.0.0',
    environment: import.meta.env.MODE ?? 'development',
    region: 'Ontario, Canada',
  },

  // Platform fees and rates
  pricing: {
    platformCommissionRate: 0.20, // 20% platform fee
    cleanerPayoutRate: 0.80, // 80% goes to cleaner
    minimumHourlyRate: 20,
    maximumHourlyRate: 75,
    defaultHourlyRate: 35,
    currency: 'CAD',
    currencySymbol: '$',
    taxRate: 0.13, // 13% HST (Ontario)
    taxLabel: 'HST',
  },

  // Service types with pricing
  services: [
    { id: 'regular', name: 'Regular Cleaning', basePrice: 30, description: 'Routine cleaning for home maintenance' },
    { id: 'deep', name: 'Deep Cleaning', basePrice: 45, description: 'Thorough top-to-bottom cleaning' },
    { id: 'moveinout', name: 'Move In/Out', basePrice: 50, description: 'Complete cleaning for property transitions' },
    { id: 'window', name: 'Window Cleaning', basePrice: 35, description: 'Interior and exterior window cleaning' },
    { id: 'carpet', name: 'Carpet Cleaning', basePrice: 40, description: 'Professional carpet and upholstery cleaning' },
    { id: 'laundry', name: 'Laundry', basePrice: 25, description: 'Washing, drying, and folding services' },
    { id: 'postconstruction', name: 'Post-Construction', basePrice: 55, description: 'Heavy-duty cleaning after renovations' },
  ],

  // Time options for booking
  booking: {
    minHours: 2,
    maxHours: 12,
    hourOptions: [2, 3, 4, 5, 6, 8, 10, 12],
    timeSlots: [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ],
    advanceBookingDays: 60, // How far in advance users can book
  },

  // Polling intervals (in milliseconds)
  polling: {
    dashboardStats: 15000, // 15 seconds
    availableJobs: 5000, // 5 seconds
    activeJobs: 10000, // 10 seconds
    notifications: 30000, // 30 seconds
  },

  // Validation rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false,
    },
    phone: {
      minDigits: 10,
      maxDigits: 11,
    },
    bio: {
      maxLength: 500,
    },
    instructions: {
      maxLength: 1000,
    },
  },

  // File upload limits
  uploads: {
    maxImageSize: 2 * 1024 * 1024, // 2MB
    maxImages: 5,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Feature flags
  features: {
    messaging: false, // In-app messaging (coming soon)
    notifications: true, // Push notifications
    payments: true, // Stripe payments integration
    mapIntegration: true, // Google Maps links
    imageUpload: true, // Photo uploads
    reviews: true, // Review system
    googleAuth: true, // Google sign-in via Firebase
    verificationSystem: true, // Email/phone/address verification
    paymentReminders: true, // Recurring payment reminder system
  },

  // Payment reminder defaults
  reminders: {
    defaultEnabled: true,
    defaultIntervalMinutes: 30,
    defaultStartHoursBefore: 3,
    defaultMaxReminders: 6,
    checkIntervalMs: 60000, // Check every 60 seconds
  },

  // Geolocation / proximity settings
  geolocation: {
    maxAcceptDistance: 100, // meters — cleaner must be within this range to accept a job
  },

  // Server configuration
  server: {
    apiUrl: (process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3001') + '/api',
    // Stripe publishable key - set this in production
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  // Contact and support
  support: {
    email: 'support@hollaclean.ca',
    phone: '+1 (800) HOLLACLEAN',
    hours: '7:00 AM - 9:00 PM EST, 7 days a week',
  },

  // Legal links (would be actual URLs in production)
  legal: {
    termsOfService: '/terms',
    privacyPolicy: '/privacy',
    cookiePolicy: '/cookies',
  },
};

// ─── Dynamic Platform Config (admin-editable, persisted in localStorage) ───

export interface PlatformConfig {
  pricing: {
    platformCommissionRate: number;
    cleanerPayoutRate: number;
    minimumHourlyRate: number;
    maximumHourlyRate: number;
    defaultHourlyRate: number;
    taxRate: number;
    taxLabel: string;
  };
  geolocation: {
    maxAcceptDistance: number;
  };
  booking: {
    minHours: number;
    maxHours: number;
    advanceBookingDays: number;
  };
  photoTips: Record<string, string>;
  features: Record<string, boolean>;
}

/** Default photo tips (used as fallback) */
export const DEFAULT_PHOTO_TIPS: Record<string, string> = {
  bedroom: 'Take a wide-angle photo from the doorway showing the full room. Include any areas needing special attention (under the bed, closet).',
  bathroom: 'Capture the full bathroom — toilet, sink, shower/tub area. Highlight any stains, mold, or hard water buildup.',
  kitchen: 'Photograph countertops, stovetop, sink, and floor. Show inside the oven or fridge if they need cleaning.',
  livingRoom: 'Stand in a corner and capture the full room. Include upholstery, shelves, and any hard-to-reach areas.',
  other: 'Take a wide shot showing the full space. Point out anything that needs special attention.',
};

function buildDefault(): PlatformConfig {
  return {
    pricing: { ...CONFIG.pricing },
    geolocation: { ...CONFIG.geolocation },
    booking: { minHours: CONFIG.booking.minHours, maxHours: CONFIG.booking.maxHours, advanceBookingDays: CONFIG.booking.advanceBookingDays },
    photoTips: { ...DEFAULT_PHOTO_TIPS },
    features: { ...CONFIG.features },
  };
}

function mergeWithDefaults(saved: Partial<PlatformConfig>): PlatformConfig {
  return {
    pricing: { ...CONFIG.pricing, ...saved.pricing },
    geolocation: { ...CONFIG.geolocation, ...saved.geolocation },
    booking: {
      minHours: CONFIG.booking.minHours,
      maxHours: CONFIG.booking.maxHours,
      advanceBookingDays: CONFIG.booking.advanceBookingDays,
      ...saved.booking,
    },
    photoTips: { ...DEFAULT_PHOTO_TIPS, ...saved.photoTips },
    features: { ...CONFIG.features, ...saved.features },
  };
}

// Module-level cache — populated by loadPlatformConfig()
let _cachedConfig: PlatformConfig = buildDefault();

/**
 * Sync getter — returns the in-memory cache.
 * Always call loadPlatformConfig() at app startup (or on admin mount) to
 * populate the cache from Firestore before calling this.
 */
export function getPlatformConfig(): PlatformConfig {
  return _cachedConfig;
}

/**
 * Fetch platform config from the backend and update the in-memory cache.
 * Call once on app startup and after saving changes.
 */
export async function loadPlatformConfig(): Promise<PlatformConfig> {
  try {
    const { adminApi } = await import('./api');
    const saved = await adminApi.getConfig();
    if (saved && Object.keys(saved).length > 0) {
      _cachedConfig = mergeWithDefaults(saved as Partial<PlatformConfig>);
      return _cachedConfig;
    }
  } catch {
    // Backend unreachable — keep defaults
  }
  _cachedConfig = buildDefault();
  return _cachedConfig;
}

/** Save admin-edited platform config to Firestore and refresh the cache */
export async function savePlatformConfig(config: PlatformConfig): Promise<void> {
  config.pricing.cleanerPayoutRate = +(1 - config.pricing.platformCommissionRate).toFixed(4);
  const { adminApi } = await import('./api');
  await adminApi.saveConfig(config);
  _cachedConfig = config;
}

// Helper function to calculate payment breakdown (pass config explicitly to avoid async)
export function calculatePayment(hourlyRate: number, hours: number, platformConfig?: PlatformConfig) {
  const cfg = platformConfig ?? buildDefault();
  const subtotal = hourlyRate * hours;
  const platformCommission = subtotal * cfg.pricing.platformCommissionRate;
  const cleanerPayout = subtotal * cfg.pricing.cleanerPayoutRate;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    cleanerPayout: Math.round(cleanerPayout * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
  };
}

// Get service by ID
export function getServiceById(id: string) {
  return CONFIG.services.find(s => s.id === id);
}

// Get service by name
export function getServiceByName(name: string) {
  return CONFIG.services.find(s => s.name.toLowerCase() === name.toLowerCase());
}

// Format currency
export function formatCurrency(amount: number): string {
  return `${CONFIG.pricing.currencySymbol}${amount.toFixed(2)}`;
}

// Check if feature is enabled
export function isFeatureEnabled(feature: keyof typeof CONFIG.features): boolean {
  return CONFIG.features[feature];
}

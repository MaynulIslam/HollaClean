
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
    environment: 'development', // 'development' | 'staging' | 'production'
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

  // Server configuration
  server: {
    apiUrl: 'http://localhost:3001/api',
    // Stripe publishable key - set this in production
    stripePublishableKey: '', // pk_test_xxx or pk_live_xxx
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

// Helper function to calculate payment breakdown
export function calculatePayment(hourlyRate: number, hours: number) {
  const subtotal = hourlyRate * hours;
  const platformCommission = subtotal * CONFIG.pricing.platformCommissionRate;
  const cleanerPayout = subtotal * CONFIG.pricing.cleanerPayoutRate;

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


export type UserType = 'homeowner' | 'cleaner' | 'admin';

export interface User {
  id: string;
  type: UserType;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  streetAddress?: string;
  apartment?: string;
  city?: string;
  province?: string;
  country?: string;
  createdAt: string;
  
  // Verification
  emailVerified?: boolean;
  phoneVerified?: boolean;
  addressVerified?: boolean;

  // Auth provider
  authProvider?: 'email' | 'google';
  firebaseUid?: string;
  photoURL?: string;
  profileComplete?: boolean;

  // Cleaner specific
  bio?: string;
  hourlyRate?: number;
  experience?: number;
  services?: string[];
  rating?: number;
  reviewCount?: number;
  totalEarnings?: number;
  isAvailable?: boolean;

  // Stripe Connect (cleaner payouts)
  stripeAccountId?: string;
  stripeConnectStatus?: 'not_started' | 'pending' | 'active';
}

export type RequestStatus = 'open' | 'accepted' | 'in_progress' | 'awaiting_payment' | 'completed' | 'cancelled';

export type InvoiceType = 'proforma' | 'payment' | 'final';

export interface CleaningRequest {
  id: string;
  homeownerId: string;
  homeownerName: string;
  homeownerPhone: string;
  homeownerEmail: string;
  
  serviceType: string;
  date: string;
  time: string;
  hours: number;
  address: string;
  instructions: string;
  images?: string[];
  
  status: RequestStatus;
  
  acceptedBy: string | null;
  cleanerName: string | null;
  cleanerPhone: string | null;
  hourlyRate: number | null;
  acceptedAt: string | null;
  completedAt: string | null;
  
  totalAmount: number;
  platformCommission: number;
  cleanerPayout: number;
  paymentStatus: 'pending' | 'awaiting' | 'held' | 'paid' | 'demo_completed';
  paymentIntentId?: string;
  paidAt?: string;
  cleanerId?: string;

  // Tax
  taxAmount?: number;
  taxRate?: number;

  // Admin payout tracking
  payoutStatus?: 'pending' | 'disbursed';
  payoutDisbursedAt?: string;
  payoutAmount?: number;

  // Property details (optional, helps with estimation)
  squareFootage?: number;
  floorType?: string;
  numberOfRooms?: number; // backward compat: total rooms
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  numberOfKitchens?: number;
  numberOfLivingRooms?: number;
  numberOfOtherRooms?: number;
  hasPets?: boolean;

  // Images organized by room type (new format)
  roomImages?: Record<string, string[]>;

  // Reminder tracking
  remindersSent?: number;
  lastReminderAt?: string;

  // Location proximity check
  locationApprovalStatus?: 'pending' | 'approved' | 'denied';
  locationApprovalRequestedAt?: string;
  cleanerDistanceAtStart?: number; // meters

  createdAt: string;
}

export interface Review {
  id: string;
  requestId: string;
  cleanerId: string;
  homeownerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ServiceOffer {
  id: string;
  name: string;
  basePrice: number; // Hourly rate or base fee
  description?: string;
}

export interface PaymentDetails {
  subtotal: string;
  platformCommission: string;
  stripeFee: string;
  cleanerPayout: string;
  platformProfit: string;
}

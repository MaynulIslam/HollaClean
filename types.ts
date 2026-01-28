
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
  
  // Cleaner specific
  bio?: string;
  hourlyRate?: number;
  experience?: number;
  services?: string[];
  rating?: number;
  reviewCount?: number;
  totalEarnings?: number;
  isAvailable?: boolean;
}

export type RequestStatus = 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

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
  paymentStatus: 'pending' | 'paid';
  
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

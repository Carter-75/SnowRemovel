/**
 * Type definitions for API requests and responses
 */

// Estimate API
export interface EstimateRequest {
  address: string;
  urgentService?: boolean;
  consentToStorage?: boolean;
}

export interface EstimateResponse {
  sqft: number;
  price: number;
  basePrice: number;
  upchargeAmount: number;
  upchargeApplied: boolean;
  rate: number;
  jobType: string;
  driveFee: number;
  driveMiles: number;
  driveMinutes: number;
  roundTripMiles: number;
  roundTripMinutes: number;
  timestamp: number;
  discountExpired?: boolean;
}

export interface EstimateErrorResponse {
  error: string;
}

// Quote API
export interface QuoteRequest {
  name: string;
  email?: string;
  address: string;
  timeframe?: string;
  details?: string;
  estimate?: EstimateResponse | null;
  discountPercent?: number;
  totalWithDrive?: number | null;
  agreedToTerms?: boolean;
  downloadedTerms?: boolean;
  emergencyWaiver?: boolean;
  urgentService?: boolean;
  honeypot?: string;
}

export interface QuoteResponse {
  ok: boolean;
}

export interface QuoteErrorResponse {
  error: string;
}

// Stripe Checkout API
export interface CheckoutRequest {
  name: string;
  email?: string;
  address: string;
  timeframe?: string;
  urgentService?: boolean;
  timezoneOffsetMinutes?: number;
  estimateTimestamp?: number;
  honeypot?: string;
}

export interface CheckoutResponse {
  url: string;
}

export interface CheckoutErrorResponse {
  error: string;
}

// Generic error response
export interface ApiErrorResponse {
  error: string;
}

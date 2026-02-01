/**
 * Application-wide constants for snow removal service
 */

// Discount timing constants
export const DISCOUNT_WINDOW_SECONDS = 600; // 10 minutes
export const DISCOUNT_FIRST_PHASE_SECONDS = 300; // First 5 minutes
export const DISCOUNT_MAX_PERCENT = 15;
export const DISCOUNT_MIN_PERCENT = 10;

// Urgency upcharge constants
export const URGENCY_THRESHOLD_DAYS = 3;
export const URGENCY_UPCHARGE_PERCENT = 0.1; // 10%

// Data retention constants
export const ADDRESS_RETENTION_YEARS = 3;
export const ADDRESS_RETENTION_MS = ADDRESS_RETENTION_YEARS * 365 * 24 * 60 * 60 * 1000;

// Rate limiting constants
export const ESTIMATE_RATE_LIMIT = 30; // requests per window
export const ESTIMATE_RATE_WINDOW_MS = 60_000; // 1 minute
export const CHECKOUT_RATE_LIMIT = 10; // requests per window
export const CHECKOUT_RATE_WINDOW_MS = 60_000; // 1 minute

// Input validation constants
export const MAX_NAME_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_TEXT_LENGTH = 500;

// Scheduling constants
export const MIN_DATETIME_STEP_MINUTES = 5;
export const MAX_SCHEDULE_AHEAD_MONTHS = 3;
export const MIN_MINUTES_AHEAD = 5;

// Business information constants
export const BUSINESS_NAME = "Carter Moyer Snow Removal";
export const BUSINESS_ADDRESS = "401 Gillette St, La Crosse, WI 54603";
export const BUSINESS_EMAIL = "cartermoyer75@gmail.com";
export const BUSINESS_PHONE = "920-904-2695";

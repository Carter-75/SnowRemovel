/**
 * Input sanitization utilities to prevent XSS, injection attacks, and data leaks
 */

/**
 * Sanitize text input by removing potentially harmful characters
 */
export const sanitizeText = (input: string, maxLength: number = 500): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>{}]/g, '') // Remove common XSS chars
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
};

/**
 * Sanitize name input (alphanumeric, spaces, hyphens, apostrophes)
 */
export const sanitizeName = (input: string, maxLength: number = 120): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[^a-zA-Z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (input: string, maxLength: number = 254): string => {
  const email = input.trim().toLowerCase().slice(0, maxLength);
  // Basic email validation - allows standard email format
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) ? email : '';
};

/**
 * Hash sensitive data for storage (one-way hash for privacy)
 */
export const hashForStorage = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Redact address for logging/metadata (keep city/state, hide street)
 */
export const redactAddress = (address: string): string => {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 2) return '[address]';
  
  // Keep last 2 parts (usually city, state), redact the rest
  const visibleParts = parts.slice(-2);
  return `[street], ${visibleParts.join(', ')}`;
};

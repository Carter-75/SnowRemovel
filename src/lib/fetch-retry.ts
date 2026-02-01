/**
 * Retry utility for external API calls with exponential backoff
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);

      // Success - return immediately
      if (response.ok) {
        return response;
      }

      // Check if status code is retryable
      if (!opts.retryableStatusCodes.includes(response.status)) {
        // Non-retryable error - return immediately
        return response;
      }

      // Retryable error - clone response for error handling
      const errorText = await response.clone().text();
      lastError = new Error(
        `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      );

      // Don't wait after last attempt
      if (attempt < opts.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
      }
    } catch (error) {
      // Network error or fetch threw
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');

      // Don't wait after last attempt
      if (attempt < opts.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
      }
    }
  }

  // All attempts failed
  throw new Error(
    `Failed after ${opts.maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Wrapper for JSON APIs with automatic retry
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, init, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

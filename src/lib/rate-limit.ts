type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

const getStore = () => {
  const globalStore = globalThis as typeof globalThis & { __rateLimitStore?: Map<string, RateLimitEntry> };
  if (!globalStore.__rateLimitStore) {
    globalStore.__rateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalStore.__rateLimitStore;
};

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

export const checkRateLimit = (key: string, limit: number, windowMs: number): RateLimitResult => {
  const store = getStore();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, retryAfterMs: entry.resetAt - now };
};

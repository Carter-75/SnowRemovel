type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

const isKvConfigured = () => Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const getStore = () => {
  const globalStore = globalThis as typeof globalThis & { __rateLimitStore?: Map<string, RateLimitEntry> };
  if (!globalStore.__rateLimitStore) {
    globalStore.__rateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalStore.__rateLimitStore;
};

const pruneStore = (store: Map<string, RateLimitEntry>, now: number, maxEntries = 10_000) => {
  if (store.size <= maxEntries) {
    return;
  }

  store.forEach((entry, key) => {
    if (store.size <= maxEntries) {
      return;
    }
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  });
};

export const getClientIp = (request: Request) => {
  // Try multiple headers in order of reliability
  // Cloudflare / Vercel
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Vercel
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }

  // Standard proxy header - take first IP (client)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Fallback - treat as suspicious
  return "unknown";
};

export const checkRateLimit = async (
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> => {
  if (isKvConfigured()) {
    const { kv } = await import("@vercel/kv");
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, windowSeconds);
    }
    const ttl = await kv.ttl(key);
    const retryAfterMs = ttl > 0 ? ttl * 1000 : windowMs;
    return { allowed: count <= limit, retryAfterMs };
  }

  const store = getStore();
  const now = Date.now();
  pruneStore(store, now);
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

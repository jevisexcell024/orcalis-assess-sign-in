/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting request frequency
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  statusCode?: number; // Status code to return
  skipSuccessfulRequests?: boolean; // Skip incrementing for successful responses
  skipFailedRequests?: boolean; // Skip incrementing for failed responses
}

export interface RateLimitStore {
  get(key: string): Promise<number>;
  set(key: string, value: number, expiryMs: number): Promise<void>;
  increment(key: string, expiryMs: number): Promise<number>;
}

// In-memory store (suitable for single-instance deployments)
class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; expiryTime: number }> = new Map();

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (Date.now() > entry.expiryTime) {
      this.store.delete(key);
      return 0;
    }
    return entry.count;
  }

  async set(key: string, value: number, expiryMs: number): Promise<void> {
    this.store.set(key, {
      count: value,
      expiryTime: Date.now() + expiryMs,
    });
  }

  async increment(key: string, expiryMs: number): Promise<number> {
    const current = await this.get(key);
    const newCount = current + 1;
    await this.set(key, newCount, expiryMs);
    return newCount;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiryTime) {
        this.store.delete(key);
      }
    }
  }
}

// CloudFlare Durable Objects store (suitable for distributed deployments)
export class DurableObjectStore implements RateLimitStore {
  constructor(private durableObject: any) {}

  async get(key: string): Promise<number> {
    const value = await this.durableObject.storage?.get(key);
    if (!value) return 0;

    const entry = JSON.parse(value);
    if (Date.now() > entry.expiryTime) {
      await this.durableObject.storage?.delete(key);
      return 0;
    }

    return entry.count;
  }

  async set(key: string, value: number, expiryMs: number): Promise<void> {
    const entry = {
      count: value,
      expiryTime: Date.now() + expiryMs,
    };
    await this.durableObject.storage?.put(key, JSON.stringify(entry));
  }

  async increment(key: string, expiryMs: number): Promise<number> {
    const current = await this.get(key);
    const newCount = current + 1;
    await this.set(key, newCount, expiryMs);
    return newCount;
  }
}

const defaultStore = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  defaultStore.cleanup();
}, 5 * 60 * 1000);

/**
 * Create a rate limiting middleware
 */
export function createRateLimiter(
  config: RateLimitConfig,
  store: RateLimitStore = defaultStore,
) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later",
    statusCode = 429,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (request: Request, handler: () => Promise<Response>): Promise<Response> => {
    // Get client identifier (IP or user ID)
    const clientId = getClientIdentifier(request);
    const key = `rate-limit:${clientId}`;

    // Check current request count
    const currentCount = await store.get(key);

    if (currentCount >= maxRequests) {
      return new Response(JSON.stringify({ error: message }), {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(windowMs / 1000).toString(),
        },
      });
    }

    // Increment counter
    await store.increment(key, windowMs);

    // Call next handler
    let response: Response;
    try {
      response = await handler();
    } catch (error) {
      if (!skipFailedRequests) {
        // Already incremented, so we're good
      }
      throw error;
    }

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - (currentCount + 1));
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", (Date.now() + windowMs).toString());

    return response;
  };
}

/**
 * Get client identifier from request
 * Prioritizes authenticated user ID, falls back to IP address
 */
function getClientIdentifier(request: Request): string {
  // Try to get user ID from auth cookie or header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7); // Use JWT token as identifier
  }

  // Fall back to IP address
  const ip =
    request.headers.get("cf-connecting-ip") || // CloudFlare
    request.headers.get("x-forwarded-for")?.split(",")[0] || // Standard proxy header
    request.headers.get("x-real-ip") || // Nginx
    "unknown";

  return ip.trim();
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitPresets = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  // Normal: 30 requests per minute
  normal: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  // Relaxed: 100 requests per minute
  relaxed: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  // Auth endpoints: 5 attempts per 15 minutes
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // Public endpoints: 1000 requests per hour
  public: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
  },
};

export default {
  createRateLimiter,
  MemoryStore,
  DurableObjectStore,
  rateLimitPresets,
  getClientIdentifier,
};

// ── Production-ready in-memory rate limiter for API routes ──────────────────

const globalStore = new MemoryStore();

/**
 * Check rate limit for a request. Throws a 429 Response if exceeded.
 * @param key      Unique key (e.g. IP address or user ID)
 * @param config   Rate limit configuration
 */
export async function checkRateLimit(
  key: string,
  config: { windowMs?: number; maxRequests?: number; message?: string } = {},
): Promise<void> {
  const windowMs    = config.windowMs    ?? 60_000;  // 1 minute default
  const maxRequests = config.maxRequests ?? 60;       // 60 req/min default
  const message     = config.message     ?? "Too many requests. Please slow down.";

  const count = await globalStore.increment(key, windowMs);
  if (count > maxRequests) {
    throw Response.json({ error: message }, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(windowMs / 1000)),
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": "0",
      },
    });
  }
}

/**
 * Extract IP address from a Request for rate-limit keying.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

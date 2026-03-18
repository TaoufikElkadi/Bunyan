/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance Vercel deployments.
 * For multi-instance, swap to @upstash/ratelimit.
 */

const store = new Map<string, number[]>()

// Prevent memory leak: purge stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter((t) => t > cutoff)
    if (filtered.length === 0) {
      store.delete(key)
    } else {
      store.set(key, filtered)
    }
  }
}

interface RateLimitResult {
  success: boolean
  remaining: number
}

/**
 * Check rate limit for a given key.
 * @param key   Unique identifier (e.g., IP address or IP + route)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds (default: 60s)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs
  const timestamps = store.get(key) ?? []
  const recent = timestamps.filter((t) => t > cutoff)

  if (recent.length >= limit) {
    store.set(key, recent)
    return { success: false, remaining: 0 }
  }

  recent.push(now)
  store.set(key, recent)
  return { success: true, remaining: limit - recent.length }
}

/**
 * Extract client IP from request headers (Vercel/Cloudflare).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

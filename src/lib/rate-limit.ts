/**
 * Rate limiter with Upstash Redis for production (Vercel serverless)
 * and in-memory fallback for local development.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars to enable
 * distributed rate limiting. Without them, falls back to in-memory (single-instance only).
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Upstash-backed rate limiter (production)
// ---------------------------------------------------------------------------

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`
  let limiter = upstashLimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: 'bunyan:rl',
    })
    upstashLimiters.set(key, limiter)
  }
  return limiter
}

// ---------------------------------------------------------------------------
// In-memory fallback (local dev only)
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, number[]>()

const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  const cutoff = now - windowMs
  for (const [key, timestamps] of memoryStore) {
    const filtered = timestamps.filter((t) => t > cutoff)
    if (filtered.length === 0) {
      memoryStore.delete(key)
    } else {
      memoryStore.set(key, filtered)
    }
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanup(windowMs)
  const now = Date.now()
  const cutoff = now - windowMs
  const timestamps = memoryStore.get(key) ?? []
  const recent = timestamps.filter((t) => t > cutoff)

  if (recent.length >= limit) {
    memoryStore.set(key, recent)
    return { success: false, remaining: 0 }
  }

  recent.push(now)
  memoryStore.set(key, recent)
  return { success: true, remaining: limit - recent.length }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface RateLimitResult {
  success: boolean
  remaining: number
}

/**
 * Check rate limit for a given key.
 * Uses Upstash Redis in production, in-memory fallback for local dev.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (hasUpstash) {
    const limiter = getUpstashLimiter(limit, windowMs)
    const { success, remaining } = await limiter.limit(key)
    return { success, remaining }
  }

  return memoryRateLimit(key, limit, windowMs)
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

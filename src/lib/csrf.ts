/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Validates that state-changing requests (POST, PUT, PATCH, DELETE) originate
 * from our own domain. This prevents malicious sites from crafting requests
 * that execute actions using a victim's session cookie.
 *
 * Strategy: Origin header validation (recommended by OWASP for modern apps).
 * - Check the Origin header (set by browsers on all cross-origin requests)
 * - Fall back to the Referer header if Origin is absent
 * - If neither header is present, REJECT the request. All modern browsers
 *   send Origin on state-changing requests. Server-to-server calls (e.g.,
 *   Stripe webhooks, cron jobs) should bypass CSRF checks at the route
 *   level, not rely on missing headers being allowed.
 */

const PRODUCTION_ORIGINS = [
  'https://bunyan.nl',
  'https://www.bunyan.nl',
]

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
]

/**
 * Check whether a request's origin is allowed.
 *
 * @returns `true` if the request should be allowed, `false` if it should be blocked.
 */
export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Extract the origin to validate. Prefer Origin; fall back to Referer.
  const sourceOrigin = origin ?? extractOriginFromReferer(referer)

  // No Origin or Referer: reject the request.
  // All modern browsers send the Origin header on state-changing requests.
  // Server-to-server calls (Stripe webhooks, cron) should bypass CSRF
  // checks at the route level, not here.
  if (!sourceOrigin) {
    return false
  }

  const allowed = getAllowedOrigins()
  return allowed.includes(sourceOrigin)
}

/**
 * Build the list of allowed origins based on the current environment.
 */
function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === 'development') {
    return [...PRODUCTION_ORIGINS, ...DEV_ORIGINS]
  }
  return PRODUCTION_ORIGINS
}

/**
 * Extract the origin (scheme + host + port) from a full Referer URL.
 * Returns `null` if the Referer is missing or malformed.
 */
function extractOriginFromReferer(referer: string | null): string | null {
  if (!referer) return null
  try {
    const url = new URL(referer)
    return url.origin
  } catch {
    return null
  }
}

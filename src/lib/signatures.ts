const MAX_SIGNATURE_BYTES = 500_000 // 500KB
const DATA_URL_PREFIX = 'data:image/png;base64,'

/**
 * Validates and extracts raw base64 from a signature data URL.
 * Returns the raw base64 string or throws on invalid input.
 */
export function parseSignatureBase64(dataUrl: string): string {
  if (!dataUrl.startsWith(DATA_URL_PREFIX)) {
    throw new Error('Ongeldige handtekening: verwacht PNG afbeelding')
  }

  const raw = dataUrl.slice(DATA_URL_PREFIX.length)

  // Validate base64 charset
  if (!/^[A-Za-z0-9+/=]+$/.test(raw)) {
    throw new Error('Ongeldige handtekening: ongeldig formaat')
  }

  const sizeBytes = Math.ceil((raw.length * 3) / 4)
  if (sizeBytes > MAX_SIGNATURE_BYTES) {
    throw new Error('Handtekening is te groot (max 500KB)')
  }

  return raw
}

/**
 * Extracts the client IP from request headers (behind Vercel/nginx proxy).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

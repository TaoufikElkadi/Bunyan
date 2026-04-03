import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Content-Security-Policy
// ---------------------------------------------------------------------------
// TODO: Replace 'unsafe-inline' with nonce-based CSP once Next.js supports
// per-request nonces in the App Router (see next.js#48448). For now
// 'unsafe-inline' is required because Next.js injects inline <script> tags.
// ---------------------------------------------------------------------------
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.supabase.co;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co https://api.stripe.com https://m.stripe.network https://vitals.vercel-insights.com https://*.ingest.sentry.io;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`
  .replace(/\n/g, " ")
  .trim();

// ---------------------------------------------------------------------------
// Security headers applied to every route
// ---------------------------------------------------------------------------
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains; eligible for preload list
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent the page from being embedded in frames (clickjacking defence)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing the content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send full URL as referrer only to same origin; origin-only cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser APIs the app does not use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Allow DNS prefetching for linked resources (perf benefit)
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Content Security Policy — see directive comments above
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    // Prevents full barrel file imports
    optimizePackageImports: [
      '@base-ui/react',
      'lucide-react',
    ],
    // Client-side router cache: keep visited pages cached for 5 min
    // so navigating back is instant (0ms)
    staleTimes: {
      dynamic: 300, // seconds
    },
  },

  async headers() {
    return [
      {
        // Cache static assets for 1 year (fingerprinted by Next.js)
        source: "/:path*.(svg|jpg|jpeg|png|webp|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Apply security headers to every route
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Upload source maps for better error stack traces
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Disable Sentry telemetry
  telemetry: false,

  // Suppress noisy build logs
  silent: !process.env.CI,

  // Tunnel events through the app to avoid ad blockers (optional)
  // tunnelRoute: "/api/monitoring",
});

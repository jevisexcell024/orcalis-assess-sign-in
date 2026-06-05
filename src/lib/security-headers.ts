/**
 * Security Headers Middleware
 * Applied to all server responses for production hardening.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent XSS
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",

  // HTTPS only
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Cross-Origin isolation (required for SharedArrayBuffer / high-res timers)
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Resource-Policy": "same-origin",

  // Permissions policy — restrict sensitive APIs
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self), payment=(self)",

  // Content Security Policy
  // Content Security Policy — 'unsafe-eval' removed for production hardening.
  // 'unsafe-inline' for scripts is required by TanStack Start's SSR hydration inline scripts.
  // Tighten further with per-response nonces once TanStack supports CSP nonce injection.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://storage.googleapis.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com https://ingest.sentry.io https://api.resend.com",
    "frame-src https://js.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

/**
 * Apply security headers to a Response object.
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

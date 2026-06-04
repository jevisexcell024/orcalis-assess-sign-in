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

  // Permissions policy — restrict sensitive APIs
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self), payment=(self)",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.stripe.com https://ingest.sentry.io",
    "frame-src https://js.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
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

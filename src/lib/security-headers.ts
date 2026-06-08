/**
 * Security Headers Middleware
 * HTTPS-only headers are skipped when the request arrives over plain HTTP
 * (dev server, local network) to avoid breaking asset loading.
 */

const ALWAYS_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self), payment=(self)",
};

const HTTPS_ONLY_HEADERS: Record<string, string> = {
  // Only safe over HTTPS — breaks HTTP dev servers if included
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function buildCsp(httpsMode: boolean): string {
  const directives = [
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
    // upgrade-insecure-requests only in HTTPS mode — on HTTP it breaks all asset loads
    ...(httpsMode ? ["upgrade-insecure-requests"] : []),
  ];
  return directives.join("; ");
}

export function applySecurityHeaders(response: Response, request?: Request): Response {
  const isHttps = request
    ? new URL(request.url).protocol === "https:"
    : false;

  const headers = new Headers(response.headers);

  for (const [k, v] of Object.entries(ALWAYS_HEADERS)) {
    headers.set(k, v);
  }

  if (isHttps) {
    for (const [k, v] of Object.entries(HTTPS_ONLY_HEADERS)) {
      headers.set(k, v);
    }
  }

  headers.set("Content-Security-Policy", buildCsp(isHttps));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

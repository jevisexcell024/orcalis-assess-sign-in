/**
 * Cloudflare Worker entry — wraps TanStack Start's SSR handler with:
 *   1. SSR error normalisation (h3 swallowed errors → branded 500 page)
 *   2. OWASP baseline security headers on every response
 *
 * The security-headers layer was the original sole addition to this file in the
 * "Security Baseline" patch; the SSR wrapper logic below is preserved verbatim.
 */
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

// ────────────────────────────────────────────────────────────────────────────────
// Security headers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Content Security Policy.
 *
 * Notes for future tightening:
 *  - `'unsafe-inline'` on style-src is needed for TanStack/Tailwind CSS injection;
 *    once we move to nonce-based CSP we can drop it.
 *  - script-src does NOT allow 'unsafe-inline' — the app is React/TanStack and
 *    doesn't emit inline scripts. If a third-party script is added later, add it
 *    here by host, not by relaxing the policy.
 *  - connect-src lists every origin the SPA talks to (Supabase, Sentry,
 *    Lovable OAuth). Add new origins explicitly.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://auth.lovable.dev",
  "frame-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP_DIRECTIVES,
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": [
    "camera=(self)", // needed for proctoring
    "microphone=(self)", // needed for proctoring
    "geolocation=()",
    "payment=()",
    "usb=()",
    "magnetometer=()",
    "accelerometer=()",
    "gyroscope=()",
    "interest-cohort=()",
  ].join(", "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
};

function applySecurityHeaders(response: Response): Response {
  // Clone headers (Response.headers is sometimes immutable on Workers).
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// SSR error normalisation (unchanged from previous file)
// ────────────────────────────────────────────────────────────────────────────────

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// ────────────────────────────────────────────────────────────────────────────────
// Worker entry
// ────────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const raw = await handler.fetch(request, env, ctx);
      const normalised = await normalizeCatastrophicSsrResponse(raw);
      return applySecurityHeaders(normalised);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(brandedErrorResponse());
    }
  },
};

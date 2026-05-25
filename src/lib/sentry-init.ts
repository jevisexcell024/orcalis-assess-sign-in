/**
 * Sentry error tracking + performance + session replay.
 *
 * Rewritten for @sentry/react v10. The previous file imported `BrowserTracing`
 * from `@sentry/tracing` and instantiated `new Sentry.Replay(...)` — both are
 * v7 APIs and will throw at runtime against the installed v10 package, which
 * meant the app silently had no error tracking.
 *
 * v10 uses functional integrations: `browserTracingIntegration()` and
 * `replayIntegration()`. The deprecated `@sentry/tracing` package can be
 * removed from package.json after this lands.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || "development";

  if (!dsn) {
    // Quiet warning so devs aren't spammed in local dev.
    if (environment !== "production") {
      console.info("[Sentry] DSN not set — error tracking disabled in", environment);
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_APP_VERSION || undefined,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],

    // Performance — sample 10% in prod, everything in dev.
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,

    // Replay — sample 10% normally, 100% if there's an error.
    replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Hygiene
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    sendDefaultPii: false,

    // Don't capture noise from extensions / random scripts.
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],

    // Strip auth tokens and obvious secrets before they ever leave the client.
    beforeSend(event) {
      try {
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
        if (event.request?.url) {
          event.request.url = event.request.url.replace(
            /([?&](access_token|refresh_token|token_hash|apikey)=)[^&]+/gi,
            "$1[redacted]",
          );
        }
      } catch {
        // Never let scrubbing crash error reporting.
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  if (context) Sentry.setContext("custom", context);
  Sentry.captureException(error);
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

export function setUserContext(userId: string, email?: string, username?: string): void {
  if (!initialized) return;
  Sentry.setUser({ id: userId, email, username });
}

export function clearUserContext(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

export default Sentry;

/**
 * Auth error normalisation.
 *
 * Supabase's raw `error.message` strings ("Invalid login credentials",
 * "Email not confirmed", "Email rate limit exceeded", ...) leak implementation
 * detail and confuse end users. This module maps every known Supabase auth
 * error to friendly copy.
 *
 * Two extra design goals:
 *   1. Resist email enumeration. We deliberately collapse "user not found"
 *      and "wrong password" into the same message on sign-in. Forgot-password
 *      already does this in the UI; this keeps sign-in consistent.
 *   2. Never surface stack traces or codes to the user. If an unknown error
 *      slips through, return a generic message and let Sentry log the detail.
 *
 * Usage:
 *   import { toFriendlyAuthError } from "@/lib/auth-errors";
 *   const { error } = await supabase.auth.signInWithPassword({...});
 *   if (error) setSubmitError(toFriendlyAuthError(error, "signIn"));
 */

import type { AuthError } from "@supabase/supabase-js";
import { captureException } from "./sentry-init";

type AuthSurface =
  | "signIn"
  | "signUp"
  | "forgotPassword"
  | "resetPassword"
  | "oauth"
  | "verify";

interface FriendlyMessage {
  match: (raw: string, status?: number) => boolean;
  message: string;
}

/**
 * Generic fallback per surface. Sign-in is deliberately vague to avoid
 * confirming whether an account exists for a given email.
 */
const GENERIC: Record<AuthSurface, string> = {
  signIn: "We couldn't sign you in with those details. Please check and try again.",
  signUp: "We couldn't create your account. Please try again in a moment.",
  forgotPassword:
    "We couldn't send the reset link right now. Please try again in a moment.",
  resetPassword:
    "We couldn't update your password. Please request a new reset link and try again.",
  oauth: "Single sign-on didn't complete. Please try again or use email and password.",
  verify: "We couldn't confirm that link. It may have expired — please request a new one.",
};

/**
 * Per-surface lookup tables. First match wins.
 * The matchers are case-insensitive substring checks against the raw message;
 * status-code matchers are also supported for known Supabase responses.
 */
const TABLES: Record<AuthSurface, FriendlyMessage[]> = {
  signIn: [
    {
      match: (m) =>
        /invalid login credentials/i.test(m) ||
        /invalid email or password/i.test(m) ||
        /user not found/i.test(m),
      message: "Email or password is incorrect. Please try again.",
    },
    {
      match: (m) => /email not confirmed/i.test(m),
      message: "Please confirm your email first — check your inbox for the link we sent.",
    },
    {
      match: (m) => /too many requests/i.test(m) || /rate limit/i.test(m),
      message: "Too many attempts. Please wait a minute before trying again.",
    },
    {
      match: (m) => /network/i.test(m) || /failed to fetch/i.test(m),
      message: "We couldn't reach our servers. Check your connection and try again.",
    },
  ],
  signUp: [
    {
      match: (m) =>
        /already registered/i.test(m) ||
        /user already/i.test(m) ||
        /already exists/i.test(m),
      // Enumeration-safe: don't confirm the address is taken; nudge them to sign in.
      message:
        "If that email is already registered, please sign in or use 'Forgot password'.",
    },
    {
      match: (m) => /password.*(weak|short|requirements)/i.test(m),
      message: "That password doesn't meet our requirements. Please choose a stronger one.",
    },
    {
      match: (m) => /signup.*disabled/i.test(m),
      message: "Sign-up is temporarily unavailable. Please try again later.",
    },
    {
      match: (m) => /rate limit/i.test(m),
      message: "Too many sign-ups from this address. Please wait a few minutes.",
    },
  ],
  forgotPassword: [
    {
      // Enumeration-safe: don't reveal whether the address exists.
      match: (m) => /user not found/i.test(m) || /no user/i.test(m),
      message:
        "If an account exists for that email, we've sent a reset link. Please check your inbox.",
    },
    {
      match: (m) => /rate limit/i.test(m),
      message: "Too many reset requests. Please wait before trying again.",
    },
  ],
  resetPassword: [
    {
      match: (m) => /token.*(expired|invalid)/i.test(m) || /link.*expired/i.test(m),
      message: "This reset link has expired. Please request a new one.",
    },
    {
      match: (m) => /same.*password/i.test(m),
      message: "Your new password must be different from your current one.",
    },
  ],
  oauth: [
    {
      match: (m) => /popup.*closed/i.test(m) || /cancelled/i.test(m),
      message: "Sign-in was cancelled. Please try again.",
    },
    {
      match: (m) => /redirect/i.test(m),
      message: "There was a problem returning from your provider. Please try again.",
    },
  ],
  verify: [
    {
      match: (m) => /expired/i.test(m),
      message: "This link has expired. Please request a new one.",
    },
    {
      match: (m) => /token/i.test(m) && /invalid/i.test(m),
      message: "This link is no longer valid. Please request a new one.",
    },
  ],
};

interface InputErrorShape {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
}

/**
 * Translate a Supabase AuthError (or any error-like object) to user-friendly copy.
 * Unknown errors are logged to Sentry; the surface's generic fallback is returned.
 */
export function toFriendlyAuthError(
  error: AuthError | Error | InputErrorShape | unknown,
  surface: AuthSurface,
): string {
  const raw = extractMessage(error);
  const status = extractStatus(error);

  if (raw) {
    const table = TABLES[surface];
    for (const entry of table) {
      if (entry.match(raw, status)) return entry.message;
    }
  }

  // Unknown error — log full detail to Sentry for debugging, but show the
  // generic copy to the user.
  captureException(error, { surface, raw, status });

  return GENERIC[surface];
}

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const e = error as InputErrorShape;
    return e.message ?? "";
  }
  return "";
}

function extractStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null) {
    const e = error as InputErrorShape;
    return typeof e.status === "number" ? e.status : undefined;
  }
  return undefined;
}

/**
 * Tiny helper for forms: takes whatever Supabase returns and either sets a
 * user-friendly error on the form or clears it. Lets callers write one line:
 *
 *   handleAuthResult(error, "signIn", setSubmitError);
 */
export function handleAuthResult(
  error: AuthError | Error | null | undefined,
  surface: AuthSurface,
  setError: (message: string | null) => void,
): boolean {
  if (!error) {
    setError(null);
    return true;
  }
  setError(toFriendlyAuthError(error, surface));
  return false;
}

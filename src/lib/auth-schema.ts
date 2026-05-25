import { z } from "zod";

/**
 * Centralised auth validation schemas.
 *
 * Password policy
 * ───────────────
 *  - Minimum 10 characters (was 8; NIST 800-63B still allows 8 but modern best
 *    practice is 10–12 for non-MFA accounts).
 *  - At least one lowercase letter.
 *  - At least one uppercase letter.
 *  - At least one digit.
 *  - At least one symbol.
 *  - Cannot be the email address (very common pattern in breach data).
 *  - Maximum 128 chars (kept) — Supabase Auth has its own hard cap.
 *
 * The sign-IN form deliberately does NOT enforce this — users with legacy
 * shorter passwords must still be able to sign in. Only sign-up / reset apply
 * the strict policy.
 */

const EMAIL_FIELD = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Enter a valid email address" })
  .max(255);

/** Loose password — used for sign-IN only. */
const PASSWORD_LOOSE = z
  .string()
  .min(1, { message: "Password is required" })
  .max(128);

/** Strict password — used for sign-UP and password-RESET. */
function strictPassword() {
  return z
    .string()
    .min(10, { message: "Password must be at least 10 characters" })
    .max(128, { message: "Password is too long" })
    .regex(/[a-z]/, { message: "Add at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Add at least one uppercase letter" })
    .regex(/\d/, { message: "Add at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Add at least one symbol (e.g. ! @ # ?)" });
}

// ────────────────────────────────────────────────────────────────────────────────
// Sign in
// ────────────────────────────────────────────────────────────────────────────────

export const signInSchema = z.object({
  email: EMAIL_FIELD,
  password: PASSWORD_LOOSE,
  remember: z.boolean().optional(),
});
export type SignInValues = z.infer<typeof signInSchema>;

// ────────────────────────────────────────────────────────────────────────────────
// Sign up
// ────────────────────────────────────────────────────────────────────────────────

export const signUpSchema = z
  .object({
    institutionName: z
      .string()
      .trim()
      .min(2, { message: "Institution name is required" })
      .max(120),
    contactName: z
      .string()
      .trim()
      .min(2, { message: "Contact name is required" })
      .max(120),
    email: EMAIL_FIELD,
    password: strictPassword(),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  })
  .refine((data) => data.password.toLowerCase() !== data.email.toLowerCase(), {
    path: ["password"],
    message: "Password cannot be the same as your email",
  });
export type SignUpValues = z.infer<typeof signUpSchema>;

// ────────────────────────────────────────────────────────────────────────────────
// Forgot password
// ────────────────────────────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: EMAIL_FIELD,
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// ────────────────────────────────────────────────────────────────────────────────
// Reset password
// ────────────────────────────────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    password: strictPassword(),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ────────────────────────────────────────────────────────────────────────────────
// Admin sign in — same shape as candidate sign-in but exported separately so
// the form can wire to a dedicated schema rather than using ad-hoc RHF `required`.
// ────────────────────────────────────────────────────────────────────────────────

export const adminSignInSchema = signInSchema;
export type AdminSignInValues = SignInValues;

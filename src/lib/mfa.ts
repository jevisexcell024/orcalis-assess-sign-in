/**
 * MFA / TOTP helpers (client-side)
 * Uses the Supabase Auth MFA API (built-in TOTP support).
 * Docs: https://supabase.com/docs/guides/auth/auth-mfa
 */
import { supabase } from "@/integrations/supabase/client";

export type TOTPFactor = {
  id: string;
  friendly_name: string;
  factor_type: "totp";
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
};

export type MFAEnrollResult = {
  id: string;                // factor_id
  totp: {
    qr_code: string;         // SVG data URL
    secret: string;          // base32 secret for manual entry
    uri: string;             // otpauth:// URI
  };
};

/** Start TOTP enrollment — returns QR code and secret */
export async function enrollTOTP(friendlyName = "Orcalis Assess"): Promise<MFAEnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });
  if (error) throw new Error(error.message);
  return data as unknown as MFAEnrollResult;
}

/** Verify the TOTP code to complete enrollment */
export async function verifyTOTP(factorId: string, code: string): Promise<void> {
  // 1. Create a challenge
  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeErr) throw new Error(challengeErr.message);

  // 2. Verify the code
  const { error: verifyErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyErr) throw new Error(verifyErr.message);
}

/** List enrolled MFA factors */
export async function listFactors(): Promise<TOTPFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message);
  return (data?.totp ?? []) as TOTPFactor[];
}

/** Unenroll (remove) a TOTP factor */
export async function unenrollTOTP(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message);
}

/** Get Assurance Level — 'aal1' = password only, 'aal2' = password + MFA */
export async function getAssuranceLevel(): Promise<"aal1" | "aal2"> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return "aal1";
  return data?.currentLevel ?? "aal1";
}

/** Challenge and verify for login MFA step */
export async function challengeAndVerify(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeErr) throw new Error(challengeErr.message);
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (error) throw new Error(error.message);
}

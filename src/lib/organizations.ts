import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OrgRole = "owner" | "admin" | "instructor" | "proctor" | "member";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type OrgMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
};

export type OrgInvitation = {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

const CURRENT_ORG_KEY = "orcalis:current_org_id";

export function getCurrentOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_ORG_KEY);
}

export function setCurrentOrgId(orgId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_ORG_KEY, orgId);
}

export async function listMyOrgs(): Promise<Array<Organization & { role: OrgRole }>> {
  const { data: memberships, error: mErr } = await supabase
    .from("organization_members" as never)
    .select("organization_id, role");
  if (mErr) throw mErr;
  if (!memberships?.length) return [];

  const orgIds = (memberships as Array<{ organization_id: string; role: OrgRole }>).map((m) => m.organization_id);
  const { data: orgs, error: oErr } = await supabase
    .from("organizations" as never)
    .select("*")
    .in("id", orgIds);
  if (oErr) throw oErr;

  const roleMap = new Map((memberships as Array<{ organization_id: string; role: OrgRole }>).map((m) => [m.organization_id, m.role]));
  return (orgs as unknown as Organization[]).map((o) => ({ ...o, role: roleMap.get(o.id) ?? "member" }));
}

export async function getOrCreateCurrentOrg(): Promise<(Organization & { role: OrgRole }) | null> {
  const orgs = await listMyOrgs();
  if (!orgs.length) return null;
  const stored = getCurrentOrgId();
  const found = stored ? orgs.find((o) => o.id === stored) : null;
  const chosen = found ?? orgs[0];
  setCurrentOrgId(chosen.id);
  return chosen;
}

export async function updateOrganization(id: string, patch: Partial<Pick<Organization, "name" | "logo_url" | "settings">>): Promise<void> {
  const { error } = await supabase.from("organizations" as never).update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function listOrgMembers(orgId: string): Promise<Array<OrgMember & { email?: string }>> {
  const { data, error } = await supabase
    .from("organization_members" as never)
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const members = (data as unknown as OrgMember[]) ?? [];

  // Try to join with profiles for email display (RLS may limit visibility)
  if (members.length) {
    const userIds = members.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,email")
      .in("user_id", userIds);
    const emailMap = new Map((profiles ?? []).map((p) => [p.user_id, p.email]));
    return members.map((m) => ({ ...m, email: emailMap.get(m.user_id) }));
  }
  return members;
}

export async function updateMemberRole(memberId: string, role: OrgRole): Promise<void> {
  const { error } = await supabase.from("organization_members" as never).update({ role } as never).eq("id", memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from("organization_members" as never).delete().eq("id", memberId);
  if (error) throw error;
}

export async function listInvitations(orgId: string): Promise<OrgInvitation[]> {
  const { data, error } = await supabase
    .from("organization_invitations" as never)
    .select("*")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as OrgInvitation[]) ?? [];
}

export async function createInvitation(orgId: string, email: string, role: OrgRole): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("organization_invitations" as never)
    .insert({ organization_id: orgId, email, role, invited_by: user.id } as never);
  if (error) throw error;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from("organization_invitations" as never)
    .delete()
    .eq("id", invitationId);
  if (error) throw error;
}

// Keep helper for future use even if not referenced yet
export type _DB = Database;
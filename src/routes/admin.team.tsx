import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSession } from "@/lib/auth";
import {
  createInvitation,
  getOrCreateCurrentOrg,
  listInvitations,
  listOrgMembers,
  removeMember,
  revokeInvitation,
  updateMemberRole,
  type OrgInvitation,
  type OrgMember,
  type OrgRole,
  type Organization,
} from "@/lib/organizations";
import { Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [
      { title: "Team · Orcalis Assess" },
      { name: "description", content: "Invite teammates and manage their roles within your organization." },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/admin-login" });
  },
  component: TeamPage,
});

const ROLES: OrgRole[] = ["owner", "admin", "instructor", "proctor", "member"];

function TeamPage() {
  const [org, setOrg] = useState<(Organization & { role: OrgRole }) | null>(null);
  const [members, setMembers] = useState<Array<OrgMember & { email?: string }>>([]);
  const [invites, setInvites] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (orgId: string) => {
    const [m, i] = await Promise.all([listOrgMembers(orgId), listInvitations(orgId)]);
    setMembers(m);
    setInvites(i);
  };

  useEffect(() => {
    (async () => {
      const o = await getOrCreateCurrentOrg();
      setOrg(o);
      if (o) await refresh(o.id);
      setLoading(false);
    })();
  }, []);

  const canManage = org?.role === "owner" || org?.role === "admin";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setBusy(true);
    setError(null);
    try {
      await createInvitation(org.id, inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail("");
      setInviteRole("member");
      await refresh(org.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: OrgRole) => {
    await updateMemberRole(memberId, role);
    if (org) await refresh(org.id);
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the organization?")) return;
    await removeMember(memberId);
    if (org) await refresh(org.id);
  };

  const handleRevoke = async (id: string) => {
    await revokeInvitation(id);
    if (org) await refresh(org.id);
  };

  return (
    <AdminShell title="Team" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Team" }]}>
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !org ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No organization found</h3>
        </Card>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6">
          {canManage && (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold">Invite a teammate</h3>
              </div>
              <form onSubmit={handleInvite} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                <div className="space-y-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((r) => r !== "owner").map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={busy || !inviteEmail}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send invite
                </Button>
              </form>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Invitees will redeem the invitation link the first time they sign in.</p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold">Members ({members.length})</h3>
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.email ?? m.user_id.slice(0, 8)}</p>
                    <p className="truncate text-xs text-muted-foreground">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && m.role !== "owner" ? (
                      <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v as OrgRole)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.filter((r) => r !== "owner").map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                    )}
                    {canManage && m.role !== "owner" && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(m.id)} aria-label="Remove member">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {invites.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 text-base font-semibold">Pending invitations ({invites.length})</h3>
              <div className="divide-y divide-border">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{inv.role}</Badge>
                      {canManage && (
                        <Button variant="ghost" size="icon" onClick={() => handleRevoke(inv.id)} aria-label="Revoke">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </AdminShell>
  );
}

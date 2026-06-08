import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth";
import { getOrCreateCurrentOrg, updateOrganization, type Organization, type OrgRole } from "@/lib/organizations";
import { Loader2, Building2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/organization")({
  head: () => ({
    meta: [
      { title: "Organization · Orcalis Assess" },
      { name: "description", content: "Manage your organization's profile, branding, and plan." },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/admin-login" });
  },
  component: OrgSettingsPage,
});

function OrgSettingsPage() {
  const [org, setOrg] = useState<(Organization & { role: OrgRole }) | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const o = await getOrCreateCurrentOrg();
      setOrg(o);
      if (o) {
        setName(o.name);
        setLogoUrl(o.logo_url ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const canEdit = org?.role === "owner" || org?.role === "admin";

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateOrganization(org.id, { name, logo_url: logoUrl || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Organization" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Organization" }]}>
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !org ? (
        <Card className="p-8 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No organization found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Sign out and sign back in to provision your workspace.</p>
        </Card>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Profile</h3>
                <p className="text-sm text-muted-foreground">Public-facing information for your organization.</p>
              </div>
              <Badge variant="secondary" className="capitalize">{org.role}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Organization name</Label>
                <Input id="name" value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" value={logoUrl} disabled={!canEdit} placeholder="https://…/logo.png" onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={org.slug} disabled />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Input value={org.plan} disabled className="capitalize" />
              </div>
            </div>
            {canEdit && (
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save changes
                </Button>
                {saved && <span className="text-sm text-emerald-600">Saved</span>}
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminShell>
  );
}

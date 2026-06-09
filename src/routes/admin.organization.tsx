import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Building2, BookOpen, GraduationCap, Calendar, MapPin,
  Plus, Save, Edit2, Trash2, Users2, Globe, ChevronRight,
  X, Check, AlertCircle, Settings2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import {
  getOrCreateCurrentOrg,
  updateOrganization,
  type Organization,
  type OrgRole,
} from "@/lib/organizations";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";

export const Route = createFileRoute("/admin/organization")({
  head: () => ({
    meta: [
      { title: "Institution Management · Orcalis Assess" },
      { name: "description", content: "Manage your institution: faculties, departments, programs, courses, and campuses." },
    ],
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/admin-login" });
  },
  component: OrgPage,
});

const NAVY = "oklch(0.385 0.12 247)";

const TABS = [
  { id: "overview",    label: "Overview",    icon: Building2 },
  { id: "faculties",   label: "Faculties",   icon: GraduationCap },
  { id: "departments", label: "Departments", icon: BookOpen },
  { id: "programs",    label: "Programs",    icon: BookOpen },
  { id: "campuses",    label: "Campuses",    icon: MapPin },
  { id: "academic",    label: "Academic Yr", icon: Calendar },
] as const;

type Tab = typeof TABS[number]["id"];

// ─── Generic CRUD list component ─────────────────────────────
function CrudList<T extends { id: string; name: string; created_at: string }>({
  items,
  isLoading,
  onAdd,
  onDelete,
  emptyLabel,
  columns,
}: {
  items: T[];
  isLoading: boolean;
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  emptyLabel: string;
  columns?: { key: keyof T; label: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSavingNew(true);
    try {
      await onAdd(newName.trim());
      setNewName("");
      setAdding(false);
      toast.success("Added");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add");
    } finally {
      setSavingNew(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This may affect associated records.`)) return;
    setDeleting(id);
    try {
      await onDelete(id);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!adding ? (
          <Button size="sm" className="gap-1.5 text-white" style={{ background: NAVY }}
            onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewName(""); } }}
              placeholder="Name…" className="h-8 w-64 text-sm" />
            <Button size="sm" onClick={handleAdd} disabled={savingNew || !newName.trim()}
              className="text-white gap-1" style={{ background: NAVY }}>
              <Check className="h-3.5 w-3.5" /> {savingNew ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              {columns?.map((c) => (
                <th key={String(c.key)} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={3 + (columns?.length ?? 0)} className="py-10 text-center text-muted-foreground text-sm">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={3 + (columns?.length ?? 0)} className="py-10 text-center text-muted-foreground text-sm">
                {emptyLabel}
              </td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  {columns?.map((c) => (
                    <td key={String(c.key)} className="px-4 py-3 text-muted-foreground text-sm">
                      {String(item[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deleting === item.id}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
function OrgPage() {
  const qc = useQueryClient();
  const [tab, setTab]         = useState<Tab>("overview");
  const [saving, setSaving]   = useState(false);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["org", "current"],
    queryFn: getOrCreateCurrentOrg,
  });

  const [profile, setProfile] = useState({
    name: "",
    type: "university",
    accreditation: "",
    website: "",
    phone: "",
    address: "",
  });

  // Initialize profile from org
  const [profileInitialized, setProfileInitialized] = useState(false);
  if (org && !profileInitialized) {
    const s = org.settings as any ?? {};
    setProfile({
      name:          org.name ?? "",
      type:          s.type ?? "university",
      accreditation: s.accreditation ?? "",
      website:       s.website ?? "",
      phone:         s.phone ?? "",
      address:       s.address ?? "",
    });
    setProfileInitialized(true);
  }

  // ── Faculties ──
  const { data: faculties = [], isLoading: facLoading } = useQuery({
    queryKey: ["org", "faculties", org?.id],
    queryFn: async () => {
      if (!org) return [];
      const { data, error } = await (supabase as any)
        .from("faculties")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!org,
  });

  // ── Departments ──
  const { data: departments = [], isLoading: deptLoading } = useQuery({
    queryKey: ["org", "departments", org?.id],
    queryFn: async () => {
      if (!org) return [];
      const { data, error } = await (supabase as any)
        .from("departments")
        .select("*, faculties(name)")
        .eq("organization_id", org.id)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!org,
  });

  // ── Programs ──
  const { data: programs = [], isLoading: progLoading } = useQuery({
    queryKey: ["org", "programs", org?.id],
    queryFn: async () => {
      if (!org) return [];
      const { data, error } = await (supabase as any)
        .from("programs")
        .select("*, departments(name)")
        .eq("organization_id", org.id)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!org,
  });

  // ── Campuses ──
  const { data: campuses = [], isLoading: campLoading } = useQuery({
    queryKey: ["org", "campuses", org?.id],
    queryFn: async () => {
      if (!org) return [];
      const { data, error } = await (supabase as any)
        .from("campuses")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!org,
  });

  // ── Academic Years ──
  const { data: academicYears = [], isLoading: ayLoading } = useQuery({
    queryKey: ["org", "academic-years", org?.id],
    queryFn: async () => {
      if (!org) return [];
      const { data, error } = await (supabase as any)
        .from("academic_years")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!org,
  });

  const handleSaveProfile = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await updateOrganization(org.id, {
        name: profile.name,
        settings: {
          ...(org.settings ?? {}),
          type: profile.type,
          accreditation: profile.accreditation,
          website: profile.website,
          phone: profile.phone,
          address: profile.address,
        },
      });
      await writeAuditLog({ action: "UPDATE", resource_type: "organization", resource_id: org.id, organization_id: org.id });
      qc.invalidateQueries({ queryKey: ["org", "current"] });
      toast.success("Institution profile saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Generic add/delete factories
  const addToTable = (table: string) => async (name: string) => {
    if (!org) return;
    const { error } = await (supabase as any).from(table).insert({ name, organization_id: org.id });
    if (error) throw error;
    await writeAuditLog({ action: "CREATE", resource_type: table, organization_id: org.id });
    qc.invalidateQueries({ queryKey: ["org", table.replace(/_/g, "-"), org.id] });
    // Also invalidate plural forms
    qc.invalidateQueries({ queryKey: ["org"] });
  };

  const deleteFromTable = (table: string, invalidateKey?: string) => async (id: string) => {
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) throw error;
    await writeAuditLog({ action: "DELETE", resource_type: table, resource_id: id, organization_id: org?.id });
    qc.invalidateQueries({ queryKey: ["org"] });
  };

  if (orgLoading) {
    return (
      <AdminShell title="Institution Management" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Institution" }]}>
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading institution…</div>
      </AdminShell>
    );
  }

  if (!org) {
    return (
      <AdminShell title="Institution Management" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Institution" }]}>
        <div className="flex flex-col items-center gap-4 py-20">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <p className="text-base font-semibold">No institution found</p>
          <p className="text-sm text-muted-foreground">Contact your platform administrator to set up an institution.</p>
        </div>
      </AdminShell>
    );
  }

  const settings = org.settings as any ?? {};

  return (
    <AdminShell
      title="Institution Management"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Institution" }]}
      actions={
        tab === "overview" ? (
          <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-1.5 text-white" style={{ background: NAVY }}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        ) : undefined
      }
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1 mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                tab === t.id ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background",
              )}
              style={tab === t.id ? { background: NAVY } : undefined}>
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Stats */}
            <div className="space-y-3">
              {[
                { label: "Faculties",   value: faculties.length,   icon: GraduationCap },
                { label: "Departments", value: departments.length,  icon: BookOpen      },
                { label: "Programs",    value: programs.length,     icon: BookOpen      },
                { label: "Campuses",    value: campuses.length,     icon: MapPin        },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile form */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Institution Profile
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Institution Name</Label>
                  <Input className="mt-1" value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Institution Type</Label>
                  <select value={profile.type} onChange={(e) => setProfile((p) => ({ ...p, type: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
                    {["university","college","polytechnic","vocational","certification_body","corporate","government"].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Accreditation</Label>
                  <Input className="mt-1" placeholder="e.g. NUC, NAAC, WAEC" value={profile.accreditation}
                    onChange={(e) => setProfile((p) => ({ ...p, accreditation: e.target.value }))} />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input type="url" className="mt-1" placeholder="https://…" value={profile.website}
                    onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" placeholder="+1 555 000 0000" value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input className="mt-1" placeholder="123 University Ave, City, Country" value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
                </div>
              </div>

              {/* Plan badge */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 mt-2">
                <div>
                  <p className="text-sm font-medium">Current Plan</p>
                  <p className="text-xs text-muted-foreground">Manage subscription in Billing</p>
                </div>
                <Badge variant="outline" className="capitalize font-semibold">{org.plan}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Faculties */}
        {tab === "faculties" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Faculties</h2>
              <p className="text-sm text-muted-foreground">Top-level academic divisions of your institution.</p>
            </div>
            <CrudList
              items={faculties}
              isLoading={facLoading}
              onAdd={addToTable("faculties")}
              onDelete={deleteFromTable("faculties")}
              emptyLabel="No faculties yet. Add your first faculty (e.g. Faculty of Engineering)."
            />
          </div>
        )}

        {/* Departments */}
        {tab === "departments" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Departments</h2>
              <p className="text-sm text-muted-foreground">Departments within each faculty.</p>
            </div>
            <CrudList
              items={departments.map((d: any) => ({ ...d, faculty: d.faculties?.name ?? "—" }))}
              isLoading={deptLoading}
              onAdd={addToTable("departments")}
              onDelete={deleteFromTable("departments")}
              emptyLabel="No departments yet."
              columns={[{ key: "faculty" as any, label: "Faculty" }]}
            />
          </div>
        )}

        {/* Programs */}
        {tab === "programs" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Programs</h2>
              <p className="text-sm text-muted-foreground">Degree and certificate programs offered.</p>
            </div>
            <CrudList
              items={programs.map((p: any) => ({ ...p, department: p.departments?.name ?? "—" }))}
              isLoading={progLoading}
              onAdd={addToTable("programs")}
              onDelete={deleteFromTable("programs")}
              emptyLabel="No programs yet."
              columns={[{ key: "department" as any, label: "Department" }]}
            />
          </div>
        )}

        {/* Campuses */}
        {tab === "campuses" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Campuses & Study Centers</h2>
              <p className="text-sm text-muted-foreground">Physical and virtual locations.</p>
            </div>
            <CrudList
              items={campuses}
              isLoading={campLoading}
              onAdd={addToTable("campuses")}
              onDelete={deleteFromTable("campuses")}
              emptyLabel="No campuses yet. Add your main campus or study centers."
            />
          </div>
        )}

        {/* Academic Years */}
        {tab === "academic" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Academic Years</h2>
              <p className="text-sm text-muted-foreground">Define your academic calendar periods.</p>
            </div>
            <CrudList
              items={academicYears}
              isLoading={ayLoading}
              onAdd={addToTable("academic_years")}
              onDelete={deleteFromTable("academic_years")}
              emptyLabel="No academic years defined yet. E.g. 2024/2025."
            />
          </div>
        )}
      </div>
    </AdminShell>
  );
}

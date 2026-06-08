import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Plus, FileText, Calendar, MoreHorizontal, Archive, Trash2,
  Globe, Search, Download, CheckSquare, Square, X,
  BookOpen, Clock, FolderArchive,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listExams, updateExam, deleteExam } from "@/lib/exams";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams")({
  component: ExamsPage,
  head: () => ({ meta: [{ title: "Examinations · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";

async function getExamStats(examIds: string[]) {
  if (!examIds.length) return { scheduled: 0, upcoming: 0 };
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("exam_schedules")
    .select("exam_id, start_at, end_at")
    .in("exam_id", examIds);
  const rows = data ?? [];
  const scheduled = new Set(rows.map((r) => r.exam_id)).size;
  const upcoming = new Set(rows.filter((r) => r.start_at > now).map((r) => r.exam_id)).size;
  return { scheduled, upcoming };
}

const STATUS_FILTERS = [
  { id: "all",       label: "All Exams" },
  { id: "draft",     label: "Draft" },
  { id: "published", label: "Published" },
  { id: "archived",  label: "Archived" },
] as const;

function ExamsPage() {
  // ── ALL hooks must be at the top — before any conditional returns ──
  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [openMenu,     setOpenMenu]     = useState<string | null>(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn:  listExams,
  });

  const examIds = useMemo(() => exams.map((e) => e.id), [exams]);

  const { data: stats = { scheduled: 0, upcoming: 0 } } = useQuery({
    queryKey: ["exam-stats", examIds],
    queryFn:  () => getExamStats(examIds),
    enabled:  examIds.length > 0,
    staleTime: 30_000,
  });

  const counts = useMemo(() => ({
    total:     exams.length,
    published: exams.filter((e) => e.status === "published").length,
    draft:     exams.filter((e) => e.status === "draft").length,
    archived:  exams.filter((e) => e.status === "archived").length,
    scheduled: stats.scheduled,
    upcoming:  stats.upcoming,
  }), [exams, stats]);

  const filtered = useMemo(() => {
    let list = exams;
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (search.trim()) list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [exams, statusFilter, search]);

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  const toggleAll = () => {
    if (allSelected) setSelected((p) => { const n = new Set(p); filtered.forEach((e) => n.delete(e.id)); return n; });
    else             setSelected((p) => { const n = new Set(p); filtered.forEach((e) => n.add(e.id));    return n; });
  };
  const toggleOne = (id: string) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const archiveMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => updateExam(id, { status: "archived" }))),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["exams"] }); setSelected(new Set()); toast.success("Exams archived."); },
    onError:    () => toast.error("Failed to archive exams."),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => deleteExam(id))),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["exams"] }); setSelected(new Set()); toast.success("Exams deleted."); },
    onError:    () => toast.error("Failed to delete exams."),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "published" | "draft" }) => updateExam(id, { status }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["exams"] }); setOpenMenu(null); toast.success("Exam updated."); },
    onError:    () => toast.error("Failed to update exam."),
  });

  const handleExport = () => {
    exportToCSV("exams-export.csv", filtered as any[], [
      { key: "id",         header: "ID" },
      { key: "title",      header: "Title" },
      { key: "status",     header: "Status" },
      { key: "term",       header: "Term" },
      { key: "created_at", header: "Created At" },
    ]);
    toast.success("Exported to CSV.");
  };

  // ── After all hooks: conditional render for child routes ──
  if (pathname !== "/admin/exams") return <Outlet />;

  const statCards = [
    { label: "Total",     value: counts.total,    icon: BookOpen,      color: "text-sky-700 bg-sky-50",         filter: "all" },
    { label: "Published", value: counts.published, icon: Globe,         color: "text-emerald-700 bg-emerald-50", filter: "published" },
    { label: "Draft",     value: counts.draft,     icon: FileText,      color: "text-amber-700 bg-amber-50",     filter: "draft" },
    { label: "Archived",  value: counts.archived,  icon: FolderArchive, color: "text-rose-700 bg-rose-50",       filter: "archived" },
    { label: "Scheduled", value: counts.scheduled, icon: Calendar,      color: "text-violet-700 bg-violet-50",   filter: null },
    { label: "Upcoming",  value: counts.upcoming,  icon: Clock,         color: "text-indigo-700 bg-indigo-50",   filter: null },
  ];

  return (
    <AdminShell
      title="Examinations"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Examinations" }]}
      actions={
        <Button size="sm" className="gap-1.5 text-white" style={{ background: NAVY }}
          onClick={() => navigate({ to: "/admin/exams/new" })}
        >
          <Plus className="h-4 w-4" /> New Examination
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.label} type="button"
                onClick={() => c.filter !== null && setStatusFilter(c.filter)}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 text-left shadow-sm transition",
                  c.filter !== null ? "hover:shadow-md cursor-pointer" : "cursor-default",
                  statusFilter === c.filter && c.filter !== null ? "ring-2 ring-[oklch(0.385_0.12_247)]" : "",
                )}
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search examinations…" className="pl-9 h-9" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {STATUS_FILTERS.map((t) => (
              <button key={t.id}
                onClick={() => { setStatusFilter(t.id); setSelected(new Set()); }}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition",
                  statusFilter === t.id ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                style={statusFilter === t.id ? { background: NAVY } : undefined}
              >{t.label}</button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => archiveMutation.mutate(Array.from(selected))}
                disabled={archiveMutation.isPending}
              ><Archive className="h-4 w-4" /> Archive</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => { if (confirm(`Delete ${selected.size} exam(s)?`)) deleteMutation.mutate(Array.from(selected)); }}
                disabled={deleteMutation.isPending}
              ><Trash2 className="h-4 w-4" /> Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading examinations…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No examinations found</p>
              <Button size="sm" className="gap-1.5 text-white mt-1" style={{ background: NAVY }}
                onClick={() => navigate({ to: "/admin/exams/new" })}
              ><Plus className="h-4 w-4" /> Create Examination</Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                      {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Examination</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Term</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Created</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((exam) => {
                  const isSelected = selected.has(exam.id);
                  const isMenuOpen = openMenu === exam.id;
                  return (
                    <tr key={exam.id}
                      className={cn("border-b border-border last:border-0 transition-colors",
                        isSelected ? "bg-blue-50/40" : "hover:bg-muted/20")}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => toggleOne(exam.id)} className="text-muted-foreground hover:text-foreground">
                          {isSelected
                            ? <CheckSquare className="h-4 w-4 text-[oklch(0.385_0.12_247)]" />
                            : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.id.slice(0, 8).toUpperCase()}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{exam.term ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          exam.status === "published" ? "bg-emerald-100 text-emerald-700" :
                          exam.status === "archived"  ? "bg-rose-100 text-rose-700" :
                                                        "bg-amber-100 text-amber-700",
                        )}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                        {new Date(exam.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button onClick={() => setOpenMenu(isMenuOpen ? null : exam.id)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-border bg-background shadow-lg">
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => { navigate({ to: "/admin/exams/$examId/builder", params: { examId: exam.id } }); setOpenMenu(null); }}>
                                <BookOpen className="h-4 w-4" /> Open Builder
                              </button>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => publishMutation.mutate({ id: exam.id, status: exam.status === "published" ? "draft" : "published" })}>
                                <Globe className="h-4 w-4" />
                                {exam.status === "published" ? "Unpublish" : "Publish"}
                              </button>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => { archiveMutation.mutate([exam.id]); setOpenMenu(null); }}>
                                <Archive className="h-4 w-4" /> Archive
                              </button>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                onClick={() => { if (confirm("Delete this exam?")) { deleteMutation.mutate([exam.id]); setOpenMenu(null); } }}>
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {filtered.length > 0 && (
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Showing {filtered.length} of {exams.length} examination{exams.length !== 1 ? "s" : ""}</span>
              {selected.size > 0 && <span>{selected.size} selected</span>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

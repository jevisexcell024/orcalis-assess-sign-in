import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, FileText, Calendar, MoreHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listExams, createExam } from "@/lib/exams";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams")({
  component: ExamsPage,
  head: () => ({
    meta: [{ title: "Exams · Orcalis Assess" }],
  }),
});

function ExamsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: exams, isLoading } = useQuery({
    queryKey: ["admin", "exams"],
    queryFn: listExams,
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const exam = await createExam({ title: title.trim(), term: term.trim() || null });
      await qc.invalidateQueries({ queryKey: ["admin", "exams"] });
      setOpen(false);
      setTitle("");
      setTerm("");
      navigate({ to: "/admin/exams/$examId/builder", params: { examId: exam.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      title="Exams"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Exams" }]}
    >
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
            <p className="text-sm text-muted-foreground">
              Build and manage proctored exams across your institution.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Exam
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-background p-12 text-center text-sm text-muted-foreground">
            Loading exams…
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {exams.map((e) => (
              <Link
                key={e.id}
                to="/admin/exams/$examId/builder"
                params={{ examId: e.id }}
                className="group rounded-2xl border border-border bg-background p-5 shadow-[0_1px_2px_oklch(0.2_0.02_260/0.04)] transition hover:border-foreground/20 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
                      e.status === "published"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : e.status === "archived"
                          ? "bg-slate-100 text-slate-600 ring-slate-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200",
                    )}
                  >
                    {e.status}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold leading-snug group-hover:text-foreground">
                  {e.title}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {e.term || "No term set"}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Updated{" "}
                    {new Date(e.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No exams yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first exam to start building sections and questions.
            </p>
            <Button className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create exam
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New exam</DialogTitle>
            <DialogDescription>
              Give the exam a title. You can add sections and questions next.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CS101 Final Exam"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="term">Term (optional)</Label>
              <Input
                id="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. Spring 2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !title.trim()}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
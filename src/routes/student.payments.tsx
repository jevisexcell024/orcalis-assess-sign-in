import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, Download, CheckCircle2, Clock, XCircle,
  Plus, Shield, Loader2,
} from "lucide-react";
import { redirectToCheckout } from "@/lib/payments";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student/payments")({
  component: StudentPaymentsPage,
  head: () => ({ meta: [{ title: "Payments · Orcalis Assess" }] }),
});

const NAVY = "oklch(0.385 0.12 247)";

// Exam registration fee (flat rate — replace when a real billing table exists)
const EXAM_FEE_USD = 50;

async function getMyRegistrations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("exam_registrations")
    .select("id, status, score, created_at, exams:exam_id(title, term)")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: `REG-${r.id.slice(0, 8).toUpperCase()}`,
    registration_id: r.id,
    description: r.exams?.title ?? "Exam Registration",
    term: r.exams?.term ?? "",
    amount: EXAM_FEE_USD,
    currency: "USD",
    // Map registration status to payment status
    status: r.status === "cancelled" ? "failed"
          : r.status === "completed" || r.status === "confirmed" ? "paid"
          : "pending",
    date: r.created_at?.slice(0, 10) ?? "",
    method: "–",
  }));
}

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  paid:    { label: "Paid",    icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending: { label: "Pending", icon: Clock,        cls: "bg-amber-50   text-amber-700   ring-amber-200"   },
  failed:  { label: "Failed",  icon: XCircle,      cls: "bg-rose-50    text-rose-700    ring-rose-200"     },
};

function StudentPaymentsPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["student", "payments"],
    queryFn: getMyRegistrations,
  });

  const handlePay = async (inv: typeof invoices[0]) => {
    setPayingId(inv.registration_id);
    try {
      await redirectToCheckout({
        items: [{ name: inv.description, amount_usd_cents: Math.round(inv.amount * 100) }],
        metadata: { registration_id: inv.registration_id },
      });
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed. Check your Stripe configuration.");
      setPayingId(null);
    }
  };

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalDue  = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const firstPending = invoices.find((i) => i.status === "pending");

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-muted-foreground">Exam registration fees and payment history.</p>
          </div>
          <Button
            onClick={() => setShowAddCard(true)}
            className="gap-1.5 text-white"
            style={{ background: NAVY }}
          >
            <Plus className="h-4 w-4" /> Add Payment Method
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700 tabular-nums">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <p className="text-xs text-amber-700">Amount Due</p>
            <p className="mt-1 text-3xl font-bold text-amber-700 tabular-nums">
              ${totalDue.toFixed(2)}
            </p>
            {totalDue > 0 && firstPending && (
              <Button
                size="sm"
                onClick={() => handlePay(firstPending)}
                disabled={!!payingId}
                className="mt-3 h-8 text-white text-xs gap-1.5"
                style={{ background: "oklch(0.72 0.15 85)" }}
              >
                {payingId ? <><Loader2 className="h-3 w-3 animate-spin" /> Processing…</> : "Pay Now"}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Saved Payment Methods</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCard(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Card
            </Button>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div
              className="flex h-10 w-16 items-center justify-center rounded-md text-[10px] font-bold text-white tracking-wider"
              style={{ background: NAVY }}
            >
              VISA
            </div>
            <div>
              <p className="text-sm font-medium">Visa ending in 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/27</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              <Shield className="h-3 w-3" /> Default
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Payment History</h3>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payment history…
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No exam registrations yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => {
                const meta = STATUS_META[inv.status];
                const Icon = meta.icon;
                return (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.id} · {inv.date}{inv.term ? ` · ${inv.term}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", meta.cls)}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums w-20 text-right">
                        ${inv.amount.toFixed(2)}
                      </span>
                      {inv.status === "pending" && (
                        <Button
                          size="sm"
                          className="h-8 text-xs text-white gap-1"
                          style={{ background: NAVY }}
                          disabled={!!payingId}
                          onClick={() => handlePay(inv)}
                        >
                          {payingId === inv.registration_id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : "Pay"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
}

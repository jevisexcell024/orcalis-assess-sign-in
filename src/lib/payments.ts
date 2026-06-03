/**
 * Payments lib — Stripe Checkout integration
 * Client helpers that call server-side API routes.
 */

export type PaymentItem = {
  name: string;
  description?: string;
  amount_usd_cents: number;   // e.g. 5000 = $50.00
  metadata?: Record<string, string>;
};

export type CheckoutSession = {
  session_id: string;
  url: string;
};

/** Create a Stripe Checkout session for exam registration */
export async function createCheckoutSession(input: {
  items: PaymentItem[];
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> {
  const res = await fetch("/api/payments/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to create payment session");
  }
  return res.json();
}

/** Redirect the browser to Stripe Checkout */
export async function redirectToCheckout(input: Parameters<typeof createCheckoutSession>[0]): Promise<void> {
  const session = await createCheckoutSession(input);
  window.location.href = session.url;
}

export type Invoice = {
  id: string;
  number: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  created: number;
  hosted_invoice_url: string | null;
  description: string;
};

export async function listMyInvoices(): Promise<Invoice[]> {
  const res = await fetch("/api/payments/invoices");
  if (!res.ok) return [];
  const data = await res.json();
  return (data as any).invoices ?? [];
}

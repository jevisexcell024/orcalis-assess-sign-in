import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Orcalis Assess" },
      {
        name: "description",
        content:
          "Get in touch with Orcalis Assess. Talk to sales, book a demo, or reach our 24/7 support team.",
      },
      { property: "og:title", content: "Contact Orcalis Assess" },
      {
        property: "og:description",
        content: "Book a demo, talk to sales, or reach support.",
      },
    ],
  }),
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  return (
    <MarketingShell>
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-extrabold tracking-tight">Talk to us</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Whether you're piloting a single course or rolling Orcalis Assess
            out to a million candidates, our team will get back to you within 1
            business day.
          </p>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div className="space-y-6">
            {[
              { icon: Mail, title: "Email", body: "sales@orcalis-assess.com" },
              { icon: Phone, title: "Phone", body: "+1 (415) 555-0188" },
              { icon: MapPin, title: "HQ", body: "548 Market St, San Francisco, CA" },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSending(true);
              setTimeout(() => {
                setSending(false);
                toast.success("Thanks! Our team will reach out within 1 business day.");
                (e.target as HTMLFormElement).reset();
              }, 700);
            }}
            className="rounded-2xl border border-border bg-background p-7 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="org">Organization</Label>
                <Input id="org" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="e.g. Registrar, IT Director" className="mt-1.5" />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="message">How can we help?</Label>
              <Textarea id="message" required rows={5} className="mt-1.5" />
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="mt-5 w-full rounded-lg text-white shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}
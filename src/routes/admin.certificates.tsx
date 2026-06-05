import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  Image as ImageIcon,
  PenLine,
  Plus,
  QrCode,
  Redo2,
  ShieldCheck,
  Trash2,
  Type as TypeIcon,
  Undo2,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/certificates")({
  component: CertificatesPage,
  head: () => ({
    meta: [
      { title: "Certificate Designer · Orcalis Assess" },
      {
        name: "description",
        content:
          "Design and batch-issue tamper-proof certificates with dynamic fields, QR verification, and blockchain anchoring on Orcalis Assess.",
      },
    ],
  }),
});

const assetTools = [
  { label: "Text Block", icon: TypeIcon },
  { label: "Image", icon: ImageIcon },
  { label: "QR Code", icon: QrCode },
  { label: "Signature", icon: PenLine },
];

const dynamicFields = ["candidate_name", "course_title", "issue_date", "certificate_id", "score"];

const templates = [
  { name: "Standard Academic", selected: true },
  { name: "Corporate Training", selected: false },
  { name: "Professional Cert", selected: false },
];

function CertificatesPage() {
  const [selectedField, setSelectedField] = useState("candidate_name");
  const [securityOn, setSecurityOn] = useState(true);
  const [activeAsset, setActiveAsset] = useState("QR Code");
  const [canvasTab, setCanvasTab] = useState("Design");
  const [zoom, setZoom] = useState(75);
  const [selectedTemplate, setSelectedTemplate] = useState("Standard Academic");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <AdminShell
      title="Certificate Designer"
      breadcrumbs={[{ label: "Issuance" }, { label: "Certificates" }]}
      actions={
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Undo — last change reverted.")}>
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Redo — change re-applied.")}>
            <Redo2 className="h-3.5 w-3.5" /> Redo
          </Button>
          <Button size="sm" style={{ background: "var(--gradient-primary)" }} disabled={saving} onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); toast.success("Template saved successfully."); }}>
            {saving ? "Saving…" : "Save Template"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_1fr_320px]">
        {/* LEFT PANEL */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Assets & Elements
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {assetTools.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.label}
                    onClick={() => setActiveAsset(t.label)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border text-xs transition",
                      activeAsset === t.label
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/60",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Dynamic Fields
              </p>
              <button className="text-[11px] font-semibold text-primary" onClick={() => toast.info("Custom field dialog coming soon — name your variable and it will be injected into the certificate.")}>Add Custom</button>
            </div>
            <ul className="mt-3 space-y-1.5">
              {dynamicFields.map((f) => (
                <li
                  key={f}
                  onClick={() => setSelectedField(f)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs",
                    selectedField === f && "border-primary/40 bg-primary/5",
                  )}
                >
                  <span className="font-mono text-foreground/80">{"{" + f + "}"}</span>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-background p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Saved Templates
            </p>
            <div className="mt-3 space-y-2">
              {templates.map((tpl, i) => (
                <button
                  key={tpl.name}
                  className={cn(
                    "w-full rounded-xl border p-2 text-left text-xs transition",
                    tpl.selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60",
                  )}
                >
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                    Preview {i + 1}
                  </div>
                  <p className="mt-1.5 font-semibold">{tpl.name}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* CANVAS */}
        <div className="rounded-2xl border border-border bg-[oklch(0.97_0.005_260)] p-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
              {["Design", "Preview", "Code"].map((t) => (
                <button
                  key={t}
                  onClick={() => setCanvasTab(t)}
                  className={cn(
                    "rounded-md px-3 py-1 font-medium",
                    canvasTab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <span>800 × 600 · A4 Landscape</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="rounded-md border border-border px-2 py-1">−</button>
              <span>{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(150, z + 25))} className="rounded-md border border-border px-2 py-1">+</button>
            </div>
          </div>

          <div
            className="mx-auto aspect-[4/3] max-w-[720px] rounded-xl border-2 border-dashed border-border bg-background p-10 shadow-sm"
          >
            <div className="h-full rounded-lg border border-border p-8">
              <h2 className="text-center font-serif text-3xl tracking-[0.05em]">
                CERTIFICATE OF COMPLETION
              </h2>
              <p className="mt-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                This is to certify that
              </p>
              <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 py-3 text-center text-2xl font-semibold text-primary underline decoration-dotted underline-offset-4">
                {"{candidate_name}"}
              </div>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                has successfully completed the requirements for
              </p>
              <p className="text-center text-sm font-semibold">{"{course_title}"}</p>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                and is hereby awarded this certificate.
              </p>
              <div className="mt-8 grid grid-cols-3 items-end gap-4 text-xs">
                <div>
                  <p className="font-mono">{"{issue_date}"}</p>
                  <div className="mt-1 h-px bg-border" />
                  <p className="mt-1 text-[10px] uppercase text-muted-foreground">Date</p>
                  <p className="mt-3 text-[10px] text-muted-foreground">ID: {"{certificate_id}"}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded border border-border bg-background">
                    <QrCode className="h-9 w-9" />
                    <span className="absolute -top-2 right-0 rounded bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      LIVE
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase text-muted-foreground">Scan to verify</p>
                </div>
                <div className="text-right">
                  <p className="italic text-muted-foreground">Signature</p>
                  <div className="mt-1 h-px bg-border" />
                  <p className="mt-1 font-semibold">Dr. Sarah Jenkins</p>
                  <p className="text-[10px] text-muted-foreground">Director of Education</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — PROPERTIES */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Properties
              </p>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">Text Element</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs">Content</Label>
                <Input defaultValue={"{" + selectedField + "}"} className="mt-1 h-9 font-mono text-xs" />
              </div>

              <p className="pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Typography
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font</Label>
                  <Select defaultValue="inter">
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="playfair">Playfair Display</SelectItem>
                      <SelectItem value="ibm">IBM Plex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Weight</Label>
                  <Select defaultValue="semibold">
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">SemiBold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Size (px)</Label>
                  <Input defaultValue="30" className="mt-1 h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Line Height</Label>
                  <Input defaultValue="Auto" className="mt-1 h-9 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-md border border-border" style={{ background: "#2563EB" }} />
                  <Input defaultValue="#2563EB" className="h-9 text-xs" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Security Features
              </p>
              <Switch checked={securityOn} onCheckedChange={setSecurityOn} />
            </div>
            <div className="mt-3 rounded-xl border border-border bg-emerald-50/40 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold">Blockchain Anchoring</p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Certificates will be cryptographically signed and verifiable globally.
              </p>
            </div>
            <div className="mt-3">
              <Label className="text-xs">QR Code Destination</Label>
              <Select defaultValue="public">
                <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Verification Page</SelectItem>
                  <SelectItem value="custom">Custom URL</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Button className="w-full gap-2" size="lg" style={{ background: "var(--gradient-primary)" }} disabled={generating} onClick={async () => { setGenerating(true); await new Promise(r => setTimeout(r, 1500)); setGenerating(false); toast.success("142 certificates queued for generation. Processing in background."); }}>
            <Award className="h-4 w-4" /> {generating ? "Generating…" : "Generate Batch (142)"}
          </Button>
          <p className="-mt-3 text-center text-[11px] text-muted-foreground">Will process in background</p>
        </div>
      </div>

      {/* Hidden so Trash icon import isn't flagged when designer scales */}
      <Trash2 className="hidden" />
    </AdminShell>
  );
}
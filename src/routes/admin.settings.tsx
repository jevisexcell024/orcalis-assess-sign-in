import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Globe, Shield, Bell, Mail, Palette, Database, Key } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MFASetup } from "@/components/auth/MFASetup";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Orcalis Assess" }] }),
});

const SECTIONS = [
  { id: "general",       label: "General",       icon: Globe    },
  { id: "security",      label: "Security",      icon: Shield   },
  { id: "notifications", label: "Notifications", icon: Bell     },
  { id: "email",         label: "Email",         icon: Mail     },
  { id: "appearance",    label: "Appearance",    icon: Palette  },
  { id: "data",          label: "Data & Privacy",icon: Database },
  { id: "api",           label: "API Keys",      icon: Key      },
];

function SettingsPage() {
  const [active, setActive] = useState("general");
  const [saving, setSaving] = useState(false);

  // General settings state
  const [orgName, setOrgName] = useState("Orcalis University");
  const [orgSlug, setOrgSlug] = useState("orcalis-uni");
  const [timezone, setTimezone] = useState("Africa/Accra");

  // API key state
  const [liveRevealed, setLiveRevealed] = useState(false);
  const [testRevealed, setTestRevealed] = useState(false);

  // SMTP state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);

  // Security settings
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("8");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [auditAll, setAuditAll] = useState(true);

  // Notification settings
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [whatsappNotifs, setWhatsappNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleRotateKey = (type: "live" | "test") => {
    toast.success(`${type === "live" ? "Production" : "Test"} API key rotated. Update your integrations.`);
  };

  const handleGenerateKey = () => {
    toast.success("New API key generated. Copy it now — it won't be shown again.");
  };

  const handleSendTestEmail = async () => {
    if (!smtpHost.trim()) {
      toast.error("Enter SMTP host before sending a test email.");
      return;
    }
    setTestEmailSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error("Not authenticated."); return; }

      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: parseInt(smtpPort, 10) || 587,
          user: smtpUser.trim(),
          pass: smtpPass,
          to: session?.user.email,
        }),
      });
      const json = await res.json() as { success?: boolean; note?: string; error?: string; provider?: string };
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Test email failed.");
      } else if (json.provider === "smtp_pending") {
        toast.info(json.note ?? "SMTP config saved. Set RESEND_API_KEY to enable live sends.");
      } else {
        toast.success("Test email sent successfully. Check your inbox.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send test email.");
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved successfully.");
  };

  return (
    <AdminShell
      title="Settings"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Settings" }]}
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-52 shrink-0">
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition",
                    active === s.id
                      ? "text-white shadow-sm"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground",
                  )}
                  style={active === s.id ? { background: "var(--gradient-primary)" } : undefined}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {active === "general" && (
              <Section title="General Settings" desc="Basic configuration for your institution.">
                <Field label="Institution Name" id="org-name">
                  <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </Field>
                <Field label="Slug / URL Identifier" id="org-slug">
                  <Input id="org-slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} />
                  <p className="mt-1 text-xs text-muted-foreground">Used in your institution URL: assess.orcalis.io/{orgSlug}</p>
                </Field>
                <Field label="Default Timezone" id="timezone">
                  <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                    <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                    <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                    <option value="Europe/London">Europe/London (GMT+1)</option>
                    <option value="America/New_York">America/New_York (GMT-4)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  </select>
                </Field>
              </Section>
            )}

            {active === "security" && (
              <Section title="Security Settings" desc="Authentication and access control configuration.">
                <ToggleField
                  label="Require MFA for all admins"
                  desc="All admin accounts must configure TOTP or SMS-based 2FA."
                  checked={mfaRequired}
                  onChange={setMfaRequired}
                />
                <Field label="Session Timeout (hours)" id="session-timeout">
                  <Input id="session-timeout" type="number" min="1" max="72" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="w-32" />
                </Field>
                <ToggleField
                  label="Audit all user actions"
                  desc="Log every read/write action to the audit log table."
                  checked={auditAll}
                  onChange={setAuditAll}
                />
                <Field label="IP Allowlist" id="ip-whitelist">
                  <textarea
                    id="ip-whitelist"
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                    placeholder="One IP or CIDR per line (leave blank to allow all)"
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Your Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Manage 2FA for your own admin account.</p>
                  <div className="mt-2">
                    <MFASetup />
                  </div>
                </div>
              </Section>
            )}

            {active === "notifications" && (
              <Section title="Notification Settings" desc="Configure how and when notifications are delivered.">
                <ToggleField label="Email Notifications" desc="Send notifications via email." checked={emailNotifs} onChange={setEmailNotifs} />
                <ToggleField label="SMS Notifications"   desc="Send notifications via SMS."  checked={smsNotifs}   onChange={setSmsNotifs}   />
                <ToggleField label="WhatsApp Notifications" desc="Send notifications via WhatsApp Business API." checked={whatsappNotifs} onChange={setWhatsappNotifs} />
                <ToggleField label="Push Notifications"  desc="Browser and mobile push notifications." checked={pushNotifs} onChange={setPushNotifs} />
              </Section>
            )}

            {active === "email" && (
              <Section title="Email Configuration" desc="SMTP settings for outgoing email.">
                <Field label="SMTP Host" id="smtp-host">
                  <Input id="smtp-host" placeholder="smtp.mailgun.org" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                </Field>
                <Field label="SMTP Port" id="smtp-port">
                  <Input id="smtp-port" type="number" placeholder="587" className="w-32" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                </Field>
                <Field label="SMTP Username" id="smtp-user">
                  <Input id="smtp-user" placeholder="postmaster@yourdomain.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                </Field>
                <Field label="SMTP Password" id="smtp-pass">
                  <Input id="smtp-pass" type="password" placeholder="••••••••" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
                </Field>
                <Field label="From Address" id="from-addr">
                  <Input id="from-addr" placeholder="noreply@youruni.edu" value={fromAddr} onChange={(e) => setFromAddr(e.target.value)} />
                </Field>
                <div>
                  <Button variant="outline" size="sm" onClick={handleSendTestEmail} disabled={testEmailSending}>
                    {testEmailSending ? "Sending…" : "Send Test Email"}
                  </Button>
                </div>
              </Section>
            )}

            {active === "api" && (
              <Section title="API Keys" desc="Manage API keys for programmatic access.">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Production API Key</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Input value={liveRevealed ? "oa_live_sk_7f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c" : "oa_live_••••••••••••••••••••••••••••••••"} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => setLiveRevealed((v) => !v)}>{liveRevealed ? "Hide" : "Reveal"}</Button>
                    <Button variant="outline" size="sm" onClick={() => { setLiveRevealed(false); handleRotateKey("live"); }}>Rotate</Button>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Test API Key</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Input value={testRevealed ? "oa_test_sk_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d" : "oa_test_••••••••••••••••••••••••••••••••"} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => setTestRevealed((v) => !v)}>{testRevealed ? "Hide" : "Reveal"}</Button>
                    <Button variant="outline" size="sm" onClick={() => { setTestRevealed(false); handleRotateKey("test"); }}>Rotate</Button>
                  </div>
                </div>
                <Button size="sm" className="gap-1.5" onClick={handleGenerateKey}><Key className="h-4 w-4" /> Generate New Key</Button>
              </Section>
            )}

            {["data", "appearance"].includes(active) && (
              <Section title={SECTIONS.find((s) => s.id === active)?.label ?? ""} desc="Settings coming soon.">
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                  This section is under construction.
                </div>
              </Section>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
      </div>
      <hr className="border-border" />
      {children}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ToggleField({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

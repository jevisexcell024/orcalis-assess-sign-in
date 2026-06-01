import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Megaphone, MessageSquare, Send, Plus, Trash2,
  Bell, Mail, Phone, ChevronDown, Users2, AlertTriangle,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  listAnnouncements, createAnnouncement, sendAnnouncement, deleteAnnouncement,
  type AnnouncementAudience, type AnnouncementPriority,
} from "@/lib/communications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/communication")({
  component: CommunicationPage,
  head: () => ({ meta: [{ title: "Communication · Orcalis Assess" }] }),
});

const PRIORITY_OPTIONS: { value: AnnouncementPriority; label: string; cls: string }[] = [
  { value: "low",    label: "Low",    cls: "bg-muted text-muted-foreground ring-border"          },
  { value: "normal", label: "Normal", cls: "bg-sky-50 text-sky-700 ring-sky-200"                 },
  { value: "high",   label: "High",   cls: "bg-orange-50 text-orange-700 ring-orange-200"        },
  { value: "urgent", label: "Urgent", cls: "bg-rose-50 text-rose-700 ring-rose-200"              },
];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: "all",         label: "Everyone"    },
  { value: "students",    label: "Students"    },
  { value: "instructors", label: "Instructors" },
  { value: "admins",      label: "Admins"      },
];

const CHANNEL_OPTIONS = [
  { id: "in_app",   label: "In-App",   icon: Bell        },
  { id: "email",    label: "Email",    icon: Mail        },
  { id: "sms",      label: "SMS",      icon: Phone       },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

function CommunicationPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"announcements" | "compose" | "broadcast">("announcements");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [channels, setChannels] = useState<string[]>(["in_app"]);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => listAnnouncements(),
  });

  const toggleChannel = (ch: string) => {
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await createAnnouncement({ title, body, audience, priority, channels });
      await qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      setOpen(false);
      setTitle(""); setBody("");
      toast.success("Announcement created.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await sendAnnouncement(id);
      await qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      toast.success("Announcement sent.");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      await qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      toast.success("Announcement deleted.");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const stats = {
    total: announcements.length,
    sent: announcements.filter((a: any) => a.sent_at).length,
    scheduled: announcements.filter((a: any) => a.scheduled_at && !a.sent_at).length,
    draft: announcements.filter((a: any) => !a.sent_at && !a.scheduled_at).length,
  };

  return (
    <AdminShell
      title="Communication Center"
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Communication" }]}
    >
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",     value: stats.total,     cls: "text-foreground"  },
            { label: "Sent",      value: stats.sent,      cls: "text-emerald-700" },
            { label: "Scheduled", value: stats.scheduled, cls: "text-sky-700"     },
            { label: "Drafts",    value: stats.draft,     cls: "text-amber-700"   },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {([
              { id: "announcements", label: "Announcements", icon: Megaphone    },
              { id: "compose",       label: "Compose",       icon: MessageSquare },
              { id: "broadcast",     label: "Broadcast",     icon: Users2        },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                  tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        </div>

        {/* Announcements list */}
        {tab === "announcements" && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center py-16 rounded-2xl border border-dashed border-border bg-background text-center">
                <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium">No announcements yet</p>
                <p className="text-sm text-muted-foreground">Create one to notify your institution.</p>
                <Button className="mt-4 gap-1.5" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> Create Announcement
                </Button>
              </div>
            ) : (
              announcements.map((a: any) => {
                const pMeta = PRIORITY_OPTIONS.find((p) => p.value === a.priority) ?? PRIORITY_OPTIONS[1];
                return (
                  <div key={a.id} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{a.title}</h3>
                          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", pMeta.cls)}>
                            {pMeta.label}
                          </span>
                          {a.sent_at && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">Sent</span>
                          )}
                          {a.scheduled_at && !a.sent_at && (
                            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">Scheduled</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>Audience: <strong className="text-foreground capitalize">{a.audience}</strong></span>
                          <span>Channels: <strong className="text-foreground">{a.channels.join(", ")}</strong></span>
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!a.sent_at && (
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleSend(a.id)}>
                            <Send className="h-3.5 w-3.5" /> Send Now
                          </Button>
                        )}
                        <button onClick={() => handleDelete(a.id)} className="rounded-md border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Compose tab (direct message) */}
        {tab === "compose" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
            <h3 className="font-semibold">Send Direct Message</h3>
            <div className="space-y-1.5">
              <Label>Recipient (User ID or Email)</Label>
              <Input placeholder="Enter recipient email or user ID" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input placeholder="Message subject" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea placeholder="Type your message here…" rows={6} />
            </div>
            <div className="flex justify-end">
              <Button className="gap-1.5"><Send className="h-4 w-4" /> Send Message</Button>
            </div>
          </div>
        )}

        {/* Broadcast tab */}
        {tab === "broadcast" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Emergency Broadcast</p>
                <p className="mt-0.5">This will send an urgent notification to ALL users via ALL enabled channels simultaneously. Use only for critical announcements.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Broadcast Message</Label>
              <Textarea placeholder="Type your emergency broadcast message…" rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((ch) => (
                  <button key={ch.id} className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    <ch.icon className="h-4 w-4" /> {ch.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="destructive" className="gap-1.5"><AlertTriangle className="h-4 w-4" /> Send Broadcast</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create announcement dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Create and optionally schedule an announcement for your institution.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement…" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <select value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                  {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      channels.includes(ch.id)
                        ? "border-transparent text-white"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                    style={channels.includes(ch.id) ? { background: "var(--gradient-primary)" } : undefined}
                  >
                    <ch.icon className="h-3.5 w-3.5" /> {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !title.trim() || !body.trim()}>
              {saving ? "Creating…" : "Create Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

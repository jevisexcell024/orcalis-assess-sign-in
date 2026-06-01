import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Mail, MessageSquare, AlertTriangle, Megaphone, CheckCheck } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { listAnnouncements, listMyMessages, markMessageRead } from "@/lib/communications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/announcements")({
  component: StudentAnnouncementsPage,
  head: () => ({ meta: [{ title: "Announcements · Orcalis Assess" }] }),
});

const PRIORITY_META: Record<string, { cls: string; icon: typeof Bell }> = {
  urgent: { cls: "bg-rose-50 text-rose-700 ring-rose-200",     icon: AlertTriangle },
  high:   { cls: "bg-orange-50 text-orange-700 ring-orange-200",icon: Bell          },
  normal: { cls: "bg-sky-50 text-sky-700 ring-sky-200",         icon: Megaphone     },
  low:    { cls: "bg-muted text-muted-foreground ring-border",   icon: Megaphone     },
};

function StudentAnnouncementsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"announcements" | "messages">("announcements");

  const { data: announcements = [], isLoading: loadingA } = useQuery({
    queryKey: ["student", "announcements"],
    queryFn: () => listAnnouncements(),
  });

  const { data: messages = [], isLoading: loadingM } = useQuery({
    queryKey: ["student", "messages"],
    queryFn: listMyMessages,
  });

  const unread = messages.filter((m: any) => !m.read_at).length;

  const handleMarkRead = async (id: string) => {
    await markMessageRead(id);
    qc.invalidateQueries({ queryKey: ["student", "messages"] });
  };

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements & Messages</h1>
          <p className="text-sm text-muted-foreground">
            Stay up to date with your institution's communications.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
          {([
            { id: "announcements", label: "Announcements", icon: Megaphone, count: announcements.length },
            { id: "messages",      label: "Messages",      icon: MessageSquare, count: unread },
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
              {t.count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  tab === t.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Announcements tab */}
        {tab === "announcements" && (
          <div className="space-y-3">
            {loadingA ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center py-16 rounded-2xl border border-dashed border-border bg-background text-center">
                <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              </div>
            ) : (
              announcements.map((a: any) => {
                const meta = PRIORITY_META[a.priority] ?? PRIORITY_META.normal;
                const Icon = meta.icon;
                const isNew = !a.sent_at || new Date(a.created_at) > new Date(Date.now() - 86400000);
                return (
                  <div key={a.id} className={cn(
                    "rounded-2xl border border-border bg-background p-5 shadow-sm transition",
                    a.priority === "urgent" && "border-rose-200 bg-rose-50/30",
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", meta.cls)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-snug">{a.title}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {isNew && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">NEW</span>
                            )}
                            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize", meta.cls)}>
                              {a.priority}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                          {a.expires_at && ` · Expires ${new Date(a.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Messages tab */}
        {tab === "messages" && (
          <div className="space-y-3">
            {loadingM ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center py-16 rounded-2xl border border-dashed border-border bg-background text-center">
                <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              </div>
            ) : (
              messages.map((m: any) => {
                const isUnread = !m.read_at;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-2xl border bg-background p-5 shadow-sm transition cursor-pointer hover:shadow-md",
                      isUnread ? "border-sky-200 bg-sky-50/20" : "border-border",
                    )}
                    onClick={() => isUnread && handleMarkRead(m.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-bold text-white">
                          {(m.subject ?? "M")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={cn("text-sm font-medium", isUnread && "font-semibold")}>{m.subject ?? "(No subject)"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {isUnread ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0 mt-1" />
                      ) : (
                        <CheckCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{m.body}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </StudentShell>
  );
}

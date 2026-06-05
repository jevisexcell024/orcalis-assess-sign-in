import { supabase } from "@/integrations/supabase/client";

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type AnnouncementAudience = "all" | "students" | "instructors" | "admins" | "specific";

export type Announcement = {
  id: string;
  organization_id: string | null;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  audience_ids: string[];
  priority: AnnouncementPriority;
  channels: string[];
  scheduled_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  organization_id: string | null;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
  created_at: string;
};

export async function listAnnouncements(orgId?: string | null): Promise<Announcement[]> {
  let q = (supabase as any)
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (orgId) q = q.eq("organization_id", orgId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  priority?: AnnouncementPriority;
  channels?: string[];
  organization_id?: string;
  scheduled_at?: string;
  expires_at?: string;
}): Promise<Announcement> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await (supabase as any)
    .from("announcements")
    .insert({
      ...input,
      created_by: user.id,
      priority: input.priority ?? "normal",
      channels: input.channels ?? ["in_app"],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sendAnnouncement(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("announcements")
    .update({ sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await (supabase as any).from("announcements").delete().eq("id", id);
  if (error) throw error;
}

export async function listMyMessages(): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await (supabase as any)
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).filter((m: Message) =>
    (m.sender_id === user.id && !m.deleted_by_sender) ||
    (m.recipient_id === user.id && !m.deleted_by_recipient)
  );
}

export async function sendMessage(input: {
  recipient_id: string;
  body: string;
  subject?: string;
  organization_id?: string;
}): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await (supabase as any)
    .from("messages")
    .insert({ ...input, sender_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessageRead(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function countUnreadMessages(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await (supabase as any)
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null)
    .eq("deleted_by_recipient", false);
  if (error) return 0;
  return count ?? 0;
}

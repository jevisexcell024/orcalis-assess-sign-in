import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Phone, MapPin, Shield, Bell, LogOut, Save, Camera } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { MFASetup } from "@/components/auth/MFASetup";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/profile")({
  component: StudentProfilePage,
  head: () => ({ meta: [{ title: "My Profile · Orcalis Assess" }] }),
});

const TABS = [
  { id: "profile",  label: "Profile",       icon: User     },
  { id: "security", label: "Security",      icon: Shield   },
  { id: "notifs",   label: "Notifications", icon: Bell     },
];

function StudentProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
  });

  const [fullName, setFullName] = useState(profile?.contact_name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Profile updated.");
  };

  return (
    <StudentShell>
      <div className="mx-auto w-full max-w-[800px] space-y-6">
        {/* Avatar header */}
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-3xl font-bold text-white">
              {(profile?.contact_name ?? profile?.email ?? "U")[0]?.toUpperCase()}
            </div>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.contact_name ?? "Student"}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{profile?.institution_name ?? "Orcalis University"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-disp">Email</Label>
                <Input id="email-disp" value={profile?.email ?? ""} readOnly className="bg-muted/30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" className="pl-9" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
              <h3 className="font-semibold">Change Password</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cur-pw">Current Password</Label>
                  <Input id="cur-pw" type="password" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input id="new-pw" type="password" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conf-pw">Confirm Password</Label>
                  <Input id="conf-pw" type="password" />
                </div>
              </div>
              <Button size="sm">Update Password</Button>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              <Button variant="outline" size="sm" className="mt-4">Set Up 2FA</Button>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <h3 className="font-semibold text-rose-800">Sign Out</h3>
              <p className="mt-1 text-sm text-rose-700">Sign out from this device.</p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              >
                <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        )}

        {tab === "notifs" && (
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-5">
            <h3 className="font-semibold">Notification Preferences</h3>
            {[
              { label: "Email Notifications",   desc: "Receive exam reminders and results via email.", checked: emailNotifs, onChange: setEmailNotifs },
              { label: "Push Notifications",    desc: "Browser and mobile push alerts.",                checked: pushNotifs,  onChange: setPushNotifs  },
            ].map((pref) => (
              <div key={pref.label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <Switch checked={pref.checked} onCheckedChange={pref.onChange} />
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Preferences"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/transactions";
import { Panel } from "@/components/finance-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Expense Tracker" },
      { name: "description", content: "Manage your profile, currency and appearance." },
      { property: "og:title", content: "Settings — Expense Tracker" },
      { property: "og:description", content: "Manage your profile, currency and appearance." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: SettingsPage,
});

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "AED"];

function SettingsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "INR");
  const [dark, setDark] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("theme", v ? "dark" : "light");
  };

  async function saveProfile() {
    if (!profile) return;
    if (name.trim().length < 2) return void toast.error("Enter your full name");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), currency }).eq("id", profile.id);
    setSaving(false);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  }

  async function changePassword() {
    if (pw.next.length < 8) return void toast.error("New password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as never);
    if (error) return void toast.error(error.message);
    setPw({ current: "", next: "" });
    toast.success("Password changed");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Profile & Settings</h1>
      <Panel title="Profile">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </Panel>
      <Panel title="Appearance">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark">Dark mode</Label>
          <Switch id="dark" checked={dark} onCheckedChange={toggleDark} />
        </div>
      </Panel>
      <Panel title="Change password">
        <div className="space-y-4">
          <Input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Button variant="outline" onClick={changePassword}>Update password</Button>
        </div>
      </Panel>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Expense Tracker" },
      { name: "description", content: "Create a free Expense Tracker account." },
      { property: "og:title", content: "Create account — Expense Tracker" },
      { property: "og:description", content: "Create a free Expense Tracker account." },
    ],
  }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2) return void toast.error("Enter your full name");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return void toast.error("Enter a valid email");
    if (f.password.length < 8) return void toast.error("Password must be at least 8 characters");
    if (f.password !== f.confirm) return void toast.error("Passwords do not match");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: f.name.trim() } },
    });
    setLoading(false);
    if (error) return void toast.error(error.message);
    if (data.user && data.user.identities?.length === 0) return void toast.error("An account with this email already exists");
    if (data.session) return void nav({ to: "/dashboard" });
    setSent(true);
  }

  if (sent)
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a confirmation link to ${f.email}.`}>
        <p className="text-sm text-muted-foreground">Click the link in the email, then come back and log in.</p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Go to log in</Link>
        </Button>
      </AuthLayout>
    );

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking in under a minute.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={f.name} onChange={set("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={f.email} onChange={set("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={f.password} onChange={set("password")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" value={f.confirm} onChange={set("confirm")} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-bal hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

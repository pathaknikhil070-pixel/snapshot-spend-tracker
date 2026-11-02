import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-bal text-primary-foreground">
        <Wallet className="h-5 w-5" />
      </div>
      <span className={`font-display text-lg font-semibold ${light ? "text-sidebar-primary" : "text-foreground"}`}>
        Expense Tracker
      </span>
    </div>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero hidden flex-col justify-between p-12 text-primary-foreground lg:flex dark:text-foreground">
        <Logo light />
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-semibold leading-tight">Know where every rupee goes.</h2>
          <p className="opacity-75">
            Record income and expenses, watch your monthly spending, and get plain-language insights from your own data.
          </p>
        </div>
        <p className="text-sm opacity-60">Your records are private to your account.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

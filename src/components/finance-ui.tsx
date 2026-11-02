import type { ReactNode } from "react";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatMoney, type Transaction } from "@/lib/finance";

export const CHART_COLORS = Array.from({ length: 9 }, (_, i) => `var(--chart-${i + 1})`);

const tones = {
  balance: "bg-bal-soft text-bal",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  neutral: "bg-muted text-foreground",
} as const;

export function StatCard({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: keyof typeof tones;
  hint?: ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card-surface p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TxRow({ t, currency, actions }: { t: Transaction; currency: string; actions?: ReactNode }) {
  const inc = t.type === "income";
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${inc ? tones.income : tones.expense}`}>
        {inc ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{t.purpose}</p>
        <p className="truncate text-xs text-muted-foreground">
          {t.category} · {format(new Date(t.transaction_date), "d MMM yyyy, HH:mm")}
        </p>
      </div>
      <p className={`shrink-0 font-semibold ${inc ? "text-income" : "text-expense"}`}>
        {inc ? "+" : "−"}
        {formatMoney(t.amount, currency)}
      </p>
      {actions}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

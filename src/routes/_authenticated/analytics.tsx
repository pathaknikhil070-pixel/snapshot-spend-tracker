import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import { Lightbulb } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { transactionsQuery, profileQuery } from "@/lib/transactions";
import { categoryBreakdown, formatMoney, inMonth, insights, lastMonths, totals } from "@/lib/finance";
import { Panel, StatCard, Empty, CHART_COLORS } from "@/components/finance-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tooltipStyle } from "./dashboard";
import { Wallet, TrendingUp, TrendingDown, Hash } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Expense Tracker" },
      { name: "description", content: "Monthly reports, spending trends, category analysis and insights." },
      { property: "og:title", content: "Analytics — Expense Tracker" },
      { property: "og:description", content: "Monthly reports, spending trends, category analysis and insights." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(transactionsQuery), context.queryClient.ensureQueryData(profileQuery)]),
  component: Analytics,
});

function Analytics() {
  const { data: txs } = useSuspenseQuery(transactionsQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const money = (n: number) => formatMoney(n, profile?.currency ?? "INR");
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), i))), []);
  const [idx, setIdx] = useState("0");
  const month = months[Number(idx)]!;
  const mtx = inMonth(txs, month);
  const mt = totals(mtx);
  const cats = categoryBreakdown(mtx);
  const trend = lastMonths(txs, 12);
  const tips = insights(txs);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <Select value={idx} onValueChange={setIdx}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => <SelectItem key={i} value={String(i)}>{format(m, "MMMM yyyy")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={money(mt.income)} tone="income" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Expenses" value={money(mt.expense)} tone="expense" icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="Net savings" value={money(mt.balance)} tone="balance" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Transactions" value={String(mtx.length)} tone="neutral" icon={<Hash className="h-4 w-4" />} />
      </div>

      <Panel title="Insights">
        <ul className="grid gap-3 md:grid-cols-2">
          {tips.map((t) => (
            <li key={t} className="flex gap-3 rounded-xl bg-muted p-4 text-sm">
              <Lightbulb className="h-4 w-4 shrink-0 text-bal" /> {t}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Spending trend (12 months)">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
                <Line type="monotone" dataKey="expense" name="Spent" stroke="var(--expense)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Income vs expenses by month">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} cursor={{ fill: "var(--muted)" }} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="var(--expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title={`Categories — ${format(month, "MMMM yyyy")}`}>
        {cats.length === 0 ? (
          <Empty>No spending in this month.</Empty>
        ) : (
          <ul className="space-y-4">
            {cats.map((c, i) => (
              <li key={c.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {money(c.value)} · {c.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

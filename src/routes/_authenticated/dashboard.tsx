import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { Wallet, TrendingUp, TrendingDown, CalendarDays, Plus, Minus } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { transactionsQuery, profileQuery } from "@/lib/transactions";
import { categoryBreakdown, formatMoney, lastMonths, monthlyExpense, percentChange, totals } from "@/lib/finance";
import { StatCard, Panel, TxRow, Empty, CHART_COLORS } from "@/components/finance-ui";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Expense Tracker" },
      { name: "description", content: "Your balance, income, expenses and monthly spending at a glance." },
      { property: "og:title", content: "Dashboard — Expense Tracker" },
      { property: "og:description", content: "Your balance, income, expenses and monthly spending at a glance." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(transactionsQuery), context.queryClient.ensureQueryData(profileQuery)]),
  component: Dashboard,
});

export const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--popover-foreground)",
};

function Dashboard() {
  const { data: txs } = useSuspenseQuery(transactionsQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const cur = profile?.currency ?? "INR";
  const [open, setOpen] = useState(false);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), i))), []);
  const [monthIdx, setMonthIdx] = useState("0");
  const month = months[Number(monthIdx)];

  const t = totals(txs);
  const monthExp = monthlyExpense(txs, month);
  const thisExp = monthlyExpense(txs, new Date());
  const prevExp = monthlyExpense(txs, subMonths(new Date(), 1));
  const change = percentChange(thisExp, prevExp);
  const six = lastMonths(txs, 6);
  const cats = categoryBreakdown(txs);
  const money = (n: number) => formatMoney(n, cur);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</p>
          <h1 className="text-3xl font-semibold">Your money, at a glance</h1>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Balance" value={money(t.balance)} tone="balance" icon={<Wallet className="h-4 w-4" />} hint="Income minus expenses" />
        <StatCard label="Total Income" value={money(t.income)} tone="income" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Total Expenses" value={money(t.expense)} tone="expense" icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard
          label="Monthly Expenditure"
          value={money(monthExp)}
          tone="neutral"
          icon={<CalendarDays className="h-4 w-4" />}
          hint={
            <Select value={monthIdx} onValueChange={setMonthIdx}>
              <SelectTrigger className="mt-1 h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {format(m, "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Monthly expenditure (last 6 months)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={six}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="expense" name="Spent" fill="var(--expense)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="This month vs last month">
          <div className="flex h-64 flex-col justify-center gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">This month</span>
              <span className="font-display text-xl font-semibold">{money(thisExp)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Last month</span>
              <span className="font-display text-xl font-semibold">{money(prevExp)}</span>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium ${
                change === null || Math.abs(change) < 1
                  ? "bg-muted"
                  : change > 0
                    ? "bg-expense-soft text-expense"
                    : "bg-income-soft text-income"
              }`}
            >
              {change !== null && change >= 1 && <TrendingUp className="h-4 w-4" />}
              {change !== null && change <= -1 && <TrendingDown className="h-4 w-4" />}
              {change !== null && Math.abs(change) < 1 && <Minus className="h-4 w-4" />}
              {change === null
                ? "No spending last month to compare."
                : Math.abs(change) < 1
                  ? "No significant change."
                  : `Spending ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}%`}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Income vs expenses">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={six}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} cursor={{ fill: "var(--muted)" }} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--income)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="var(--expense)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.income >= t.expense ? "Overall you are earning more than you spend." : "Overall you are spending more than you earn."}
          </p>
        </Panel>

        <Panel title="Where your money goes">
          {cats.length === 0 ? (
            <Empty>No expenses yet.</Empty>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {cats.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--card)" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {cats.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1">{c.name}</span>
                    <span className="font-medium">{c.percent.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Recent transactions"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/transactions">View All</Link>
          </Button>
        }
      >
        {txs.length === 0 ? (
          <Empty>No transactions yet — add your first one.</Empty>
        ) : (
          <div className="divide-y">
            {txs.slice(0, 8).map((x) => (
              <TxRow key={x.id} t={x} currency={cur} />
            ))}
          </div>
        )}
      </Panel>

      <TransactionDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

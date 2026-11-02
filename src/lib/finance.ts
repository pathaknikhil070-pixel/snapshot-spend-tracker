import { format, startOfMonth, subMonths, isSameMonth } from "date-fns";

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  purpose: string;
  category: string;
  transaction_date: string;
  notes: string | null;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Education",
  "Entertainment",
  "Healthcare",
  "Bills & Utilities",
  "Travel",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelancing",
  "Allowance",
  "Business",
  "Gifts",
  "Refund",
  "Other",
] as const;

export const categoriesFor = (t: TxType): readonly string[] =>
  t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

const sum = (txs: Transaction[], type: TxType) =>
  txs.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

export function totals(txs: Transaction[]) {
  const income = sum(txs, "income");
  const expense = sum(txs, "expense");
  return { income, expense, balance: income - expense };
}

export function inMonth(txs: Transaction[], month: Date) {
  return txs.filter((t) => isSameMonth(new Date(t.transaction_date), month));
}

export function monthlyExpense(txs: Transaction[], month: Date) {
  return sum(inMonth(txs, month), "expense");
}

/** Percentage change; null when previous month had no spending. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function lastMonths(txs: Transaction[], count: number, now = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const m = startOfMonth(subMonths(now, count - 1 - i));
    const list = inMonth(txs, m);
    return {
      month: format(m, "MMM"),
      income: sum(list, "income"),
      expense: sum(list, "expense"),
    };
  });
}

export function categoryBreakdown(txs: Transaction[]) {
  const expenses = txs.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const map = new Map<string, number>();
  for (const t of expenses) map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
  return [...map.entries()]
    .map(([name, value]) => ({ name, value, percent: total ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function insights(txs: Transaction[], now = new Date()): string[] {
  const out: string[] = [];
  const cur = inMonth(txs, now);
  const prevMonth = subMonths(now, 1);
  const prev = inMonth(txs, prevMonth);
  const curExp = sum(cur, "expense");
  const prevExp = sum(prev, "expense");
  const change = percentChange(curExp, prevExp);
  if (change === null) out.push("You have no spending last month to compare against yet.");
  else if (Math.abs(change) < 1) out.push("Your spending is about the same as last month.");
  else
    out.push(
      `Your spending ${change > 0 ? "went up" : "went down"} by ${Math.abs(change).toFixed(0)}% compared to last month.`,
    );
  const top = categoryBreakdown(cur)[0];
  if (top) out.push(`You spent the most on ${top.name} this month (${top.percent.toFixed(0)}% of spending).`);
  const curCats = new Map(categoryBreakdown(cur).map((c) => [c.name, c.value]));
  for (const p of categoryBreakdown(prev)) {
    const c = curCats.get(p.name) ?? 0;
    if (c < p.value * 0.8) {
      out.push(`Your ${p.name} spending went down this month.`);
      break;
    }
  }
  const curInc = sum(cur, "income");
  if (curInc || curExp)
    out.push(
      curInc >= curExp
        ? "Your income this month is more than your spending."
        : "This month you are spending more than you earn.",
    );
  return out;
}

export function formatMoney(n: number, currency = "INR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

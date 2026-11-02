import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, startOfMonth, subMonths, isSameMonth } from "date-fns";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { transactionsQuery, profileQuery, useDeleteTransaction } from "@/lib/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from "@/lib/finance";
import { Panel, TxRow, Empty } from "@/components/finance-ui";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Expense Tracker" },
      { name: "description", content: "Add, search, filter, edit and delete your income and expenses." },
      { property: "og:title", content: "Transactions — Expense Tracker" },
      { property: "og:description", content: "Add, search, filter, edit and delete your income and expenses." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(transactionsQuery), context.queryClient.ensureQueryData(profileQuery)]),
  component: TransactionsPage,
});

const ALL_CATS = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
const init = { q: "", type: "all", cat: "all", month: "all", from: "", to: "", sort: "newest" };

function TransactionsPage() {
  const { data: txs } = useSuspenseQuery(transactionsQuery);
  const { data: profile } = useSuspenseQuery(profileQuery);
  const del = useDeleteTransaction();
  const [f, setF] = useState(init);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), i))), []);
  const set = (k: keyof typeof init) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const list = useMemo(() => {
    let r = txs.filter((t) => {
      if (f.q && !t.purpose.toLowerCase().includes(f.q.toLowerCase())) return false;
      if (f.type !== "all" && t.type !== f.type) return false;
      if (f.cat !== "all" && t.category !== f.cat) return false;
      const d = new Date(t.transaction_date);
      if (f.month !== "all" && !isSameMonth(d, months[Number(f.month)])) return false;
      if (f.from && d < new Date(f.from + "T00:00:00")) return false;
      if (f.to && d > new Date(f.to + "T23:59:59")) return false;
      return true;
    });
    const by = {
      newest: (a: Transaction, b: Transaction) => +new Date(b.transaction_date) - +new Date(a.transaction_date),
      oldest: (a: Transaction, b: Transaction) => +new Date(a.transaction_date) - +new Date(b.transaction_date),
      highest: (a: Transaction, b: Transaction) => b.amount - a.amount,
      lowest: (a: Transaction, b: Transaction) => a.amount - b.amount,
    }[f.sort as "newest"];
    r = [...r].sort(by);
    return r;
  }, [txs, f, months]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{txs.length} records</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialog(true); }}>
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </div>

      <div className="card-surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by purpose" value={f.q} onChange={(e) => set("q")(e.target.value)} />
        </div>
        <Select value={f.type} onValueChange={set("type")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.cat} onValueChange={set("cat")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ALL_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.month} onValueChange={set("month")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any month</SelectItem>
            {months.map((m, i) => <SelectItem key={i} value={String(i)}>{format(m, "MMMM yyyy")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" aria-label="From date" value={f.from} onChange={(e) => set("from")(e.target.value)} />
        <Input type="date" aria-label="To date" value={f.to} onChange={(e) => set("to")(e.target.value)} />
        <div className="flex gap-2">
          <Select value={f.sort} onValueChange={set("sort")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="highest">Highest amount</SelectItem>
              <SelectItem value="lowest">Lowest amount</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setF(init)}>Clear Filters</Button>
        </div>
      </div>

      <Panel title={`${list.length} shown`}>
        {list.length === 0 ? (
          <Empty>No transactions match.</Empty>
        ) : (
          <div className="divide-y">
            {list.map((t) => (
              <TxRow
                key={t.id}
                t={t}
                currency={profile?.currency ?? "INR"}
                actions={
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(t); setDialog(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(t)}>
                      <Trash2 className="h-4 w-4 text-expense" />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </Panel>

      <TransactionDialog open={dialog} onOpenChange={setDialog} editing={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.purpose}" will be removed permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await del.mutateAsync(toDelete.id);
                  toast.success("Transaction deleted");
                } catch (e) {
                  toast.error((e as Error).message);
                }
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

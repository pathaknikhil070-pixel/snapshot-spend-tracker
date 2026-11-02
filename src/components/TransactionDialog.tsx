import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesFor, type Transaction, type TxType } from "@/lib/finance";
import { useSaveTransaction } from "@/lib/transactions";
import { evaluate } from "./Calculator";

const nowLocal = () => format(new Date(), "yyyy-MM-dd'T'HH:mm");

export function TransactionDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Transaction | null;
}) {
  const save = useSaveTransaction();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(nowLocal());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(editing?.type ?? "expense");
    setAmount(editing ? String(editing.amount) : "");
    setPurpose(editing?.purpose ?? "");
    setCategory(editing?.category ?? "");
    setDate(editing ? format(new Date(editing.transaction_date), "yyyy-MM-dd'T'HH:mm") : nowLocal());
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // allow quick sums like "120+45.5"
    const value = /[+\-*/]/.test(amount.slice(1)) ? evaluate(amount) : Number(amount);
    if (!value || !isFinite(value) || value <= 0) return toast.error("Amount must be greater than zero");
    if (!purpose.trim()) return toast.error("Enter a purpose");
    if (!categoriesFor(type).includes(category)) return toast.error("Choose a category");
    if (!date) return toast.error("Choose a date");
    try {
      await save.mutateAsync({
        id: editing?.id,
        type,
        amount: Math.round(value * 100) / 100,
        purpose: purpose.trim(),
        category,
        transaction_date: new Date(date).toISOString(),
        notes: notes.trim() || null,
      });
      toast.success(editing ? "Transaction updated" : "Transaction saved");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory("");
                }}
                className={`rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
                  type === t
                    ? t === "income"
                      ? "bg-income text-primary-foreground"
                      : "bg-expense text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0.00  (you can type 120+45)"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.+\-*/]/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" maxLength={120} placeholder="Lunch, Petrol, Salary…" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesFor(type).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date & time</Label>
              <Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

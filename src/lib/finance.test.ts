import { describe, it, expect } from "vitest";
import { totals, percentChange, monthlyExpense, type Transaction } from "./finance";

const tx = (type: "income" | "expense", amount: number, date: string): Transaction => ({
  id: Math.random().toString(),
  type,
  amount,
  purpose: "x",
  category: "Other",
  transaction_date: date,
  notes: null,
});

describe("finance rules", () => {
  it("balance = income - expenses", () => {
    expect(totals([tx("income", 1000, "2026-01-01"), tx("expense", 300, "2026-01-02")]).balance).toBe(700);
  });
  it("percent change uses previous month as base", () => {
    expect(percentChange(115, 100)).toBeCloseTo(15);
  });
  it("percent change is safe when previous month is zero", () => {
    expect(percentChange(50, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
  });
  it("monthly expenditure only counts that month's expenses", () => {
    const list = [
      tx("expense", 100, "2026-03-05T10:00:00"),
      tx("expense", 50, "2026-02-05T10:00:00"),
      tx("income", 999, "2026-03-06T10:00:00"),
    ];
    expect(monthlyExpense(list, new Date("2026-03-15T00:00:00"))).toBe(100);
  });
});

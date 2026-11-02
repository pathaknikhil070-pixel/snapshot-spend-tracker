import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Safe evaluator for + - * / with precedence; no eval(). */
export function evaluate(expr: string): number | null {
  const tokens = expr.match(/\d+(\.\d+)?|[+\-*/]/g);
  if (!tokens) return null;
  const nums: number[] = [];
  const ops: string[] = [];
  let expectNum = true;
  for (const t of tokens) {
    if (expectNum) {
      if (isNaN(Number(t))) return null;
      nums.push(Number(t));
    } else ops.push(t);
    expectNum = !expectNum;
  }
  if (expectNum) return null;
  // * and / first
  for (let i = 0; i < ops.length; ) {
    if (ops[i] === "*" || ops[i] === "/") {
      if (ops[i] === "/" && nums[i + 1] === 0) return null;
      const a = nums[i]!, b = nums[i + 1]!;
      const r = ops[i] === "*" ? a * b : a / b;
      nums.splice(i, 2, r);
      ops.splice(i, 1);
    } else i++;
  }
  return ops.reduce<number>((acc, op, i) => (op === "+" ? acc + nums[i + 1]! : acc - nums[i + 1]!), nums[0]!);
}

const KEYS = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];

export function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string>("");

  const press = (k: string) => {
    if (k === "=") {
      const r = evaluate(expr);
      setResult(r === null ? "Error" : String(Math.round(r * 100) / 100));
      return;
    }
    setExpr((e) => e + k);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Calculator</p>
      <div className="rounded-lg bg-muted p-3 text-right">
        <div className="min-h-5 truncate text-sm text-muted-foreground">{expr.replace(/\*/g, "×").replace(/\//g, "÷") || "0"}</div>
        <div className="font-display text-2xl font-semibold">{result || " "}</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.map((k) => (
          <Button
            key={k}
            variant={k === "=" ? "default" : /[+\-*/]/.test(k) ? "secondary" : "outline"}
            onClick={() => press(k)}
          >
            {k === "*" ? "×" : k === "/" ? "÷" : k}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="ghost" onClick={() => { setExpr(""); setResult(""); }}>Clear</Button>
        <Button
          variant="ghost"
          disabled={!result || result === "Error"}
          onClick={() => {
            navigator.clipboard?.writeText(result);
            toast.success("Copied — paste it into the amount");
          }}
        >
          Copy result
        </Button>
      </div>
    </div>
  );
}

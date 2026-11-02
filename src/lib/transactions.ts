import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, TxType } from "./finance";

export const transactionsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,type,amount,purpose,category,transaction_date,notes")
      .order("transaction_date", { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount), type: t.type as TxType }));
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    return { email: u.user.email ?? "", full_name: data?.full_name ?? "", currency: data?.currency ?? "INR", id: u.user.id };
  },
});

export type TxInput = Omit<Transaction, "id">;

export function useSaveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TxInput & { id?: string | undefined }) => {
      const { error } = id
        ? await supabase.from("transactions").update(input).eq("id", id)
        : await supabase.from("transactions").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

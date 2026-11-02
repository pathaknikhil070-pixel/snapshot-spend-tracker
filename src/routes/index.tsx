import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/login" });
  },
  head: () => ({
    meta: [
      { title: "Expense Tracker" },
      { name: "description", content: "Your personal income and expense tracker." },
      { property: "og:title", content: "Expense Tracker" },
      { property: "og:description", content: "Your personal income and expense tracker." },
    ],
  }),
});

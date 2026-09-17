"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useToast } from "@/components/ui/ToastProvider";

export default function StockRealtimeObserver() {
  const router = useRouter();
  const { pushToast } = useToast();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("stock-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_levels" },
        (payload) => {
          router.refresh();
          pushToast({
            title: "Stock updated",
            description: `Product ${payload.new?.product_id || payload.old?.product_id} has new balance.`,
            variant: "success",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_ledger" },
        (payload) => {
          router.refresh();
          pushToast({
            title: "Ledger event",
            description: `${payload.new?.operation_type || "stock change"} recorded`,
            variant: "default",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, pushToast]);

  return null;
}

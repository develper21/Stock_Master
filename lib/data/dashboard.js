import { getSessionAndProfile } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env.server";

export async function fetchDashboardStats(context = {}) {
  let { profile } = context;
  if (!profile) {
    ({ profile } = await getSessionAndProfile({ redirectToLogin: true }));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const [products, lowStockQuery, receiptsQuery, deliveriesQuery] = await Promise.all([
    supabase.from("products").select("id"),
    supabase.from("stock_levels").select("id, quantity, products!inner(reorder_level)"),
    supabase.from("receipts").select("id, status"),
    supabase.from("deliveries").select("id, status"),
  ]);

  const lowStockCount =
    lowStockQuery.data?.filter((row) => {
      const reorder = row.products?.reorder_level ?? 0;
      return reorder > 0 && Number(row.quantity) <= reorder;
    }).length ?? 0;

  const pendingReceiptsCount = receiptsQuery.data?.filter((r) => r.status !== "done").length ?? 0;
  const pendingDeliveriesCount = deliveriesQuery.data?.filter((r) => r.status !== "done").length ?? 0;

  return {
    profile,
    kpis: [
      {
        label: "Total Products",
        value: products?.data?.length ?? 0,
        href: "/products",
      },
      {
        label: "Low Stock Items",
        value: lowStockCount,
        href: "/products?filter=low-stock",
      },
      {
        label: "Pending Receipts",
        value: pendingReceiptsCount,
        href: "/receipts?status!=done",
      },
      {
        label: "Pending Deliveries",
        value: pendingDeliveriesCount,
        href: "/deliveries?status!=done",
      },
    ],
  };
}

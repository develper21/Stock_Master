import { getSessionAndProfile } from "@/lib/auth";

export async function fetchDashboardStats(context = {}) {
  let { supabase, profile } = context;
  if (!supabase || !profile) {
    ({ supabase, profile } = await getSessionAndProfile({ redirectToLogin: true }));
  }

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

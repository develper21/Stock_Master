import PageHeader from "@/components/layout/PageHeader";
import AdjustmentForm from "@/components/adjustments/AdjustmentForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "Create Adjustment | StockMaster",
};

export default async function CreateAdjustmentPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });

  const [{ data: products }, { data: warehouses }, { data: locations }, { data: stockLevels }] = await Promise.all([
    supabase.from("products").select("id, name, sku").order("name", { ascending: true }),
    supabase.from("warehouses").select("id, name").order("name", { ascending: true }),
    supabase.from("locations").select("id, name, warehouse_id").order("name", { ascending: true }),
    supabase.from("stock_levels").select("product_id, warehouse_id, location_id, quantity"),
  ]);

  return (
    <div>
      <PageHeader
        title="Create adjustment"
        description="Record manual cycle-count corrections with full audit log updates."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <AdjustmentForm
          products={products || []}
          warehouses={warehouses || []}
          locations={locations || []}
          stockLevels={stockLevels || []}
        />
      </div>
    </div>
  );
}

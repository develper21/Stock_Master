import PageHeader from "@/components/layout/PageHeader";
import TransferForm from "@/components/transfers/TransferForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "Create Transfer | StockMaster",
};

export default async function CreateTransferPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });

  const [{ data: products }, { data: warehouses }, { data: locations }, { data: stockLevels }] = await Promise.all([
    supabase.from("products").select("id, name, sku").order("name", { ascending: true }),
    supabase.from("warehouses").select("id, name").order("name", { ascending: true }),
    supabase.from("locations").select("id, name, warehouse_id").order("name", { ascending: true }),
    supabase.from("stock_levels").select("product_id, warehouse_id, quantity"),
  ]);

  const stockMatrix = {};
  stockLevels?.forEach((row) => {
    const warehouse = row.warehouse_id;
    if (!stockMatrix[warehouse]) stockMatrix[warehouse] = {};
    stockMatrix[warehouse][row.product_id] = Number(row.quantity);
  });

  return (
    <div>
      <PageHeader
        title="Create transfer"
        description="Move stock between warehouses/locations with built-in validations."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <TransferForm
          products={products || []}
          warehouses={warehouses || []}
          locations={locations || []}
          stockMatrix={stockMatrix}
        />
      </div>
    </div>
  );
}

import PageHeader from "@/components/layout/PageHeader";
import WarehouseForm from "@/components/settings/WarehouseForm";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Warehouse | StockMaster",
};

export default async function EditWarehousePage({ params }) {
  const resolvedParams = await params;
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: warehouse } = await supabase
    .from("warehouses")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (!warehouse) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${warehouse.name}`}
        description="Update address, contact info, or operational parameters for this warehouse."
        backHref="/settings/warehouses"
        backLabel="Warehouses"
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <WarehouseForm warehouse={warehouse} />
      </div>
    </div>
  );
}

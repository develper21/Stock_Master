import PageHeader from "@/components/layout/PageHeader";
import WarehouseForm from "@/components/settings/WarehouseForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "Create Warehouse | StockMaster",
};

export default async function CreateWarehousePage() {
  await getSessionAndProfile({ redirectToLogin: true });

  return (
    <div>
      <PageHeader
        title="Add warehouse"
        description="Register a new physical location so stock levels can be tracked precisely."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <WarehouseForm />
      </div>
    </div>
  );
}

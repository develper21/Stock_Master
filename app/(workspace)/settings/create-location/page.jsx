import PageHeader from "@/components/layout/PageHeader";
import LocationForm from "@/components/settings/LocationForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "Create Location | StockMaster",
};

export default async function CreateLocationPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: warehouses = [] } = await supabase.from("warehouses").select("id, name").order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Add location"
        description="Define rack/bin identifiers inside warehouses to improve traceability."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <LocationForm warehouses={warehouses} />
      </div>
    </div>
  );
}

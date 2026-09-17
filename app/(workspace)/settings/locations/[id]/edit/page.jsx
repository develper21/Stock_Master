import PageHeader from "@/components/layout/PageHeader";
import LocationForm from "@/components/settings/LocationForm";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Location | StockMaster",
};

export default async function EditLocationPage({ params }) {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const [{ data: location }, { data: warehouses }] = await Promise.all([
    supabase.from("locations").select("*").eq("id", params.id).single(),
    supabase.from("warehouses").select("id, name").order("name", { ascending: true }),
  ]);

  if (!location) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${location.name}`}
        description="Update rack or zone metadata for accurate stock allocations."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <LocationForm warehouses={warehouses} location={location} />
      </div>
    </div>
  );
}

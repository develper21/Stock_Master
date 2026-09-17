import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import DeleteLocationButton from "@/components/settings/DeleteLocationButton";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const isManager = profile.role === "inventory_manager";
  const { data: locations = [] } = await supabase
    .from("locations")
    .select("id, name, code, type, warehouse:warehouse_id(name)")
    .order("name", { ascending: true });

  const columns = [
    { label: "Name", accessor: "name" },
    { label: "Code", accessor: "code" },
    { label: "Type", accessor: "type" },
    {
      label: "Warehouse",
      accessor: "warehouse",
      render: (row) => row.warehouse?.name || "—",
    },
  ];

  if (isManager) {
    columns.push({
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="space-x-3 text-xs">
          <Link href={`/settings/locations/${row.id}/edit`} className="text-emerald-300 hover:text-emerald-200">
            Edit
          </Link>
          <DeleteLocationButton locationId={row.id} />
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Manage granular bins, racks, and zones inside each warehouse."
        actions={
          isManager && (
            <Link
              href="/settings/create-location"
              className="rounded-2xl bg-gradient-to-r from-violet-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
            >
              + Add Location
            </Link>
          )
        }
      />
      <DataTable columns={columns} data={locations} emptyState="No locations yet." />
    </div>
  );
}

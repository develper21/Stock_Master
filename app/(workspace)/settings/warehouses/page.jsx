import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import DeleteWarehouseButton from "@/components/settings/DeleteWarehouseButton";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const isManager = profile.role === "inventory_manager";
  const { data: warehouses = [] } = await supabase
    .from("warehouses")
    .select("id, name, code, address, created_at")
    .order("created_at", { ascending: false });

  const columns = [
    { label: "Name", accessor: "name" },
    { label: "Code", accessor: "code" },
    { label: "Address", accessor: "address" },
    {
      label: "Created",
      accessor: "created_at",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  if (isManager) {
    columns.push({
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="space-x-3 text-xs">
          <Link href={`/settings/warehouses/${row.id}/edit`} className="text-emerald-300 hover:text-emerald-200">
            Edit
          </Link>
          <DeleteWarehouseButton warehouseId={row.id} />
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Manage physical nodes where stock is stored and moved."
        actions={
          isManager && (
            <Link
              href="/settings/create-warehouse"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900"
            >
              + Add Warehouse
            </Link>
          )
        }
      />
      <DataTable columns={columns} data={warehouses} emptyState="No warehouses yet." />
    </div>
  );
}

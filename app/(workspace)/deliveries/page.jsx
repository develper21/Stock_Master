import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: deliveries = [] } = await supabase
    .from("deliveries")
    .select("id, reference_no, customer, status, created_at, warehouses(name)")
    .order("created_at", { ascending: false });

  const columns = [
    {
      label: "Reference",
      accessor: "reference_no",
      render: (row) => (
        <Link href={`/deliveries/${row.id}`} className="text-emerald-300 hover:text-emerald-200">
          {row.reference_no}
        </Link>
      ),
    },
    { label: "Customer", accessor: "customer" },
    {
      label: "Warehouse",
      accessor: "warehouse",
      render: (row) => row.warehouses?.name || "—",
    },
    {
      label: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: "Created",
      accessor: "created_at",
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="space-x-3 text-xs">
          <Link href={`/deliveries/${row.id}`} className="text-slate-400 hover:text-slate-200">
            View
          </Link>
          <Link href={`/deliveries/${row.id}?edit=true`} className="text-emerald-300 hover:text-emerald-200">
            Edit
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Plan, pick, pack, and ship customer orders with confidence."
        actions={
          <Link
            href="/deliveries/create"
            className="rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 px-4 py-2 text-sm font-semibold text-white"
          >
            + New Delivery
          </Link>
        }
      />

      <DataTable columns={columns} data={deliveries} emptyState="No deliveries yet." />
    </div>
  );
}

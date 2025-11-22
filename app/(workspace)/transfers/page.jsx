import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: transfers = [] } = await supabase
    .from("internal_transfers")
    .select(
      "id, reference_no, status, created_at, from:from_warehouse_id(name), to:to_warehouse_id(name)"
    )
    .order("created_at", { ascending: false });

  const columns = [
    {
      label: "Reference",
      accessor: "reference_no",
      render: (row) => (
        <Link href={`/transfers/${row.id}`} className="text-emerald-300 hover:text-emerald-200">
          {row.reference_no}
        </Link>
      ),
    },
    {
      label: "From → To",
      accessor: "warehouses",
      render: (row) => `${row.from?.name || "—"} → ${row.to?.name || "—"}`,
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
  ];

  return (
    <div>
      <PageHeader
        title="Internal Transfers"
        description="Track location-to-location movements with full audit coverage."
        actions={
          <Link
            href="/transfers/create"
            className="rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
          >
            + New Transfer
          </Link>
        }
      />
      <DataTable columns={columns} data={transfers} emptyState="No transfers yet." />
    </div>
  );
}

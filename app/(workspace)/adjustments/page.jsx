import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdjustmentsPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: adjustments = [] } = await supabase
    .from("adjustments")
    .select("id, difference, reason, created_at, products(name, sku), warehouses(name)")
    .order("created_at", { ascending: false });

  const columns = [
    {
      label: "Product",
      accessor: "product",
      render: (row) => (
        <div>
          <Link href={`/adjustments/${row.id}`} className="font-medium text-emerald-300 hover:text-emerald-200">
            {row.products?.name}
          </Link>
          <p className="text-xs text-slate-500">{row.products?.sku}</p>
        </div>
      ),
    },
    {
      label: "Warehouse",
      accessor: "warehouse",
      render: (row) => row.warehouses?.name || "—",
    },
    {
      label: "Difference",
      accessor: "difference",
      render: (row) => {
        const diff = Number(row.difference) || 0;
        const tone = diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-300" : "text-rose-300";
        const sign = diff > 0 ? "+" : "";
        return <span className={`font-semibold ${tone}`}>{`${sign}${diff}`}</span>;
      },
    },
    {
      label: "Reason",
      accessor: "reason",
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
        title="Inventory Adjustments"
        description="Document every cycle count correction and ensure the ledger stays balanced."
        actions={
          <Link
            href="/adjustments/create"
            className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
          >
            + New Adjustment
          </Link>
        }
      />

      <DataTable columns={columns} data={adjustments} emptyState="No adjustments yet." />
    </div>
  );
}

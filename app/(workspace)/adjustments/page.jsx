import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdjustmentsPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: adjustments = [] } = await supabase
    .from("adjustments")
    .select("id, reference_no, adjustment_type, reason, created_at, warehouses(name), adjustment_items(id, quantity, products(name, sku, unit), locations(name))")
    .order("created_at", { ascending: false });

  const columns = [
    {
      label: "Reference",
      accessor: "reference_no",
      render: (row) => (
        <Link href={`/adjustments/${row.id}`} className="font-semibold text-emerald-300 hover:text-emerald-200">
          {row.reference_no}
        </Link>
      ),
    },
    {
      label: "Product",
      accessor: "product",
      render: (row) => {
        const item = row.adjustment_items?.[0];
        if (!item?.products) return <span className="text-slate-500">—</span>;
        return (
          <div>
            <p className="font-medium text-white">{item.products.name}</p>
            <p className="text-xs text-slate-500">{item.products.sku}</p>
          </div>
        );
      },
    },
    {
      label: "Warehouse",
      accessor: "warehouse",
      render: (row) => row.warehouses?.name || "—",
    },
    {
      label: "Type",
      accessor: "adjustment_type",
      render: (row) => (
        <StatusBadge 
          status={row.adjustment_type === "increase" ? "ready" : "waiting"} 
          label={row.adjustment_type || "adjustment"} 
        />
      ),
    },
    {
      label: "Quantity",
      accessor: "quantity",
      render: (row) => {
        const item = row.adjustment_items?.[0];
        const qty = Number(item?.quantity) || 0;
        const tone = qty === 0 ? "text-slate-400" : qty > 0 ? "text-emerald-300" : "text-rose-300";
        const sign = qty > 0 ? "+" : "";
        return <span className={`font-semibold ${tone}`}>{`${sign}${qty}`} {item?.products?.unit || ""}</span>;
      },
    },
    {
      label: "Reason",
      accessor: "reason",
      render: (row) => <span className="text-sm text-slate-300">{row.reason || "—"}</span>,
    },
    {
      label: "Date",
      accessor: "created_at",
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Adjustments"
        description="Document every cycle count correction and ensure the ledger stays balanced."
        actions={
          <Link
            href="/adjustments/create"
            className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:from-amber-300 hover:to-amber-400"
          >
            + New Adjustment
          </Link>
        }
      />

      <DataTable columns={columns} data={adjustments || []} emptyState="No adjustments yet." />
    </div>
  );
}

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionAndProfile } from "@/lib/auth";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdjustmentDetailPage({ params }) {
  const resolvedParams = await params;
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: adjustment } = await supabase
    .from("adjustments")
    .select("*, warehouses(name), profiles:created_by(full_name, email), adjustment_items(*, products(name, sku, unit), locations(name))")
    .eq("id", resolvedParams.id)
    .single();

  if (!adjustment) {
    notFound();
  }

  const items = adjustment.adjustment_items || [];
  const primaryItem = items[0];
  const diff = Number(primaryItem?.quantity) || 0;
  const diffTone = diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-300" : "text-rose-300";

  const columns = [
    {
      label: "Product",
      accessor: "product",
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.products?.name || "—"}</p>
          <p className="text-xs text-slate-500">{row.products?.sku || ""}</p>
        </div>
      ),
    },
    {
      label: "Location",
      accessor: "location",
      render: (row) => row.locations?.name || "Default",
    },
    {
      label: "Quantity",
      accessor: "quantity",
      render: (row) => {
        const qty = Number(row.quantity) || 0;
        const tone = qty === 0 ? "text-slate-400" : qty > 0 ? "text-emerald-300" : "text-rose-300";
        const sign = qty > 0 ? "+" : "";
        return <span className={`font-semibold ${tone}`}>{`${sign}${qty}`} {row.products?.unit || ""}</span>;
      },
    },
    {
      label: "Batch",
      accessor: "batch_number",
      render: (row) => row.batch_number || "—",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Adjustment ${adjustment.reference_no || ""}`}
        description={`Warehouse: ${adjustment.warehouses?.name || "—"}`}
        backHref="/adjustments"
        backLabel="All adjustments"
        actions={
          <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">
            Recorded by: {adjustment.profiles?.full_name || profile.full_name}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard label="Type" value={<StatusBadge status={adjustment.adjustment_type === "increase" ? "ready" : "waiting"} label={adjustment.adjustment_type} />} />
        <InfoCard label="Warehouse" value={adjustment.warehouses?.name || "—"} />
        <InfoCard label="Reason" value={adjustment.reason || "—"} />
        <InfoCard label="Date" value={adjustment.created_at ? new Date(adjustment.created_at).toLocaleDateString() : "—"} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Adjusted Items</h2>
          <p className="text-sm text-slate-400">All SKUs impacted by this adjustment.</p>
        </div>
        <DataTable columns={columns} data={items} emptyState="No items in this adjustment." />
      </section>

      {adjustment.notes && (
        <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Notes</h3>
          <p className="mt-2 text-slate-200">{adjustment.notes}</p>
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

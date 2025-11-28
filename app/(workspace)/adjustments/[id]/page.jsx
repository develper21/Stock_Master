import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { getSessionAndProfile } from "@/lib/auth";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdjustmentDetailPage({ params }) {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: adjustment } = await supabase
    .from("adjustments")
    .select("*, products(name, sku, unit), warehouses(name), locations(name)")
    .eq("id", params.id)
    .single();

  if (!adjustment) {
    notFound();
  }

  const rows = [
    {
      id: "qty",
      label: "System quantity",
      value: Number(adjustment.system_quantity).toLocaleString(),
    },
    {
      id: "count",
      label: "Counted quantity",
      value: Number(adjustment.counted_quantity).toLocaleString(),
    },
    {
      id: "diff",
      label: "Difference",
      value: adjustment.difference,
    },
  ];

  const diffTone = adjustment.difference === 0 ? "text-slate-400" : adjustment.difference > 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Adjustment for ${adjustment.products?.name || "Product"}`}
        description={`Warehouse ${adjustment.warehouses?.name || "—"}`}
        backHref="/adjustments"
        backLabel="All adjustments"
        actions={
          <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">By {profile.full_name}</div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Product" value={`${adjustment.products?.name || "—"} (${adjustment.products?.sku || ""})`} />
        <InfoCard label="Warehouse" value={adjustment.warehouses?.name || "—"} />
        <InfoCard label="Location" value={adjustment.locations?.name || "All"} />
      </div>

      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Quantities</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{row.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${row.id === "diff" ? diffTone : "text-white"}`}>
                {row.id === "diff" && row.value > 0 ? "+" : ""}
                {row.value}
                {row.id !== "diff" && ` ${adjustment.products?.unit || ""}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {adjustment.reason && (
        <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Reason</h3>
          <p className="mt-2 text-slate-200">{adjustment.reason}</p>
        </section>
      )}

      <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Ledger impact</h3>
        <DataTable
          columns={[
            { label: "Timestamp", accessor: "timestamp" },
            { label: "Quantity", accessor: "quantity" },
            { label: "Balance", accessor: "balance" },
          ]}
          data={[
            {
              id: adjustment.id,
              timestamp: new Date(adjustment.created_at).toLocaleString(),
              quantity: (
                <span className={diffTone}>
                  {adjustment.difference > 0 ? "+" : ""}
                  {adjustment.difference} {adjustment.products?.unit || ""}
                </span>
              ),
              balance: Number(adjustment.counted_quantity).toLocaleString(),
            },
          ]}
          emptyState="No ledger rows yet"
        />
      </section>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

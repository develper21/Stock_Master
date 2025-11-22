import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import TransferValidateButton from "@/components/transfers/TransferValidateButton";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TransferDetailPage({ params }) {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: transfer } = await supabase
    .from("internal_transfers")
    .select(
      "*, from:from_warehouse_id(name), to:to_warehouse_id(name), transfer_items(*, products(name, sku, unit))"
    )
    .eq("id", params.id)
    .single();

  if (!transfer) {
    notFound();
  }

  const columns = [
    {
      label: "Product",
      accessor: "product",
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.products?.name}</p>
          <p className="text-xs text-slate-400">{row.products?.sku}</p>
        </div>
      ),
    },
    {
      label: "Quantity",
      accessor: "quantity",
      render: (row) => `${Number(row.quantity).toLocaleString()} ${row.products?.unit || ""}`,
    },
  ];

  const isValidated = transfer.status === "done";
  const canValidate = profile.role === "inventory_manager" && !isValidated;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Transfer ${transfer.reference_no}`}
        description={`${transfer.from?.name || "—"} → ${transfer.to?.name || "—"}`}
        actions={
          <div className="flex gap-3">
            <Link
              href={`/transfers/${transfer.id}?edit=true`}
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200"
            >
              Edit Draft
            </Link>
            {canValidate && <TransferValidateButton transferId={transfer.id} />}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Status" value={<StatusBadge status={transfer.status} />} />
        <InfoCard label="From Warehouse" value={transfer.from?.name || "—"} />
        <InfoCard label="To Warehouse" value={transfer.to?.name || "—"} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Items</h2>
            <p className="text-sm text-slate-400">Stock moved within this transfer.</p>
          </div>
          <p className="text-sm text-slate-500">{transfer.transfer_items?.length || 0} items</p>
        </div>
        <DataTable columns={columns} data={transfer.transfer_items || []} emptyState="No items" />
      </section>

      {transfer.notes && (
        <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Notes</h3>
          <p className="mt-2 text-slate-200">{transfer.notes}</p>
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

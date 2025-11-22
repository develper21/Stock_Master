import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ReceiptValidateButton from "@/components/receipts/ReceiptValidateButton";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({ params, searchParams }) {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });

  const { data: receipt } = await supabase
    .from("receipts")
    .select(
      "*, warehouses(name), receipt_items(*, products(name, sku, unit)), profiles:created_by(full_name, email)"
    )
    .eq("id", params.id)
    .single();

  if (!receipt) {
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
    {
      label: "Unit Price",
      accessor: "unit_price",
      render: (row) => (row.unit_price ? `₹${Number(row.unit_price).toFixed(2)}` : "—"),
    },
  ];

  const isValidated = receipt.status === "done";
  const canValidate = profile.role === "inventory_manager" && !isValidated;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Receipt ${receipt.reference_no}`}
        description={`Supplier ${receipt.supplier_name || "—"}`}
        actions={
          <div className="flex gap-3">
            <Link
              href={`/receipts/${receipt.id}?edit=true`}
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200"
            >
              Edit Draft
            </Link>
            <a
              href={`/api/receipts/${receipt.id}/export`}
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:text-white"
            >
              Export CSV
            </a>
            {canValidate && <ReceiptValidateButton receiptId={receipt.id} />}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard label="Status" value={<StatusBadge status={receipt.status} />} />
        <InfoCard label="Warehouse" value={receipt.warehouses?.name || "—"} />
        <InfoCard label="Receipt From" value={receipt.supplier_name || "—"} />
        <InfoCard label="Created" value={new Date(receipt.created_at).toLocaleString()} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Items</h2>
            <p className="text-sm text-slate-400">All SKUs captured in this receipt.</p>
          </div>
          <p className="text-sm text-slate-500">{receipt.receipt_items?.length || 0} items</p>
        </div>
        <DataTable columns={columns} data={receipt.receipt_items || []} emptyState="No items" />
      </section>

      {receipt.notes && (
        <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Notes</h3>
          <p className="mt-2 text-slate-200">{receipt.notes}</p>
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

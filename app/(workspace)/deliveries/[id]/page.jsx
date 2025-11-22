import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DeliveryValidateButton from "@/components/deliveries/DeliveryValidateButton";
import DeliveryItemsTable from "@/components/deliveries/DeliveryItemsTable";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DeliveryDetailPage({ params }) {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: delivery } = await supabase
    .from("deliveries")
    .select(
      "*, warehouses(name), delivery_items(*, products(name, sku, unit)), profiles:created_by(full_name)"
    )
    .eq("id", params.id)
    .single();

  if (!delivery) {
    notFound();
  }

  const isValidated = delivery.status === "done";
  const canValidate = profile.role === "inventory_manager" && !isValidated;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Delivery ${delivery.reference_no}`}
        description={`Customer ${delivery.customer || "—"}`}
        actions={
          <div className="flex gap-3">
            <Link
              href={`/deliveries/${delivery.id}?edit=true`}
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200"
            >
              Edit Draft
            </Link>
            {canValidate && <DeliveryValidateButton deliveryId={delivery.id} />}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Status" value={<StatusBadge status={delivery.status} />} />
        <InfoCard label="Warehouse" value={delivery.warehouses?.name || "—"} />
        <InfoCard label="Created" value={new Date(delivery.created_at).toLocaleString()} />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Items</h2>
            <p className="text-sm text-slate-400">All SKUs committed for this delivery.</p>
          </div>
          <p className="text-sm text-slate-500">{delivery.delivery_items?.length || 0} items</p>
        </div>
        <DeliveryItemsTable
          items={delivery.delivery_items || []}
          deliveryId={delivery.id}
          allowActions={!isValidated}
        />
      </section>

      {delivery.notes && (
        <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Notes</h3>
          <p className="mt-2 text-slate-200">{delivery.notes}</p>
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

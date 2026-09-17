"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LineItemsEditor from "@/components/forms/LineItemsEditor";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "waiting", label: "Waiting" },
  { value: "ready", label: "Ready" },
];

export default function DeliveryForm({ products = [], warehouses = [], locations = [], stockMatrix = {} }) {
  const router = useRouter();
  const [form, setForm] = useState({
    reference_no: "DEL-" + Date.now().toString().slice(-6),
    customer: "",
    warehouse_id: warehouses[0]?.id || "",
    status: "draft",
    notes: "",
  });
  const [items, setItems] = useState([
    {
      product_id: products[0]?.id || "",
      quantity: 1,
      location_id: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locationOptions = useMemo(
    () =>
      locations
        .filter((loc) => loc.warehouse_id === form.warehouse_id)
        .map((loc) => ({ value: loc.id, label: loc.name })),
    [locations, form.warehouse_id]
  );

  const stockLookup = stockMatrix[form.warehouse_id] || {};

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateStock() {
    const totals = items.reduce((acc, item) => {
      if (!item.product_id) return acc;
      const qty = Number(item.quantity) || 0;
      acc[item.product_id] = (acc[item.product_id] || 0) + qty;
      return acc;
    }, {});

    for (const [productId, qty] of Object.entries(totals)) {
      const available = Number(stockLookup[productId] || 0);
      if (qty > available) {
        const product = products.find((p) => p.id === productId);
        throw new Error(
          `${product?.name || "Product"} exceeds available stock (${qty} requested vs ${available} available)`
        );
      }
    }
  }

  async function handleSubmit(nextStatus) {
    setLoading(true);
    setError(null);
    try {
      validateStock();

      const payload = {
        ...form,
        status: nextStatus || form.status,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity) || 0,
          location_id: item.location_id || null,
          picked: false,
          packed: false,
        })),
      };

      const response = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to save delivery");
      }

      router.push(`/deliveries/${body.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const itemFields = [
    { key: "quantity", label: "Quantity", type: "number", min: 0 },
    { key: "location_id", label: "Location", type: "select", options: locationOptions },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Reference No" name="reference_no" value={form.reference_no} onChange={handleChange} />
        <Field label="Customer" name="customer" value={form.customer} onChange={handleChange} required />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Warehouse</label>
          <select
            name="warehouse_id"
            value={form.warehouse_id}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} className="bg-slate-900">
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value} className="bg-slate-900">
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <Field label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Delivery Items</h3>
        <p className="text-sm text-slate-400">Ensure quantities do not exceed available stock.</p>
        <div className="mt-4">
          <LineItemsEditor products={products} fields={itemFields} value={items} onChange={setItems} />
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit("draft")}
          className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200"
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit("waiting")}
          className="rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {loading ? "Submitting..." : "Submit for Picking"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</label>
      <input {...props} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white" />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LineItemsEditor from "@/components/forms/LineItemsEditor";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "waiting", label: "Waiting" },
  { value: "ready", label: "Ready" },
];

export default function TransferForm({
  products = [],
  warehouses = [],
  locations = [],
  stockMatrix = {},
  transfer,
}) {
  const router = useRouter();
  const isEdit = Boolean(transfer);
  const [form, setForm] = useState({
    reference_no: transfer?.reference_no || "TRF-" + Date.now().toString().slice(-6),
    from_warehouse_id: transfer?.from_warehouse_id || warehouses[0]?.id || "",
    to_warehouse_id:
      transfer?.to_warehouse_id || warehouses[1]?.id || warehouses[0]?.id || "",
    from_location_id: transfer?.from_location_id || "",
    to_location_id: transfer?.to_location_id || "",
    status: transfer?.status || "draft",
    notes: transfer?.notes || "",
  });
  const [items, setItems] = useState(
    transfer?.transfer_items?.length
      ? transfer.transfer_items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      : [{ product_id: products[0]?.id || "", quantity: 1 }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fromLocations = useMemo(
    () => locations.filter((loc) => loc.warehouse_id === form.from_warehouse_id),
    [locations, form.from_warehouse_id]
  );
  const toLocations = useMemo(
    () => locations.filter((loc) => loc.warehouse_id === form.to_warehouse_id),
    [locations, form.to_warehouse_id]
  );

  const stockLookup = stockMatrix[form.from_warehouse_id] || {};

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateAvailability() {
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
      validateAvailability();

      const payload = {
        reference_no: form.reference_no,
        from_warehouse_id: form.from_warehouse_id,
        to_warehouse_id: form.to_warehouse_id,
        from_location_id: form.from_location_id || null,
        to_location_id: form.to_location_id || null,
        status: nextStatus || form.status,
        notes: form.notes,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity) || 0,
        })),
      };

      const response = await fetch(isEdit ? `/api/transfers/${transfer.id}` : "/api/transfers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to save transfer");
      }
      router.push(`/transfers/${body.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const itemFields = [{ key: "quantity", label: "Quantity", type: "number", min: 0 }];

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Reference No" name="reference_no" value={form.reference_no} onChange={handleChange} />
        <Field label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="From Warehouse"
          name="from_warehouse_id"
          value={form.from_warehouse_id}
          onChange={handleChange}
          options={warehouses}
        />
        <SelectField
          label="To Warehouse"
          name="to_warehouse_id"
          value={form.to_warehouse_id}
          onChange={handleChange}
          options={warehouses}
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="From Location"
          name="from_location_id"
          value={form.from_location_id}
          onChange={handleChange}
          options={fromLocations}
        />
        <SelectField
          label="To Location"
          name="to_location_id"
          value={form.to_location_id}
          onChange={handleChange}
          options={toLocations}
        />
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

      <div>
        <h3 className="text-lg font-semibold text-white">Transfer Items</h3>
        <p className="text-sm text-slate-400">Stock availability checked against source warehouse.</p>
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
          {loading ? "Saving..." : isEdit ? "Update Draft" : "Save Draft"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit("waiting")}
          className="rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {loading ? "Submitting..." : isEdit ? "Submit Update" : "Submit for Move"}
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

function SelectField({ label, options = [], ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</label>
      <select {...props} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white">
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-slate-900">
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

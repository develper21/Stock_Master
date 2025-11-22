"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LineItemsEditor from "@/components/forms/LineItemsEditor";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "waiting", label: "Waiting" },
  { value: "ready", label: "Ready" },
];

export default function ReceiptForm({
  products = [],
  warehouses = [],
  locations = [],
  profiles = [],
  mode = "create",
  receipt = null,
}) {
  const router = useRouter();
  const buildFormState = () => ({
    reference_no: receipt?.reference_no || "REC-" + Date.now().toString().slice(-6),
    supplier_name: receipt?.supplier_name || "",
    warehouse_id: receipt?.warehouse_id || warehouses[0]?.id || "",
    status: receipt?.status || "draft",
    notes: receipt?.notes || "",
    responsible_id: receipt?.responsible_id || "",
    scheduled_for: toDateTimeLocal(receipt?.scheduled_for),
  });

  const [form, setForm] = useState(buildFormState);
  const buildItemsState = () => {
    if (receipt?.receipt_items?.length) {
      return receipt.receipt_items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        location_id: item.location_id || "",
      }));
    }
    return [
      {
        product_id: products[0]?.id || "",
        quantity: 1,
        unit_price: 0,
        location_id: "",
      },
    ];
  };

  const [items, setItems] = useState(buildItemsState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(buildFormState());
    setItems(buildItemsState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  const locationOptions = useMemo(() => {
    if (!locations?.length) return [];
    if (!form.warehouse_id) return locations.map((loc) => ({ value: loc.id, label: loc.name }));
    return locations
      .filter((loc) => loc.warehouse_id === form.warehouse_id)
      .map((loc) => ({ value: loc.id, label: loc.name }));
  }, [locations, form.warehouse_id]);

  const responsibleOptions = useMemo(
    () => profiles.map((person) => ({ value: person.id, label: person.full_name })),
    [profiles]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(nextStatus) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        status: nextStatus || form.status,
        responsible_id: form.responsible_id || null,
        scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          location_id: item.location_id || null,
        })),
      };

      const endpoint = mode === "edit" && receipt ? `/api/receipts/${receipt.id}` : "/api/receipts";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to save receipt");
      }

      const receiptId = mode === "edit" && receipt ? receipt.id : body.data.id;
      router.push(`/receipts/${receiptId}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const itemFields = useMemo(
    () => [
      { key: "quantity", label: "Quantity", type: "number", min: 0 },
      { key: "unit_price", label: "Unit Price", type: "number", min: 0 },
      { key: "location_id", label: "Location", type: "select", options: locationOptions },
    ],
    [locationOptions]
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Reference No" name="reference_no" value={form.reference_no} onChange={handleChange} required />
        <Field label="Receipt from" name="supplier_name" value={form.supplier_name} onChange={handleChange} required />
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
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Responsible</label>
          <select
            name="responsible_id"
            value={form.responsible_id}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
          >
            <option value="">Unassigned</option>
            {responsibleOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          label="Scheduled for"
          type="datetime-local"
          name="scheduled_for"
          value={form.scheduled_for}
          onChange={handleChange}
          placeholder="Optional"
        />
        <Field label="Notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Receipt Items</h3>
        <p className="text-sm text-slate-400">Add each SKU and quantity received into stock.</p>
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
          className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {loading ? "Submitting..." : "Submit for Validation"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</label>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
      />
    </div>
  );
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdjustmentForm({
  products = [],
  warehouses = [],
  locations = [],
  stockLevels = [],
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    product_id: products[0]?.id || "",
    warehouse_id: warehouses[0]?.id || "",
    location_id: "",
    counted_quantity: 0,
    system_quantity: 0,
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableLocations = useMemo(
    () => locations.filter((loc) => loc.warehouse_id === form.warehouse_id),
    [locations, form.warehouse_id]
  );

  useEffect(() => {
    const match = stockLevels.find(
      (row) =>
        row.product_id === form.product_id &&
        row.warehouse_id === form.warehouse_id &&
        (row.location_id || null) === (form.location_id || null)
    );
    setForm((prev) => ({ ...prev, system_quantity: Number(match?.quantity || 0) }));
  }, [form.product_id, form.warehouse_id, form.location_id, stockLevels]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        counted_quantity: Number(form.counted_quantity) || 0,
        system_quantity: Number(form.system_quantity) || 0,
        difference: (Number(form.counted_quantity) || 0) - (Number(form.system_quantity) || 0),
      };

      const response = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to save adjustment");
      }
      router.push(`/adjustments/${body.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const difference = (Number(form.counted_quantity) || 0) - (Number(form.system_quantity) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="Product"
          name="product_id"
          value={form.product_id}
          onChange={handleChange}
          options={products}
          display={(option) => `${option.name} (${option.sku})`}
        />
        <SelectField
          label="Warehouse"
          name="warehouse_id"
          value={form.warehouse_id}
          onChange={handleChange}
          options={warehouses}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="Location"
          name="location_id"
          value={form.location_id}
          onChange={handleChange}
          options={availableLocations}
          allowEmpty
        />
        <Field
          label="Reason"
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="Counting discrepancy, damage, etc."
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          label="System quantity"
          name="system_quantity"
          type="number"
          value={form.system_quantity}
          onChange={handleChange}
          disabled
        />
        <Field
          label="Counted quantity"
          name="counted_quantity"
          type="number"
          value={form.counted_quantity}
          onChange={handleChange}
          min="0"
        />
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Difference</label>
          <div
            className={`rounded-2xl border border-white/10 px-4 py-2 text-white ${
              difference === 0 ? "bg-slate-900/40" : difference > 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
            }`}
          >
            {difference > 0 ? "+" : ""}
            {difference}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
        >
          {loading ? "Saving..." : "Commit adjustment"}
        </button>
      </div>
    </form>
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

function SelectField({ label, options = [], allowEmpty = false, display = (o) => o.name, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</label>
      <select {...props} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white">
        {allowEmpty && <option value="">All locations</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-slate-900">
            {display(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

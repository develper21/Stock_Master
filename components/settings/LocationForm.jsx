"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = ["rack", "zone", "bin", "floor"];

export default function LocationForm({ warehouses = [], location }) {
  const router = useRouter();
  const isEdit = Boolean(location);
  const [form, setForm] = useState({
    name: location?.name || "",
    code: location?.code || "",
    type: location?.type || TYPES[0],
    warehouse_id: location?.warehouse_id || warehouses[0]?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(isEdit ? `/api/locations/${location.id}` : "/api/locations", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save location");
      }
      router.push("/settings/locations");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
      <Field label="Code" name="code" value={form.code} onChange={handleChange} required />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
          >
            {TYPES.map((type) => (
              <option key={type} value={type} className="bg-slate-900">
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
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
          className="rounded-2xl bg-gradient-to-r from-violet-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {loading ? "Saving..." : isEdit ? "Save" : "Create"}
        </button>
      </div>
    </form>
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

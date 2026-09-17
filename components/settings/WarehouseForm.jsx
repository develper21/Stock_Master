"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WarehouseForm({ warehouse }) {
  const router = useRouter();
  const isEdit = Boolean(warehouse);
  const [form, setForm] = useState({
    name: warehouse?.name || "",
    code: warehouse?.code || "",
    address: warehouse?.address || "",
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
      const targetId = warehouse?.id;
      const response = await fetch(isEdit ? `/api/warehouses/${targetId}` : "/api/warehouses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save warehouse");
      }
      router.push("/settings/warehouses");
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
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
        />
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
          className="rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900"
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

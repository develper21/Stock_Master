"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const units = ["pcs", "kg", "ltr", "box", "set"];

export default function ProductForm({ categories = [], product }) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    unit: product?.unit || units[0],
    reorder_level: product?.reorder_level ?? 0,
    category_id: product?.category_id || categories[0]?.id || null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(isEdit ? `/api/products/${product.id}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Unable to save product");
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Product name" name="name" value={form.name} onChange={handleChange} required />
        <Field label="SKU" name="sku" value={form.sku} onChange={handleChange} required />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Unit</label>
          <select
            name="unit"
            value={form.unit}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
          >
            {units.map((u) => (
              <option key={u} value={u} className="bg-slate-900">
                {u.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Reorder level"
          name="reorder_level"
          type="number"
          min="0"
          value={form.reorder_level}
          onChange={handleChange}
        />
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</label>
          <select
            name="category_id"
            value={form.category_id || ""}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="bg-slate-900">
                {category.name}
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
          className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {loading ? "Saving..." : isEdit ? "Save changes" : "Create product"}
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ profile, warehouses = [] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone || "",
    default_warehouse_id: profile.default_warehouse_id || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update profile");
      }
      setMessage("Profile updated");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Full name" name="full_name" value={form.full_name} onChange={handleChange} required />
      <Field label="Email" value={form.email} disabled />
      <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Optional" />
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Default warehouse</label>
        <select
          name="default_warehouse_id"
          value={form.default_warehouse_id || ""}
          onChange={handleChange}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
        >
          <option value="">None</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id} className="bg-slate-900">
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          {loading ? "Saving..." : "Save changes"}
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

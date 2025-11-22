"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import { USER_ROLES } from "@/lib/constants";

const initialState = {
  loginId: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: USER_ROLES[0].value,
};

export default function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: form.loginId.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: form.role,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create account.");
      }

      setSuccess(
        "Account created. Enter the OTP sent to your inbox to activate access."
      );
      setForm(initialState);
      router.prefetch("/auth/verify-otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Create access</p>
        <h2 className="text-3xl font-semibold text-white">
          Bring StockMaster to your floor
        </h2>
        <p className="text-sm text-slate-400">
          We’ll email an OTP to verify ownership before you login.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Login ID"
            name="loginId"
            value={form.loginId}
            onChange={handleChange}
            placeholder="manager.azhar"
            required
          />
          <Field
            label="Full name"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Azhar Khan"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            type="email"
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
          />
          <Field
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none"
            >
              {USER_ROLES.map((role) => (
                <option key={role.value} value={role.value} className="bg-slate-900">
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            type="password"
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <Field
            type="password"
            label="Confirm password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>

        <PasswordChecklist value={form.password} />

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:from-emerald-300 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create workspace access"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already onboarded? {" "}
        <Link href="/auth/login" className="text-emerald-300 hover:text-emerald-200">
          Login here
        </Link>
      </p>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = "text", placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
    </div>
  );
}

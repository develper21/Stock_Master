"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordChecklist from "@/components/auth/PasswordChecklist";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password, confirmPassword }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to reset password.");
      }

      setStatus({ type: "success", message: "Password reset. You can login now." });
      setPassword("");
      setConfirmPassword("");
      router.prefetch("/auth/login");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">OTP verified</p>
        <h2 className="text-3xl font-semibold text-white">Set a new password</h2>
        <p className="text-sm text-slate-400">Choose a strong password that satisfies all policy checks.</p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-slate-400"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Field
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <PasswordChecklist value={password} />

        {status && (
          <p className={status.type === "error" ? "text-sm text-rose-400" : "text-sm text-emerald-400"}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:from-emerald-300 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Saving password..." : "Save new password"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, type, value, onChange, required }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
      />
    </div>
  );
}

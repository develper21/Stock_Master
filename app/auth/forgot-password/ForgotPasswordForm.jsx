"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send OTP.");
      }

      setStatus({ type: "success", message: "OTP sent. Check your inbox and continue to reset." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Reset access</p>
        <h2 className="text-3xl font-semibold text-white">Forgot your password?</h2>
        <p className="text-sm text-slate-400">
          Enter the email linked to your StockMaster account. We’ll send an OTP to verify ownership.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

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
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered? {" "}
        <Link href="/auth/login" className="text-emerald-300 hover:text-emerald-200">
          Go back to login
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to login.");
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isEmailVerificationError = error && error.includes("verify your email");

  return (
    <div>
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Welcome back</p>
        <h2 className="text-3xl font-semibold text-white">Login with your StockMaster ID</h2>
        <p className="text-sm text-slate-400">
          Use your login ID (not email) to access the command center.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Login ID</label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            placeholder="manager.azhar"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <label>Password</label>
            <Link href="/auth/forgot-password" className="text-emerald-300 hover:text-emerald-200">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className={`text-sm p-3 rounded-lg ${
            isEmailVerificationError 
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
              : 'text-rose-400'
          }`}>
            <p>{error}</p>
            {isEmailVerificationError && (
              <div className="mt-2 space-y-2">
                <Link 
                  href="/auth/verify-email" 
                  className="text-amber-300 hover:text-amber-200 underline"
                >
                  Request new verification email
                </Link>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:from-emerald-300 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Access workspace"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Need access? {" "}
        <Link href="/auth/signup" className="text-emerald-300 hover:text-emerald-200">
          Create an account
        </Link>
      </p>
    </div>
  );
}

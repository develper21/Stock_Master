"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setStatus({
        type: "error",
        message: "Invalid verification link. Please request a new verification email.",
        showResend: true
      });
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  async function verifyEmail() {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Verification failed");
      }

      setStatus({
        type: "success",
        message: payload.message,
        showLogin: true
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message,
        showResend: true
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    const email = prompt("Please enter your email address:");
    if (!email) return;

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();
      
      if (response.ok) {
        setStatus({
          type: "info",
          message: payload.message,
          showResend: false
        });
      } else {
        throw new Error(payload.error);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message,
        showResend: true
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Email Verification</h1>
          <p className="text-slate-400">
            {loading ? "Verifying your email address..." : ""}
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
            </div>
          ) : status && (
            <div className="space-y-6">
              <div className={`text-center p-4 rounded-lg ${
                status.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' :
                status.type === 'error' ? 'bg-rose-500/10 text-rose-300' :
                'bg-blue-500/10 text-blue-300'
              }`}>
                <p className="text-sm">{status.message}</p>
              </div>

              <div className="space-y-3">
                {status.showLogin && (
                  <Link
                    href="/auth/login"
                    className="w-full flex justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:from-emerald-300 hover:to-emerald-400"
                  >
                    Go to Login
                  </Link>
                )}

                {status.showResend && (
                  <button
                    onClick={handleResendEmail}
                    className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-base font-medium text-white transition hover:bg-slate-700"
                  >
                    Resend Verification Email
                  </button>
                )}

                <Link
                  href="/auth/login"
                  className="w-full flex justify-center text-sm text-slate-400 hover:text-slate-300 transition"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

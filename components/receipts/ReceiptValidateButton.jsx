"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReceiptValidateButton({ receiptId, disabled }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleValidate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/receipts/${receiptId}/validate`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to validate receipt");
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleValidate}
        disabled={disabled || loading}
        className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Validating..." : "Validate Receipt"}
      </button>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

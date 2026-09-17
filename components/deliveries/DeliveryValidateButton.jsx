"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeliveryValidateButton({ deliveryId, disabled }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/validate`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Validation failed");
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
        onClick={handleClick}
        disabled={disabled || loading}
        className="rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Validating..." : "Validate Delivery"}
      </button>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteWarehouseButton({ warehouseId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this warehouse?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/warehouses/${warehouseId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Unable to delete warehouse");
      }
      router.refresh();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-rose-300 hover:text-rose-200 disabled:opacity-60"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}

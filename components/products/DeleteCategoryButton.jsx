"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCategoryButton({ categoryId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this category?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Unable to delete category");
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

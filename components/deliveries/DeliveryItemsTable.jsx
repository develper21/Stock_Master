"use client";

import { useState } from "react";
import DataTable from "@/components/common/DataTable";

export default function DeliveryItemsTable({ items = [], deliveryId, allowActions = true }) {
  const [pending, setPending] = useState({});

  async function toggle(field, row, value) {
    setPending((prev) => ({ ...prev, [row.id]: true }));
    try {
      const endpoint = field === "picked" ? "pick" : "pack";
      const res = await fetch(`/api/deliveries/${deliveryId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: row.id, [field]: value }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Unable to update");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setPending((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  const columns = [
    {
      label: "Product",
      accessor: "product",
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.products?.name}</p>
          <p className="text-xs text-slate-400">{row.products?.sku}</p>
        </div>
      ),
    },
    {
      label: "Quantity",
      accessor: "quantity",
      render: (row) => `${Number(row.quantity).toLocaleString()} ${row.products?.unit || ""}`,
    },
    {
      label: "Picked",
      accessor: "picked",
      render: (row) =>
        allowActions ? (
          <ToggleButton
            active={row.picked}
            disabled={pending[row.id]}
            onClick={() => toggle("picked", row, !row.picked)}
          />
        ) : row.picked ? (
          "Yes"
        ) : (
          "No"
        ),
    },
    {
      label: "Packed",
      accessor: "packed",
      render: (row) =>
        allowActions ? (
          <ToggleButton
            active={row.packed}
            disabled={pending[row.id]}
            onClick={() => toggle("packed", row, !row.packed)}
          />
        ) : row.packed ? (
          "Yes"
        ) : (
          "No"
        ),
    },
  ];

  return <DataTable columns={columns} data={items} emptyState="No items" />;
}

function ToggleButton({ active, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-emerald-400/20 text-emerald-200"
          : "bg-slate-800 text-slate-400 hover:text-slate-200"
      } ${disabled ? "opacity-60" : ""}`}
    >
      {active ? "Done" : "Mark"}
    </button>
  );
}

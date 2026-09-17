"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { KanbanSquare, List } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

const STATUS_ORDER = [
  { value: "draft", label: "Draft" },
  { value: "waiting", label: "Waiting" },
  { value: "ready", label: "Ready" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ReceiptsBrowser({ receipts = [] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");

  const normalized = useMemo(
    () =>
      receipts.map((receipt) => ({
        ...receipt,
        warehouse_name: receipt.warehouses?.name || "—",
        created_label: formatTimestamp(receipt.created_at),
      })),
    [receipts]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return normalized;
    const needle = query.toLowerCase();
    return normalized.filter((receipt) => {
      return [receipt.reference_no, receipt.supplier_name, receipt.warehouse_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [normalized, query]);

  const columns = [
    {
      label: "Reference",
      accessor: "reference_no",
      render: (row) => (
        <Link href={`/receipts/${row.id}`} className="text-emerald-300 hover:text-emerald-200">
          {row.reference_no}
        </Link>
      ),
    },
    { label: "Supplier", accessor: "supplier_name" },
    {
      label: "Warehouse",
      accessor: "warehouse_name",
    },
    {
      label: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      label: "Created",
      accessor: "created_label",
    },
    {
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="space-x-3 text-xs">
          <Link href={`/receipts/${row.id}`} className="text-slate-400 hover:text-slate-200">
            View
          </Link>
          <Link href={`/receipts/${row.id}?edit=true`} className="text-emerald-300 hover:text-emerald-200">
            Edit
          </Link>
        </div>
      ),
    },
  ];

  const groupedForKanban = useMemo(() => {
    return STATUS_ORDER.map(({ value, label }) => ({
      value,
      label,
      receipts: filtered.filter((receipt) => receipt.status === value),
    }));
  }, [filtered]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            type="search"
            placeholder="Search receipts (reference, supplier, warehouse)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
          <IconsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/40 p-1 text-sm">
          {[
            { label: "List", value: "list", icon: List },
            { label: "Kanban", value: "kanban", icon: KanbanSquare },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                className={`flex-1 rounded-2xl px-4 py-2 font-medium transition ${
                  view === option.value ? "bg-emerald-500/20 text-emerald-200" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="sr-only">{option.label}</span>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {view === "list" ? (
        <DataTable columns={columns} data={filtered} emptyState="No receipts match your search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groupedForKanban.map((group) => (
            <div key={group.value} className="rounded-3xl border border-white/5 bg-slate-900/40">
              <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{group.label}</p>
                  <p className="text-sm text-slate-400">{group.receipts.length} receipts</p>
                </div>
              </header>
              <div className="space-y-3 p-4">
                {group.receipts.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                    Nothing here yet.
                  </p>
                )}
                {group.receipts.map((receipt) => (
                  <article key={receipt.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{receipt.created_label}</span>
                      <StatusBadge status={receipt.status} />
                    </div>
                    <Link
                      href={`/receipts/${receipt.id}`}
                      className="mt-2 block text-base font-semibold text-white hover:text-emerald-200"
                    >
                      {receipt.reference_no}
                    </Link>
                    <p className="text-sm text-slate-400">{receipt.supplier_name || "Unknown supplier"}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{receipt.warehouse_name}</p>
                    <div className="mt-3 flex gap-2 text-xs">
                      <Link
                        href={`/receipts/${receipt.id}`}
                        className="rounded-xl border border-white/10 px-3 py-1 text-slate-300 hover:border-emerald-300"
                      >
                        View
                      </Link>
                      <Link
                        href={`/receipts/${receipt.id}?edit=true`}
                        className="rounded-xl border border-emerald-500/40 px-3 py-1 text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Edit
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IconsSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function formatTimestamp(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

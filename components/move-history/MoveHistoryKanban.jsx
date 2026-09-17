"use client";

import { useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/common/StatusBadge";

const STATUS_GROUPS = [
  { key: "draft", title: "Draft" },
  { key: "waiting", title: "Waiting" },
  { key: "ready", title: "Ready" },
  { key: "done", title: "Completed" },
  { key: "cancelled", title: "Cancelled" },
];

export default function MoveHistoryKanban({ moves = [] }) {
  const grouped = useMemo(() => {
    return moves.reduce((acc, move) => {
      const bucket = move.status || "draft";
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(move);
      return acc;
    }, {});
  }, [moves]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {STATUS_GROUPS.map((group) => {
        const items = grouped[group.key] || [];
        return (
          <section key={group.key} className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/50">
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span>{group.title}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">{items.length}</span>
            </header>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {items.length === 0 && (
                <p className="text-xs text-slate-500">No moves.</p>
              )}
              {items.map((move) => (
                <article
                  key={move.id}
                  className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-200 shadow-sm shadow-black/40"
                >
                  <header className="flex items-center justify-between">
                    <Link
                      href={`/transfers/${move.id}`}
                      className="font-semibold text-emerald-300 hover:text-emerald-200"
                    >
                      {move.reference_no}
                    </Link>
                    <StatusBadge status={move.status} />
                  </header>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>
                      <span className="font-medium text-slate-300">Contact:</span> {move.contactName || "—"}
                    </p>
                    {move.contactEmail && <p>{move.contactEmail}</p>}
                    <p>
                      <span className="font-medium text-slate-300">From:</span> {move.from?.name || "—"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-300">To:</span> {move.to?.name || "—"}
                    </p>
                  </div>
                  <footer className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-white">
                      {move.totalQuantity?.toLocaleString() || 0} units
                    </p>
                    <p className="text-slate-500">{new Date(move.created_at).toLocaleDateString()}</p>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

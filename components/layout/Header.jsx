"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header({ profile }) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-slate-950/70 px-8 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Live workspace</p>
        <h1 className="text-2xl font-semibold text-white">{profile.default_warehouse_id ? "Warehouse Ops" : "Stock Overview"}</h1>
        <p className="text-sm text-slate-400">Stay on top of receipts, deliveries, and realtime stock deltas.</p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/receipts/create"
          className="rounded-2xl border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10"
        >
          New Receipt
        </Link>
        <Link
          href="/deliveries/create"
          className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Create Delivery
        </Link>
        <button
          onClick={() => router.refresh()}
          className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-400 hover:text-white"
        >
          Refresh
        </button>
      </div>
    </header>
  );
}

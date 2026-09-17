export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.25),_rgba(15,23,42,0.95))] px-12 py-16 shadow-card lg:flex">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">StockMaster</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white">
              {title || "Modern inventory intelligence for ambitious operations"}
            </h1>
            <p className="mt-6 max-w-md text-lg text-slate-200/80">
              {subtitle ||
                "One control tower for products, warehouses, moves, and people. Crafted for high-trust operations teams."}
            </p>
          </div>
          <ul className="space-y-4 text-sm text-slate-200/70">
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Real-time Supabase telemetry across every stock move.
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Role-aware workflows for managers & floor teams.
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Audit-grade ledger with zero spreadsheet gymnastics.
            </li>
          </ul>
        </section>
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur">
          {children}
        </section>
      </div>
    </div>
  );
}

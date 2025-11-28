import KpiGrid from "@/components/dashboard/KpiGrid";
import { fetchDashboardStats } from "@/lib/data/dashboard";

export const metadata = {
  title: "Dashboard | stockiq",
};

export default async function DashboardPage() {
  const { profile, kpis } = await fetchDashboardStats();

  return (
    <div className="space-y-8">
      <KpiGrid stats={kpis} />

      <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Realtime</p>
            <h2 className="text-2xl font-semibold text-white">Recent Operations</h2>
          </div>
          <p className="text-sm text-slate-400">
            Logged in as <span className="text-white">{profile.full_name}</span>
          </p>
        </header>
        <p className="mt-4 text-sm text-slate-500">
          Hook Supabase Realtime feeds here to surface latest receipts, deliveries, transfers, and adjustments.
        </p>
      </section>
    </div>
  );
}

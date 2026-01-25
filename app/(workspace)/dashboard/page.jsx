import KpiGrid from "@/components/dashboard/KpiGrid";
import RealtimeFeed from "@/components/dashboard/RealtimeFeed";
import StockAlerts from "@/components/dashboard/StockAlerts";
import { fetchDashboardStats } from "@/lib/data/dashboard";

export const metadata = {
  title: "Dashboard | stockiq",
};

export default async function DashboardPage() {
  const { profile, kpis } = await fetchDashboardStats();

  return (
    <div className="space-y-6 lg:space-y-8">
      <KpiGrid stats={kpis} />

      <div className="grid gap-6 lg:gap-8 xl:grid-cols-3">
        <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-4 lg:p-6 xl:col-span-1">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">User Info</p>
              <h2 className="text-xl lg:text-2xl font-semibold text-white">Welcome Back!</h2>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-sm text-slate-400">
                Logged in as <span className="text-white font-medium block sm:inline">{profile.full_name}</span>
              </p>
              <p className="text-xs text-slate-500">
                Role: <span className="text-slate-300">{profile.role}</span>
              </p>
            </div>
          </header>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-300">Default Warehouse</span>
              <span className="text-sm text-white font-medium">
                {profile.default_warehouse_id ? 'Main Warehouse' : 'Not Set'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-300">Account Status</span>
              <span className={`text-sm font-medium ${
                profile.is_active ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {profile.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-slate-300">Email Verified</span>
              <span className={`text-sm font-medium ${
                profile.email_verified ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {profile.email_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-4 lg:p-6 xl:col-span-2">
          <RealtimeFeed />
        </section>
      </div>

      <StockAlerts />
    </div>
  );
}

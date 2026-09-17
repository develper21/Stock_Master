import PageHeader from "@/components/layout/PageHeader";
import ProfileForm from "@/components/profile/ProfileForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "My Profile | StockMaster",
};

export default async function ProfilePage() {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: warehouses = [] } = await supabase.from("warehouses").select("id, name").order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your contact info, login ID, and default warehouse preference."
      />
      <div className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Login ID" value={profile.login_id} />
          <InfoCard label="Role" value={profile.role.replace("_", " ")} />
        </div>
        <ProfileForm profile={profile} warehouses={warehouses} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white capitalize">{value || "—"}</p>
    </div>
  );
}

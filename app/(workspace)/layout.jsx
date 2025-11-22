import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StockRealtimeObserver from "@/components/realtime/StockRealtimeObserver";
import { getSessionAndProfile } from "@/lib/auth";

export default async function WorkspaceLayout({ children }) {
  const { profile } = await getSessionAndProfile({ redirectToLogin: true });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      <StockRealtimeObserver />
      <div className="hidden w-80 shrink-0 lg:block">
        <Sidebar profile={profile} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-20">
          <Header profile={profile} />
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-950/70 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

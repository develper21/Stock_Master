import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CustomRealtimeObserver from "@/components/realtime/CustomRealtimeObserver";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { getSessionAndProfile } from "@/lib/auth";

export default async function WorkspaceLayout({ children }) {
  const { profile } = await getSessionAndProfile({ redirectToLogin: true });

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
        <CustomRealtimeObserver />
        <div className="hidden w-80 shrink-0 lg:block">
          <Sidebar profile={profile} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-20">
            <Header profile={profile} />
          </div>
          <main className="flex-1 overflow-y-auto bg-slate-950/70 px-6 py-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

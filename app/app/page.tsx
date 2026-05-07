import SentinelHeader from "@/components/SentinelHeader";
import ActiveIncidents from "@/components/ActiveIncidents";
import ResolvedByClaude from "@/components/ResolvedByClaude";
import SystemHealth from "@/components/SystemHealth";
import ErrorLogFeed from "@/components/ErrorLogFeed";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">

      <SentinelHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">

        {/* Page title row */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Incident Overview
          </h1>
          <p className="text-sm text-slate-500">
            Real-time monitoring · Autonomous resolution by Claude
          </p>
        </div>

        {/* Three-column dashboard grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ActiveIncidents />
          <ResolvedByClaude />
          <SystemHealth />
        </div>

        {/* Full-width live error log feed */}
        <div className="mt-6">
          <ErrorLogFeed />
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800/60 pt-6 text-center">
          <p className="font-mono text-[11px] text-slate-700">
            PROJECT SENTINEL · Powered by Claude · All times UTC
          </p>
        </footer>

      </main>
    </div>
  );
}

type Severity = "CRITICAL" | "HIGH" | "MEDIUM";

interface Incident {
  id: string;
  component: string;
  description: string;
  severity: Severity;
  elapsed: string;
}

const INCIDENTS: Incident[] = [
  {
    id: "INC-2847",
    component: "API Gateway",
    description: "502 errors on /auth route cluster",
    severity: "CRITICAL",
    elapsed: "3m ago",
  },
  {
    id: "INC-2846",
    component: "Worker Node 3",
    description: "Memory utilisation at 94% — OOM risk",
    severity: "HIGH",
    elapsed: "11m ago",
  },
  {
    id: "INC-2844",
    component: "Auth Service",
    description: "Token refresh latency 8× above baseline",
    severity: "HIGH",
    elapsed: "29m ago",
  },
  {
    id: "INC-2841",
    component: "DB Connection Pool",
    description: "Max connections reached (200/200)",
    severity: "MEDIUM",
    elapsed: "1h 4m ago",
  },
];

const SEVERITY_STYLES: Record<Severity, string> = {
  CRITICAL: "bg-red-500/10 text-red-400 ring-1 ring-red-500/30",
  HIGH: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
};

const SEVERITY_DOT: Record<Severity, string> = {
  CRITICAL: "bg-red-400",
  HIGH: "bg-orange-400",
  MEDIUM: "bg-amber-400",
};

export default function ActiveIncidents() {
  return (
    <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">

      {/* Card header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {/* Pulsing red indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2 className="font-semibold text-slate-100">Active Incidents</h2>
        </div>
        {/* Count badge */}
        <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-red-400 ring-1 ring-red-500/30">
          {INCIDENTS.length}
        </span>
      </div>

      {/* Incident list */}
      <ul className="flex flex-col divide-y divide-slate-800/60">
        {INCIDENTS.map((inc) => (
          <li
            key={inc.id}
            className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-slate-800/30"
          >
            <div className="flex items-center justify-between gap-2">
              {/* ID */}
              <span className="font-mono text-xs font-semibold text-slate-400">
                {inc.id}
              </span>
              {/* Severity badge */}
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${SEVERITY_STYLES[inc.severity]}`}
              >
                {inc.severity}
              </span>
            </div>

            {/* Component name */}
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[inc.severity]}`} />
              <span className="text-sm font-medium text-slate-200">{inc.component}</span>
            </div>

            {/* Description + time */}
            <div className="flex items-end justify-between gap-2">
              <p className="text-xs leading-relaxed text-slate-500">{inc.description}</p>
              <span className="shrink-0 text-[11px] text-slate-600">{inc.elapsed}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Card footer */}
      <div className="mt-auto border-t border-slate-800 px-5 py-3">
        <p className="text-[11px] text-slate-600">
          Showing {INCIDENTS.length} unresolved incidents · Auto-refreshes every 30s
        </p>
      </div>

    </section>
  );
}

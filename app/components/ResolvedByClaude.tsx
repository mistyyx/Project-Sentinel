type ErrorType = "SyntaxError" | "TypeMismatch" | "LogicError";

interface Resolution {
  id: string;
  component: string;
  description: string;
  errorType: ErrorType;
  resolvedIn: string;
  resolvedAt: string;
}

const RESOLUTIONS: Resolution[] = [
  {
    id: "INC-2843",
    component: "Alert Dedup Engine",
    description: "Recursive loop in deduplication window calculation",
    errorType: "LogicError",
    resolvedIn: "34s",
    resolvedAt: "09:41",
  },
  {
    id: "INC-2840",
    component: "Nginx Proxy",
    description: "Syntax error in upstream config after deploy",
    errorType: "SyntaxError",
    resolvedIn: "12s",
    resolvedAt: "08:57",
  },
  {
    id: "INC-2838",
    component: "Severity Parser",
    description: "Incorrect boolean cast on severity threshold field",
    errorType: "TypeMismatch",
    resolvedIn: "8s",
    resolvedAt: "08:22",
  },
  {
    id: "INC-2835",
    component: "Metric Poller",
    description: "Memory leak in polling interval handler",
    errorType: "LogicError",
    resolvedIn: "41s",
    resolvedAt: "07:15",
  },
];

const ERROR_TYPE_STYLES: Record<ErrorType, string> = {
  SyntaxError: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30",
  TypeMismatch: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
  LogicError: "bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/30",
};

export default function ResolvedByClaude() {
  return (
    <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">

      {/* Card header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {/* Checkmark icon */}
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 text-emerald-400">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="font-semibold text-slate-100">Resolved by Claude</h2>
        </div>
        {/* Count badge */}
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
          {RESOLUTIONS.length} today
        </span>
      </div>

      {/* Resolution list */}
      <ul className="flex flex-col divide-y divide-slate-800/60">
        {RESOLUTIONS.map((res) => (
          <li
            key={res.id}
            className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-slate-800/30"
          >
            <div className="flex items-center justify-between gap-2">
              {/* ID */}
              <span className="font-mono text-xs font-semibold text-slate-400">
                {res.id}
              </span>
              {/* Error type badge */}
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${ERROR_TYPE_STYLES[res.errorType]}`}
              >
                {res.errorType}
              </span>
            </div>

            {/* Component + description */}
            <div className="flex items-start gap-2">
              {/* Green check dot */}
              <svg viewBox="0 0 10 10" fill="none" className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400">
                <path
                  d="M1.5 5l2.5 2.5 4.5-4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-200">{res.component}</p>
                <p className="text-xs leading-relaxed text-slate-500">{res.description}</p>
              </div>
            </div>

            {/* Timing row */}
            <div className="flex items-center gap-3 pl-5">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 text-slate-600">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M6 3.5v2.8l1.8 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>Fixed in <span className="font-mono font-semibold text-slate-400">{res.resolvedIn}</span></span>
              </div>
              <span className="text-slate-700">·</span>
              <span className="font-mono text-[11px] text-slate-600">{res.resolvedAt}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Card footer */}
      <div className="mt-auto border-t border-slate-800 px-5 py-3">
        <p className="text-[11px] text-slate-600">
          Avg resolution time:{" "}
          <span className="font-mono font-semibold text-slate-500">23.75s</span>
          {" "}· Claude autonomous mode
        </p>
      </div>

    </section>
  );
}

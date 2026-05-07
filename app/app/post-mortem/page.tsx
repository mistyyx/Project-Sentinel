import SentinelHeader from "@/components/SentinelHeader";

interface Incident {
  readonly id: string;
  readonly severity: "HIGH" | "MEDIUM";
  readonly errorType: "LogicError" | "TypeMismatch" | "SyntaxError";
  readonly module: string;
  readonly symptom: string;
  readonly rootCause: string;
  readonly fix: string;
  readonly recurrenceRisk: string;
  readonly eventCount: number;
}

interface TimelineEntry {
  readonly time: string;
  readonly event: string;
}

interface ActionItem {
  readonly id: number;
  readonly action: string;
  readonly owner: string;
  readonly status: "Open" | "Resolved";
}

const REPORT_DATE = "2026-05-07";
const REPORT_GENERATED = "2026-05-07T15:51:00Z";
const TOTAL_EVENTS = 345;
const WINDOW_MINUTES = 76;

const INCIDENTS: readonly Incident[] = [
  {
    id: "INC-2026-05-07-001",
    severity: "HIGH",
    errorType: "LogicError",
    module: "alert-dedup-engine.ts",
    symptom: 'Alert deduplication window produced a negative interval (-300ms).',
    rootCause:
      'calculateDedupWindow() computed endTime - startTime with no timestamp ordering check. Under clock-skew or chaos conditions where timestamps arrived inverted, the result was a negative interval that propagated silently downstream — no exception, no guard.',
    fix:
      'Added a pre-condition guard: if (endTime < startTime) throw new RangeError(…). Any inverted timestamp pair now fails loudly at the boundary rather than silently corrupting dedup logic.',
    recurrenceRisk: 'Low — guard is at the function entry point; no caller can bypass it.',
    eventCount: 116,
  },
  {
    id: "INC-2026-05-07-002",
    severity: "HIGH",
    errorType: "TypeMismatch",
    module: "severity-parser.ts",
    symptom: 'Expected type "number" but received "string" for field "severity".',
    rootCause:
      'Upstream service serialized the severity field as a JSON string (e.g. "3") instead of a number. Consumer code used the raw value directly, causing type violations and potential runtime arithmetic errors. Number(null) === 0 made a naive coerce-and-check approach silently unsafe for null inputs.',
    fix:
      'Introduced parseSeverity(value: unknown): number — a strict coercion and validation gate. It rejects null/undefined explicitly before coercion, validates isFinite(), and range-checks against [0, 5], throwing TypeError or RangeError with descriptive messages.',
    recurrenceRisk: 'Low — parsing is centralized; all call sites must go through parseSeverity().',
    eventCount: 118,
  },
  {
    id: "INC-2026-05-07-003",
    severity: "MEDIUM",
    errorType: "SyntaxError",
    module: "response-parser.ts",
    symptom: 'Unexpected token "<" at position 42 in response payload.',
    rootCause:
      'Upstream occasionally returned an HTML error page (502 gateway) instead of JSON. The client called response.json() unconditionally, hitting the < character of the HTML doctype and crashing with a confusing tokenizer error rather than a meaningful upstream failure.',
    fix:
      'Wrapped all JSON parsing in parseJsonResponse(response: Response): Promise<unknown>. It reads the Content-Type header before attempting to parse. If the type does not include application/json, it throws a descriptive SyntaxError with the actual content type.',
    recurrenceRisk: 'Low — fix is at the I/O boundary; any non-JSON upstream response is caught before reaching business logic.',
    eventCount: 111,
  },
];

const TIMELINE: readonly TimelineEntry[] = [
  { time: "14:34:17", event: "First error event logged by chaos monkey." },
  { time: "~14:34", event: "Dashboard entered CRITICAL state." },
  { time: "~14:35", event: "Sentinel Agent triggered; Resolution Protocol initiated." },
  { time: "~14:35", event: "incident-history.log checked — no prior failures found." },
  { time: "~14:36", event: "Three service files authored: alert-dedup-engine.ts, severity-parser.ts, response-parser.ts." },
  { time: "~14:36", event: "Three test suites written using node:test (zero external deps). tsc --noEmit passed with zero type errors." },
  { time: "~14:36", event: "Three entries appended to incident-history.log." },
  { time: "15:50:28", event: "System returned to HEALTHY." },
];

const LESSONS = [
  {
    heading: "Fail loudly at boundaries.",
    body: "All three bugs involved silent bad data flowing inward. The fix pattern in each case was identical: validate at the entry point, throw a typed error immediately.",
  },
  {
    heading: "Type coercion is not type safety.",
    body: "TypeMismatch existed because Number(value) was trusted without guarding against null, undefined, or non-numeric strings. Explicit guards beat implicit coercion.",
  },
  {
    heading: "Upstream contracts can't be assumed.",
    body: "The HTML-as-JSON bug is a recurring category across services. parseJsonResponse() should be adopted as the standard fetch wrapper across all upstream calls.",
  },
];

const ACTION_ITEMS: readonly ActionItem[] = [
  { id: 1, action: "Adopt parseJsonResponse() as the project-standard fetch wrapper", owner: "Engineering", status: "Open" },
  { id: 2, action: "Add clock-skew detection to the metrics pipeline to catch timestamp inversions before dedup logic", owner: "Infra", status: "Open" },
  { id: 3, action: "Enforce parseSeverity() at all upstream ingestion points via lint rule or schema validator", owner: "Engineering", status: "Open" },
];

const ERROR_TYPE_BADGE: Record<string, string> = {
  LogicError:  "bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/30",
  TypeMismatch: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
  SyntaxError: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30",
};

const SEVERITY_BADGE: Record<string, string> = {
  HIGH:   "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
};

const EVENT_BAR_COLOR: Record<string, string> = {
  TypeMismatch: "bg-sky-500",
  LogicError:   "bg-fuchsia-500",
  SyntaxError:  "bg-violet-500",
};

export default function PostMortemPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <SentinelHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">

        {/* Page title */}
        <div className="mb-8 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Incident Post-Mortem
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
              All Resolved
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {REPORT_DATE} · Authored by Claude (Sentinel Agent) · Generated {new Date(REPORT_GENERATED).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} UTC
          </p>
        </div>

        {/* Summary strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Current Status", value: "HEALTHY", valueClass: "text-emerald-400" },
            { label: "Total Events", value: String(TOTAL_EVENTS), valueClass: "text-slate-100" },
            { label: "Disruption Window", value: `${WINDOW_MINUTES} min`, valueClass: "text-slate-100" },
            { label: "Incidents Resolved", value: String(INCIDENTS.length), valueClass: "text-slate-100" },
          ].map(({ label, value, valueClass }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
              <p className={`font-mono text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Event volume */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-100">Event Volume by Error Type</h2>
          <div className="space-y-3">
            {INCIDENTS.map((inc) => {
              const pct = Math.round((inc.eventCount / TOTAL_EVENTS) * 100);
              return (
                <div key={inc.errorType} className="flex items-center gap-4">
                  <span className={`w-28 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-bold uppercase tracking-wide ${ERROR_TYPE_BADGE[inc.errorType]}`}>
                    {inc.errorType}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${EVENT_BAR_COLOR[inc.errorType]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-slate-400">
                    {inc.eventCount} <span className="text-slate-600">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Incident cards */}
        <div className="mb-6 space-y-4">
          {INCIDENTS.map((inc) => (
            <section key={inc.id} className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">

              {/* Card header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-5 py-4">
                <span className="font-mono text-xs font-semibold text-slate-500">{inc.id}</span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${SEVERITY_BADGE[inc.severity]}`}>
                  {inc.severity}
                </span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${ERROR_TYPE_BADGE[inc.errorType]}`}>
                  {inc.errorType}
                </span>
                <span className="font-mono text-xs text-slate-400">{inc.module}</span>
                <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                  Resolved
                </span>
              </div>

              {/* Card body */}
              <div className="grid gap-px bg-slate-800 sm:grid-cols-2">
                {[
                  { label: "Symptom", text: inc.symptom },
                  { label: "Root Cause", text: inc.rootCause },
                  { label: "Fix Applied", text: inc.fix },
                  { label: "Recurrence Risk", text: inc.recurrenceRisk },
                ].map(({ label, text }) => (
                  <div key={label} className="bg-slate-900 px-5 py-4">
                    <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {label}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-300">{text}</p>
                  </div>
                ))}
              </div>

            </section>
          ))}
        </div>

        {/* Timeline + Lessons grid */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* Timeline */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-100">Timeline of Events</h2>
            <ol className="space-y-3">
              {TIMELINE.map((entry, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-indigo-400 pt-0.5">
                    {entry.time}
                  </span>
                  <div className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500/60 ring-2 ring-indigo-500/20" />
                      {idx < TIMELINE.length - 1 && (
                        <span className="mt-1 flex-1 w-px bg-slate-800" />
                      )}
                    </div>
                    <p className="pb-3 text-sm text-slate-400">{entry.event}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Lessons learned */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-100">Lessons Learned</h2>
            <div className="space-y-4">
              {LESSONS.map((lesson, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 font-mono text-[10px] font-bold text-indigo-400 ring-1 ring-indigo-500/25">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{lesson.heading}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{lesson.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Action items */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-100">Action Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-2 pr-4 text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">#</th>
                <th className="pb-2 pr-4 text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">Action</th>
                <th className="pb-2 pr-4 text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">Owner</th>
                <th className="pb-2 text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ACTION_ITEMS.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">{item.id}</td>
                  <td className="py-3 pr-4 text-slate-300">{item.action}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-400">{item.owner}</td>
                  <td className="py-3">
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                      item.status === "Resolved"
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-12 border-t border-slate-800/60 pt-6 text-center">
          <p className="font-mono text-[11px] text-slate-700">
            PROJECT SENTINEL · Post-Mortem {REPORT_DATE} · Powered by Claude · All times UTC
          </p>
        </footer>

      </main>
    </div>
  );
}

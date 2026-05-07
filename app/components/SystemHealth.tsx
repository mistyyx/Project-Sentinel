"use client";

import { useEffect, useState, useCallback } from "react";

type SystemStatus = "HEALTHY" | "CRITICAL" | "UNKNOWN";

interface StatusPayload {
  status: SystemStatus;
  updatedAt: string;
  activeError: string | null;
}

// Colour tokens for each status variant
const STATUS_CONFIG: Record<
  SystemStatus,
  {
    label: string;
    textColor: string;
    bgRing: string;
    pingColor: string;
    dotColor: string;
    cardGlow: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    icon: React.ReactNode;
  }
> = {
  HEALTHY: {
    label: "HEALTHY",
    textColor: "text-emerald-400",
    bgRing: "bg-emerald-500/10",
    pingColor: "bg-emerald-400",
    dotColor: "bg-emerald-400",
    cardGlow: "shadow-emerald-500/10 ring-emerald-500/20",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    badgeBorder: "ring-emerald-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-400">
        <path d="M12 2L4 6v5c0 4.8 3.6 9.1 8 10 4.4-.9 8-5.2 8-10V6L12 2z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  CRITICAL: {
    label: "CRITICAL",
    textColor: "text-red-400",
    bgRing: "bg-red-500/10",
    pingColor: "bg-red-400",
    dotColor: "bg-red-500",
    cardGlow: "shadow-red-500/20 ring-red-500/30",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-400",
    badgeBorder: "ring-red-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-red-400">
        <path d="M12 2L4 6v5c0 4.8 3.6 9.1 8 10 4.4-.9 8-5.2 8-10V6L12 2z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  UNKNOWN: {
    label: "UNKNOWN",
    textColor: "text-slate-400",
    bgRing: "bg-slate-500/10",
    pingColor: "bg-slate-400",
    dotColor: "bg-slate-500",
    cardGlow: "",
    badgeBg: "bg-slate-500/10",
    badgeText: "text-slate-400",
    badgeBorder: "ring-slate-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-slate-400">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
};

function formatUpdatedAt(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

export default function SystemHealth() {
  const [data, setData] = useState<StatusPayload>({
    status: "UNKNOWN",
    updatedAt: "",
    activeError: null,
  });
  const [loading, setLoading] = useState(true);
  // Flicker the refresh dot briefly when data updates
  const [refreshFlash, setRefreshFlash] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const json: StatusPayload = await res.json();
      setData(json);
      setRefreshFlash(true);
      setTimeout(() => setRefreshFlash(false), 400);
    } catch {
      setData((prev) => ({ ...prev, status: "UNKNOWN" }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [poll]);

  const cfg = STATUS_CONFIG[data.status];

  return (
    <section
      className={`flex flex-col rounded-xl border bg-slate-900 shadow-xl transition-shadow duration-500 ${
        data.status === "CRITICAL"
          ? "border-red-500/40 shadow-red-500/10 ring-1 ring-red-500/20"
          : data.status === "HEALTHY"
          ? "border-emerald-500/30 shadow-emerald-500/5"
          : "border-slate-800"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h2 className="font-semibold text-slate-100">System Health</h2>
        <div className="flex items-center gap-1.5">
          {/* Refresh flash dot */}
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
              refreshFlash ? "bg-sky-400" : "bg-slate-700"
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Live · 3s
          </span>
        </div>
      </div>

      {/* Status display — centre stage */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-10">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 animate-pulse rounded-full bg-slate-800" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
          </div>
        ) : (
          <>
            {/* Pulsing ring + icon */}
            <div className="relative flex items-center justify-center">
              {/* Outer ping ring — only animate when CRITICAL */}
              {data.status === "CRITICAL" && (
                <span className="absolute inline-flex h-28 w-28 animate-ping rounded-full bg-red-400 opacity-10" />
              )}
              {/* Middle glowing ring */}
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full ring-2 transition-all duration-500 ${cfg.bgRing} ${
                  data.status === "CRITICAL" ? "ring-red-500/40" : "ring-emerald-500/30"
                }`}
              >
                {/* Inner icon */}
                {cfg.icon}
              </div>
            </div>

            {/* Status text */}
            <div className="flex flex-col items-center gap-1">
              <span
                className={`font-mono text-3xl font-black tracking-widest transition-colors duration-300 ${cfg.textColor}`}
              >
                {data.status}
              </span>

              {/* Active error type badge */}
              {data.activeError ? (
                <span
                  className={`mt-1 rounded-full px-3 py-1 font-mono text-xs font-bold ring-1 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                >
                  {data.activeError}
                </span>
              ) : (
                <span className="mt-1 font-mono text-xs text-slate-600">
                  No active errors
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-800" />

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 px-0 py-4">
        {[
          { label: "Uptime", value: "99.97%" },
          { label: "Response", value: "142ms" },
          { label: "Checks", value: "1,924" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 px-4">
            <span className="font-mono text-sm font-semibold text-slate-200">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Card footer — last updated */}
      <div className="border-t border-slate-800 px-5 py-3">
        <p className="text-[11px] text-slate-600">
          Last read:{" "}
          <span className="font-mono text-slate-500">
            {formatUpdatedAt(data.updatedAt)}
          </span>
          {" "}· Reads <code className="text-slate-600">/services/status.json</code>
        </p>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
}

interface FeedResponse {
  entries: LogEntry[];
  total: number;
}

const ERROR_TYPE_STYLES: Record<string, { badge: string; row: string }> = {
  SyntaxError: {
    badge: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/30",
    row: "hover:bg-violet-500/5",
  },
  TypeMismatch: {
    badge: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30",
    row: "hover:bg-sky-500/5",
  },
  LogicError: {
    badge: "bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/30",
    row: "hover:bg-fuchsia-500/5",
  },
};

const FALLBACK_STYLE = {
  badge: "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30",
  row: "hover:bg-slate-800/40",
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function ErrorLogFeed() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // track how many entries existed on the last poll to detect additions
  const prevLengthRef = useRef(0);
  const newCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    if (isPaused) return;
    try {
      const res = await fetch("/api/errors", { cache: "no-store" });
      const data: FeedResponse = await res.json();

      const diff = data.entries.length - prevLengthRef.current;
      if (diff > 0) {
        // Clear any running flash timer before starting a new one
        if (newCountTimerRef.current) clearTimeout(newCountTimerRef.current);
        setNewCount(diff);
        newCountTimerRef.current = setTimeout(() => setNewCount(0), 900);
      }
      prevLengthRef.current = data.entries.length;

      setEntries(data.entries);
      setTotal(data.total);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, [isPaused]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      clearInterval(id);
      if (newCountTimerRef.current) clearTimeout(newCountTimerRef.current);
    };
  }, [poll]);

  const isEmpty = entries.length === 0;

  return (
    <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/20">

      {/* Card header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {/* Terminal icon */}
          <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800">
            <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 text-slate-400">
              <path d="M2 4l3 3-3 3M7 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-semibold text-slate-100">Live Error Log</h2>
          {/* Entry count badge */}
          {total > 0 && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
              {total} entries
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* New-entry flash badge */}
          {newCount > 0 && (
            <span className="animate-pulse rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">
              +{newCount} new
            </span>
          )}

          {/* Pause / resume toggle */}
          <button
            onClick={() => setIsPaused((p) => !p)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
              isPaused
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 hover:bg-amber-500/20"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            {isPaused ? (
              <>
                <svg viewBox="0 0 10 10" fill="currentColor" className="h-2.5 w-2.5">
                  <path d="M2 2l6 3-6 3V2z" />
                </svg>
                RESUME
              </>
            ) : (
              <>
                <svg viewBox="0 0 10 10" fill="currentColor" className="h-2.5 w-2.5">
                  <rect x="1.5" y="1.5" width="2.5" height="7" rx="0.5" />
                  <rect x="6" y="1.5" width="2.5" height="7" rx="0.5" />
                </svg>
                PAUSE
              </>
            )}
          </button>

          {/* Live / paused indicator */}
          <div className="flex items-center gap-1.5">
            {isPaused ? (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            ) : (
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
              </span>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {isPaused ? "Paused" : "Live · 3s"}
            </span>
          </div>
        </div>
      </div>

      {/* Log body */}
      <div className="h-80 overflow-y-auto font-mono text-xs leading-relaxed">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center gap-2 text-slate-600">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 8.5l2 2 3-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            No errors logged
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {entries.map((entry, idx) => {
                const style = ERROR_TYPE_STYLES[entry.errorType] ?? FALLBACK_STYLE;
                const isNew = idx < newCount;
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-slate-800/50 transition-colors ${style.row} ${
                      isNew ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="whitespace-nowrap py-2 pl-5 pr-4 text-slate-600">
                      {formatTimestamp(entry.timestamp)}
                    </td>

                    {/* Error type badge */}
                    <td className="whitespace-nowrap py-2 pr-4">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
                        {entry.errorType}
                      </span>
                    </td>

                    {/* Message */}
                    <td className="py-2 pr-5 text-slate-400">
                      {entry.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
        <p className="text-[11px] text-slate-600">
          Reads <code className="text-slate-700">/services/error.log</code> · Last {Math.min(total, 60)} of {total} entries shown
        </p>
        <div className="flex gap-3 font-mono text-[10px] text-slate-600">
          {(["SyntaxError", "TypeMismatch", "LogicError"] as const).map((type) => {
            const count = entries.filter((e) => e.errorType === type).length;
            const s = ERROR_TYPE_STYLES[type];
            return (
              <span key={type} className={`rounded px-1.5 py-0.5 ${s.badge}`}>
                {type} · {count}
              </span>
            );
          })}
        </div>
      </div>

    </section>
  );
}

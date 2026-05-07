"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/post-mortem", label: "Post-Mortem" },
] as const;

export default function SentinelHeader() {
  const [time, setTime] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Left — Logo + wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-indigo-400"
            >
              <path d="M12 2L4 6v5c0 4.8 3.6 9.1 8 10 4.4-.9 8-5.2 8-10V6L12 2z" />
            </svg>
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Project
            </p>
            <p className="font-mono text-base font-bold leading-none tracking-wider text-slate-100">
              SENTINEL
            </p>
          </div>
        </div>

        {/* Center — Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right — Live clock + status pill */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm tabular-nums text-slate-400">
            {time}
          </span>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Monitoring Active
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}

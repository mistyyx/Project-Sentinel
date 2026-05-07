import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const LOG_LINE_RE = /^\[([^\]]+)\] \[([^\]]+)\] (.+)$/;
const MAX_ENTRIES = 60;

export interface LogEntry {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
}

export async function GET() {
  const logPath = path.resolve(process.cwd(), "..", "services", "error.log");

  try {
    const raw = fs.readFileSync(logPath, "utf8");

    const entries: LogEntry[] = raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line): LogEntry | null => {
        const match = LOG_LINE_RE.exec(line);
        if (!match) return null;
        const [, timestamp, errorType, message] = match;
        return { id: timestamp, timestamp, errorType, message };
      })
      .filter((e): e is LogEntry => e !== null)
      .slice(-MAX_ENTRIES)   // keep last N
      .reverse();             // newest first

    return NextResponse.json({ entries, total: entries.length });
  } catch {
    return NextResponse.json({ entries: [], total: 0 });
  }
}

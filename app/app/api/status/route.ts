import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Never cache — every request reads the file fresh from disk
export const dynamic = "force-dynamic";

export async function GET() {
  // process.cwd() is the Next.js project root (/app), so ../services resolves correctly
  const statusPath = path.resolve(process.cwd(), "..", "services", "status.json");

  try {
    const raw = fs.readFileSync(statusPath, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    // Return a safe fallback if the file doesn't exist yet or can't be parsed
    return NextResponse.json({
      status: "UNKNOWN",
      updatedAt: new Date().toISOString(),
      activeError: null,
    });
  }
}

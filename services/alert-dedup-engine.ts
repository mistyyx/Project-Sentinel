export interface DedupWindow {
  startTime: number;
  endTime: number;
  intervalMs: number;
}

export const MINIMUM_INTERVAL_MS = 0;

export function calculateDedupWindow(startTime: number, endTime: number): DedupWindow {
  if (endTime < startTime) {
    throw new RangeError(
      `Dedup window endTime (${endTime}) must be >= startTime (${startTime})`
    );
  }
  return { startTime, endTime, intervalMs: endTime - startTime };
}

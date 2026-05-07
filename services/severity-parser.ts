export const SEVERITY_MIN = 0;
export const SEVERITY_MAX = 5;

export function parseSeverity(value: unknown): number {
  if (value === null || value === undefined) {
    throw new TypeError(
      `Expected a finite number for severity, received: ${String(value)}`
    );
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new TypeError(
      `Expected a finite number for severity, received: ${String(value)}`
    );
  }
  if (n < SEVERITY_MIN || n > SEVERITY_MAX) {
    throw new RangeError(
      `Severity ${n} is out of range [${SEVERITY_MIN}, ${SEVERITY_MAX}]`
    );
  }
  return n;
}

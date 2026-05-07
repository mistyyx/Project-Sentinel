import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateDedupWindow } from "../alert-dedup-engine";

describe("calculateDedupWindow", () => {
  it("returns correct interval for valid window", () => {
    const result = calculateDedupWindow(1000, 1300);
    assert.equal(result.intervalMs, 300);
    assert.equal(result.startTime, 1000);
    assert.equal(result.endTime, 1300);
  });

  it("returns zero interval when times are equal", () => {
    const result = calculateDedupWindow(1000, 1000);
    assert.equal(result.intervalMs, 0);
  });

  it("throws RangeError when endTime < startTime", () => {
    assert.throws(
      () => calculateDedupWindow(1300, 1000),
      RangeError
    );
  });

  it("RangeError message includes both timestamps", () => {
    assert.throws(
      () => calculateDedupWindow(1300, 1000),
      (err: unknown) => {
        assert.ok(err instanceof RangeError);
        const rangeErr = err as RangeError;
        assert.ok(rangeErr.message.includes("1000"));
        assert.ok(rangeErr.message.includes("1300"));
        return true;
      }
    );
  });
});

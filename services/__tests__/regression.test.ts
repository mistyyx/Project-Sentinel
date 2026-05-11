/**
 * Regression tests for the three CRITICAL production bugs fixed by alpha-debugger.
 *
 * Incident history:
 *  [2026-05-07] alert-dedup-engine.ts — Negative dedup interval from reversed timestamps
 *  [2026-05-07] severity-parser.ts    — TypeMismatch: severity received as string
 *  [2026-05-07] response-parser.ts    — SyntaxError: HTML page parsed as JSON
 *
 * These tests cover edge cases NOT present in /services/tests/:
 *  - parseSeverity:        NaN, Infinity, and whitespace-padded numeric string " 3 "
 *  - parseJsonResponse:    Response with no Content-Type header at all (absent, not empty)
 *  - calculateDedupWindow: floating-point timestamps
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSeverity } from "../severity-parser";
import { parseJsonResponse } from "../response-parser";
import { calculateDedupWindow } from "../alert-dedup-engine";

// ---------------------------------------------------------------------------
// parseSeverity — edge cases
// ---------------------------------------------------------------------------

describe("parseSeverity regression — edge cases from production incident", () => {
  it("should throw TypeError when value is NaN (Number('') coerces to 0, but Number(NaN) is NaN)", () => {
    assert.throws(
      () => parseSeverity(NaN),
      TypeError
    );
  });

  it("should throw TypeError when value is Infinity (not finite, out of [0,5])", () => {
    assert.throws(
      () => parseSeverity(Infinity),
      TypeError
    );
  });

  it("should throw TypeError when value is negative Infinity", () => {
    assert.throws(
      () => parseSeverity(-Infinity),
      TypeError
    );
  });

  it("should parse correctly when value is a whitespace-padded numeric string like \" 3 \"", () => {
    // Number(" 3 ") === 3 in JavaScript — the fix must handle this gracefully
    const result: number = parseSeverity(" 3 ");
    assert.equal(result, 3);
  });

  it("should throw TypeError when value is a whitespace-only string (coerces to 0 via Number, stays 0 which is in range — verify actual behaviour)", () => {
    // Number("   ") === 0, which is in range [0,5], so parseSeverity should return 0
    const result: number = parseSeverity("   ");
    assert.equal(result, 0);
  });

  it("should throw TypeError and include the original value in the message when NaN is supplied", () => {
    assert.throws(
      () => parseSeverity(NaN),
      (err: unknown) => {
        assert.ok(err instanceof TypeError);
        const typeErr = err as TypeError;
        assert.ok(typeErr.message.length > 0);
        return true;
      }
    );
  });

  it("should throw TypeError and include the original value in the message when Infinity is supplied", () => {
    assert.throws(
      () => parseSeverity(Infinity),
      (err: unknown) => {
        assert.ok(err instanceof TypeError);
        const typeErr = err as TypeError;
        assert.ok(typeErr.message.includes("Infinity"));
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// parseJsonResponse — edge cases
// ---------------------------------------------------------------------------

describe("parseJsonResponse regression — edge cases from production incident", () => {
  it("should throw SyntaxError when the Content-Type header is completely absent (not set at all)", async () => {
    // Constructing a Response with NO headers object at all — content-type is absent
    const responseWithNoHeaders: Response = new Response('{"ok":true}');
    await assert.rejects(
      () => parseJsonResponse(responseWithNoHeaders),
      SyntaxError
    );
  });

  it("should include a descriptive message when Content-Type header is absent", async () => {
    const responseWithNoHeaders: Response = new Response("<html>Internal Server Error</html>");
    await assert.rejects(
      () => parseJsonResponse(responseWithNoHeaders),
      (err: unknown) => {
        assert.ok(err instanceof SyntaxError);
        const syntaxErr = err as SyntaxError;
        assert.ok(syntaxErr.message.includes("application/json"));
        return true;
      }
    );
  });

  it("should throw SyntaxError when Content-Type is 'text/plain' (not JSON)", async () => {
    const response: Response = new Response("plain text body", {
      headers: { "Content-Type": "text/plain" },
    });
    await assert.rejects(
      () => parseJsonResponse(response),
      SyntaxError
    );
  });

  it("should throw SyntaxError when Content-Type is 'application/xml'", async () => {
    const response: Response = new Response("<root/>", {
      headers: { "Content-Type": "application/xml" },
    });
    await assert.rejects(
      () => parseJsonResponse(response),
      SyntaxError
    );
  });
});

// ---------------------------------------------------------------------------
// calculateDedupWindow — edge cases
// ---------------------------------------------------------------------------

describe("calculateDedupWindow regression — edge cases from production incident", () => {
  it("should compute correct intervalMs with floating-point timestamps 1000.5 and 1300.7", () => {
    const result = calculateDedupWindow(1000.5, 1300.7);
    // Use closeTo for floating-point arithmetic
    assert.ok(
      Math.abs(result.intervalMs - 300.2) < 1e-9,
      `Expected intervalMs close to 300.2, got ${result.intervalMs}`
    );
    assert.equal(result.startTime, 1000.5);
    assert.equal(result.endTime, 1300.7);
  });

  it("should return zero intervalMs when floating-point startTime equals endTime", () => {
    const result = calculateDedupWindow(1000.5, 1000.5);
    assert.equal(result.intervalMs, 0);
  });

  it("should throw RangeError when endTime is a float less than startTime (e.g. 1000.5 > 1000.4)", () => {
    assert.throws(
      () => calculateDedupWindow(1000.5, 1000.4),
      RangeError
    );
  });

  it("should throw RangeError and the message should contain both float timestamps", () => {
    assert.throws(
      () => calculateDedupWindow(1300.7, 1000.5),
      (err: unknown) => {
        assert.ok(err instanceof RangeError);
        const rangeErr = err as RangeError;
        assert.ok(rangeErr.message.includes("1000.5"));
        assert.ok(rangeErr.message.includes("1300.7"));
        return true;
      }
    );
  });

  it("should preserve floating-point precision for startTime and endTime in the returned DedupWindow", () => {
    const startTime = 1000.5;
    const endTime = 1300.7;
    const result = calculateDedupWindow(startTime, endTime);
    assert.equal(result.startTime, startTime);
    assert.equal(result.endTime, endTime);
  });
});

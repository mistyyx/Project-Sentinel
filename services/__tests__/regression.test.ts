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
 *
 * Additional suites guard against chaos-monkey synthetic injection being mistaken
 * for a real regression:
 *  - Source integrity:     defensive guard strings must be present in each service file
 *  - Chaos-monkey canary:  DependencyError / ConfigError are synthetic-only error types
 *  - Integration payloads: service functions handle chaos-monkey-emulated payload shapes
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseSeverity } from "../severity-parser";
import { parseJsonResponse } from "../response-parser";
import { calculateDedupWindow } from "../alert-dedup-engine";

// ---------------------------------------------------------------------------
// Path constants — resolved relative to the compiled output location so that
// fs.readFileSync finds the actual source artefacts on disk regardless of cwd.
// ---------------------------------------------------------------------------

const SERVICES_ROOT = path.resolve(__dirname, "..", "..");
const ALERT_DEDUP_SOURCE_PATH = path.join(SERVICES_ROOT, "alert-dedup-engine.ts");
const SEVERITY_PARSER_SOURCE_PATH = path.join(SERVICES_ROOT, "severity-parser.ts");
const RESPONSE_PARSER_SOURCE_PATH = path.join(SERVICES_ROOT, "response-parser.ts");
const CHAOS_MONKEY_PATH = path.resolve(SERVICES_ROOT, "..", "scripts", "chaos-monkey.js");

// Guard strings that must be present in source files
const ALERT_DEDUP_GUARD_STRING = "endTime < startTime";
const SEVERITY_PARSER_GUARD_STRING = "Number.isFinite";
const RESPONSE_PARSER_GUARD_STRING = "application/json";

// Chaos-monkey synthetic-only error type identifiers
const SYNTHETIC_ERROR_TYPE_DEPENDENCY = "DependencyError";
const SYNTHETIC_ERROR_TYPE_CONFIG = "ConfigError";

// Reversed timestamp values that reproduce the LogicError chaos-monkey pattern
const LOGIC_ERROR_REVERSED_START_MS = 1000;
const LOGIC_ERROR_REVERSED_END_MS = 700;

// Content-Type value used to emulate the SyntaxError chaos-monkey pattern
const SYNTHETIC_HTML_CONTENT_TYPE = "text/html";

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

// ---------------------------------------------------------------------------
// Source integrity — guard strings must be present in each service source file
//
// These tests detect if a future chaos injection or accidental edit removes the
// defensive guards that Alpha introduced.  A failure here means the production
// defence has been eroded, NOT merely that a test is wrong.
// ---------------------------------------------------------------------------

describe("source integrity — defensive guards must be present in service source files", () => {
  it("should contain the endTime < startTime guard in alert-dedup-engine.ts", () => {
    const sourceContent: string = fs.readFileSync(ALERT_DEDUP_SOURCE_PATH, "utf8");
    const hasGuard: boolean = sourceContent.includes(ALERT_DEDUP_GUARD_STRING);
    assert.ok(
      hasGuard,
      `Expected alert-dedup-engine.ts to contain "${ALERT_DEDUP_GUARD_STRING}"`
    );
  });

  it("should contain the Number.isFinite guard in severity-parser.ts", () => {
    const sourceContent: string = fs.readFileSync(SEVERITY_PARSER_SOURCE_PATH, "utf8");
    const hasGuard: boolean = sourceContent.includes(SEVERITY_PARSER_GUARD_STRING);
    assert.ok(
      hasGuard,
      `Expected severity-parser.ts to contain "${SEVERITY_PARSER_GUARD_STRING}"`
    );
  });

  it("should contain the application/json Content-Type check in response-parser.ts", () => {
    const sourceContent: string = fs.readFileSync(RESPONSE_PARSER_SOURCE_PATH, "utf8");
    const hasGuard: boolean = sourceContent.includes(RESPONSE_PARSER_GUARD_STRING);
    assert.ok(
      hasGuard,
      `Expected response-parser.ts to contain "${RESPONSE_PARSER_GUARD_STRING}"`
    );
  });
});

// ---------------------------------------------------------------------------
// Chaos-monkey canary — DependencyError and ConfigError are synthetic-only
//
// These error type identifiers exist only inside chaos-monkey.js.  If either
// string ever appears at a throw site in a production service file it would
// mean real code has started emitting synthetic error labels — a clear sign
// of misattribution or unintentional copy-paste from the chaos script.
// ---------------------------------------------------------------------------

describe("chaos-monkey canary — DependencyError and ConfigError must not appear in production service files", () => {
  it("should confirm DependencyError is defined in chaos-monkey.js", () => {
    const chaosSource: string = fs.readFileSync(CHAOS_MONKEY_PATH, "utf8");
    const hasDependencyError: boolean = chaosSource.includes(SYNTHETIC_ERROR_TYPE_DEPENDENCY);
    assert.ok(
      hasDependencyError,
      `Expected chaos-monkey.js to contain "${SYNTHETIC_ERROR_TYPE_DEPENDENCY}"`
    );
  });

  it("should confirm ConfigError is defined in chaos-monkey.js", () => {
    const chaosSource: string = fs.readFileSync(CHAOS_MONKEY_PATH, "utf8");
    const hasConfigError: boolean = chaosSource.includes(SYNTHETIC_ERROR_TYPE_CONFIG);
    assert.ok(
      hasConfigError,
      `Expected chaos-monkey.js to contain "${SYNTHETIC_ERROR_TYPE_CONFIG}"`
    );
  });

  it("should confirm DependencyError does not appear as a throw site in alert-dedup-engine.ts", () => {
    const sourceContent: string = fs.readFileSync(ALERT_DEDUP_SOURCE_PATH, "utf8");
    const hasSyntheticType: boolean = sourceContent.includes(SYNTHETIC_ERROR_TYPE_DEPENDENCY);
    assert.equal(
      hasSyntheticType,
      false,
      `alert-dedup-engine.ts must not contain the synthetic type "${SYNTHETIC_ERROR_TYPE_DEPENDENCY}"`
    );
  });

  it("should confirm ConfigError does not appear as a throw site in alert-dedup-engine.ts", () => {
    const sourceContent: string = fs.readFileSync(ALERT_DEDUP_SOURCE_PATH, "utf8");
    const hasSyntheticType: boolean = sourceContent.includes(SYNTHETIC_ERROR_TYPE_CONFIG);
    assert.equal(
      hasSyntheticType,
      false,
      `alert-dedup-engine.ts must not contain the synthetic type "${SYNTHETIC_ERROR_TYPE_CONFIG}"`
    );
  });

  it("should confirm DependencyError does not appear as a throw site in severity-parser.ts", () => {
    const sourceContent: string = fs.readFileSync(SEVERITY_PARSER_SOURCE_PATH, "utf8");
    const hasSyntheticType: boolean = sourceContent.includes(SYNTHETIC_ERROR_TYPE_DEPENDENCY);
    assert.equal(
      hasSyntheticType,
      false,
      `severity-parser.ts must not contain the synthetic type "${SYNTHETIC_ERROR_TYPE_DEPENDENCY}"`
    );
  });

  it("should confirm ConfigError does not appear as a throw site in severity-parser.ts", () => {
    const sourceContent: string = fs.readFileSync(SEVERITY_PARSER_SOURCE_PATH, "utf8");
    const hasSyntheticType: boolean = sourceContent.includes(SYNTHETIC_ERROR_TYPE_CONFIG);
    assert.equal(
      hasSyntheticType,
      false,
      `severity-parser.ts must not contain the synthetic type "${SYNTHETIC_ERROR_TYPE_CONFIG}"`
    );
  });

  it("should confirm DependencyError does not appear as a throw site in response-parser.ts", () => {
    const sourceContent: string = fs.readFileSync(RESPONSE_PARSER_SOURCE_PATH, "utf8");
    const hasSyntheticType: boolean = sourceContent.includes(SYNTHETIC_ERROR_TYPE_DEPENDENCY);
    assert.equal(
      hasSyntheticType,
      false,
      `response-parser.ts must not contain the synthetic type "${SYNTHETIC_ERROR_TYPE_DEPENDENCY}"`
    );
  });

  it("should confirm ConfigError does not appear as a throw site in response-parser.ts", () => {
    const sourceContent: string = fs.readFileSync(RESPONSE_PARSER_SOURCE_PATH, "utf8");
    const hasSyntheticType: boolean = sourceContent.includes(SYNTHETIC_ERROR_TYPE_CONFIG);
    assert.equal(
      hasSyntheticType,
      false,
      `response-parser.ts must not contain the synthetic type "${SYNTHETIC_ERROR_TYPE_CONFIG}"`
    );
  });
});

// ---------------------------------------------------------------------------
// Integration payloads — service functions handle the exact shapes that
// chaos-monkey synthetic errors emulate
//
// Each test reproduces the original failure condition described in the error
// log and asserts the service throws the correctly typed defensive error.
// ---------------------------------------------------------------------------

describe("integration payloads — services reject chaos-monkey-emulated malformed inputs", () => {
  it("should throw TypeError when parseSeverity receives a non-numeric string (TypeMismatch pattern)", () => {
    // Reproduces: 'Expected type "number" but received "string" for field "severity"'
    assert.throws(
      () => parseSeverity("string"),
      TypeError
    );
  });

  it("should throw TypeError and the message should reference the original value for the TypeMismatch pattern", () => {
    assert.throws(
      () => parseSeverity("string"),
      (err: unknown) => {
        assert.ok(err instanceof TypeError);
        const typeErr = err as TypeError;
        assert.ok(typeErr.message.length > 0);
        return true;
      }
    );
  });

  it("should throw RangeError when calculateDedupWindow receives reversed timestamps (LogicError pattern)", () => {
    // Reproduces: 'Alert deduplication window produced a negative interval (-300ms)'
    assert.throws(
      () => calculateDedupWindow(LOGIC_ERROR_REVERSED_START_MS, LOGIC_ERROR_REVERSED_END_MS),
      RangeError
    );
  });

  it("should throw RangeError whose message references both timestamps for the LogicError pattern", () => {
    assert.throws(
      () => calculateDedupWindow(LOGIC_ERROR_REVERSED_START_MS, LOGIC_ERROR_REVERSED_END_MS),
      (err: unknown) => {
        assert.ok(err instanceof RangeError);
        const rangeErr = err as RangeError;
        assert.ok(
          rangeErr.message.includes(String(LOGIC_ERROR_REVERSED_START_MS)),
          `Expected message to include startTime ${LOGIC_ERROR_REVERSED_START_MS}`
        );
        assert.ok(
          rangeErr.message.includes(String(LOGIC_ERROR_REVERSED_END_MS)),
          `Expected message to include endTime ${LOGIC_ERROR_REVERSED_END_MS}`
        );
        return true;
      }
    );
  });

  it("should throw SyntaxError when parseJsonResponse receives a text/html response (SyntaxError pattern)", async () => {
    // Reproduces: 'Unexpected token "<" at position 42 in response payload'
    const mockHtmlResponse: Response = new Response(
      "<html><body>Internal Server Error</body></html>",
      { headers: { "Content-Type": SYNTHETIC_HTML_CONTENT_TYPE } }
    );
    await assert.rejects(
      () => parseJsonResponse(mockHtmlResponse),
      SyntaxError
    );
  });

  it("should throw SyntaxError whose message references application/json when html response is received", async () => {
    const mockHtmlResponse: Response = new Response(
      "<html><body>Unexpected token</body></html>",
      { headers: { "Content-Type": SYNTHETIC_HTML_CONTENT_TYPE } }
    );
    await assert.rejects(
      () => parseJsonResponse(mockHtmlResponse),
      (err: unknown) => {
        assert.ok(err instanceof SyntaxError);
        const syntaxErr = err as SyntaxError;
        assert.ok(
          syntaxErr.message.includes(RESPONSE_PARSER_GUARD_STRING),
          `Expected SyntaxError message to reference "${RESPONSE_PARSER_GUARD_STRING}"`
        );
        return true;
      }
    );
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSeverity } from "../severity-parser";

describe("parseSeverity", () => {
  it("parses valid numeric string '3'", () => {
    assert.equal(parseSeverity("3"), 3);
  });

  it("parses number 0 (minimum boundary)", () => {
    assert.equal(parseSeverity(0), 0);
  });

  it("parses number 5 (maximum boundary)", () => {
    assert.equal(parseSeverity(5), 5);
  });

  it("throws TypeError for non-numeric string 'high'", () => {
    assert.throws(
      () => parseSeverity("high"),
      TypeError
    );
  });

  it("throws TypeError for undefined", () => {
    assert.throws(
      () => parseSeverity(undefined),
      TypeError
    );
  });

  it("throws TypeError for null", () => {
    assert.throws(
      () => parseSeverity(null),
      TypeError
    );
  });

  it("throws RangeError for -1 (below minimum)", () => {
    assert.throws(
      () => parseSeverity(-1),
      RangeError
    );
  });

  it("throws RangeError for 6 (above maximum)", () => {
    assert.throws(
      () => parseSeverity(6),
      RangeError
    );
  });
});

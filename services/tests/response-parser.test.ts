import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseJsonResponse } from "../response-parser";

function makeMockResponse(body: string, contentType: string): Response {
  return new Response(body, { headers: { "Content-Type": contentType } });
}

describe("parseJsonResponse", () => {
  it("parses valid JSON response", async () => {
    const response = makeMockResponse('{"ok":true}', "application/json");
    const result = await parseJsonResponse(response);
    assert.deepEqual(result, { ok: true });
  });

  it("parses JSON with charset in content-type", async () => {
    const response = makeMockResponse('{"ok":true}', "application/json; charset=utf-8");
    const result = await parseJsonResponse(response);
    assert.deepEqual(result, { ok: true });
  });

  it("throws SyntaxError for HTML response", async () => {
    const response = makeMockResponse("<html><body>Error</body></html>", "text/html");
    await assert.rejects(
      () => parseJsonResponse(response),
      SyntaxError
    );
  });

  it("throws SyntaxError when content-type is missing", async () => {
    const response = makeMockResponse("{}", "");
    await assert.rejects(
      () => parseJsonResponse(response),
      SyntaxError
    );
  });

  it("SyntaxError message includes the actual content type", async () => {
    const response = makeMockResponse("<html></html>", "text/html");
    await assert.rejects(
      () => parseJsonResponse(response),
      (err: unknown) => {
        assert.ok(err instanceof SyntaxError);
        const syntaxErr = err as SyntaxError;
        assert.ok(syntaxErr.message.includes("text/html"));
        return true;
      }
    );
  });
});

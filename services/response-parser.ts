export const EXPECTED_CONTENT_TYPE = "application/json";

export async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new SyntaxError(
      `Expected Content-Type application/json but received: ${contentType}`
    );
  }
  return response.json();
}

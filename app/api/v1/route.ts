/* Public API index (open — no key needed, for discovery). */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json({
    name: "AI Supply Chain Map API",
    version: "v1",
    description:
      "Structured data on the AI hardware supply chain — 8 layers, ~37 public companies, dependencies, chokepoints, live quotes and news.",
    openapi: `${origin}/api/v1/openapi.json`,
    auth: "API key via 'Authorization: Bearer <key>' or 'x-api-key: <key>'.",
    mcp: { url: `${origin}/api/mcp`, transport: "streamable-http", note: "Model Context Protocol server (same auth)." },
    endpoints: [
      "GET /api/v1/graph",
      "GET /api/v1/companies?layer=&risk=&liquid=&live=",
      "GET /api/v1/companies/{idOrTicker}?live=",
      "GET /api/v1/layers",
      "GET /api/v1/layers/{1-8}",
      "GET /api/v1/chokepoints",
      "GET /api/v1/dependencies?id={idOrTicker}",
      "GET /api/v1/quotes",
      "GET /api/v1/news?symbol={ticker}",
    ],
  });
}

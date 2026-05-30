/* OpenAPI 3.1 spec for the AI Supply Chain Map API. Served (open, no key)
   at /api/v1/openapi.json so agents/tools can auto-discover the endpoints. */

export function openApiSpec(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "AI Supply Chain Map API",
      version: "1.0.0",
      description:
        "Structured data on the AI hardware supply chain: 8 layers (silicon → hyperscalers), ~37 public companies, their dependencies and chokepoints, plus live stock quotes and recent news. Built for AI agents and applications.",
    },
    servers: [{ url: `${origin}/api/v1` }],
    security: [{ bearerAuth: [] }, { apiKeyHeader: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", description: "Authorization: Bearer <API_KEY>" },
        apiKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" },
      },
    },
    paths: {
      "/graph": {
        get: {
          operationId: "getSupplyChainGraph",
          summary: "Full structural graph: layers, companies, and dependency edges.",
          responses: { "200": { description: "Graph" } },
        },
      },
      "/companies": {
        get: {
          operationId: "listCompanies",
          summary: "List companies, optionally filtered. Set live=true to merge real-time quotes.",
          parameters: [
            { name: "layer", in: "query", schema: { type: "integer", minimum: 1, maximum: 8 } },
            { name: "risk", in: "query", schema: { type: "string", enum: ["MAX", "HIGH", "MED", "LOW"] } },
            { name: "liquid", in: "query", schema: { type: "boolean" } },
            { name: "live", in: "query", schema: { type: "boolean" } },
          ],
          responses: { "200": { description: "Array of companies" } },
        },
      },
      "/companies/{id}": {
        get: {
          operationId: "getCompany",
          summary: "One company by id or ticker. Set live=true for a real-time quote.",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "live", in: "query", schema: { type: "boolean" } },
          ],
          responses: { "200": { description: "Company" }, "404": { description: "Not found" } },
        },
      },
      "/layers": {
        get: {
          operationId: "listLayers",
          summary: "The 8 supply-chain layers with descriptions and chokepoints.",
          responses: { "200": { description: "Array of layers" } },
        },
      },
      "/layers/{layer}": {
        get: {
          operationId: "getLayer",
          summary: "One layer (1–8) with its companies and chokepoint narrative.",
          parameters: [{ name: "layer", in: "path", required: true, schema: { type: "integer", minimum: 1, maximum: 8 } }],
          responses: { "200": { description: "Layer" }, "404": { description: "Not found" } },
        },
      },
      "/chokepoints": {
        get: {
          operationId: "findChokepoints",
          summary: "Highest-risk layers (the supply bottlenecks) with key companies.",
          responses: { "200": { description: "Ranked chokepoints" } },
        },
      },
      "/dependencies": {
        get: {
          operationId: "getDependencies",
          summary: "Cross-layer dependencies for a company (both directions).",
          parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Dependencies" }, "404": { description: "Not found" } },
        },
      },
      "/quotes": {
        get: {
          operationId: "getQuotes",
          summary: "Live stock quotes snapshot keyed by company id (US-listed names).",
          responses: { "200": { description: "Quotes" } },
        },
      },
      "/news": {
        get: {
          operationId: "getCompanyNews",
          summary: "Recent headlines for a company ticker.",
          parameters: [{ name: "symbol", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "News items" } },
        },
      },
    },
  };
}

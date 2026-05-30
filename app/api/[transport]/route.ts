/* ──────────────────────────────────────────────────────────────
   MCP server (Model Context Protocol) — streamable HTTP at /api/mcp
   Exposes the same data as the REST v1 API as agent-native tools.
   Gated by the same API key auth. Built on mcp-handler (Vercel).
   ────────────────────────────────────────────────────────────── */
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  findChokepoints, getCompany, getDependencies, getGraph, getLayer,
  listCompanies, listLayers,
} from "@/lib/api-service";
import { getQuotesSnapshot } from "@/lib/quotes-provider";
import { getCompanyNews } from "@/lib/news-provider";
import { authorize, authError } from "@/lib/api-auth";

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.tool(
      "get_supply_chain_graph",
      "The full structural graph of the AI hardware supply chain: 8 layers, ~37 public companies, and the dependency edges between them.",
      {},
      async () => text(getGraph()),
    );

    server.tool(
      "list_companies",
      "List public companies in the AI supply chain. Optional filters by layer (1-8), risk, or liquidity. Set live=true to include real-time stock quotes.",
      {
        layer: z.number().int().min(1).max(8).optional().describe("Filter by supply-chain layer 1-8"),
        risk: z.enum(["MAX", "HIGH", "MED", "LOW"]).optional().describe("Filter by the layer's supply-risk level"),
        onlyLiquid: z.boolean().optional().describe("Only US-listed (NASDAQ/NYSE) companies"),
        live: z.boolean().optional().describe("Merge real-time stock quotes"),
      },
      async ({ layer, risk, onlyLiquid, live }) =>
        text(await listCompanies({ layer, risk, liquid: onlyLiquid, live })),
    );

    server.tool(
      "get_company",
      "Get one company by id (e.g. 'nvidia') or ticker (e.g. 'NVDA'): role, HQ, layer, risk, market cap. Set live=true for a real-time quote.",
      {
        id: z.string().describe("Company id or ticker symbol"),
        live: z.boolean().optional().describe("Include a real-time stock quote"),
      },
      async ({ id, live }) => text(await getCompany(id, live)),
    );

    server.tool(
      "list_layers",
      "The 8 supply-chain layers (silicon → hyperscalers), each with its description, chokepoint narrative, and companies.",
      {},
      async () => text(listLayers()),
    );

    server.tool(
      "get_layer",
      "Get one supply-chain layer (1-8) with its description, chokepoint, and member companies.",
      { layer: z.number().int().min(1).max(8).describe("Layer number 1-8") },
      async ({ layer }) => text(getLayer(layer)),
    );

    server.tool(
      "find_chokepoints",
      "The highest-risk layers — the supply bottlenecks of the AI boom — ranked by risk, with their narrative and key companies. The single most useful tool for analysis.",
      {},
      async () => text(findChokepoints()),
    );

    server.tool(
      "get_dependencies",
      "Cross-layer dependencies for a company in both directions: who it depends on, and who depends on it. E.g. 'tsmc' or 'TSM'.",
      { id: z.string().describe("Company id or ticker symbol") },
      async ({ id }) => text(getDependencies(id)),
    );

    server.tool(
      "get_quotes",
      "Real-time stock quotes snapshot for the US-listed companies, keyed by company id.",
      {},
      async () => text((await getQuotesSnapshot()).quotes),
    );

    server.tool(
      "get_company_news",
      "Recent news headlines for a company ticker (e.g. 'NVDA').",
      { symbol: z.string().describe("Ticker symbol") },
      async ({ symbol }) => text(await getCompanyNews(symbol)),
    );
  },
  {},
  { basePath: "/api", maxDuration: 60, verboseLogs: false },
);

async function handler(req: Request): Promise<Response> {
  const a = authorize(req);
  if (!a.ok) return authError(a);
  return mcpHandler(req);
}

export { handler as GET, handler as POST, handler as DELETE };

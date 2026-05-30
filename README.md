# AI Supply Chain Map

Interactive force-directed graph of the AI hardware supply chain: 8 layers (silicon → hyperscalers) and ~37 public companies, with risk coloring, filters, a detail panel, and **real live stock quotes** where coverage exists. Next.js (App Router, TypeScript) + D3, deployable on Vercel. UI copy is in Spanish.

The Next.js app lives at the repo root. The original design prototype (static HTML/CSS/JS, exported from Claude Design) is preserved in [`project/`](project/) as the design reference.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — add a Finnhub key for live quotes
npm run dev                  # http://localhost:3000
```

The app runs **without any key**: it renders reference data with a gentle, clearly-labeled simulated drift. Add `FINNHUB_API_KEY` to pull real prices.

```bash
npm run build && npm run start   # production build + server
npm run lint                     # ESLint (not run during build)
```

## How live data works

- `GET /api/quotes` runs server-side. With a `FINNHUB_API_KEY` it fetches real prices for the **US-listed tickers** (the `liquid` companies — NASDAQ/NYSE), caches the snapshot (`QUOTES_REVALIDATE_SECONDS`, default 30s), and returns live overrides keyed by company id.
- **OTC tickers** (Shin-Etsu, SUMCO, Samsung, SK Hynix, Foxconn, …) have no reliable free coverage, so they always fall back to reference data — flagged "datos de referencia" in the UI, exactly as the prototype intended.
- Market caps are static (they drive node sizing, so nodes don't resize on every tick). Only price and 24h change go live.
- No key → everything is reference data with a simulated drift; the navbar pill turns amber and reads "Datos de referencia".

Get a free key at <https://finnhub.io> (free tier: 60 req/min — comfortably enough for ~23 symbols on a 30s cache).

## Deploy to Vercel

The app is at the repo root, so Vercel auto-detects Next.js with no extra configuration:

1. Push to GitHub (already at <https://github.com/mcdesignspur-svg/ai-boom-supplychain>).
2. Vercel → New Project → import the repo. Framework preset **Next.js** is detected automatically. **Leave Root Directory as the default (repo root)** — do not set it to a subfolder.
3. Add the environment variable `FINNHUB_API_KEY` (Production + Preview). Optionally `QUOTES_REVALIDATE_SECONDS`.
4. Deploy. The `/api/quotes` route is cached at the edge (`s-maxage=30, stale-while-revalidate=60`).

Without the env var the deploy still works — it just serves reference data. Every push to `main` redeploys automatically.

> If a Vercel project was created earlier with **Root Directory** set to `web`, clear it back to the default (repo root) under Settings → Build and Deployment, since the app no longer lives in a subfolder.

## Architecture

The original prototype's split (`data → graph → ui`) is preserved as a clean separation of concerns:

- **`lib/supply-chain-data.ts`** — typed dataset (layers, companies, dependencies, risk palette) + `buildGraph()`. `liquid` companies are the live-quote candidates.
- **`lib/graph-engine.ts`** — framework-agnostic D3 force engine that owns the `<svg>` imperatively (so React never fights D3). Settles the layout **synchronously** (420 ticks) rather than via `requestAnimationFrame`, which is throttled in unfocused tabs. Exposes an imperative API (`setFilter`, `focusNode`, `resetView`, zoom, select/deselect) + emits node events through callbacks.
- **`components/`** — React owns all the chrome (navbar, toolbar, legend, tooltip, detail panel, intro) as stateful components. `SupplyGraph` mounts the engine via a ref; `SupplyChainApp` holds the state and wires filters/selection/theme to the engine.
- **`lib/use-quotes.ts`** — polls `/api/quotes`, merges live overrides, and drives the simulated drift for reference companies.
- **`app/api/quotes/route.ts`** + **`lib/quotes-provider.ts`** — server-side quotes with caching and graceful fallback.

## Responsive

Desktop is hover-driven; touch is tap-to-open. On mobile the detail panel becomes a bottom sheet, the toolbar scrolls horizontally, hover tooltips are skipped, and the layout uses `100dvh` with `viewport-fit=cover` for notched devices.

## API & MCP (for AI agents)

The supply-chain data is exposed two ways, both gated by an API key. Set valid keys in the `API_KEYS` env var (comma-separated); per-key rate limit via `API_RATE_LIMIT` (default 120/min). Send the key as `Authorization: Bearer <key>` or `x-api-key: <key>`.

### REST API (`/api/v1`)

Universal — any agent/framework can call it. Discovery endpoints are open (no key):

- `GET /api/v1` — index of endpoints
- `GET /api/v1/openapi.json` — OpenAPI 3.1 spec (import as tools)

Data endpoints (key required):

| Endpoint | Returns |
|---|---|
| `GET /api/v1/graph` | layers + companies + dependency edges |
| `GET /api/v1/companies?layer=&risk=&liquid=&live=` | companies (optionally with live quotes) |
| `GET /api/v1/companies/{idOrTicker}?live=` | one company |
| `GET /api/v1/layers` · `/layers/{1-8}` | layers + chokepoints |
| `GET /api/v1/chokepoints` | highest-risk bottlenecks |
| `GET /api/v1/dependencies?id={idOrTicker}` | who depends on / is depended on |
| `GET /api/v1/quotes` · `/news?symbol=` | live quotes / recent headlines |

```bash
curl -H "Authorization: Bearer $API_KEY" https://<host>/api/v1/chokepoints
```

### MCP server (`/api/mcp`)

Agent-native (Claude Desktop/Code, Cursor, …) over **streamable HTTP**, built with [`mcp-handler`](https://www.npmjs.com/package/mcp-handler). Same auth. Tools: `get_supply_chain_graph`, `list_companies`, `get_company`, `list_layers`, `get_layer`, `find_chokepoints`, `get_dependencies`, `get_quotes`, `get_company_news`.

Add to an MCP client config:

```json
{
  "mcpServers": {
    "ai-supply-chain": {
      "url": "https://<host>/api/mcp",
      "headers": { "Authorization": "Bearer <API_KEY>" }
    }
  }
}
```

For clients that only speak stdio, bridge with `npx mcp-remote https://<host>/api/mcp --header "Authorization: Bearer <API_KEY>"`.

Both the REST routes and the MCP tools call one shared service layer (`lib/api-service.ts`), so they always return identical data.

# AI Supply Chain Map — production app

Interactive force-directed graph of the AI hardware supply chain: 8 layers (silicon → hyperscalers) and ~37 public companies, with risk coloring, filters, a detail panel, and **real live stock quotes** where coverage exists. Next.js (App Router, TypeScript) + D3, deployable on Vercel.

This is the production rebuild of the design prototype in [`../project/`](../project). UI copy is in Spanish.

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

1. Push this repo to GitHub.
2. In Vercel → New Project → import the repo. **Set the Root Directory to `web`** (the app is a subfolder; the prototype lives alongside in `project/`).
3. Framework preset: **Next.js** (auto-detected). No build overrides needed.
4. Add the environment variable `FINNHUB_API_KEY` (Production + Preview). Optionally `QUOTES_REVALIDATE_SECONDS`.
5. Deploy. The `/api/quotes` route is cached at the edge (`s-maxage=30, stale-while-revalidate=60`).

Without the env var the deploy still works — it just serves reference data.

## Architecture

The original prototype's split (`data → graph → ui`) is preserved as a clean separation of concerns:

- **`lib/supply-chain-data.ts`** — typed dataset (layers, companies, dependencies, risk palette) + `buildGraph()`. `liquid` companies are the live-quote candidates.
- **`lib/graph-engine.ts`** — framework-agnostic D3 force engine that owns the `<svg>` imperatively (so React never fights D3). Settles the layout **synchronously** (420 ticks) rather than via `requestAnimationFrame`, which is throttled in unfocused tabs. Exposes an imperative API (`setFilter`, `focusNode`, `resetView`, zoom, select/deselect) + emits node events through callbacks.
- **`components/`** — React owns all the chrome (navbar, toolbar, legend, tooltip, detail panel, intro) as stateful components. `SupplyGraph` mounts the engine via a ref; `SupplyChainApp` holds the state and wires filters/selection/theme to the engine.
- **`lib/use-quotes.ts`** — polls `/api/quotes`, merges live overrides, and drives the simulated drift for reference companies.
- **`app/api/quotes/route.ts`** + **`lib/quotes-provider.ts`** — server-side quotes with caching and graceful fallback.

## Responsive

Desktop is hover-driven; touch is tap-to-open. On mobile the detail panel becomes a bottom sheet, the toolbar scrolls horizontally, hover tooltips are skipped, and the layout uses `100dvh` with `viewport-fit=cover` for notched devices.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout: two halves

- **[project/](project/)** — the original **design handoff bundle** from Claude Design (claude.ai/design): a static HTML/CSS/JS prototype. Treat this as the design source of truth / reference, not as code to ship.
- **[web/](web/)** — the **production rebuild**: Next.js (App Router, TypeScript) + D3, with real live stock quotes and a responsive/mobile layout, deployable on Vercel. This is where active development happens. See [web/README.md](web/README.md) for run/deploy details and its own architecture notes.

## What this repo is

The primary design is [project/AI Supply Chain Map.html](project/AI Supply Chain Map.html) — an interactive **force-directed graph of the AI hardware supply chain**: 8 layers (silicon → hyperscalers) and ~37 public companies, with risk coloring, filters, a detail panel, and live stock data. UI copy is in **Spanish**.

The prototype used fully simulated financials; the `web/` rebuild pulls **real prices** for US-listed tickers via Finnhub and falls back to reference data for OTC names (see `web/lib/quotes-provider.ts`).

## Running the prototype

No build step, no dependencies to install — D3 v7 loads from a CDN. Open the HTML directly, or serve the `project/` folder over HTTP (needed so the local Inter font and SVG assets resolve):

```bash
cd project && python3 -m http.server 8000   # then open http://localhost:8000/AI%20Supply%20Chain%20Map.html
```

There are no tests, linters, or build commands.

## Architecture

Four files load in strict order (see the bottom of the HTML); each layer talks to the next through a single global object — **no bundler, no ES modules, no imports**. Load order is load-bearing.

1. **[project/data.js](project/data.js)** — the dataset and graph builder. Exposes `window.SCM = { LAYERS, COMPANIES, buildGraph, RISK }`.
   - `LAYERS` (8 entries): each has `layer` number, `risk` (`MAX`/`HIGH`/`MED`/`LOW`), `description`, and a `bottleneck` (the chokepoint narrative shown in the panel).
   - `COMPANIES` (~37): each tied to a layer, with `ticker`, `liquid` flag (drives the "Solo líquidas" filter and tick volatility), and simulated `price` / `changePct` / `marketCap`.
   - `LAYER_CHAIN` (vertical 1→8 spine) and `COMPANY_DEPS` (cross-layer arrows, e.g. `nvidia → tsmc`) define the edges.
   - `buildGraph()` flattens layers + companies into `{nodes, links}` with three link `kind`s: `belongs-to`, `layer-chain`, `company-dep`. The rest of the app keys behavior off `kind`.

2. **[project/graph.js](project/graph.js)** — the D3 force simulation. Owns the `<svg id="graph">` directly (the header comment notes this is deliberate "so React never fights D3"). Exposes `window.Graph` (`init`, `setFilter`, `focusNode`, `resetView`, `select`/`deselect`, zoom, `layerRiskOf`). `init(svgEl, callbacks)` takes callbacks (`onNodeClick`, `onNodeHover`, `onNodeMove`, `onBackgroundClick`) — this is the seam between graph and UI.
   - **The simulation is settled synchronously**: after setup it calls `sim.stop()` then loops `sim.tick()` ~420 times before painting once. This is intentional — `requestAnimationFrame` is throttled in unfocused iframes and would leave nodes stacked. Preserve this if you reimplement.
   - Highlight/selection works off an `adjacency` map built from links; filtering applies CSS classes (`dim`, `faded`) rather than removing nodes.

3. **[project/ui.js](project/ui.js)** — everything around the graph: navbar, toolbar filters (risk chips, layer dropdown, liquid-only), the detail panel (`layerPanel` / `companyPanel` with sparklines), tooltip, theme toggle, intro overlay, and the **simulated live tick** (`setInterval(tick, 3200)` nudges every company's price). Sparklines use a deterministic seeded RNG (`seedRand` keyed on ticker+id) so they're stable across renders; only the live stat grid re-renders on tick.

4. **HTML** — static shell with all the chrome (navbar, toolbar, legend, intro, empty `#panel`/`#tooltip` containers the JS fills).

### Styling & theming

- **[project/styles.css](project/styles.css)** — all component styles, **dark-first**. Theme switches via `:root[data-theme="dark"|"light"]` swapping CSS variables (`--bg`, `--ink*`, `--accent`, `--node-*`, `--link`). The toggle persists to `localStorage` under `scm-theme`.
- **[project/assets/colors_and_type.css](project/assets/colors_and_type.css)** — the **MC Designs brand token system** (`--mc-*`: colors, type scale, spacing, radii, shadows, motion easings), derived from the production site mcdesignspr.com. `styles.css` consumes these tokens (e.g. `--mc-ease-std`, `--mc-dur-base`). Treat this as the design-system source of truth; don't hardcode values that exist here.
- The **risk palette** lives in two places that must stay in sync: `RISK` in `data.js` (JS-side colors/glow) and the swatch hex values inline in the HTML toolbar/legend.

### Conventions to preserve

- All user-facing copy is **Spanish** — keep it Spanish unless told otherwise.
- Node behavior is driven by `node.type` (`"layer"` vs `"company"`) and link `kind` everywhere — these two discriminators are the backbone of the rendering logic.
- Company size on the graph is `sqrt(marketCap)`-scaled and clamped (`companyR` in graph.js); layer node size comes from `LAYER_RADIUS` keyed by risk.

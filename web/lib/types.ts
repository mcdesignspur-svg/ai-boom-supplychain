/* ──────────────────────────────────────────────────────────────
   AI Supply Chain Map — shared types
   ────────────────────────────────────────────────────────────── */

export type RiskLevel = "MAX" | "HIGH" | "MED" | "LOW";

export interface Layer {
  id: string;
  type: "layer";
  layer: number;
  name: string;
  shortName: string;
  risk: RiskLevel;
  description: string;
  /** The chokepoint narrative shown in the detail panel. */
  bottleneck: string;
}

export interface Company {
  id: string;
  type?: "company";
  name: string;
  shortName: string;
  ticker: string;
  exchange: string;
  layer: number;
  hq: string;
  /** US-listed (NASDAQ/NYSE) → eligible for real live quotes. OTC → reference only. */
  liquid: boolean;
  role: string;
  /** Reference baseline price (USD). Live quote overrides this at runtime when available. */
  basePrice: number;
  /** Reference baseline 24h change (%). Live quote overrides at runtime. */
  baseChangePct: number;
  /** Market cap (USD) — static; used for node sizing so nodes don't resize on every tick. */
  marketCap: number;
}

export interface RiskMeta {
  color: string;
  label: string;
  glow: string;
}

/** A runtime price snapshot for one company — either real (live) or reference. */
export interface Quote {
  price: number;
  changePct: number;
  /** true → real data from the quotes provider; false → reference/simulated. */
  live: boolean;
}

export type QuotesMap = Record<string, Quote>;

/** Response shape of GET /api/quotes. */
export interface QuotesResponse {
  /** Quotes keyed by company id. Missing ids fall back to reference data client-side. */
  quotes: QuotesMap;
  /** Whether the server had a provider key configured and returned any live data. */
  liveMode: boolean;
  /** ISO timestamp the snapshot was produced. */
  asOf: string;
}

/* ── Graph (nodes + links) ──────────────────────────────────────── */

export type GraphNode = (Layer | Company) & {
  type: "layer" | "company";
  isPublic?: boolean;
  // d3-force mutates these in place:
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

export type LinkKind = "belongs-to" | "layer-chain" | "company-dep";

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  kind: LinkKind;
  layer?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

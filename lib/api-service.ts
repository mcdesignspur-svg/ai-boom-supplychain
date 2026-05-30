/* ──────────────────────────────────────────────────────────────
   Public API service layer
   Pure-ish accessors over the supply-chain dataset, shared by the
   REST v1 routes and the MCP server so both expose identical data.
   ────────────────────────────────────────────────────────────── */
import { COMPANIES, COMPANY_DEPS, LAYERS, LAYER_CHAIN, RISK } from "./supply-chain-data";
import { getQuotesSnapshot } from "./quotes-provider";
import type { Company, Layer, RiskLevel } from "./types";

const companyById: Record<string, Company> = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));
const layerByNum: Record<number, Layer> = Object.fromEntries(LAYERS.map((l) => [l.layer, l]));
const RISK_ORDER: Record<RiskLevel, number> = { MAX: 0, HIGH: 1, MED: 2, LOW: 3 };

export function layerRiskOf(n: number): RiskLevel {
  return layerByNum[n]?.risk ?? "MED";
}

function resolveCompany(idOrTicker: string): Company | undefined {
  const key = idOrTicker.trim();
  return (
    companyById[key] ??
    companyById[key.toLowerCase()] ??
    COMPANIES.find((c) => c.ticker.toLowerCase() === key.toLowerCase())
  );
}

interface QuoteLike { price: number; changePct: number; live: boolean }

function publicCompany(c: Company, quote?: QuoteLike) {
  const layer = layerByNum[c.layer];
  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    ticker: c.ticker,
    exchange: c.exchange,
    layer: c.layer,
    layerName: layer?.name ?? null,
    hq: c.hq,
    liquid: c.liquid,
    role: c.role,
    risk: layer?.risk ?? null,
    riskLabel: layer ? RISK[layer.risk].label : null,
    marketCap: c.marketCap,
    price: quote?.price ?? c.basePrice,
    changePct: quote?.changePct ?? c.baseChangePct,
    live: quote?.live ?? false,
  };
}

export interface CompanyQuery {
  layer?: number;
  risk?: RiskLevel;
  liquid?: boolean;
  live?: boolean;
}

export async function listCompanies(opts: CompanyQuery = {}) {
  let list = COMPANIES;
  if (opts.layer != null) list = list.filter((c) => c.layer === opts.layer);
  if (opts.risk) list = list.filter((c) => layerRiskOf(c.layer) === opts.risk);
  if (opts.liquid != null) list = list.filter((c) => c.liquid === opts.liquid);

  let quotes: Record<string, QuoteLike> = {};
  if (opts.live) quotes = (await getQuotesSnapshot()).quotes;
  return list.map((c) => publicCompany(c, quotes[c.id]));
}

export async function getCompany(idOrTicker: string, live = false) {
  const c = resolveCompany(idOrTicker);
  if (!c) return null;
  let q: QuoteLike | undefined;
  if (live) q = (await getQuotesSnapshot()).quotes[c.id];
  return publicCompany(c, q);
}

function publicLayer(l: Layer, withCompanies = true) {
  const cos = COMPANIES.filter((c) => c.layer === l.layer);
  return {
    id: l.id,
    layer: l.layer,
    name: l.name,
    shortName: l.shortName,
    risk: l.risk,
    riskLabel: RISK[l.risk].label,
    description: l.description,
    bottleneck: l.bottleneck,
    companyCount: cos.length,
    companies: withCompanies
      ? cos.map((c) => ({ id: c.id, shortName: c.shortName, ticker: c.ticker }))
      : undefined,
  };
}

export function listLayers() {
  return LAYERS.map((l) => publicLayer(l));
}

export function getLayer(n: number) {
  const l = layerByNum[n];
  return l ? publicLayer(l) : null;
}

/** Layers ranked by supply risk (MAX/HIGH only) with their chokepoint narrative. */
export function findChokepoints() {
  return [...LAYERS]
    .filter((l) => l.risk === "MAX" || l.risk === "HIGH")
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk])
    .map((l) => ({
      layer: l.layer,
      name: l.name,
      risk: l.risk,
      riskLabel: RISK[l.risk].label,
      bottleneck: l.bottleneck,
      keyCompanies: COMPANIES.filter((c) => c.layer === l.layer).map((c) => ({
        id: c.id,
        shortName: c.shortName,
        ticker: c.ticker,
      })),
    }));
}

function brief(id: string) {
  const c = companyById[id];
  return c ? { id: c.id, shortName: c.shortName, ticker: c.ticker, layer: c.layer } : { id };
}

/** Cross-layer dependency edges for a company (both directions). */
export function getDependencies(idOrTicker: string) {
  const c = resolveCompany(idOrTicker);
  if (!c) return null;
  return {
    id: c.id,
    shortName: c.shortName,
    dependsOn: COMPANY_DEPS.filter(([s]) => s === c.id).map(([, t]) => brief(t)),
    dependedOnBy: COMPANY_DEPS.filter(([, t]) => t === c.id).map(([s]) => brief(s)),
  };
}

/** Whole structural graph (layers, companies, dependency edges). */
export function getGraph() {
  return {
    layers: LAYERS.map((l) => ({ id: l.id, layer: l.layer, name: l.name, risk: l.risk })),
    companies: COMPANIES.map((c) => ({
      id: c.id,
      shortName: c.shortName,
      ticker: c.ticker,
      layer: c.layer,
      liquid: c.liquid,
    })),
    layerChain: LAYER_CHAIN,
    companyDependencies: COMPANY_DEPS,
  };
}

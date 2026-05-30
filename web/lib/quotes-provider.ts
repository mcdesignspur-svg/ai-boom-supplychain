/* ──────────────────────────────────────────────────────────────
   Quotes provider (server-only)
   Pulls REAL prices from Finnhub for US-listed tickers (the `liquid`
   companies). Everything else — and the no-key case — falls back to
   reference data on the client. Never throws: a provider hiccup
   degrades to reference data instead of breaking the page.
   ────────────────────────────────────────────────────────────── */
import { COMPANIES } from "./supply-chain-data";
import type { QuotesMap } from "./types";

const FINNHUB_URL = "https://finnhub.io/api/v1/quote";

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  pc: number; // previous close
}

function revalidateSeconds(): number {
  const n = Number(process.env.QUOTES_REVALIDATE_SECONDS);
  return Number.isFinite(n) && n >= 15 ? n : 30;
}

async function fetchOne(symbol: string, token: string, revalidate: number): Promise<FinnhubQuote | null> {
  try {
    const url = `${FINNHUB_URL}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    const q = (await res.json()) as FinnhubQuote;
    // Finnhub returns c=0 for unknown/uncovered symbols.
    if (!q || typeof q.c !== "number" || q.c <= 0) return null;
    return q;
  } catch {
    return null;
  }
}

export interface QuotesSnapshot {
  quotes: QuotesMap;
  liveMode: boolean;
}

/**
 * Build a quotes snapshot. With no FINNHUB_API_KEY this resolves to an empty
 * map and liveMode:false (the client renders reference data). With a key, it
 * returns live overrides for every US-listed ticker that responded.
 */
export async function getQuotesSnapshot(): Promise<QuotesSnapshot> {
  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!token) return { quotes: {}, liveMode: false };

  const revalidate = revalidateSeconds();
  const liquid = COMPANIES.filter((c) => c.liquid);

  const results = await Promise.all(
    liquid.map(async (c) => {
      const q = await fetchOne(c.ticker, token, revalidate);
      return { id: c.id, q };
    }),
  );

  const quotes: QuotesMap = {};
  for (const { id, q } of results) {
    if (q) quotes[id] = { price: q.c, changePct: q.dp ?? 0, live: true };
  }

  return { quotes, liveMode: Object.keys(quotes).length > 0 };
}

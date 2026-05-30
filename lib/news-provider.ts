/* Finnhub company-news fetch, shared by /api/news and /api/v1/news. */
import type { NewsItem } from "./types";

interface FinnhubNews {
  headline: string;
  source: string;
  url: string;
  datetime: number;
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export async function getCompanyNews(symbol: string): Promise<NewsItem[]> {
  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!symbol || !token) return [];

  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  try {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmtDate(from)}&to=${fmtDate(to)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = (await res.json()) as FinnhubNews[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((n) => n && n.headline && n.url)
      .slice(0, 5)
      .map((n) => ({ headline: n.headline, source: n.source, url: n.url, datetime: n.datetime }));
  } catch {
    return [];
  }
}

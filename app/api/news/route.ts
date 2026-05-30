import { NextResponse } from "next/server";
import type { NewsItem, NewsResponse } from "@/lib/types";

// News changes slowly — cache 30 min at the edge and per upstream call.
export const revalidate = 1800;

interface FinnhubNews {
  headline: string;
  source: string;
  url: string;
  datetime: number;
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(req: Request) {
  const empty: NewsResponse = { news: [] };
  const symbol = new URL(req.url).searchParams.get("symbol");
  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!symbol || !token) return NextResponse.json(empty);

  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmtDate(from)}&to=${fmtDate(to)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return NextResponse.json(empty);
    const data = (await res.json()) as FinnhubNews[];
    if (!Array.isArray(data)) return NextResponse.json(empty);

    const news: NewsItem[] = data
      .filter((n) => n && n.headline && n.url)
      .slice(0, 5)
      .map((n) => ({ headline: n.headline, source: n.source, url: n.url, datetime: n.datetime }));

    return NextResponse.json(
      { news } satisfies NewsResponse,
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json(empty);
  }
}

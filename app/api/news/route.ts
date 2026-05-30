import { NextResponse } from "next/server";
import { getCompanyNews } from "@/lib/news-provider";
import type { NewsResponse } from "@/lib/types";

// News changes slowly — cache 30 min at the edge.
export const revalidate = 1800;

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ news: [] } satisfies NewsResponse);
  const news = await getCompanyNews(symbol);
  return NextResponse.json({ news } satisfies NewsResponse, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}

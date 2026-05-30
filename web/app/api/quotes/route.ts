import { NextResponse } from "next/server";
import { getQuotesSnapshot } from "@/lib/quotes-provider";
import type { QuotesResponse } from "@/lib/types";

// Cache the response at the edge/CDN; the provider also caches each upstream
// call via fetch revalidate. Keep this aligned with QUOTES_REVALIDATE_SECONDS.
export const revalidate = 30;

export async function GET() {
  const { quotes, liveMode } = await getQuotesSnapshot();
  const body: QuotesResponse = {
    quotes,
    liveMode,
    asOf: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}

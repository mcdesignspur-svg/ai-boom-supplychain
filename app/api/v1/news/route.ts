import { protectedJson } from "@/lib/api-handler";
import { getCompanyNews } from "@/lib/news-provider";

export const GET = protectedJson(async (req) => {
  const symbol = new URL(req.url).searchParams.get("symbol");
  if (!symbol) return Response.json({ error: "query param 'symbol' required" }, { status: 400 });
  return { symbol, news: await getCompanyNews(symbol) };
});

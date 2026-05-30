import { protectedJson } from "@/lib/api-handler";
import { getQuotesSnapshot } from "@/lib/quotes-provider";

export const GET = protectedJson(async () => {
  const snap = await getQuotesSnapshot();
  return { liveMode: snap.liveMode, quotes: snap.quotes };
});

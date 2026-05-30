import { protectedJson } from "@/lib/api-handler";
import { getCompany } from "@/lib/api-service";

export const GET = protectedJson(async (req, ctx) => {
  const { id } = await ctx.params;
  const live = new URL(req.url).searchParams.get("live") === "true";
  return getCompany(id, live); // null → 404
});

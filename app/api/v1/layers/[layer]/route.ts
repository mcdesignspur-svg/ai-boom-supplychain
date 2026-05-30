import { protectedJson } from "@/lib/api-handler";
import { getLayer } from "@/lib/api-service";

export const GET = protectedJson(async (_req, ctx) => {
  const { layer } = await ctx.params;
  const n = Number(layer);
  if (!Number.isInteger(n)) return Response.json({ error: "layer must be 1–8" }, { status: 400 });
  return getLayer(n); // null → 404
});

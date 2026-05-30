import { protectedJson } from "@/lib/api-handler";
import { getDependencies } from "@/lib/api-service";

export const GET = protectedJson((req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "query param 'id' required" }, { status: 400 });
  return getDependencies(id); // null → 404
});

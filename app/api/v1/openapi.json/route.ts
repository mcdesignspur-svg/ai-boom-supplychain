/* OpenAPI spec (open — for discovery). */
import { openApiSpec } from "@/lib/openapi";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json(openApiSpec(origin), {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}

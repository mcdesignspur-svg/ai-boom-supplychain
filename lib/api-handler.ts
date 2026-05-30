/* Shared wrapper for protected REST v1 handlers: auth + rate limit +
   JSON serialization. A handler may return raw data (JSON-ified), `null`
   (→ 404), or a Response (passed through). */
import { authorize, authError, withRateHeaders } from "./api-auth";

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: Ctx) => Promise<unknown> | unknown;

const CACHE = "public, s-maxage=30, stale-while-revalidate=60";

export function protectedJson(handler: Handler) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    const a = authorize(req);
    if (!a.ok) return authError(a);
    try {
      const data = await handler(req, ctx);
      if (data instanceof Response) return withRateHeaders(data, a);
      if (data == null) {
        return withRateHeaders(Response.json({ error: "Not found" }, { status: 404 }), a);
      }
      return withRateHeaders(Response.json(data, { headers: { "Cache-Control": CACHE } }), a);
    } catch {
      return withRateHeaders(Response.json({ error: "Internal error" }, { status: 500 }), a);
    }
  };
}

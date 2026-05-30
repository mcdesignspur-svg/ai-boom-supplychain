/* ──────────────────────────────────────────────────────────────
   API key auth + rate limiting for the public API and MCP server.

   Keys come from the API_KEYS env var (comma-separated). Rate limiting
   is an in-memory fixed window per key — effective on Vercel Fluid Compute
   (warm, reused instances) but not strictly distributed across all
   instances/regions. For hard global limits, back it with Upstash Redis.
   ────────────────────────────────────────────────────────────── */

const WINDOW_MS = 60_000;
const LIMIT = Number(process.env.API_RATE_LIMIT) || 120; // requests per minute per key

function validKeys(): Set<string> {
  return new Set(
    (process.env.API_KEYS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const x = req.headers.get("x-api-key");
  return x?.trim() || null;
}

const buckets = new Map<string, { count: number; reset: number }>();
function hit(key: string) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count++;
  return { ok: b.count <= LIMIT, remaining: Math.max(0, LIMIT - b.count), reset: b.reset };
}

export interface AuthResult {
  ok: boolean;
  status?: number;
  error?: string;
  key?: string;
  headers: Record<string, string>;
}

export function authorize(req: Request): AuthResult {
  const keys = validKeys();
  if (!keys.size) {
    return { ok: false, status: 503, error: "API not configured: set the API_KEYS env var.", headers: {} };
  }
  const key = extractKey(req);
  if (!key || !keys.has(key)) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or missing API key. Send 'Authorization: Bearer <key>' or 'x-api-key: <key>'.",
      headers: { "WWW-Authenticate": "Bearer" },
    };
  }
  const rl = hit(key);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(LIMIT),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.reset / 1000)),
  };
  if (!rl.ok) {
    return { ok: false, status: 429, error: "Rate limit exceeded.", headers, key };
  }
  return { ok: true, key, headers };
}

/** Build the error Response for a failed authorize(). */
export function authError(a: AuthResult): Response {
  return Response.json({ error: a.error }, { status: a.status ?? 401, headers: a.headers });
}

/** Attach rate-limit headers to a successful Response. */
export function withRateHeaders(res: Response, a: AuthResult): Response {
  for (const [k, v] of Object.entries(a.headers)) res.headers.set(k, v);
  return res;
}

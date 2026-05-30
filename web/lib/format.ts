/* ──────────────────────────────────────────────────────────────
   Formatting + sparkline helpers (ported from the prototype's ui.js)
   ────────────────────────────────────────────────────────────── */

export const fmtPrice = (v: number) =>
  "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtChg = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

export function fmtCap(v: number) {
  if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(0) + "B";
  return "$" + (v / 1e6).toFixed(0) + "M";
}

/** #RRGGBB → rgba() with given alpha. */
export function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Deterministic pseudo-random from a string — stable sparklines across renders. */
function seedRand(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable ~7-day price series ending at the current price. */
export function sparkSeries(seed: string, price: number, changePct: number, n = 28): number[] {
  const rnd = seedRand(seed);
  const drift = (changePct || 0) / 100 / n;
  let v = price * (1 - ((changePct || 0) / 100) * 1.4);
  const out = [v];
  for (let i = 1; i < n; i++) {
    v = v * (1 + drift + (rnd() - 0.5) * 0.018);
    out.push(v);
  }
  out[n - 1] = price;
  return out;
}

export function sparkPath(series: number[], w: number, h: number): string {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const stepX = w / (series.length - 1);
  return series
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`)
    .join(" ");
}

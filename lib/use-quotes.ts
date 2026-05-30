"use client";
/* ──────────────────────────────────────────────────────────────
   useQuotes — live quote orchestration
   • Polls /api/quotes for REAL prices (US-listed tickers).
   • Applies a gentle, clearly-labeled simulated drift to the
     reference-only (OTC) companies so the map feels alive without
     pretending OTC data is real.
   • Exposes a "secondsAgo" clock for the navbar update pill.
   ────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState } from "react";
import { COMPANIES } from "./supply-chain-data";
import type { QuotesMap, QuotesResponse } from "./types";

const POLL_MS = 30_000;
const SIM_MS = 3_200;

function seedQuotes(): QuotesMap {
  const m: QuotesMap = {};
  for (const c of COMPANIES) m[c.id] = { price: c.basePrice, changePct: c.baseChangePct, live: false };
  return m;
}

export interface UseQuotesResult {
  quotes: QuotesMap;
  liveMode: boolean;
  secondsAgo: number;
}

export function useQuotes(): UseQuotesResult {
  const [quotes, setQuotes] = useState<QuotesMap>(seedQuotes);
  const [liveMode, setLiveMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(() => Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const liveIds = useRef<Set<string>>(new Set());

  // Poll real quotes from the server.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/quotes", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as QuotesResponse;
        if (cancelled) return;
        liveIds.current = new Set(Object.keys(data.quotes));
        setLiveMode(data.liveMode);
        if (Object.keys(data.quotes).length) {
          setQuotes((prev) => ({ ...prev, ...data.quotes }));
          setLastUpdate(Date.now());
        }
      } catch {
        /* network hiccup → keep last good values */
      }
    }
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Gentle simulated drift for reference-only (OTC) companies.
  useEffect(() => {
    const id = window.setInterval(() => {
      setQuotes((prev) => {
        const next: QuotesMap = { ...prev };
        for (const c of COMPANIES) {
          if (liveIds.current.has(c.id)) continue; // real data — never fake-drift
          const q = next[c.id];
          const delta = (Math.random() - 0.5) * 0.006 * 0.5;
          const price = Math.max(0.5, q.price * (1 + delta));
          let changePct = q.changePct + delta * 100 * 0.9;
          if (Math.abs(changePct) > 9) changePct *= 0.6;
          next[c.id] = { price, changePct, live: false };
        }
        return next;
      });
      // In reference-only mode (no API key) advance the "updated" clock too.
      if (liveIds.current.size === 0) setLastUpdate(Date.now());
    }, SIM_MS);
    return () => window.clearInterval(id);
  }, []);

  // Tick the "hace Xs" label once per second.
  useEffect(() => {
    setSecondsAgo(0);
    const id = window.setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastUpdate) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lastUpdate]);

  return { quotes, liveMode, secondsAgo };
}

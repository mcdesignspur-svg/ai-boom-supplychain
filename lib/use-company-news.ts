"use client";
import { useEffect, useState } from "react";
import type { NewsItem, NewsResponse } from "./types";

export interface UseNewsResult {
  loading: boolean;
  news: NewsItem[];
}

/**
 * Fetches recent company news on demand (when a company panel opens).
 * Only fires when `enabled` (US-listed companies); OTC names skip it.
 */
export function useCompanyNews(symbol: string | null, enabled: boolean): UseNewsResult {
  const [state, setState] = useState<UseNewsResult>({ loading: false, news: [] });

  useEffect(() => {
    if (!enabled || !symbol) {
      setState({ loading: false, news: [] });
      return;
    }
    let cancelled = false;
    setState({ loading: true, news: [] });
    fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => (r.ok ? r.json() : { news: [] }))
      .then((d: NewsResponse) => {
        if (!cancelled) setState({ loading: false, news: d.news ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, news: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, enabled]);

  return state;
}

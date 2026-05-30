"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SupplyGraph from "./SupplyGraph";
import Navbar from "./Navbar";
import Toolbar from "./Toolbar";
import Legend from "./Legend";
import Tooltip from "./Tooltip";
import DetailPanel from "./DetailPanel";
import Intro from "./Intro";
import { COMPANIES, LAYERS } from "@/lib/supply-chain-data";
import type { Company, GraphNode, Layer, Quote, RiskLevel } from "@/lib/types";
import type { GraphEngine } from "@/lib/graph-engine";
import { useQuotes } from "@/lib/use-quotes";

// Companies in the raw dataset have no `type` field (only buildGraph adds it for
// the D3 engine). The panel/tooltip resolve from here and branch on `type`, so
// stamp it explicitly — otherwise company panels render empty.
const companyById: Record<string, Company> = Object.fromEntries(
  COMPANIES.map((c) => [c.id, { ...c, type: "company" as const }]),
);
const layerById: Record<string, Layer> = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
const layerRiskOf = (n: number): RiskLevel => LAYERS.find((l) => l.layer === n)?.risk ?? "MED";

interface Selection { id: string; type: "layer" | "company"; }
interface Hover { id: string; x: number; y: number; }
interface FilterState { layers: Set<number>; risks: Set<RiskLevel>; onlyLiquid: boolean; }

export default function SupplyChainApp() {
  const engineRef = useRef<GraphEngine | null>(null);
  const [ready, setReady] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [filter, setFilter] = useState<FilterState>(() => ({
    layers: new Set(LAYERS.map((l) => l.layer)),
    risks: new Set<RiskLevel>(),
    onlyLiquid: false,
  }));

  const { quotes, liveMode, secondsAgo } = useQuotes();

  /* ── theme ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") === "light") setTheme("light");
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("scm-theme", next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /* ── filter → engine ────────────────────────────────────────── */
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const passes = useCallback((node: GraphNode) => {
    const f = filterRef.current;
    if (!f.layers.has(node.layer)) return false;
    const risk = node.type === "layer" ? (node as Layer).risk : layerRiskOf(node.layer);
    if (f.risks.size && !f.risks.has(risk)) return false;
    if (node.type === "company" && f.onlyLiquid && !(node as Company).liquid) return false;
    return true;
  }, []);
  useEffect(() => {
    if (ready) engineRef.current?.setFilter(passes);
  }, [filter, ready, passes]);

  /* ── graph callbacks ────────────────────────────────────────── */
  const onReady = useCallback((engine: GraphEngine) => {
    engineRef.current = engine;
    setReady(true);
  }, []);
  const onNodeClick = useCallback((id: string) => {
    const type = id.startsWith("layer-") && layerById[id] ? "layer" : "company";
    setHover(null);
    setSelected({ id, type });
  }, []);
  const onNodeHover = useCallback((id: string | null, x: number, y: number) => {
    setHover(id ? { id, x, y } : null);
  }, []);
  const onNodeMove = useCallback((x: number, y: number) => {
    setHover((h) => (h ? { ...h, x, y } : h));
  }, []);
  const onBackgroundClick = useCallback(() => {
    setSelected(null);
    setHover(null);
  }, []);

  /* ── panel actions ──────────────────────────────────────────── */
  const closePanel = useCallback(() => {
    setSelected(null);
    engineRef.current?.deselect();
  }, []);
  const openCompany = useCallback((id: string) => {
    setSelected({ id, type: "company" });
    engineRef.current?.focusNode(id, true);
  }, []);
  const openLayer = useCallback((layer: number) => {
    const id = "layer-" + layer;
    setSelected({ id, type: "layer" });
    engineRef.current?.focusNode(id, true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closePanel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePanel]);

  /* ── filter toggles ─────────────────────────────────────────── */
  const toggleRisk = useCallback((r: RiskLevel) => {
    setFilter((f) => {
      const risks = new Set(f.risks);
      if (risks.has(r)) risks.delete(r); else risks.add(r);
      return { ...f, risks };
    });
  }, []);
  const toggleLayer = useCallback((n: number) => {
    setFilter((f) => {
      const layers = new Set(f.layers);
      if (layers.has(n)) layers.delete(n); else layers.add(n);
      return { ...f, layers };
    });
  }, []);
  const toggleAllLayers = useCallback(() => {
    setFilter((f) => {
      const layers = f.layers.size === LAYERS.length ? new Set<number>() : new Set(LAYERS.map((l) => l.layer));
      return { ...f, layers };
    });
  }, []);
  const toggleLiquid = useCallback(() => {
    setFilter((f) => ({ ...f, onlyLiquid: !f.onlyLiquid }));
  }, []);

  /* ── resolved data ──────────────────────────────────────────── */
  const getQuote = useCallback((id: string): Quote => {
    return quotes[id] ?? { price: companyById[id]?.basePrice ?? 0, changePct: 0, live: false };
  }, [quotes]);

  const selectedNode = useMemo<Layer | Company | null>(() => {
    if (!selected) return null;
    return (selected.type === "layer" ? layerById[selected.id] : companyById[selected.id]) ?? null;
  }, [selected]);

  const hoverNode = useMemo<Layer | Company | null>(() => {
    if (!hover) return null;
    return layerById[hover.id] ?? companyById[hover.id] ?? null;
  }, [hover]);

  const updatedText = secondsAgo < 3 ? "ahora mismo" : "hace " + secondsAgo + "s";

  return (
    <>
      <SupplyGraph
        onReady={onReady}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        onNodeMove={onNodeMove}
        onBackgroundClick={onBackgroundClick}
      />

      <Navbar theme={theme} liveMode={liveMode} updatedText={updatedText} onToggleTheme={toggleTheme} />

      <Toolbar
        risks={filter.risks}
        layers={filter.layers}
        onlyLiquid={filter.onlyLiquid}
        onToggleRisk={toggleRisk}
        onToggleLayer={toggleLayer}
        onToggleAllLayers={toggleAllLayers}
        onToggleLiquid={toggleLiquid}
        onZoomIn={() => engineRef.current?.zoomIn()}
        onZoomOut={() => engineRef.current?.zoomOut()}
        onResetView={() => engineRef.current?.resetView()}
      />

      <Legend />

      <div className="zoom-hint">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>drag_pan</span>
        Arrastra para mover · scroll para zoom · click en un nodo
      </div>

      <Tooltip
        node={hoverNode}
        quote={hoverNode && hoverNode.type === "company" ? getQuote(hoverNode.id) : null}
        x={hover?.x ?? 0}
        y={hover?.y ?? 0}
      />

      <DetailPanel
        node={selectedNode}
        getQuote={getQuote}
        onClose={closePanel}
        onOpenCompany={openCompany}
        onOpenLayer={openLayer}
      />

      {introVisible && <Intro onClose={() => setIntroVisible(false)} />}
    </>
  );
}

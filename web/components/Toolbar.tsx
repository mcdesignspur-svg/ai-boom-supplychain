"use client";
import { useEffect, useRef, useState } from "react";
import { LAYERS, RISK } from "@/lib/supply-chain-data";
import type { RiskLevel } from "@/lib/types";

const RISK_CHIPS: { risk: RiskLevel; label: string; color: string }[] = [
  { risk: "MAX", label: "Máx", color: "#FF5B57" },
  { risk: "HIGH", label: "Alto", color: "#F2A53C" },
  { risk: "MED", label: "Medio", color: "#4C9BEC" },
  { risk: "LOW", label: "Bajo", color: "#6FB23A" },
];

interface ToolbarProps {
  risks: Set<RiskLevel>;
  layers: Set<number>;
  onlyLiquid: boolean;
  onToggleRisk: (r: RiskLevel) => void;
  onToggleLayer: (n: number) => void;
  onToggleAllLayers: () => void;
  onToggleLiquid: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export default function Toolbar({
  risks, layers, onlyLiquid,
  onToggleRisk, onToggleLayer, onToggleAllLayers, onToggleLiquid,
  onZoomIn, onZoomOut, onResetView,
}: ToolbarProps) {
  const [ddOpen, setDdOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ddOpen) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setDdOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [ddOpen]);

  const layerCount = layers.size === LAYERS.length ? "Todas" : layers.size + " capas";

  return (
    <div className="toolbar">
      <div className="tool-group">
        <span className="tool-label">Riesgo</span>
        {RISK_CHIPS.map((c) => (
          <button
            key={c.risk}
            className={"chip risk" + (risks.has(c.risk) ? " active" : "")}
            data-risk={c.risk}
            aria-pressed={risks.has(c.risk)}
            onClick={() => onToggleRisk(c.risk)}
          >
            <span className="swatch" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}
      </div>

      <div className="tool-group">
        <div className="dd-wrap" ref={wrapRef}>
          <button
            className="chip"
            aria-expanded={ddOpen}
            onClick={(e) => { e.stopPropagation(); setDdOpen((o) => !o); }}
          >
            <span className="material-symbols-outlined">layers</span>Capas
            <span style={{ color: "var(--ink-3)", fontWeight: 700 }}>{layerCount}</span>
          </button>
          <div className={"layer-dd" + (ddOpen ? " open" : "")} onClick={(e) => e.stopPropagation()}>
            <button className="dd-row" data-all onClick={onToggleAllLayers}>
              <span className="material-symbols-outlined">done_all</span>Todas las capas
            </button>
            {LAYERS.map((l) => (
              <button
                key={l.layer}
                className={"dd-row" + (layers.has(l.layer) ? " on" : "")}
                onClick={() => onToggleLayer(l.layer)}
              >
                <span className="dd-dot" style={{ background: RISK[l.risk].color }} />
                <span className="dd-num">{String(l.layer).padStart(2, "0")}</span> {l.name}
                <span className="material-symbols-outlined dd-check">check</span>
              </button>
            ))}
          </div>
        </div>
        <button className={"chip" + (onlyLiquid ? " active" : "")} aria-pressed={onlyLiquid} onClick={onToggleLiquid}>
          <span className="material-symbols-outlined">show_chart</span>Solo líquidas
        </button>
      </div>

      <div className="tool-group">
        <button className="chip" title="Alejar" aria-label="Alejar" onClick={onZoomOut}>
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button className="chip" onClick={onResetView}>
          <span className="material-symbols-outlined">center_focus_strong</span>Centrar
        </button>
        <button className="chip" title="Acercar" aria-label="Acercar" onClick={onZoomIn}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}

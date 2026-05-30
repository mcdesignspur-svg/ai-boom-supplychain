"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { Company, Layer, Quote } from "@/lib/types";
import { RISK } from "@/lib/supply-chain-data";
import { fmtChg, fmtPrice, hexA } from "@/lib/format";

interface TooltipProps {
  node: Layer | Company | null;
  quote: Quote | null;
  x: number;
  y: number;
}

export default function Tooltip({ node, quote, x, y }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!node || !ref.current) return;
    const pad = 16;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    let left = x + 18;
    let top = y + 18;
    if (left + w + pad > window.innerWidth) left = x - w - 18;
    if (top + h + pad > window.innerHeight) top = y - h - 18;
    setPos({ left, top });
  }, [x, y, node]);

  return (
    <div ref={ref} className={"tooltip" + (node ? " show" : "")} style={{ left: pos.left, top: pos.top }}>
      {node && node.type === "layer" && <LayerTip layer={node} />}
      {node && node.type === "company" && <CompanyTip company={node} quote={quote} />}
    </div>
  );
}

function LayerTip({ layer }: { layer: Layer }) {
  const r = RISK[layer.risk];
  return (
    <>
      <div className="tt-name">{layer.name}</div>
      <div className="tt-meta">Capa {String(layer.layer).padStart(2, "0")}</div>
      <div className="tt-badge" style={{ background: hexA(r.color, 0.16), color: r.color }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>warning</span>
        {r.label}
      </div>
    </>
  );
}

function CompanyTip({ company, quote }: { company: Company; quote: Quote | null }) {
  const price = quote?.price ?? company.basePrice;
  const changePct = quote?.changePct ?? company.baseChangePct;
  const up = changePct >= 0;
  return (
    <>
      <div className="tt-name">{company.shortName}</div>
      <div className="tt-meta">{company.ticker} · {company.exchange}</div>
      <div className="tt-row">
        <span className="tt-price">{fmtPrice(price)}</span>
        <span className={"chg " + (up ? "up" : "down")}>{fmtChg(changePct)}</span>
      </div>
    </>
  );
}

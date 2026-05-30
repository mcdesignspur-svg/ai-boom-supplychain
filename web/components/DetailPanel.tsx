"use client";
import { useEffect, useState } from "react";
import { COMPANIES, LAYERS, RISK } from "@/lib/supply-chain-data";
import type { Company, Layer, Quote } from "@/lib/types";
import { fmtCap, fmtChg, fmtPrice, hexA, sparkPath, sparkSeries } from "@/lib/format";

const UP = "#3ECF8E";
const DOWN = "#FF6B66";

interface DetailPanelProps {
  node: Layer | Company | null;
  getQuote: (id: string) => Quote;
  onClose: () => void;
  onOpenCompany: (id: string) => void;
  onOpenLayer: (layer: number) => void;
}

export default function DetailPanel({ node, getQuote, onClose, onOpenCompany, onOpenLayer }: DetailPanelProps) {
  // Retain the last node during the slide-out transition so it doesn't blank.
  const [last, setLast] = useState<Layer | Company | null>(node);
  useEffect(() => {
    if (node) setLast(node);
  }, [node]);

  const open = !!node;
  const content = node ?? last;

  return (
    <aside className={"panel" + (open ? " open" : "")} aria-hidden={!open}>
      <div className="panel-grip" />
      {content && content.type === "layer" && (
        <LayerPanel layer={content} onClose={onClose} onOpenCompany={onOpenCompany} />
      )}
      {content && content.type === "company" && (
        <CompanyPanel company={content} quote={getQuote(content.id)} onClose={onClose} onOpenLayer={onOpenLayer} />
      )}
    </aside>
  );
}

function PanelClose({ onClose }: { onClose: () => void }) {
  return (
    <button className="panel-close" aria-label="Cerrar panel" onClick={onClose}>
      <span className="material-symbols-outlined">close</span>
    </button>
  );
}

function LayerPanel({ layer, onClose, onOpenCompany }: { layer: Layer; onClose: () => void; onOpenCompany: (id: string) => void }) {
  const r = RISK[layer.risk];
  const cos = COMPANIES.filter((c) => c.layer === layer.layer);
  return (
    <>
      <div className="panel-top">
        <div>
          <div className="panel-eyebrow">Capa {String(layer.layer).padStart(2, "0")} · Cadena de suministro</div>
          <h2 className="panel-name">{layer.name}</h2>
          <div className="panel-meta">
            <span className="risk-badge" style={{ background: hexA(r.color, 0.16), color: r.color }}>
              <span className="material-symbols-outlined">warning</span>{r.label}
            </span>
            <span className="meta-tag">{cos.length} compañías</span>
          </div>
        </div>
        <PanelClose onClose={onClose} />
      </div>
      <div className="panel-scroll">
        <div className="section-label">Qué ocurre aquí</div>
        <p className="body">{layer.description}</p>
        <div className="chokepoint">
          <div className="cp-head"><span className="material-symbols-outlined">bolt</span>Chokepoint principal</div>
          <p>{layer.bottleneck}</p>
        </div>
        <div className="section-label">Compañías en esta capa</div>
        <div className="co-list">
          {cos.map((c) => (
            <button key={c.id} className="co-chip" onClick={() => onOpenCompany(c.id)}>
              <span className="codot" style={{ background: r.color }} />
              {c.shortName}
              <span className="tk">{c.ticker}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function CompanyPanel({ company, quote, onClose, onOpenLayer }: { company: Company; quote: Quote; onClose: () => void; onOpenLayer: (layer: number) => void }) {
  const layer = LAYERS.find((l) => l.layer === company.layer)!;
  const r = RISK[layer.risk];
  const price = quote.price;
  const changePct = quote.changePct;
  const up = changePct >= 0;
  const live = quote.live;

  const series = sparkSeries(company.ticker + company.id, price, changePct);
  const sLo = Math.min(...series);
  const sHi = Math.max(...series);
  const line = sparkPath(series, 280, 52);
  const yfUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(company.ticker)}`;

  return (
    <>
      <div className="panel-top">
        <div>
          <div className="panel-eyebrow">{company.ticker} · {company.exchange}</div>
          <h2 className="panel-name">{company.shortName}</h2>
          <div className="panel-meta">
            <span className="meta-tag">{company.name}</span>
          </div>
          <div className="panel-meta">
            <button className="meta-tag" onClick={() => onOpenLayer(company.layer)}>
              <span className="codot" style={{ width: 7, height: 7, borderRadius: "50%", background: r.color }} />
              Capa {String(company.layer).padStart(2, "0")} · {layer.name}
            </button>
          </div>
        </div>
        <PanelClose onClose={onClose} />
      </div>
      <div className="panel-scroll">
        <div className="section-label">
          Mercado{" "}
          <span style={{ color: live ? "var(--accent)" : "var(--mc-warning)", fontWeight: 700 }}>
            {live ? "· en vivo" : "· datos de referencia"}
          </span>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-val price">{fmtPrice(price)}</div>
            <div className="stat-label">Precio</div>
          </div>
          <div className="stat">
            <div className="stat-val" style={{ color: up ? UP : DOWN }}>{fmtChg(changePct)}</div>
            <div className="stat-label">Cambio 24h</div>
          </div>
          <div className="stat">
            <div className="stat-val">{fmtCap(company.marketCap)}</div>
            <div className="stat-label">Market cap</div>
          </div>
        </div>
        {!company.liquid && (
          <div className="offline-note">
            <span className="material-symbols-outlined">info</span>
            Cotiza OTC — datos de referencia, baja cobertura en tiempo real.
          </div>
        )}
        <div className="section-label">Precio · 7 días</div>
        <div className="spark-wrap">
          <div className="spark-head">
            <span className="t">{company.ticker}</span>
            <span className="r">{fmtPrice(sLo)} — {fmtPrice(sHi)}</span>
          </div>
          <svg className="spark-svg" viewBox="0 0 280 56" preserveAspectRatio="none">
            <path d={`${line} L280,56 L0,56 Z`} fill={up ? "rgba(62,207,142,0.12)" : "rgba(255,107,102,0.12)"} stroke="none" />
            <path d={line} fill="none" stroke={up ? UP : DOWN} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div className="section-label">Rol en la cadena</div>
        <p className="body">{company.role}</p>
        <div className="section-label">Sede</div>
        <p className="body" style={{ color: "var(--ink)" }}>{company.hq}</p>
        <a className="link-out" href={yfUrl} target="_blank" rel="noopener noreferrer">
          Ver en Yahoo Finance <span className="material-symbols-outlined">arrow_outward</span>
        </a>
      </div>
    </>
  );
}

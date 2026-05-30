"use client";
import { useState } from "react";

export default function Intro({ onClose }: { onClose: () => void }) {
  const [hiding, setHiding] = useState(false);

  function start() {
    setHiding(true);
    window.setTimeout(onClose, 600);
  }

  return (
    <div className={"intro" + (hiding ? " hide" : "")}>
      <div className="intro-card">
        <div className="eyebrow">AI Boom · Supply Chain Map</div>
        <h1>
          Del silicio
          <br />
          al modelo.
        </h1>
        <p>
          La cadena de suministro de la IA en 8 capas y ~37 compañías públicas — desde la arena de silicio
          hasta los hyperscalers. Cada nodo es una pieza del rompecabezas. Los cuellos de botella son las
          oportunidades.
        </p>
        <div className="start">
          <button className="btn btn-primary" onClick={start}>
            Explorar la cadena <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </div>
        <div className="fine">
          <span className="material-symbols-outlined">info</span>
          Precios en vivo donde hay cobertura; los OTC muestran datos de referencia.
        </div>
      </div>
    </div>
  );
}

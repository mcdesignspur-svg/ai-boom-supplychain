"use client";
import { useEffect, useRef } from "react";
import { createGraphEngine, type GraphEngine } from "@/lib/graph-engine";

interface SupplyGraphProps {
  onReady: (engine: GraphEngine) => void;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null, x: number, y: number) => void;
  onNodeMove: (x: number, y: number) => void;
  onBackgroundClick: () => void;
}

export default function SupplyGraph(props: SupplyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Keep the latest callbacks without re-initializing the engine.
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const engine = createGraphEngine(el, {
      onNodeClick: (id) => propsRef.current.onNodeClick(id),
      onNodeHover: (id, cx, cy) => propsRef.current.onNodeHover(id, cx, cy),
      onNodeMove: (cx, cy) => propsRef.current.onNodeMove(cx, cy),
      onBackgroundClick: () => propsRef.current.onBackgroundClick(),
    });
    propsRef.current.onReady(engine);
    return () => engine.destroy();
  }, []);

  return (
    <div id="stage">
      <svg id="graph" ref={svgRef} role="img" aria-label="Grafo de la cadena de suministro de la IA" />
    </div>
  );
}

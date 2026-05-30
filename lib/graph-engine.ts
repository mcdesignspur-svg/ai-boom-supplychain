/* ──────────────────────────────────────────────────────────────
   AI Supply Chain Map — Force-directed graph engine (d3-force)
   Framework-agnostic: owns the SVG imperatively so React never
   fights D3. React mounts it via a ref and talks to it through the
   returned API + callbacks. Ported from the prototype's graph.js.
   ────────────────────────────────────────────────────────────── */
/* d3's selection/zoom/drag generics don't compose cleanly across
   .append()/.call() chains; a few narrow `any` casts at those seams keep
   the engine readable without weakening types elsewhere. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { select, type Selection } from "d3-selection";
import {
  forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY,
  type Simulation,
} from "d3-force";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom";
import { drag } from "d3-drag";
import { easeCubicOut } from "d3-ease";
import "d3-transition"; // augments selection.prototype.transition()

import { buildGraph, RISK } from "./supply-chain-data";
import type { GraphLink, GraphNode, RiskLevel } from "./types";

const LAYER_GAP = 158;
const LAYER_RADIUS: Record<RiskLevel, number> = { MAX: 42, HIGH: 38, MED: 34, LOW: 30 };

export interface GraphCallbacks {
  onNodeClick?: (id: string) => void;
  onNodeHover?: (id: string | null, clientX: number, clientY: number) => void;
  onNodeMove?: (clientX: number, clientY: number) => void;
  onBackgroundClick?: () => void;
}

export interface GraphEngine {
  setFilter: (fn: (n: GraphNode) => boolean) => void;
  focusNode: (id: string, openSelect?: boolean) => void;
  resetView: (instant?: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  select: (id: string) => void;
  deselect: () => void;
  getNode: (id: string) => GraphNode | undefined;
  layerRiskOf: (layer: number) => RiskLevel;
  destroy: () => void;
}

type AnySel = Selection<any, any, any, any>;

function layerY(layer: number) { return (layer - 4.5) * LAYER_GAP; }
function companyR(c: GraphNode) {
  const marketCap = (c as { marketCap?: number }).marketCap || 5e9;
  const r = 10 + Math.sqrt(marketCap / 1e9) / 2.7;
  return Math.max(11, Math.min(21, r));
}
function nodeRadius(n: GraphNode) {
  return n.type === "layer" ? LAYER_RADIUS[(n as { risk: RiskLevel }).risk] : companyR(n);
}

export function createGraphEngine(svgEl: SVGSVGElement, callbacks: GraphCallbacks = {}): GraphEngine {
  const cb = callbacks;
  const svg = select(svgEl) as AnySel;

  const data = buildGraph();
  const nodes = data.nodes as GraphNode[];
  const links = data.links as GraphLink[];
  const nodeById: Record<string, GraphNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

  let width = 0, height = 0;
  let filterFn: (n: GraphNode) => boolean = () => true;
  let selectedId: string | null = null;

  // adjacency for highlight
  const adjacency: Record<string, Set<string>> = {};
  nodes.forEach((n) => (adjacency[n.id] = new Set([n.id])));
  links.forEach((l) => {
    const s = typeof l.source === "object" ? l.source.id : l.source;
    const t = typeof l.target === "object" ? l.target.id : l.target;
    adjacency[s].add(t); adjacency[t].add(s);
  });

  // seed positions: layers in a column, companies fanned around
  const perLayerIndex: Record<number, number> = {};
  nodes.forEach((n) => {
    if (n.type === "layer") { n.x = 0; n.y = layerY(n.layer); }
    else {
      perLayerIndex[n.layer] = perLayerIndex[n.layer] || 0;
      const i = perLayerIndex[n.layer]++;
      const ang = (i % 2 ? 1 : -1) * (0.5 + 0.5 * i);
      n.x = Math.cos(ang) * 150 * (i % 2 ? 1 : -1);
      n.y = layerY(n.layer) + Math.sin(ang) * 40;
    }
  });

  function layerRiskOf(layer: number): RiskLevel {
    const l = nodes.find((n) => n.type === "layer" && n.layer === layer) as { risk: RiskLevel } | undefined;
    return l ? l.risk : "MED";
  }

  // defs (arrow marker)
  const defs = svg.append("defs");
  defs.append("marker")
    .attr("id", "arrow").attr("viewBox", "0 -5 10 10")
    .attr("refX", 18).attr("refY", 0)
    .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
    .append("path").attr("d", "M0,-4L9,0L0,4")
    .attr("fill", "var(--link)");

  const gZoom = svg.append("g").attr("class", "zoom-layer");
  const gLinks = gZoom.append("g").attr("class", "links");
  const gNodes = gZoom.append("g").attr("class", "nodes");

  // links
  const linkSel = gLinks.selectAll<SVGPathElement, GraphLink>("path.link")
    .data(links).join("path")
    .attr("class", (d) => "link " + d.kind)
    .attr("stroke", (d) => (d.kind === "belongs-to" && d.layer ? RISK[layerRiskOf(d.layer)].color : null))
    .attr("stroke-opacity", (d) => (d.kind === "belongs-to" ? 0.22 : d.kind === "layer-chain" ? 0.5 : 0.3))
    .attr("marker-end", (d) => (d.kind === "company-dep" ? "url(#arrow)" : null));

  // nodes
  const nodeSel = gNodes.selectAll<SVGGElement, GraphNode>("g.node")
    .data(nodes, (d) => d.id).join("g")
    .attr("class", (d) => "node " + d.type)
    .call(makeDrag());

  nodeSel.each(function (d) {
    const g = select(this);
    const r = nodeRadius(d);
    if (d.type === "layer") {
      const risk = RISK[(d as { risk: RiskLevel }).risk];
      g.append("circle").attr("class", "halo")
        .attr("r", r + 6).attr("fill", risk.color).attr("opacity", 0.14);
      g.append("circle").attr("class", "core")
        .attr("r", r).attr("fill", risk.color)
        .attr("stroke", "rgba(255,255,255,0.85)").attr("stroke-width", 1.25)
        .style("filter", `drop-shadow(0 0 14px ${risk.glow})`);
      g.append("text").attr("class", "node-label layer-num")
        .attr("text-anchor", "middle").attr("dy", "0.36em")
        .attr("fill", "#fff").attr("stroke", "none")
        .style("font-size", "18px").style("font-weight", "900")
        .text(String(d.layer).padStart(2, "0"));
      g.append("text").attr("class", "node-label layer-label")
        .attr("text-anchor", "middle").attr("dy", r + 18)
        .style("font-size", "14px")
        .text(d.name);
      g.append("text").attr("class", "node-label layer-sub")
        .attr("text-anchor", "middle").attr("dy", r + 33)
        .attr("fill", risk.color).attr("stroke", "none")
        .text("Capa " + String(d.layer).padStart(2, "0"));
    } else {
      g.append("circle").attr("class", "ring")
        .attr("r", r + 4).attr("stroke", "var(--node-rest-ring)").attr("stroke-width", 1);
      g.append("circle").attr("class", "core")
        .attr("r", r).attr("fill", "var(--node-rest)")
        .attr("stroke", "rgba(255,255,255,0.25)").attr("stroke-width", 1);
      g.append("text").attr("class", "node-label company-label")
        .attr("text-anchor", "middle").attr("dy", r + 13)
        .text((d as { ticker: string }).ticker);
    }
  });

  nodeSel
    .on("mouseenter", (e: MouseEvent, d) => { hoverHighlight(d.id); cb.onNodeHover?.(d.id, e.clientX, e.clientY); })
    .on("mousemove", (e: MouseEvent) => { cb.onNodeMove?.(e.clientX, e.clientY); })
    .on("mouseleave", (e: MouseEvent) => { if (!selectedId) clearHighlight(); else applyHighlight(selectedId); cb.onNodeHover?.(null, e.clientX, e.clientY); })
    .on("click", (e: MouseEvent, d) => { e.stopPropagation(); selectNode(d.id); cb.onNodeClick?.(d.id); });

  // simulation
  const sim: Simulation<GraphNode, GraphLink> = forceSimulation<GraphNode>(nodes)
    .force("link", forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance((d) => {
      if (d.kind === "belongs-to") return 78;
      if (d.kind === "layer-chain") return LAYER_GAP;
      return 150;
    }).strength((d) => (d.kind === "layer-chain" ? 0.04 : d.kind === "belongs-to" ? 0.6 : 0.06)))
    .force("charge", forceManyBody().strength((d) => ((d as GraphNode).type === "layer" ? -780 : -150)))
    .force("collide", forceCollide<GraphNode>((d) => nodeRadius(d) + (d.type === "layer" ? 30 : 12)))
    .force("y", forceY<GraphNode>((d) => layerY(d.layer)).strength((d) => (d.type === "layer" ? 0.95 : 0.22)))
    .force("x", forceX<GraphNode>(0).strength((d) => (d.type === "layer" ? 0.14 : 0.02)))
    .on("tick", ticked);

  function ticked() {
    linkSel.attr("d", (d) => {
      const s = d.source as GraphNode, t = d.target as GraphNode;
      const sx = s.x!, sy = s.y!, tx = t.x!, ty = t.y!;
      if (d.kind === "company-dep") {
        const dx = tx - sx, dy = ty - sy;
        const dr = Math.hypot(dx, dy) * 1.6;
        return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
      }
      return `M${sx},${sy}L${tx},${ty}`;
    });
    nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  // zoom / pan
  const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.25, 3])
    .on("zoom", (e) => { gZoom.attr("transform", e.transform.toString()); });
  svg.call(zoomBehavior as any).on("dblclick.zoom", null);
  svg.on("click", () => { deselect(); cb.onBackgroundClick?.(); });

  function makeDrag() {
    return drag<SVGGElement, GraphNode>()
      .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); if (d.type !== "layer") { d.fx = null; d.fy = null; } });
  }

  /* ── highlight / selection ──────────────────────────────────── */
  function hoverHighlight(id: string) {
    if (selectedId) return; // selection takes precedence
    applyHighlight(id);
  }
  function applyHighlight(id: string) {
    const nbrs = adjacency[id] || new Set([id]);
    gNodes.selectAll<SVGGElement, GraphNode>("g.node")
      .classed("faded", (d) => filterFn(d) && !nbrs.has(d.id))
      .classed("hovered", (d) => d.id === id);
    gLinks.selectAll<SVGPathElement, GraphLink>("path.link").style("stroke-opacity", (l) => {
      const s = (l.source as GraphNode).id, t = (l.target as GraphNode).id;
      const on = s === id || t === id;
      if (on) return l.kind === "belongs-to" ? 0.6 : 0.85;
      return 0.05;
    });
  }
  function clearHighlight() {
    gNodes.selectAll<SVGGElement, GraphNode>("g.node").classed("faded", false).classed("hovered", false);
    gLinks.selectAll<SVGPathElement, GraphLink>("path.link").style("stroke-opacity", (d) =>
      d.kind === "belongs-to" ? 0.22 : d.kind === "layer-chain" ? 0.5 : 0.3);
    applyFilterClasses();
  }

  function selectNode(id: string) {
    selectedId = id;
    gNodes.selectAll<SVGGElement, GraphNode>("g.node").classed("selected", (d) => d.id === id);
    applyHighlight(id);
  }
  function deselect() {
    selectedId = null;
    gNodes.selectAll<SVGGElement, GraphNode>("g.node").classed("selected", false);
    clearHighlight();
  }

  /* ── filtering ──────────────────────────────────────────────── */
  function setFilter(fn: (n: GraphNode) => boolean) {
    filterFn = fn || (() => true);
    applyFilterClasses();
    if (selectedId) applyHighlight(selectedId);
  }
  function applyFilterClasses() {
    gNodes.selectAll<SVGGElement, GraphNode>("g.node")
      .classed("dim", (d) => !filterFn(d))
      .style("pointer-events", (d) => (filterFn(d) ? "all" : "none"));
    gLinks.selectAll<SVGPathElement, GraphLink>("path.link").classed("dim", (d) => {
      const s = typeof d.source === "object" ? d.source : nodeById[d.source];
      const t = typeof d.target === "object" ? d.target : nodeById[d.target];
      return !(filterFn(s) && filterFn(t));
    });
  }

  /* ── view controls ──────────────────────────────────────────── */
  function resetView(instant?: boolean) {
    const pad = 80, topInset = 132, botInset = 56;
    const availH = Math.max(120, height - topInset - botInset);
    const xs = nodes.map((n) => n.x!), ys = nodes.map((n) => n.y!);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = (maxX - minX) + pad * 2, h = (maxY - minY) + pad * 2;
    const scale = Math.min(width / w, availH / h, 1.05);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const t = zoomIdentity
      .translate(width / 2 - cx * scale, topInset + availH / 2 - cy * scale)
      .scale(scale);
    (instant ? svg : svg.transition().duration(650).ease(easeCubicOut)).call(zoomBehavior.transform as any, t);
  }

  function focusNode(id: string, openSelect?: boolean) {
    const n = nodeById[id]; if (!n) return;
    if (openSelect) selectNode(id);
    const scale = Math.max(0.8, Math.min(1.6, zoomTransform(svgEl).k));
    const t = zoomIdentity.translate(width / 2 - n.x! * scale, height / 2 - n.y! * scale).scale(scale);
    svg.transition().duration(550).ease(easeCubicOut).call(zoomBehavior.transform as any, t);
  }

  function zoomByFactor(f: number) { svg.transition().duration(220).call(zoomBehavior.scaleBy as any, f); }

  /* ── sizing ─────────────────────────────────────────────────── */
  function resize() {
    const r = svgEl.getBoundingClientRect();
    width = r.width; height = r.height;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
  }

  // Boot: size, then settle the layout SYNCHRONOUSLY (never depends on rAF,
  // which is throttled when the tab/iframe isn't focused and would otherwise
  // leave nodes stacked on first paint).
  resize();
  sim.stop();
  for (let i = 0; i < 420; i++) sim.tick();
  ticked();
  resetView(true);

  window.addEventListener("resize", resize);

  return {
    setFilter,
    focusNode,
    resetView,
    zoomIn: () => zoomByFactor(1.35),
    zoomOut: () => zoomByFactor(1 / 1.35),
    select: selectNode,
    deselect,
    getNode: (id) => nodeById[id],
    layerRiskOf,
    destroy() {
      window.removeEventListener("resize", resize);
      sim.stop();
      svg.on(".zoom", null);
      svg.selectAll("*").remove();
    },
  };
}

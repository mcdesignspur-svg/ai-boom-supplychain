/* ──────────────────────────────────────────────────────────────
   AI Supply Chain Map — Force-directed graph (D3 v7, d3-force)
   Vanilla JS — owns the SVG directly so React never fights D3.
   ────────────────────────────────────────────────────────────── */
(function () {
  const { buildGraph, RISK } = window.SCM;

  const LAYER_GAP = 158;
  const LAYER_RADIUS = { MAX: 42, HIGH: 38, MED: 34, LOW: 30 };

  function layerY(layer) { return (layer - 4.5) * LAYER_GAP; }
  function companyR(c) {
    const r = 10 + Math.sqrt((c.marketCap || 5e9) / 1e9) / 2.7;
    return Math.max(11, Math.min(21, r));
  }
  function nodeRadius(n) { return n.type === "layer" ? LAYER_RADIUS[n.risk] : companyR(n); }

  let svg, gZoom, gLinks, gNodes, gLabels, zoom, sim, width, height;
  let nodes, links, nodeById, adjacency;
  let cb = {};
  let filterFn = () => true;
  let selectedId = null;

  function init(svgEl, callbacks) {
    cb = callbacks || {};
    svg = d3.select(svgEl);
    const data = buildGraph();
    nodes = data.nodes;
    links = data.links;
    nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

    // adjacency for highlight
    adjacency = {};
    nodes.forEach(n => (adjacency[n.id] = new Set([n.id])));
    links.forEach(l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      adjacency[s].add(t); adjacency[t].add(s);
    });

    // seed positions: layers in a column, companies fanned around
    const perLayerIndex = {};
    nodes.forEach(n => {
      if (n.type === "layer") { n.x = 0; n.y = layerY(n.layer); }
      else {
        perLayerIndex[n.layer] = (perLayerIndex[n.layer] || 0);
        const i = perLayerIndex[n.layer]++;
        const ang = (i % 2 ? 1 : -1) * (0.5 + 0.5 * i);
        n.x = Math.cos(ang) * 150 * (i % 2 ? 1 : -1);
        n.y = layerY(n.layer) + Math.sin(ang) * 40;
      }
    });

    // defs (arrow marker)
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow").attr("viewBox", "0 -5 10 10")
      .attr("refX", 18).attr("refY", 0)
      .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
      .append("path").attr("d", "M0,-4L9,0L0,4")
      .attr("fill", "var(--link)");

    gZoom = svg.append("g").attr("class", "zoom-layer");
    gLinks = gZoom.append("g").attr("class", "links");
    gNodes = gZoom.append("g").attr("class", "nodes");

    // links
    const linkSel = gLinks.selectAll("path.link")
      .data(links).join("path")
      .attr("class", d => "link " + d.kind)
      .attr("stroke", d => d.kind === "belongs-to" && d.layer ? RISK[layerRiskOf(d.layer)].color : null)
      .attr("stroke-opacity", d => d.kind === "belongs-to" ? 0.22 : (d.kind === "layer-chain" ? 0.5 : 0.3))
      .attr("marker-end", d => d.kind === "company-dep" ? "url(#arrow)" : null);

    // nodes
    const nodeSel = gNodes.selectAll("g.node")
      .data(nodes, d => d.id).join("g")
      .attr("class", d => "node " + d.type)
      .call(drag());

    nodeSel.each(function (d) {
      const g = d3.select(this);
      const r = nodeRadius(d);
      if (d.type === "layer") {
        const risk = RISK[d.risk];
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
          .text(d.ticker);
      }
    });

    nodeSel
      .on("mouseenter", (e, d) => { hoverHighlight(d.id); cb.onNodeHover && cb.onNodeHover(d, e); })
      .on("mousemove", (e, d) => { cb.onNodeMove && cb.onNodeMove(d, e); })
      .on("mouseleave", (e, d) => { if (!selectedId) clearHighlight(); else applyHighlight(selectedId); cb.onNodeHover && cb.onNodeHover(null, e); })
      .on("click", (e, d) => { e.stopPropagation(); select(d.id); cb.onNodeClick && cb.onNodeClick(d); });

    // simulation
    sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => {
        if (d.kind === "belongs-to") return 78;
        if (d.kind === "layer-chain") return LAYER_GAP;
        return 150;
      }).strength(d => d.kind === "layer-chain" ? 0.04 : (d.kind === "belongs-to" ? 0.6 : 0.06)))
      .force("charge", d3.forceManyBody().strength(d => d.type === "layer" ? -780 : -150))
      .force("collide", d3.forceCollide(d => nodeRadius(d) + (d.type === "layer" ? 30 : 12)))
      .force("y", d3.forceY(d => layerY(d.layer)).strength(d => d.type === "layer" ? 0.95 : 0.22))
      .force("x", d3.forceX(0).strength(d => d.type === "layer" ? 0.14 : 0.02))
      .on("tick", ticked);

    function ticked() {
      linkSel.attr("d", d => {
        const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
        if (d.kind === "company-dep") {
          const dx = tx - sx, dy = ty - sy;
          const dr = Math.hypot(dx, dy) * 1.6;
          return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
        }
        return `M${sx},${sy}L${tx},${ty}`;
      });
      nodeSel.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    // zoom / pan
    zoom = d3.zoom().scaleExtent([0.25, 3]).on("zoom", (e) => {
      gZoom.attr("transform", e.transform);
    });
    svg.call(zoom).on("dblclick.zoom", null);
    svg.on("click", () => { deselect(); cb.onBackgroundClick && cb.onBackgroundClick(); });

    resize();
    // Settle the layout SYNCHRONOUSLY so it never depends on requestAnimationFrame
    // (rAF is throttled when the iframe isn't focused, which would leave nodes stacked).
    sim.stop();
    for (let i = 0; i < 420; i++) sim.tick();
    ticked();           // paint the settled positions once
    resetView(true);    // fit to viewport

    window.addEventListener("resize", resize);
  }

  function layerRiskOf(layer) {
    const l = nodes.find(n => n.type === "layer" && n.layer === layer);
    return l ? l.risk : "MED";
  }

  function resize() {
    const r = svg.node().getBoundingClientRect();
    width = r.width; height = r.height;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
  }

  function drag() {
    return d3.drag()
      .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); if (d.type !== "layer") { d.fx = null; d.fy = null; } });
  }

  /* ── highlight / selection ──────────────────────────────────── */
  function hoverHighlight(id) {
    if (selectedId) return; // selection takes precedence
    applyHighlight(id);
  }
  function applyHighlight(id) {
    const nbrs = adjacency[id] || new Set([id]);
    gNodes.selectAll("g.node").classed("faded", d => filterFn(d) && !nbrs.has(d.id))
      .classed("hovered", d => d.id === id);
    gLinks.selectAll("path.link").style("stroke-opacity", l => {
      const s = l.source.id, t = l.target.id;
      const on = s === id || t === id;
      if (on) return l.kind === "belongs-to" ? 0.6 : 0.85;
      return 0.05;
    });
  }
  function clearHighlight() {
    gNodes.selectAll("g.node").classed("faded", false).classed("hovered", false);
    gLinks.selectAll("path.link").style("stroke-opacity", d =>
      d.kind === "belongs-to" ? 0.22 : (d.kind === "layer-chain" ? 0.5 : 0.3));
    applyFilterClasses();
  }

  function select(id) {
    selectedId = id;
    gNodes.selectAll("g.node").classed("selected", d => d.id === id);
    applyHighlight(id);
  }
  function deselect() {
    selectedId = null;
    gNodes.selectAll("g.node").classed("selected", false);
    clearHighlight();
  }

  /* ── filtering ──────────────────────────────────────────────── */
  function setFilter(fn) {
    filterFn = fn || (() => true);
    applyFilterClasses();
    if (selectedId) applyHighlight(selectedId);
  }
  function applyFilterClasses() {
    gNodes.selectAll("g.node")
      .classed("dim", d => !filterFn(d))
      .style("pointer-events", d => filterFn(d) ? "all" : "none");
    gLinks.selectAll("path.link").classed("dim", d => {
      const s = typeof d.source === "object" ? d.source : nodeById[d.source];
      const t = typeof d.target === "object" ? d.target : nodeById[d.target];
      return !(filterFn(s) && filterFn(t));
    });
  }

  /* ── view controls ──────────────────────────────────────────── */
  function resetView(instant) {
    const pad = 80, topInset = 132, botInset = 56;
    const availH = Math.max(120, height - topInset - botInset);
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = (maxX - minX) + pad * 2, h = (maxY - minY) + pad * 2;
    const scale = Math.min(width / w, availH / h, 1.05);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const t = d3.zoomIdentity
      .translate(width / 2 - cx * scale, topInset + availH / 2 - cy * scale)
      .scale(scale);
    (instant ? svg : svg.transition().duration(650).ease(d3.easeCubicOut)).call(zoom.transform, t);
  }

  function focusNode(id, openSelect) {
    const n = nodeById[id]; if (!n) return;
    if (openSelect) select(id);
    const scale = Math.max(0.8, Math.min(1.6, d3.zoomTransform(svg.node()).k));
    const t = d3.zoomIdentity.translate(width / 2 - n.x * scale, height / 2 - n.y * scale).scale(scale);
    svg.transition().duration(550).ease(d3.easeCubicOut).call(zoom.transform, t);
  }

  function zoomBy(f) { svg.transition().duration(220).call(zoom.scaleBy, f); }

  window.Graph = {
    init, setFilter, focusNode, resetView,
    zoomIn: () => zoomBy(1.35), zoomOut: () => zoomBy(1 / 1.35),
    deselect, select,
    getNode: id => nodeById[id],
    getNodes: () => nodes,
    layerRiskOf
  };
})();

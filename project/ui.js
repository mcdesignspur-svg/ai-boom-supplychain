/* ──────────────────────────────────────────────────────────────
   AI Supply Chain Map — UI wiring
   Navbar · toolbar/filters · detail panel · tooltip · theme ·
   simulated live tick · sparkline.
   ────────────────────────────────────────────────────────────── */
(function () {
  const { LAYERS, COMPANIES, RISK } = window.SCM;
  const G = window.Graph;
  const $ = s => document.querySelector(s);

  /* ── formatting ─────────────────────────────────────────────── */
  const fmtPrice = v => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtChg = v => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
  function fmtCap(v) {
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9)  return "$" + (v / 1e9).toFixed(0) + "B";
    return "$" + (v / 1e6).toFixed(0) + "M";
  }
  const riskMeta = r => RISK[r];

  /* deterministic pseudo-random from string (stable sparklines) */
  function seedRand(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function sparkSeries(c, n = 28) {
    const rnd = seedRand(c.ticker + c.id);
    const drift = (c.changePct || 0) / 100 / n;
    let v = c.price * (1 - (c.changePct || 0) / 100 * 1.4);
    const out = [v];
    for (let i = 1; i < n; i++) {
      v = v * (1 + drift + (rnd() - 0.5) * 0.018);
      out.push(v);
    }
    out[n - 1] = c.price;
    return out;
  }
  function sparkPath(series, w, h) {
    const min = Math.min(...series), max = Math.max(...series), span = (max - min) || 1;
    const stepX = w / (series.length - 1);
    return series.map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`).join(" ");
  }

  /* ── THEME ──────────────────────────────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("#nav-logo").src = t === "light" ? "assets/MC-Designs-Logo.svg" : "assets/MC-Designs-Logo-white.svg";
    const ic = $("#theme-toggle .material-symbols-outlined");
    if (ic) ic.textContent = t === "light" ? "dark_mode" : "light_mode";
    try { localStorage.setItem("scm-theme", t); } catch (e) {}
  }
  function initTheme() {
    let t = "dark";
    try { t = localStorage.getItem("scm-theme") || "dark"; } catch (e) {}
    applyTheme(t);
    $("#theme-toggle").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "light" ? "dark" : "light");
    });
  }

  /* ── TOOLTIP ────────────────────────────────────────────────── */
  const tip = $("#tooltip");
  function showTip(node, evt) {
    if (!node) { tip.classList.remove("show"); return; }
    let html = "";
    if (node.type === "layer") {
      const r = riskMeta(node.risk);
      html = `<div class="tt-name">${node.name}</div>
        <div class="tt-meta">Capa ${String(node.layer).padStart(2,"0")}</div>
        <div class="tt-badge" style="background:${hexA(r.color,0.16)};color:${r.color}">
          <span class="material-symbols-outlined" style="font-size:13px">warning</span>${r.label}</div>`;
    } else {
      const up = (node.changePct || 0) >= 0;
      html = `<div class="tt-name">${node.shortName}</div>
        <div class="tt-meta">${node.ticker} · ${node.exchange}</div>
        <div class="tt-row"><span class="tt-price">${fmtPrice(node.price)}</span>
        <span class="chg ${up ? "up" : "down"}">${fmtChg(node.changePct)}</span></div>`;
    }
    tip.innerHTML = html;
    tip.classList.add("show");
    moveTip(evt);
  }
  function moveTip(evt) {
    if (!evt) return;
    const pad = 16, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = evt.clientX + 18, y = evt.clientY + 18;
    if (x + w + pad > window.innerWidth) x = evt.clientX - w - 18;
    if (y + h + pad > window.innerHeight) y = evt.clientY - h - 18;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ── DETAIL PANEL ───────────────────────────────────────────── */
  const panel = $("#panel");
  let openNode = null;

  function openPanel(node) {
    openNode = node;
    panel.innerHTML = node.type === "layer" ? layerPanel(node) : companyPanel(node);
    panel.classList.add("open");
    bindPanel();
  }
  function closePanel() {
    panel.classList.remove("open");
    openNode = null;
    G.deselect();
  }

  function layerPanel(l) {
    const r = riskMeta(l.risk);
    const cos = COMPANIES.filter(c => c.layer === l.layer);
    const chips = cos.map(c => `<button class="co-chip" data-id="${c.id}">
      <span class="codot" style="background:${r.color}"></span>${c.shortName}
      <span class="tk">${c.ticker}</span></button>`).join("");
    return `
      <div class="panel-top">
        <div>
          <div class="panel-eyebrow">Capa ${String(l.layer).padStart(2,"0")} · Cadena de suministro</div>
          <h2 class="panel-name">${l.name}</h2>
          <div class="panel-meta">
            <span class="risk-badge" style="background:${hexA(r.color,0.16)};color:${r.color}">
              <span class="material-symbols-outlined">warning</span>${r.label}</span>
            <span class="meta-tag">${cos.length} compañías</span>
          </div>
        </div>
        <button class="panel-close" data-close><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="panel-scroll">
        <div class="section-label">Qué ocurre aquí</div>
        <p class="body">${l.description}</p>
        <div class="chokepoint">
          <div class="cp-head"><span class="material-symbols-outlined">bolt</span>Chokepoint principal</div>
          <p>${l.bottleneck}</p>
        </div>
        <div class="section-label">Compañías en esta capa</div>
        <div class="co-list">${chips}</div>
      </div>`;
  }

  function companyPanel(c) {
    const layer = LAYERS.find(l => l.layer === c.layer);
    const r = riskMeta(layer.risk);
    const up = (c.changePct || 0) >= 0;
    const noData = !c.liquid;
    const series = sparkSeries(c);
    const sLo = Math.min(...series), sHi = Math.max(...series);
    const yfUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(c.ticker)}`;
    return `
      <div class="panel-top">
        <div>
          <div class="panel-eyebrow">${c.ticker} · ${c.exchange}</div>
          <h2 class="panel-name">${c.shortName}</h2>
          <div class="panel-meta">
            <span class="meta-tag">${c.name}</span>
          </div>
          <div class="panel-meta">
            <button class="meta-tag" data-layer="${c.layer}" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
              <span class="codot" style="width:7px;height:7px;border-radius:50%;background:${r.color}"></span>
              Capa ${String(c.layer).padStart(2,"0")} · ${layer.name}</button>
          </div>
        </div>
        <button class="panel-close" data-close><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="panel-scroll">
        <div class="section-label">Mercado <span style="color:var(--accent);font-weight:700">· simulado en vivo</span></div>
        <div class="stat-grid" id="stat-grid">${statGrid(c)}</div>
        ${noData ? `<div class="offline-note"><span class="material-symbols-outlined">info</span>Cotiza OTC — datos de referencia, baja cobertura en tiempo real.</div>` : ""}
        <div class="section-label">Precio · 7 días</div>
        <div class="spark-wrap">
          <div class="spark-head">
            <span class="t">${c.ticker}</span>
            <span class="r">${fmtPrice(sLo)} — ${fmtPrice(sHi)}</span>
          </div>
          <svg class="spark-svg" viewBox="0 0 280 56" preserveAspectRatio="none">
            <path d="${sparkPath(series,280,52).replace(/^M/,"M")} L280,56 L0,56 Z" fill="${up ? "rgba(62,207,142,0.12)" : "rgba(255,107,102,0.12)"}" stroke="none"/>
            <path d="${sparkPath(series,280,52)}" fill="none" stroke="${up ? "#3ECF8E" : "#FF6B66"}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="section-label">Rol en la cadena</div>
        <p class="body">${c.role}</p>
        <div class="section-label">Sede</div>
        <p class="body" style="color:var(--ink)">${c.hq}</p>
        <a class="link-out" href="${yfUrl}" target="_blank" rel="noopener">
          Ver en Yahoo Finance <span class="material-symbols-outlined">arrow_outward</span></a>
      </div>`;
  }

  function statGrid(c) {
    const up = (c.changePct || 0) >= 0;
    return `
      <div class="stat"><div class="stat-val price">${fmtPrice(c.price)}</div><div class="stat-label">Precio</div></div>
      <div class="stat"><div class="stat-val ${up ? "up" : "down"}" style="color:${up ? "#3ECF8E" : "#FF6B66"}">${fmtChg(c.changePct)}</div><div class="stat-label">Cambio 24h</div></div>
      <div class="stat"><div class="stat-val">${fmtCap(c.marketCap)}</div><div class="stat-label">Market cap</div></div>`;
  }

  function bindPanel() {
    panel.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closePanel));
    panel.querySelectorAll(".co-chip").forEach(b => b.addEventListener("click", () => {
      const c = COMPANIES.find(x => x.id === b.dataset.id);
      if (c) { openPanel(c); G.focusNode(c.id, true); }
    }));
    const lb = panel.querySelector("[data-layer]");
    if (lb) lb.addEventListener("click", () => {
      const l = LAYERS.find(x => x.layer === +lb.dataset.layer);
      if (l) { openPanel(l); G.focusNode(l.id, true); }
    });
  }

  /* ── FILTERS / TOOLBAR ──────────────────────────────────────── */
  const state = { layers: new Set(LAYERS.map(l => l.layer)), risks: new Set(), onlyLiquid: false };

  function passes(node) {
    const layer = node.type === "layer" ? node.layer : node.layer;
    if (!state.layers.has(layer)) return false;
    const risk = node.type === "layer" ? node.risk : G.layerRiskOf(layer);
    if (state.risks.size && !state.risks.has(risk)) return false;
    if (node.type === "company" && state.onlyLiquid && !node.liquid) return false;
    return true;
  }
  function refresh() { G.setFilter(passes); }

  function initToolbar() {
    // risk chips
    document.querySelectorAll(".chip.risk").forEach(ch => {
      ch.addEventListener("click", () => {
        const r = ch.dataset.risk;
        if (state.risks.has(r)) state.risks.delete(r); else state.risks.add(r);
        ch.classList.toggle("active");
        refresh();
      });
    });
    // only liquid
    $("#chip-liquid").addEventListener("click", () => {
      state.onlyLiquid = !state.onlyLiquid;
      $("#chip-liquid").classList.toggle("active", state.onlyLiquid);
      refresh();
    });
    // layer dropdown
    const ddBtn = $("#layer-dd-btn"), dd = $("#layer-dd");
    ddBtn.addEventListener("click", (e) => { e.stopPropagation(); dd.classList.toggle("open"); });
    document.addEventListener("click", () => dd.classList.remove("open"));
    dd.addEventListener("click", e => e.stopPropagation());
    // build layer rows
    dd.innerHTML = `<button class="dd-row" data-all><span class="material-symbols-outlined">done_all</span>Todas las capas</button>`
      + LAYERS.map(l => `<button class="dd-row" data-layer="${l.layer}">
          <span class="dd-dot" style="background:${RISK[l.risk].color}"></span>
          <span class="dd-num">${String(l.layer).padStart(2,"0")}</span> ${l.name}
          <span class="material-symbols-outlined dd-check">check</span></button>`).join("");
    function syncDD() {
      dd.querySelectorAll("[data-layer]").forEach(row => {
        row.classList.toggle("on", state.layers.has(+row.dataset.layer));
      });
      const n = state.layers.size;
      $("#layer-dd-count").textContent = n === LAYERS.length ? "Todas" : n + " capas";
    }
    dd.querySelector("[data-all]").addEventListener("click", () => {
      if (state.layers.size === LAYERS.length) state.layers.clear();
      else LAYERS.forEach(l => state.layers.add(l.layer));
      syncDD(); refresh();
    });
    dd.querySelectorAll("[data-layer]").forEach(row => row.addEventListener("click", () => {
      const ly = +row.dataset.layer;
      if (state.layers.has(ly)) state.layers.delete(ly); else state.layers.add(ly);
      syncDD(); refresh();
    }));
    syncDD();

    // view controls
    $("#zoom-in").addEventListener("click", () => G.zoomIn());
    $("#zoom-out").addEventListener("click", () => G.zoomOut());
    $("#reset-view").addEventListener("click", () => { G.resetView(); });
  }

  /* ── LIVE TICK ──────────────────────────────────────────────── */
  let lastUpdate = Date.now();
  function tick() {
    COMPANIES.forEach(c => {
      const vol = c.liquid ? 1 : 0.4;
      const d = (Math.random() - 0.5) * 0.006 * vol;
      c.price = Math.max(0.5, c.price * (1 + d));
      c.changePct = c.changePct + d * 100 * 0.9;
      if (Math.abs(c.changePct) > 9) c.changePct *= 0.6;
    });
    lastUpdate = Date.now();
    // refresh open company stats live
    if (openNode && openNode.type === "company") {
      const sg = $("#stat-grid");
      if (sg) sg.innerHTML = statGrid(openNode);
    }
    flashUpdate();
  }
  function flashUpdate() { updateAgo(); }
  function updateAgo() {
    const s = Math.round((Date.now() - lastUpdate) / 1000);
    const el = $("#update-ago");
    if (el) el.textContent = s < 3 ? "ahora mismo" : "hace " + s + "s";
  }

  /* ── INTRO ──────────────────────────────────────────────────── */
  function initIntro() {
    const intro = $("#intro");
    $("#intro-start").addEventListener("click", () => {
      intro.classList.add("hide");
      setTimeout(() => intro.remove(), 600);
    });
  }

  /* ── BOOT ───────────────────────────────────────────────────── */
  function boot() {
    initTheme();
    G.init($("#graph"), {
      onNodeClick: (d) => openPanel(d),
      onNodeHover: (d, e) => showTip(d, e),
      onNodeMove: (d, e) => moveTip(e),
      onBackgroundClick: () => closePanel()
    });
    initToolbar();
    initIntro();
    refresh();
    setInterval(tick, 3200);
    setInterval(updateAgo, 1000);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

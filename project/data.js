/* ──────────────────────────────────────────────────────────────
   AI Supply Chain Map — Dataset
   8 capas + ~37 compañías públicas de la cadena del AI Boom.
   Precios y market caps son SIMULADOS para el prototipo (mayo 2026).
   ────────────────────────────────────────────────────────────── */

/* ── Las 8 capas, de la arena al modelo ──────────────────────── */
const LAYERS = [
  {
    id: "layer-1", type: "layer", layer: 1,
    name: "Materias Primas", shortName: "Silicio", risk: "HIGH",
    description: "Todo empieza en la arena. El silicio de grado electrónico se purifica hasta 99.999999999% y se corta en obleas perfectas de 300mm. Sin obleas no existe un solo chip.",
    bottleneck: "Shin-Etsu y SUMCO controlan ~50% del mercado mundial de obleas. Cualquier interrupción en Japón frena la cadena entera desde el primer eslabón."
  },
  {
    id: "layer-2", type: "layer", layer: 2,
    name: "Software EDA / IP", shortName: "Diseño", risk: "MED",
    description: "El software con el que se diseñan los chips y la arquitectura base que licencian. Tres empresas concentran las herramientas sin las cuales ningún chip avanzado puede existir.",
    bottleneck: "Synopsys y Cadence dominan EDA; Arm provee la arquitectura. Todo sujeto a licencias de exportación de EE.UU. — una palanca geopolítica directa."
  },
  {
    id: "layer-3", type: "layer", layer: 3,
    name: "Equipos de Litografía", shortName: "Litografía", risk: "MAX",
    description: "Las máquinas que imprimen los circuitos sobre la oblea. La litografía EUV es la tecnología más compleja jamás fabricada, y solo una empresa en el mundo la produce.",
    bottleneck: "ASML tiene el monopolio absoluto de EUV. Cada máquina cuesta ~$200M, pesa como un avión y la lista de espera supera los 18 meses."
  },
  {
    id: "layer-4", type: "layer", layer: 4,
    name: "Fundición y Empaquetado", shortName: "Fundición", risk: "MAX",
    description: "Donde el diseño se convierte en silicio físico y se empaqueta. El empaquetado avanzado CoWoS es lo que une la GPU con sus pilas de memoria HBM en un solo paquete.",
    bottleneck: "TSMC fabrica casi todos los chips IA de gama alta y su capacidad CoWoS está saturada. Es el cuello de botella #1 de todo el boom."
  },
  {
    id: "layer-5", type: "layer", layer: 5,
    name: "Memoria HBM", shortName: "HBM", risk: "HIGH",
    description: "Memoria de alto ancho de banda apilada junto a la GPU. Cada acelerador IA necesita pilas de HBM, y la demanda supera a la oferta desde hace dos años.",
    bottleneck: "SK Hynix lidera HBM3E y su producción está vendida con más de un año de antelación. Solo tres fabricantes en el planeta pueden hacerla."
  },
  {
    id: "layer-6", type: "layer", layer: 6,
    name: "ODMs / Integración", shortName: "Integración", risk: "MED",
    description: "Los diseñadores de GPU y los ensambladores que convierten chips sueltos en servidores funcionales. Nvidia orquesta gran parte de la cadena aguas arriba desde aquí.",
    bottleneck: "Nvidia controla el diseño y la asignación de GPUs IA. Los ODM compiten ferozmente por capacidad de ensamblaje y refrigeración líquida."
  },
  {
    id: "layer-7", type: "layer", layer: 7,
    name: "Infraestructura Física", shortName: "Infraestructura", risk: "HIGH",
    description: "Energía, distribución eléctrica y refrigeración. Los data centers IA consumen tanta potencia que la red eléctrica se ha convertido en un límite físico real.",
    bottleneck: "La potencia y la refrigeración son el nuevo cuello de botella. Vertiv, Eaton y Schneider no dan abasto con el capex que están desplegando los hyperscalers."
  },
  {
    id: "layer-8", type: "layer", layer: 8,
    name: "Hyperscalers / Modelos", shortName: "Hyperscalers", risk: "LOW",
    description: "La punta de la cadena: quienes compran el cómputo y entrenan los modelos. Su capex sostiene económicamente todo lo que hay debajo.",
    bottleneck: "Riesgo de suministro bajo, pero concentración altísima: cuatro empresas representan la mayoría del gasto mundial en infraestructura de IA."
  }
];

/* ── Compañías públicas por capa ─────────────────────────────────
   price / changePct / marketCap (USD) son valores SIMULADOS base.
   El "tick" en vivo los hace fluctuar suavemente en runtime.        */
const COMPANIES = [
  /* Capa 1 — Materias Primas */
  { id: "shin-etsu", name: "Shin-Etsu Chemical", shortName: "Shin-Etsu", ticker: "SHECY", exchange: "OTC", layer: 1, hq: "Tokio, Japón", liquid: false,
    role: "Mayor productor mundial de obleas de silicio de grado semiconductor.", price: 21.40, changePct: 0.6, marketCap: 95e9 },
  { id: "sumco", name: "SUMCO Corporation", shortName: "SUMCO", ticker: "SUOPY", exchange: "OTC", layer: 1, hq: "Tokio, Japón", liquid: false,
    role: "Junto a Shin-Etsu controla ~50% del mercado de obleas de 300mm.", price: 12.85, changePct: -0.9, marketCap: 12e9 },
  { id: "wacker", name: "Wacker Chemie", shortName: "Wacker", ticker: "WKCMF", exchange: "OTC", layer: 1, hq: "Múnich, Alemania", liquid: false,
    role: "Polisilicio hiperpuro: la materia prima base de toda oblea.", price: 84.20, changePct: 1.2, marketCap: 5.4e9 },

  /* Capa 2 — Software EDA / IP */
  { id: "synopsys", name: "Synopsys", shortName: "Synopsys", ticker: "SNPS", exchange: "NASDAQ", layer: 2, hq: "Sunnyvale, CA", liquid: true,
    role: "Líder en software EDA; herramientas indispensables para diseñar GPUs IA.", price: 558.30, changePct: 1.8, marketCap: 86e9 },
  { id: "cadence", name: "Cadence Design Systems", shortName: "Cadence", ticker: "CDNS", exchange: "NASDAQ", layer: 2, hq: "San José, CA", liquid: true,
    role: "Co-líder EDA con Synopsys: simulación y verificación de silicio.", price: 302.10, changePct: 1.1, marketCap: 82e9 },
  { id: "arm", name: "Arm Holdings", shortName: "Arm", ticker: "ARM", exchange: "NASDAQ", layer: 2, hq: "Cambridge, RU", liquid: true,
    role: "Arquitectura de CPU licenciada presente en casi todo SoC del mundo.", price: 138.70, changePct: 2.6, marketCap: 145e9 },
  { id: "siemens-eda", name: "Siemens (EDA)", shortName: "Siemens EDA", ticker: "SIEGY", exchange: "OTC", layer: 2, hq: "Múnich, Alemania", liquid: false,
    role: "División EDA (ex-Mentor Graphics): el tercer actor en herramientas de diseño.", price: 109.40, changePct: 0.4, marketCap: 158e9 },

  /* Capa 3 — Equipos de Litografía */
  { id: "asml", name: "ASML Holding", shortName: "ASML", ticker: "ASML", exchange: "NASDAQ", layer: 3, hq: "Veldhoven, P. Bajos", liquid: true,
    role: "Monopolio mundial de litografía EUV: sin sus máquinas no existen chips de 3nm.", price: 1012.50, changePct: 2.3, marketCap: 405e9 },
  { id: "amat", name: "Applied Materials", shortName: "Applied", ticker: "AMAT", exchange: "NASDAQ", layer: 3, hq: "Santa Clara, CA", liquid: true,
    role: "Mayor fabricante de equipos de deposición y grabado de semiconductores.", price: 208.90, changePct: 1.5, marketCap: 170e9 },
  { id: "lam", name: "Lam Research", shortName: "Lam", ticker: "LRCX", exchange: "NASDAQ", layer: 3, hq: "Fremont, CA", liquid: true,
    role: "Grabado y deposición: crítico para memoria 3D y para HBM.", price: 96.40, changePct: 1.0, marketCap: 122e9 },
  { id: "kla", name: "KLA Corporation", shortName: "KLA", ticker: "KLAC", exchange: "NASDAQ", layer: 3, hq: "Milpitas, CA", liquid: true,
    role: "Inspección y metrología: control de defectos en cada oblea.", price: 821.70, changePct: 0.8, marketCap: 110e9 },
  { id: "tokyo-electron", name: "Tokyo Electron", shortName: "TEL", ticker: "TOELY", exchange: "OTC", layer: 3, hq: "Tokio, Japón", liquid: false,
    role: "Equipos de recubrimiento, grabado y limpieza: pilar del clúster japonés.", price: 111.20, changePct: -0.5, marketCap: 115e9 },

  /* Capa 4 — Fundición y Empaquetado */
  { id: "tsmc", name: "Taiwan Semiconductor Mfg.", shortName: "TSMC", ticker: "TSM", exchange: "NYSE", layer: 4, hq: "Hsinchu, Taiwán", liquid: true,
    role: "Única fundición capaz de fabricar chips IA a gran escala en 3nm/4nm. Cuello de botella CoWoS.", price: 192.30, changePct: 2.1, marketCap: 985e9 },
  { id: "samsung", name: "Samsung Electronics", shortName: "Samsung", ticker: "SSNLF", exchange: "OTC", layer: 4, hq: "Suwon, Corea del Sur", liquid: false,
    role: "Segunda fundición avanzada y productor de HBM: alternativa parcial a TSMC.", price: 44.80, changePct: -0.7, marketCap: 372e9 },
  { id: "intel", name: "Intel", shortName: "Intel", ticker: "INTC", exchange: "NASDAQ", layer: 4, hq: "Santa Clara, CA", liquid: true,
    role: "Foundry emergente (proceso 18A): la apuesta de EE.UU. por capacidad doméstica.", price: 27.60, changePct: -1.4, marketCap: 119e9 },
  { id: "ase", name: "ASE Technology", shortName: "ASE", ticker: "ASX", exchange: "NYSE", layer: 4, hq: "Kaohsiung, Taiwán", liquid: true,
    role: "Mayor proveedor OSAT de ensamblaje y test; empaquetado avanzado.", price: 11.90, changePct: 1.3, marketCap: 25e9 },
  { id: "amkor", name: "Amkor Technology", shortName: "Amkor", ticker: "AMKR", exchange: "NASDAQ", layer: 4, hq: "Tempe, AZ", liquid: true,
    role: "Empaquetado y test; socio clave de empaquetado avanzado en EE.UU.", price: 31.80, changePct: 0.9, marketCap: 7.9e9 },

  /* Capa 5 — Memoria HBM */
  { id: "sk-hynix", name: "SK Hynix", shortName: "SK Hynix", ticker: "HXSCL", exchange: "OTC", layer: 5, hq: "Icheon, Corea del Sur", liquid: false,
    role: "Líder mundial en HBM3E; proveedor principal de memoria para GPUs Nvidia.", price: 148.50, changePct: 3.1, marketCap: 121e9 },
  { id: "micron", name: "Micron Technology", shortName: "Micron", ticker: "MU", exchange: "NASDAQ", layer: 5, hq: "Boise, ID", liquid: true,
    role: "Único productor estadounidense de HBM; tercer actor tras SK Hynix y Samsung.", price: 116.40, changePct: 2.7, marketCap: 130e9 },

  /* Capa 6 — ODMs / Integración */
  { id: "nvidia", name: "Nvidia", shortName: "Nvidia", ticker: "NVDA", exchange: "NASDAQ", layer: 6, hq: "Santa Clara, CA", liquid: true,
    role: "Diseñador dominante de GPUs IA y plataformas; orquesta toda la cadena aguas arriba.", price: 141.20, changePct: 3.4, marketCap: 3480e9 },
  { id: "amd", name: "AMD", shortName: "AMD", ticker: "AMD", exchange: "NASDAQ", layer: 6, hq: "Santa Clara, CA", liquid: true,
    role: "Retador en GPUs IA (Instinct MI); segunda fuente de aceleradores.", price: 164.80, changePct: 2.2, marketCap: 268e9 },
  { id: "foxconn", name: "Hon Hai (Foxconn)", shortName: "Foxconn", ticker: "HNHPF", exchange: "OTC", layer: 6, hq: "Nuevo Taipéi, Taiwán", liquid: false,
    role: "Mayor ensamblador de servidores IA del mundo.", price: 10.30, changePct: 1.6, marketCap: 91e9 },
  { id: "quanta", name: "Quanta Computer", shortName: "Quanta", ticker: "QUCPY", exchange: "OTC", layer: 6, hq: "Taoyuan, Taiwán", liquid: false,
    role: "ODM de servidores IA para los principales hyperscalers.", price: 71.50, changePct: 1.9, marketCap: 31e9 },
  { id: "smci", name: "Super Micro Computer", shortName: "Supermicro", ticker: "SMCI", exchange: "NASDAQ", layer: 6, hq: "San José, CA", liquid: true,
    role: "Servidores IA densos y refrigeración líquida llave en mano.", price: 44.30, changePct: -2.8, marketCap: 26e9 },

  /* Capa 7 — Infraestructura Física */
  { id: "vertiv", name: "Vertiv Holdings", shortName: "Vertiv", ticker: "VRT", exchange: "NYSE", layer: 7, hq: "Westerville, OH", liquid: true,
    role: "Energía y refrigeración de data centers; beneficiario directo de la demanda IA.", price: 114.70, changePct: 2.9, marketCap: 44e9 },
  { id: "schneider", name: "Schneider Electric", shortName: "Schneider", ticker: "SBGSY", exchange: "OTC", layer: 7, hq: "Rueil-Malmaison, Francia", liquid: false,
    role: "Gestión de energía y distribución eléctrica para data centers.", price: 54.90, changePct: 1.0, marketCap: 152e9 },
  { id: "eaton", name: "Eaton Corporation", shortName: "Eaton", ticker: "ETN", exchange: "NYSE", layer: 7, hq: "Dublín, Irlanda", liquid: true,
    role: "Equipos eléctricos y gestión de potencia a gran escala.", price: 331.50, changePct: 1.4, marketCap: 132e9 },
  { id: "abb", name: "ABB Ltd", shortName: "ABB", ticker: "ABB", exchange: "NYSE", layer: 7, hq: "Zúrich, Suiza", liquid: true,
    role: "Electrificación y automatización; transformadores y switchgear.", price: 50.60, changePct: 0.7, marketCap: 110e9 },
  { id: "modine", name: "Modine Manufacturing", shortName: "Modine", ticker: "MOD", exchange: "NYSE", layer: 7, hq: "Racine, WI", liquid: true,
    role: "Soluciones térmicas y refrigeración para data centers IA.", price: 108.90, changePct: 2.4, marketCap: 5.7e9 },

  /* Capa 8 — Hyperscalers / Modelos */
  { id: "microsoft", name: "Microsoft", shortName: "Microsoft", ticker: "MSFT", exchange: "NASDAQ", layer: 8, hq: "Redmond, WA", liquid: true,
    role: "Mayor comprador de cómputo IA (Azure + OpenAI): la demanda que tira de toda la cadena.", price: 471.20, changePct: 0.9, marketCap: 3500e9 },
  { id: "amazon", name: "Amazon", shortName: "Amazon", ticker: "AMZN", exchange: "NASDAQ", layer: 8, hq: "Seattle, WA", liquid: true,
    role: "AWS + silicio propio (Trainium/Inferentia): el hyperscaler de mayor capacidad.", price: 211.40, changePct: 1.2, marketCap: 2210e9 },
  { id: "alphabet", name: "Alphabet (Google)", shortName: "Alphabet", ticker: "GOOGL", exchange: "NASDAQ", layer: 8, hq: "Mountain View, CA", liquid: true,
    role: "Google Cloud + TPUs propios: integra diseño de silicio y modelos.", price: 176.30, changePct: 1.5, marketCap: 2150e9 },
  { id: "meta", name: "Meta Platforms", shortName: "Meta", ticker: "META", exchange: "NASDAQ", layer: 8, hq: "Menlo Park, CA", liquid: true,
    role: "Mayor comprador de GPUs para entrenamiento (Llama); capex masivo en IA.", price: 582.70, changePct: 1.7, marketCap: 1520e9 }
];

/* ── Dependencias entre capas (la columna vertebral 1 → 8) ──────── */
const LAYER_CHAIN = [
  ["layer-1", "layer-2"], ["layer-2", "layer-3"], ["layer-3", "layer-4"],
  ["layer-4", "layer-5"], ["layer-5", "layer-6"], ["layer-6", "layer-7"],
  ["layer-7", "layer-8"]
];

/* ── Dependencias notables entre compañías (cross-layer) ─────────── */
const COMPANY_DEPS = [
  ["tsmc", "asml"],       // TSMC depende de las EUV de ASML
  ["tsmc", "synopsys"],   // diseño sobre herramientas EDA
  ["sk-hynix", "tsmc"],   // HBM se integra vía CoWoS en TSMC
  ["nvidia", "tsmc"],     // Nvidia fabrica en TSMC
  ["nvidia", "sk-hynix"], // GPUs de Nvidia usan HBM de SK Hynix
  ["nvidia", "arm"],      // CPUs Grace basadas en Arm
  ["smci", "nvidia"],     // servidores Supermicro alrededor de GPUs Nvidia
  ["vertiv", "nvidia"],   // refrigeración para racks GB
  ["microsoft", "nvidia"],
  ["meta", "nvidia"],
  ["amazon", "tsmc"],     // chips propios fabricados en TSMC
  ["sk-hynix", "lam"]     // HBM depende de equipos de grabado Lam
];

/* ── Generador del grafo (nodes + links) ─────────────────────────── */
function buildGraph() {
  const companyById = Object.fromEntries(COMPANIES.map(c => [c.id, c]));
  const nodes = [
    ...LAYERS.map(l => ({ ...l })),
    ...COMPANIES.map(c => ({ ...c, type: "company", isPublic: true }))
  ];
  const links = [];

  // belongs-to: cada compañía a su capa
  COMPANIES.forEach(c => {
    links.push({ source: c.id, target: "layer-" + c.layer, kind: "belongs-to", layer: c.layer });
  });
  // depends-on: cadena vertical de capas
  LAYER_CHAIN.forEach(([s, t]) => {
    links.push({ source: s, target: t, kind: "layer-chain" });
  });
  // depends-on: dependencias entre compañías
  COMPANY_DEPS.forEach(([s, t]) => {
    if (companyById[s] && companyById[t]) {
      links.push({ source: s, target: t, kind: "company-dep" });
    }
  });

  return { nodes, links };
}

/* ── Paleta de riesgo (afinada para fondo oscuro) ────────────────── */
const RISK = {
  MAX:  { color: "#FF5B57", label: "Riesgo máximo",  glow: "rgba(255,91,87,0.55)" },
  HIGH: { color: "#F2A53C", label: "Riesgo alto",    glow: "rgba(242,165,60,0.50)" },
  MED:  { color: "#4C9BEC", label: "Riesgo medio",   glow: "rgba(76,155,236,0.50)" },
  LOW:  { color: "#6FB23A", label: "Riesgo bajo",    glow: "rgba(111,178,58,0.45)" }
};

/* expose */
window.SCM = { LAYERS, COMPANIES, buildGraph, RISK };

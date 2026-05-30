import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const p = await b.newPage(); await p.setViewport({width:1280,height:850});
  await p.goto("https://ai-boom-supplychain.vercel.app/", { waitUntil:"networkidle0", timeout:30000 });
  await p.waitForSelector(".intro .btn-primary"); await p.click(".intro .btn-primary");
  await new Promise(r=>setTimeout(r,900)); await p.waitForSelector("g.node.company");
  const t=await p.evaluate(()=>{const n=[...document.querySelectorAll("g.node.company")].find(x=>(x.textContent||"").includes("NVDA"));const bb=n.getBoundingClientRect();return{x:bb.x+bb.width/2,y:bb.y+bb.height/2};});
  await p.mouse.click(t.x,t.y); await p.waitForSelector("aside.panel.open .panel-name"); await new Promise(r=>setTimeout(r,2800));
  const r = await p.evaluate(()=>{
    const panel=document.querySelector("aside.panel");
    const img=panel.querySelector(".panel-head-row .company-logo img");
    const news=[...panel.querySelectorAll(".news-item .news-head")].map(e=>e.textContent.slice(0,60));
    const market=panel.querySelector(".section-label")?.textContent.replace(/\s+/g,' ').trim();
    return { logoLoaded: img? img.naturalWidth>0:false, logoSrc: img? new URL(img.src).hostname:"<monogram>", market, newsCount: news.length, firstNews: news[0]||null };
  });
  console.log(JSON.stringify(r,null,2));
  console.log((r.logoLoaded && r.newsCount>0) ? "\nPROD PASS ✅ logo + live news" : "\nPROD FAIL ❌");
} finally { await b.close(); }

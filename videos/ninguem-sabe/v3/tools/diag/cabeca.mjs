import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { copyFileSync, unlinkSync } from "node:fs";
const n = process.argv[2];
const ts = process.argv[3].split(",").map(Number);
const pagina = `zz-cab-${n}.html`;
copyFileSync(`compositions/parte${n}.html`, pagina);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const nav = await chromium.launch({ proxy, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await (await nav.newContext({ ignoreHTTPSErrors: true })).newPage();
await p.goto(`http://localhost:8766/${pagina}`, { waitUntil: "load", timeout: 120000 });
await p.waitForFunction((id) => window[id] && typeof window[id].render === "function" && window.__cenaAtual, `__parte${n}`, { timeout: 240000 });
for (const t of ts) {
  const r = await p.evaluate(([id, t]) => {
    window[id].render(t);
    const ctx = window.__cenaAtual;
    const THREE = ctx.THREE;
    const cen = Object.values(ctx.cenarios).find((c) => c.grupo.visible);
    const o = cen.grupo.position;
    const caixa = (obj) => { const b = new THREE.Box3().setFromObject(obj); b.min.sub(o); b.max.sub(o); return b.min.toArray().map((x) => x.toFixed(2)) + " .. " + b.max.toArray().map((x) => x.toFixed(2)); };
    const rig = ctx.boneco.userData.rig;
    return { t, cabeca: caixa(rig.cabeca), tronco: caixa(rig.tronco), secador: cen.real?.corpoSecador ? caixa(cen.real.corpoSecador) : "" };
  }, [`__parte${n}`, t]);
  console.log(JSON.stringify(r));
}
await nav.close();
unlinkSync(pagina);

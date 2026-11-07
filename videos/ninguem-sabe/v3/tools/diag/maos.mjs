// posição das mãos e do celular em alguns instantes (coordenadas do cenário)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { copyFileSync, unlinkSync } from "node:fs";
const n = process.argv[2];
const ts = process.argv[3].split(",").map(Number);
const pagina = `zz-maos-${n}.html`;
copyFileSync(`compositions/parte${n}.html`, pagina);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const nav = await chromium.launch({ proxy, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await (await nav.newContext({ ignoreHTTPSErrors: true })).newPage();
p.on("pageerror", (e) => console.log("ERRO", e.message));
await p.goto(`http://localhost:8766/${pagina}`, { waitUntil: "load", timeout: 120000 });
await p.waitForFunction((id) => window[id] && typeof window[id].render === "function" && window.__cenaAtual, `__parte${n}`, { timeout: 240000 });
for (const t of ts) {
  const r = await p.evaluate(([id, t]) => {
    window[id].render(t);
    const ctx = window.__cenaAtual;
    const cen = Object.values(ctx.cenarios).find((c) => c.grupo.visible);
    const o = cen.grupo.position;
    const f = (v) => `(${(v.x - o.x).toFixed(2)}, ${(v.y - o.y).toFixed(2)}, ${(v.z - o.z).toFixed(2)})`;
    const b = ctx.boneco;
    const rig = b.userData.rig;
    const w = (obj) => obj.getWorldPosition(new ctx.THREE.Vector3());
    const out = { t, corpo: f(b.position), giro: b.rotation.y.toFixed(2) };
    for (const lado of ["E", "D"]) {
      const br = rig["braco" + lado];
      out["ombro" + lado] = f(w(br.ombro));
      out["mao" + lado] = f(w(br.pega));
    }
    out.celular = f(w(ctx.celular));
    return out;
  }, [`__parte${n}`, t]);
  console.log(JSON.stringify(r));
}
await nav.close();
unlinkSync(pagina);

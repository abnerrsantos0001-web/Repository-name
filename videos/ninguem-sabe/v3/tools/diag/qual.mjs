// detalha uma colisão: qual malha de qual peça, e onde (coordenadas locais do cenário)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { copyFileSync, unlinkSync } from "node:fs";
const [n, tS, peca] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
const pagina = `zz-qual-${n}.html`;
copyFileSync(`compositions/parte${n}.html`, pagina);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const nav = await chromium.launch({ proxy, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await (await nav.newContext({ ignoreHTTPSErrors: true })).newPage();
p.on("pageerror", (e) => console.log("ERRO", e.message));
await p.goto(`http://localhost:8766/${pagina}`, { waitUntil: "load", timeout: 120000 });
await p.waitForFunction((id) => window[id] && typeof window[id].render === "function" && window.__cenaAtual, `__parte${n}`, { timeout: 240000 });
const r = await p.evaluate(([id, t, peca]) => {
  window[id].render(t);
  const ctx = window.__cenaAtual;
  const THREE = ctx.THREE;
  const out = [];
  const cen = Object.values(ctx.cenarios).find((c) => c.grupo.visible);
  const g = cen.grupo;
  g.updateMatrixWorld(true);
  const alvo = g.children.find((c) => c.name === peca);
  const malhas = [];
  alvo.traverse((m) => m.isMesh && malhas.push(m));
  const fontes = [];
  g.traverseVisible((m) => { if (m.isMesh && !m.userData.passavel) { let p = m; while (p.parent && p.parent !== g) p = p.parent; if (p !== alvo) fontes.push([p.name, m]); } });
  ctx.boneco.traverseVisible((m) => m.isMesh && fontes.push(["ele:" + (m.name || "corpo"), m]));
  const v = new THREE.Vector3(), s = new THREE.Vector3();
  for (const [i, m] of malhas.entries()) {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const inv = new THREE.Matrix4().copy(m.matrixWorld).invert();
    const c = m.geometry.boundingBox;
    for (const [nome, f] of fontes) {
      const pos = f.geometry.attributes.position;
      f.updateMatrixWorld(true);
      let melhor = null;
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k).applyMatrix4(f.matrixWorld);
        s.copy(v).applyMatrix4(inv);
        const d = Math.min(s.x - c.min.x, c.max.x - s.x, s.y - c.min.y, c.max.y - s.y, s.z - c.min.z, c.max.z - s.z);
        if (d > 0.01 && (!melhor || d > melhor.d)) melhor = { d, w: v.clone().sub(g.position) };
      }
      if (melhor) {
        const cw = new THREE.Box3().setFromObject(m); cw.min.sub(g.position); cw.max.sub(g.position);
        const cad = []; out.push(`${nome} -> ${peca}[${i}] ${m.geometry.type} fundo ${melhor.d.toFixed(3)} em (${melhor.w.x.toFixed(2)}, ${melhor.w.y.toFixed(2)}, ${melhor.w.z.toFixed(2)}) caixa ${cw.min.toArray().map((x) => x.toFixed(2))} .. ${cw.max.toArray().map((x) => x.toFixed(2))}`);
      }
    }
  }
  return out;
}, [`__parte${n}`, tS, peca]);
console.log(r.join("\n"));
await nav.close();
unlinkSync(pagina);

import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { copyFileSync, unlinkSync } from "node:fs";
const [n, tS, quem, peca] = [process.argv[2], Number(process.argv[3]), process.argv[4], process.argv[5]];
const pagina = `zz-out-${n}.html`;
copyFileSync(`compositions/parte${n}.html`, pagina);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const nav = await chromium.launch({ proxy, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await (await nav.newContext({ ignoreHTTPSErrors: true })).newPage();
await p.goto(`http://localhost:8766/${pagina}`, { waitUntil: "load", timeout: 120000 });
await p.waitForFunction((id) => window[id] && typeof window[id].render === "function" && window.__cenaAtual, `__parte${n}`, { timeout: 240000 });
const r = await p.evaluate(([id, t, quem, peca]) => {
  window[id].render(t);
  const ctx = window.__cenaAtual, THREE = ctx.THREE;
  const b = quem === "duble" ? ctx.duble : ctx.outros[quem].boneco;
  const g = b.parent; g.updateMatrixWorld(true);
  const alvo = g.children.find((c) => c.name === peca);
  const out = [];
  const v = new THREE.Vector3(), s = new THREE.Vector3();
  alvo.traverse((m) => {
    if (!m.isMesh) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const inv = new THREE.Matrix4().copy(m.matrixWorld).invert(), c = m.geometry.boundingBox;
    b.traverse((f) => {
      if (!f.isMesh) return;
      const pos = f.geometry.attributes.position; f.updateMatrixWorld(true);
      let melhor = null;
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k).applyMatrix4(f.matrixWorld); s.copy(v).applyMatrix4(inv);
        const d = Math.min(s.x - c.min.x, c.max.x - s.x, s.y - c.min.y, c.max.y - s.y, s.z - c.min.z, c.max.z - s.z);
        if (d > 0.01 && (!melhor || d > melhor.d)) melhor = { d, l: g.worldToLocal(v.clone()) };
      }
      if (melhor) {
        const cw = new THREE.Box3().setFromObject(m); const a = g.worldToLocal(cw.min.clone()), z = g.worldToLocal(cw.max.clone());
        const cad = []; for (let q = f; q && q !== b; q = q.parent) cad.push((q.name || "?") + ":" + (q.geometry?.type || q.type)); out.push(`${cad.join(" < ")} -> ${m.geometry.type} fundo ${melhor.d.toFixed(3)} em local (${melhor.l.x.toFixed(2)}, ${melhor.l.y.toFixed(2)}, ${melhor.l.z.toFixed(2)}) caixa ${a.toArray().map((x) => x.toFixed(2))} .. ${z.toArray().map((x) => x.toFixed(2))}`);
      }
    });
  });
  return out;
}, [`__parte${n}`, tS, quem, peca]);
console.log(r.join("\n"));
await nav.close();
unlinkSync(pagina);

// Checagem de sobreposição antes do render: abre a cena de uma parte num Chromium (sem o HyperFrames),
// percorre a parte de 0,25 em 0,25 s e lista partes de personagens dentro de móveis/paredes/outros personagens
// e objetos atravessando objetos (ctx.colisoes() em assets/js/cena.js).
// Uso: node tools/colisoes.mjs 01 [passo] [tolerancia]   (precisa de um servidor em http://localhost:8766)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { copyFileSync, unlinkSync } from "node:fs";

const n = process.argv[2].padStart(2, "0");
const passo = Number(process.argv[3] || 0.25);
const tol = Number(process.argv[4] || 0.02);
const pagina = `zz-colisao-${n}.html`;
copyFileSync(`compositions/parte${n}.html`, pagina);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const nav = await chromium.launch({ proxy, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await nav.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 } });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(e.message));
await p.goto(`http://localhost:8766/${pagina}`, { waitUntil: "load", timeout: 120000 });
await p.waitForFunction((id) => window[id] && typeof window[id].render === "function" && window.__cenaAtual, `__parte${n}`, { timeout: 240000 });
const dur = await p.evaluate((id) => window[id].duracao, `__parte${n}`);
const porT = [];
for (let t = 0.05; t < dur; t += passo) {
  const r = await p.evaluate(([id, t, tol]) => {
    window[id].render(t);
    return window.__cenaAtual.colisoes(tol);
  }, [`__parte${n}`, t, tol]);
  if (r.length) porT.push([t, r]);
}
await nav.close();
unlinkSync(pagina);
if (erros.length) console.log("ERROS NA PÁGINA:\n" + erros.join("\n"));
// junta ocorrências seguidas do mesmo par em intervalos
const pares = new Map();
for (const [t, lista] of porT) {
  for (const c of lista) {
    const k = c.quem + " × " + c.onde;
    const at = pares.get(k) || { de: t, ate: t, fundo: 0, n: 0 };
    at.ate = t;
    at.fundo = Math.max(at.fundo, c.fundo);
    at.n++;
    pares.set(k, at);
  }
}
const linhas = [...pares.entries()].sort((a, b) => b[1].fundo - a[1].fundo);
if (!linhas.length) console.log(`parte ${n}: nenhuma sobreposição acima de ${tol} m`);
for (const [k, v] of linhas) console.log(`${v.fundo.toFixed(3)} m  ${v.de.toFixed(2)}–${v.ate.toFixed(2)} s (${v.n}x)  ${k}`);

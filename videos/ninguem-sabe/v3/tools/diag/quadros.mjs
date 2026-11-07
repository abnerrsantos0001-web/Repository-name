// Quadros soltos de uma cena (sem o HyperFrames, sem legendas): renderiza os instantes pedidos num Chromium e salva
// PNGs em previas/q/NN/ (1280x720 ou 720x1280). Serve para iterar câmera e luz rápido; a prévia oficial é tools/previa.sh.
// Uso: node tools/diag/quadros.mjs NN "t1,t2,..." [vertical]   (servidor em http://localhost:8766)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { copyFileSync, unlinkSync, mkdirSync, rmSync } from "node:fs";
const n = process.argv[2];
const ts = process.argv[3].split(",").map(Number);
const vertical = process.argv[4] === "vertical";
const pagina = `zz-q-${n}.html`;
copyFileSync(`compositions/parte${n}.html`, pagina);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const nav = await chromium.launch({ proxy, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const W = vertical ? 1080 : 1920, H = vertical ? 1920 : 1080;
const p = await (await nav.newContext({ ignoreHTTPSErrors: true, viewport: { width: W, height: H } })).newPage();
p.on("pageerror", (e) => console.log("ERRO:", e.message, (e.stack || "").split("\n").slice(0, 3).join(" | ")));
await p.goto(`http://localhost:8766/${pagina}${vertical ? "#vertical" : ""}`, { waitUntil: "load", timeout: 120000 });
await p.waitForFunction((id) => window[id] && typeof window[id].render === "function", `__parte${n}`, { timeout: 240000 });
const dir = `previas/q/${n}${vertical ? "v" : ""}`;
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (const t of ts) {
  await p.evaluate(([id, t]) => window[id].render(t), [`__parte${n}`, t]);
  await p.screenshot({ path: `${dir}/q-${String(t.toFixed(2)).padStart(6, "0")}.png`, clip: { x: 0, y: 0, width: W, height: H } });
}
await nav.close();
unlinkSync(pagina);
console.log(dir);

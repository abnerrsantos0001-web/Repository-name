// Cenários 2D do vídeo 1 (E Agora?): a rua da cidade à noite em três camadas com parallax e o supermercado por dentro.
// Tudo com semente: o mesmo quadro em todo render.
import { COR, rng, poligono, elipse, forma } from "./desenho2d.js";

// ---------------------------------------------------------------- rua à noite
// cam = deslocamento horizontal da câmera (px, camada da frente); chao = linha onde a calçada encontra os prédios
export function criarRua({ semente = 11, chao = 820 } = {}) {
  const longe = [];
  {
    const r = rng(semente);
    let x = -300;
    while (x < 3600) {
      const w = 90 + r() * 120;
      const h = 240 + r() * 300;
      const jan = [];
      for (let jy = chao - 60 - h + 30; jy < chao - 80; jy += 34) for (let jx = x + 14; jx < x + w - 18; jx += 26) jan.push([jx, jy, r() < 0.1]);
      longe.push({ x, w, h, jan, antena: r() < 0.3 });
      x += w + 6 + r() * 30;
    }
  }
  const meio = [];
  {
    const r = rng(semente + 12);
    let x = -200;
    const placas = ["FARMÁCIA", "", "MERCADO", "", "", "HOTEL", ""];
    let k = 0;
    while (x < 4000) {
      const w = 230 + r() * 160;
      const h = 330 + r() * 260;
      const jan = [];
      for (let jy = chao - h + 40; jy < chao - 150; jy += 70) for (let jx = x + 28; jx < x + w - 50; jx += 62) jan.push([jx, jy, r() < 0.09, r() < 0.12]);
      meio.push({ x, w, h, jan, placa: placas[k % placas.length], cor: ["#5C4194", "#553B8A", "#62479C"][k % 3] });
      x += w + 18 + r() * 40;
      k++;
    }
  }
  const estrelas = [];
  {
    const r = rng(semente + 5);
    for (let i = 0; i < 90; i++) estrelas.push([r() * 2400, r() * 520, 1.5 + r() * 2.2, r() * 6]);
  }
  return { longe, meio, estrelas, chao };
}

export function desenharRua(g, rua, t, { W = 1920, H = 1080, cam = 0, lua = [1240, 170], poste = 1250, carro = 320, ceuY = 0 } = {}) {
  const { chao } = rua;
  g.fillStyle = COR.noite;
  g.fillRect(0, 0, W, H);
  for (const [x, y, s, f] of rua.estrelas) {
    if (x > W) continue;
    g.fillStyle = "#9C8AD0";
    g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 2 + f);
    g.fillRect(x, y + ceuY, s, s);
  }
  g.globalAlpha = 1;
  if (lua) {
    elipse(g, lua[0], lua[1] + ceuY, 78, 78, "#FFF1B8", { contorno: 6, t, id: "lua", n: 18, amp: 1.2 });
    elipse(g, lua[0] - 24, lua[1] - 20 + ceuY, 15, 12, "#EADB98", { contorno: 0, t, id: "cr1", n: 9 });
    elipse(g, lua[0] + 28, lua[1] + 24 + ceuY, 10, 9, "#EADB98", { contorno: 0, t, id: "cr2", n: 9 });
  }
  const cl = cam * 0.15;
  for (const [i, b] of rua.longe.entries()) {
    const x = b.x - cl;
    if (x > W || x + b.w < 0) continue;
    poligono(g, [[x, chao - 50], [x, chao - 50 - b.h], [x + b.w, chao - 50 - b.h], [x + b.w, chao - 50]], { cor: "#3E2A6B", contorno: 5, t, id: "l" + i });
    if (b.antena) {
      g.strokeStyle = COR.contorno;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + b.w * 0.6, chao - 50 - b.h);
      g.lineTo(x + b.w * 0.6, chao - 50 - b.h - 50);
      g.stroke();
    }
    for (const [jx, jy, acesa] of b.jan) {
      g.fillStyle = acesa ? "#B98E3C" : "#4D3880";
      g.fillRect(jx - cl, jy, 12, 16);
    }
  }
  const cm = cam * 0.45;
  for (const [i, b] of rua.meio.entries()) {
    const x = b.x - cm;
    if (x > W + 40 || x + b.w < -40) continue;
    poligono(g, [[x + b.w, chao], [x + b.w, chao - b.h], [x + b.w + 28, chao - b.h + 18], [x + b.w + 28, chao]], { cor: "#47306F", contorno: 5, t, id: "ml" + i });
    poligono(g, [[x, chao], [x, chao - b.h], [x + b.w, chao - b.h], [x + b.w, chao]], { cor: b.cor, contorno: 6, t, id: "m" + i });
    for (const [k, [jx, jy, acesa, quebrada]] of b.jan.entries()) {
      const X = jx - cm;
      poligono(g, [[X, jy], [X + 36, jy], [X + 36, jy + 46], [X, jy + 46]], { cor: acesa ? "#D9A43C" : "#3A2862", contorno: 4, t, id: `j${i}-${k}`, amp: 0.5 });
      if (quebrada && !acesa) {
        g.strokeStyle = "#7E68B4";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(X + 6, jy + 8);
        g.lineTo(X + 20, jy + 26);
        g.lineTo(X + 14, jy + 40);
        g.stroke();
      }
    }
    if (b.placa) {
      const px = x + b.w / 2 - 110;
      const py = chao - 128;
      poligono(g, [[px, py], [px + 220, py], [px + 220, py + 54], [px, py + 54]], { cor: b.placa === "FARMÁCIA" ? "#2E4A3A" : "#3A2A5C", contorno: 5, t, id: "pl" + i });
      g.fillStyle = b.placa === "FARMÁCIA" ? COR.toxico : "#C9B8F0";
      g.font = '900 30px "Archivo Black"';
      g.textAlign = "center";
      g.fillText(b.placa, px + 110, py + 39);
      poligono(g, [[x + b.w / 2 - 50, chao], [x + b.w / 2 - 50, chao - 66], [x + b.w / 2 + 50, chao - 66], [x + b.w / 2 + 50, chao]], { cor: "#21163A", contorno: 5, t, id: "pt" + i });
    }
  }
  const calc = chao + 52;
  poligono(g, [[-20, chao], [W + 20, chao], [W + 20, calc], [-20, calc]], { cor: "#5A4790", contorno: 6, t, id: "calc", amp: 0.6 });
  g.fillStyle = "#3B2C61";
  g.fillRect(0, calc, W, H - calc);
  g.strokeStyle = COR.contorno;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(0, calc);
  g.lineTo(W, calc);
  g.stroke();
  for (let k = -1; k < Math.ceil(W / 300) + 2; k++) {
    const x = k * 300 - (((cam % 300) + 300) % 300);
    poligono(g, [[x, calc + 168], [x + 150, calc + 168], [x + 150, calc + 182], [x, calc + 182]], { cor: "#8E7CC3", contorno: 0, t, id: "faixa" + k });
  }
  g.strokeStyle = "#47377A";
  g.lineWidth = 4;
  for (let k = -1; k < Math.ceil(W / 110) + 2; k++) {
    const x = k * 110 - (((cam % 110) + 110) % 110);
    g.beginPath();
    g.moveTo(x, chao + 4);
    g.lineTo(x - 12, calc - 4);
    g.stroke();
  }
  if (poste !== null) {
    const p = poste - cam;
    g.fillStyle = "rgba(255, 210, 63, 0.10)";
    g.beginPath();
    g.moveTo(p + 70, chao - 470);
    g.lineTo(p - 120, calc + 8);
    g.lineTo(p + 260, calc + 8);
    g.closePath();
    g.fill();
    poligono(g, [[p - 8, calc], [p - 8, chao - 480], [p + 8, chao - 480], [p + 8, calc]], { cor: "#2C2148", contorno: 5, t, id: "poste" });
    poligono(g, [[p - 8, chao - 480], [p + 90, chao - 490], [p + 90, chao - 470], [p - 8, chao - 464]], { cor: "#2C2148", contorno: 5, t, id: "braco" });
    elipse(g, p + 74, chao - 464, 22, 10, "#FFE58A", { contorno: 4, t, id: "lamp", n: 10 });
  }
  if (carro !== null) {
    const c = carro - cam;
    const y = calc + 28;
    forma(g, [[c, y], [c + 20, y - 60], [c + 110, y - 64], [c + 160, y - 110], [c + 330, y - 110], [c + 390, y - 62], [c + 450, y - 54], [c + 460, y]], { cor: "#6F6890", contorno: 7, t, id: "carro" });
    forma(g, [[c + 176, y - 60], [c + 196, y - 94], [c + 260, y - 94], [c + 262, y - 60]], { cor: "#2A2246", contorno: 5, t, id: "vid1" });
    forma(g, [[c + 280, y - 60], [c + 278, y - 94], [c + 320, y - 94], [c + 352, y - 60]], { cor: "#2A2246", contorno: 5, t, id: "vid2" });
    elipse(g, c + 100, y + 2, 34, 34, "#1E1830", { contorno: 6, t, id: "r1", n: 12 });
    elipse(g, c + 370, y + 2, 34, 34, "#1E1830", { contorno: 6, t, id: "r2", n: 12 });
  }
}

// ---------------------------------------------------------------- supermercado por dentro (o abrigo do grupo)
export function desenharMercado(g, t, { W = 1920, H = 1080, chao = 860 } = {}) {
  // parede e teto
  g.fillStyle = "#4A3A6E";
  g.fillRect(0, 0, W, chao);
  g.fillStyle = "#3C2E5C";
  g.fillRect(0, 0, W, 120);
  for (let x = 120; x < W; x += 380) {
    poligono(g, [[x, 96], [x + 220, 96], [x + 220, 116], [x, 116]], { cor: "#CFC6F0", contorno: 4, t, id: "luz" + x });
  }
  // placa e prateleiras com caixas coloridas
  poligono(g, [[W / 2 - 300, 150], [W / 2 + 300, 150], [W / 2 + 300, 230], [W / 2 - 300, 230]], { cor: "#2A1F45", contorno: 6, t, id: "placa" });
  g.fillStyle = COR.amarelo;
  g.font = '900 52px "Archivo Black"';
  g.textAlign = "center";
  g.fillText("SUPERMERCADO", W / 2, 210);
  const r = rng(77);
  const cores = ["#C0503A", "#3D7A4A", "#D9A43C", "#3A6FA0", "#8A4A8C", "#E07A3A", "#5FB3A8"];
  for (const [i, x0] of [60, 560, 1180, 1520].entries()) {
    const w = i === 1 ? 480 : 360;
    poligono(g, [[x0, chao], [x0, 300], [x0 + w, 300], [x0 + w, chao]], { cor: "#5E4C86", contorno: 6, t, id: "est" + i });
    for (let y = 380; y < chao - 20; y += 120) {
      poligono(g, [[x0, y], [x0 + w, y], [x0 + w, y + 14], [x0, y + 14]], { cor: "#7A68A6", contorno: 4, t, id: `pr${i}-${y}`, amp: 0.5 });
      let x = x0 + 12;
      while (x < x0 + w - 40) {
        const bw = 26 + r() * 30;
        const bh = 40 + r() * 50;
        if (r() < 0.78) poligono(g, [[x, y], [x, y - bh], [x + bw, y - bh], [x + bw, y]], { cor: cores[Math.floor(r() * cores.length)], contorno: 3.5, t, id: `cx${i}-${y}-${Math.round(x)}`, amp: 0.4 });
        x += bw + 6;
      }
    }
  }
  // chão de piso
  g.fillStyle = "#6E5E96";
  g.fillRect(0, chao, W, H - chao);
  g.strokeStyle = "#5C4C84";
  g.lineWidth = 4;
  for (let x = -200; x < W + 200; x += 160) {
    g.beginPath();
    g.moveTo(x, chao);
    g.lineTo(x + (x - W / 2) * 0.5, H);
    g.stroke();
  }
  g.strokeStyle = COR.contorno;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(0, chao);
  g.lineTo(W, chao);
  g.stroke();
}

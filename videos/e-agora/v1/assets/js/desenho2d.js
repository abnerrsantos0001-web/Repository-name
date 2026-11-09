// Kit 2D do canal "E Agora?" (ESTILO.md): desenho em Canvas com contorno preto grosso, cores chapadas e traço vivo
// (o contorno treme ~12 vezes por segundo com semente Math.floor(t * 12): igual em todo render). Personagens são rigs
// por parâmetros (posição, passo, ângulos, olho, boca); nada aqui usa Math.random() sem semente nem o relógio.

export const COR = {
  noite: "#2B1B4A",
  toxico: "#7CFF4F",
  amarelo: "#FFD23F",
  contorno: "#0B0B0C",
  pele: "#C98B5E",
  peleSombra: "#A86F47",
  cabelo: "#2A1A12",
  jaqueta: "#FFD23F",
  jaquetaSombra: "#E2A916",
  jeans: "#2F3B63",
  mochila: "#2F6B6B",
  mochilaSombra: "#245252",
  tenis: "#F3F0E8",
  curativo: "#F6F1E4",
  zumbiPele: "#9DB894",
  zumbiSombra: "#7E9A77",
};

// gerador com semente (mulberry32)
export function rng(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ruído fixo por (quadro de traço, objeto, ponto): o traço "ferve" 12x/s e cada forma treme do seu jeito
const _cache = new Map();
export function tremor(t, id, i, amp = 1.6) {
  const q = Math.floor(t * 12);
  const k = `${q}|${id}|${i}`;
  let v = _cache.get(k);
  if (!v) {
    let h = 2166136261;
    for (const c of k) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const r = rng(h);
    v = [(r() - 0.5) * 2, (r() - 0.5) * 2];
    if (_cache.size > 50000) _cache.clear();
    _cache.set(k, v);
  }
  return [v[0] * amp, v[1] * amp];
}

// forma fechada suave pelos pontos (curvas pelos pontos médios), cor chapada + contorno preto
export function forma(g, pts, { cor, contorno = 7, t = 0, id = "f", amp = 1.4, aberta = false, semCor = false } = {}) {
  const p = pts.map(([x, y], i) => {
    const [dx, dy] = tremor(t, id, i, amp);
    return [x + dx, y + dy];
  });
  g.beginPath();
  if (aberta) {
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2;
      const my = (p[i][1] + p[i + 1][1]) / 2;
      g.quadraticCurveTo(p[i][0], p[i][1], mx, my);
    }
    g.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
  } else {
    const n = p.length;
    const m0 = [(p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2];
    g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const a = p[i];
      const b = p[(i + 1) % n];
      g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    g.closePath();
  }
  if (!aberta && !semCor && cor) {
    g.fillStyle = cor;
    g.fill();
  }
  if (contorno > 0) {
    g.lineWidth = contorno;
    g.strokeStyle = COR.contorno;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke();
  }
}

// polígono de cantos vivos (prédios, placas): mesma lógica, sem suavizar
export function poligono(g, pts, { cor, contorno = 6, t = 0, id = "p", amp = 1.0 } = {}) {
  g.beginPath();
  pts.forEach(([x, y], i) => {
    const [dx, dy] = tremor(t, id, i, amp);
    if (i === 0) g.moveTo(x + dx, y + dy);
    else g.lineTo(x + dx, y + dy);
  });
  g.closePath();
  if (cor) {
    g.fillStyle = cor;
    g.fill();
  }
  if (contorno > 0) {
    g.lineWidth = contorno;
    g.strokeStyle = COR.contorno;
    g.lineJoin = "round";
    g.stroke();
  }
}

// membro (braço, perna): cápsula por uma lista de juntas, contorno = traço preto largo por baixo do traço de cor
export function membro(g, juntas, largura, cor, { contorno = 7, t = 0, id = "m" } = {}) {
  const p = juntas.map(([x, y], i) => {
    const [dx, dy] = tremor(t, id, i, 1.1);
    return [x + dx, y + dy];
  });
  const caminho = () => {
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  caminho();
  g.lineWidth = largura + contorno * 2;
  g.strokeStyle = COR.contorno;
  g.stroke();
  caminho();
  g.lineWidth = largura;
  g.strokeStyle = cor;
  g.stroke();
}

export function elipse(g, x, y, rx, ry, cor, { contorno = 6, t = 0, id = "e", n = 14, amp = 1.2, rot = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a) * rx;
    const s = Math.sin(a) * ry;
    pts.push([x + c * Math.cos(rot) - s * Math.sin(rot), y + c * Math.sin(rot) + s * Math.cos(rot)]);
  }
  forma(g, pts, { cor, contorno, t, id, amp });
}

// ---------------------------------------------------------------- personagens
// aparência por tipo; a "variante" de cada personagem sobrescreve o que quiser (pessoas do grupo, zumbis variados)
export const PRESET = {
  protagonista: { pele: COR.pele, peleSombra: COR.peleSombra, camisa: COR.jaqueta, calca: COR.jeans, sapato: COR.tenis, listra: true,
    jaqueta: true, mochila: true, curativo: true, cabelo: { estilo: "curto", cor: COR.cabelo } },
  pessoa: { pele: "#C08A62", peleSombra: "#9E6E4A", camisa: "#6A6F86", calca: "#34384A", sapato: "#2A2A30", cabelo: { estilo: "curto", cor: "#2A1A12" } },
  zumbi: { pele: COR.zumbiPele, peleSombra: COR.zumbiSombra, camisa: "#7A6E62", calca: "#4A4F5E", sapato: "#3A3530" },
};

// rig: {x, y (chão), escala, lado (1 = virado para a direita), fase (do passo, rad), andar (0..1), cabeca (giro, rad),
//       inclinar (rad), bracoFrente/bracoTras: [ombro, cotovelo] (rad, 0 = para baixo), olho: "aberto"|"fechado"|"assustado"|"vazio",
//       olhar: [dx, dy] (-1..1), boca: "neutra"|"sorriso"|"aberta"|"grito"|"torta", piscar (0..1), respira (0..1)}
// tipo: "protagonista" | "zumbi"; variante: cores da roupa do zumbi
export function personagem(g, rig, t, tipo = "protagonista", variante = {}) {
  const e = rig.escala ?? 1;
  const lado = rig.lado ?? 1;
  const id = rig.id ?? tipo;
  const zumbi = tipo === "zumbi";
  const V = { ...(PRESET[tipo] || PRESET.pessoa), ...variante };
  const pele = V.pele;
  const andar = rig.andar ?? 0;
  const fase = rig.fase ?? 0;
  const resp = Math.sin(t * 2.1 + (rig.semente ?? 0)) * 3 * (rig.respira ?? 1);
  const bob = -Math.abs(Math.sin(fase)) * 9 * andar;
  g.save();
  g.translate(rig.x, rig.y);
  g.scale(e * lado, e);
  const C = 7 / e; // o contorno fica com a mesma espessura em qualquer escala... quase: cresce um pouco com o personagem
  const contorno = Math.max(5.5, Math.min(8, 7 * Math.sqrt(e))) / e;
  void C;
  // quadril, ombro, cabeça (coordenadas locais, pés em y = 0)
  const incl = rig.inclinar ?? (zumbi ? 0.16 : 0.04);
  const quadril = [0, -195 + bob];
  const ombro = [quadril[0] + Math.sin(incl) * 200, quadril[1] - Math.cos(incl) * 200 + resp * 0.3];
  const cab = [ombro[0] + Math.sin(incl * 1.4) * 95 + 6, ombro[1] - 92 + resp * 0.4];
  // pernas (passo): a de trás e a da frente em fase oposta
  const perna = (sinal, nome) => {
    const a = Math.sin(fase + (sinal > 0 ? 0 : Math.PI)) * 0.55 * andar;
    const dobra = Math.max(0, Math.sin(fase + (sinal > 0 ? 0 : Math.PI) + 1.2)) * 0.7 * andar + (zumbi ? 0.12 : 0.04);
    const joelho = [quadril[0] + Math.sin(a) * 98, quadril[1] + Math.cos(a) * 98];
    const pe = [joelho[0] + Math.sin(a - dobra) * 98, joelho[1] + Math.cos(a - dobra) * 98];
    pe[1] = Math.min(pe[1], 0);
    return { joelho, pe, nome };
  };
  const tras = perna(-1, "pt");
  const frente = perna(1, "pf");
  const calca = V.calca;
  const desenharPerna = (p, escuro) => {
    membro(g, [[quadril[0] + (escuro ? -8 : 8), quadril[1]], p.joelho, p.pe], 46, escuro ? sombra(calca) : calca, { contorno, t, id: id + p.nome });
    // tênis / pé descalço do zumbi
    const corPe = V.sapato;
    forma(g, [[p.pe[0] - 22, p.pe[1] - 4], [p.pe[0] - 20, p.pe[1] - 30], [p.pe[0] + 18, p.pe[1] - 26], [p.pe[0] + 46, p.pe[1] - 8], [p.pe[0] + 44, p.pe[1] + 6], [p.pe[0] - 22, p.pe[1] + 6]],
      { cor: escuro ? sombra(corPe) : corPe, contorno, t, id: id + p.nome + "pe", amp: 0.9 });
    if (V.listra) {
      g.strokeStyle = "#D23B3B";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(p.pe[0] - 14, p.pe[1] - 2);
      g.lineTo(p.pe[0] + 38, p.pe[1] - 2);
      g.stroke();
    }
  };
  // braços: ângulos (0 = para baixo, positivo = para a frente)
  const braco = (ang, nome, escuro) => {
    const [a1, a2] = ang;
    const base = [ombro[0] + (escuro ? -14 : 10), ombro[1] + 18];
    const cot = [base[0] + Math.sin(a1) * 88, base[1] + Math.cos(a1) * 88];
    const mao = [cot[0] + Math.sin(a1 + a2) * 84, cot[1] + Math.cos(a1 + a2) * 84];
    return { base, cot, mao, nome, escuro };
  };
  const balanco = Math.sin(fase) * 0.5 * andar;
  const bT = braco(rig.bracoTras ?? (zumbi ? [1.25 - balanco * 0.3, 0.15] : [balanco, -0.25]), "bt", true);
  const bF = braco(rig.bracoFrente ?? (zumbi ? [1.35 + balanco * 0.3, 0.1] : [-balanco, -0.3]), "bf", false);
  const manga = V.manga ?? V.camisa;
  const desenharBraco = (b) => {
    const corManga = b.escuro ? sombra(manga) : manga;
    if (zumbi) {
      // manga curta rasgada: pele a partir do meio do braço
      const meio = [(b.base[0] + b.cot[0]) / 2, (b.base[1] + b.cot[1]) / 2];
      membro(g, [meio, b.cot, b.mao], 34, b.escuro ? V.peleSombra : pele, { contorno, t, id: id + b.nome + "p" });
      membro(g, [b.base, meio], 44, corManga, { contorno, t, id: id + b.nome });
    } else {
      membro(g, [b.base, b.cot, b.mao], 44, corManga, { contorno, t, id: id + b.nome });
      // curativo no antebraço do braço da frente (ESTILO: curativo no braço)
      if (!b.escuro && V.curativo) {
        const k = 0.45;
        const c1 = [b.cot[0] + (b.mao[0] - b.cot[0]) * k, b.cot[1] + (b.mao[1] - b.cot[1]) * k];
        const c2 = [b.cot[0] + (b.mao[0] - b.cot[0]) * (k + 0.32), b.cot[1] + (b.mao[1] - b.cot[1]) * (k + 0.32)];
        membro(g, [c1, c2], 48, COR.curativo, { contorno: contorno * 0.8, t, id: id + "cur" });
        g.strokeStyle = "#CFC6B0";
        g.lineWidth = 3;
        for (const f of [0.3, 0.7]) {
          const px = c1[0] + (c2[0] - c1[0]) * f;
          const py = c1[1] + (c2[1] - c1[1]) * f;
          const ang = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]) + Math.PI / 2;
          g.beginPath();
          g.moveTo(px - Math.cos(ang) * 20, py - Math.sin(ang) * 20);
          g.lineTo(px + Math.cos(ang) * 20, py + Math.sin(ang) * 20);
          g.stroke();
        }
      }
    }
    // mão
    elipse(g, b.mao[0], b.mao[1], 21, 19, b.escuro ? V.peleSombra : pele, { contorno, t, id: id + b.nome + "m", n: 10 });
    // bengala na mão da frente (o senhor do grupo)
    if (!b.escuro && V.bengala) {
      membro(g, [[b.mao[0] + 6, b.mao[1] - 8], [b.mao[0] + 30, 0]], 10, "#6B4A2E", { contorno: contorno * 0.7, t, id: id + "beng" });
      membro(g, [[b.mao[0] - 14, b.mao[1] - 10], [b.mao[0] + 8, b.mao[1] - 12]], 10, "#6B4A2E", { contorno: contorno * 0.7, t, id: id + "beng2" });
    }
  };

  // ordem: braço de trás, perna de trás, mochila, tronco, perna da frente, cabeça, braço da frente
  desenharBraco(bT);
  desenharPerna(tras, true);
  const dx = ombro[0] - quadril[0];
  const dy = ombro[1] - quadril[1];
  const lx = (f) => quadril[0] + dx * f;
  const ly = (f) => quadril[1] + dy * f;
  if (V.mochila) {
    // mochila nas costas
    forma(g, [[lx(0.15) - 66, ly(0.15)], [lx(0.95) - 74, ly(0.95)], [lx(1.0) - 38, ly(1.0) - 10], [lx(0.15) - 30, ly(0.1)]], { cor: COR.mochila, contorno, t, id: id + "moc" });
    forma(g, [[lx(0.3) - 80, ly(0.3)], [lx(0.6) - 84, ly(0.6)], [lx(0.6) - 60, ly(0.6)], [lx(0.3) - 58, ly(0.3)]], { cor: COR.mochilaSombra, contorno: contorno * 0.8, t, id: id + "moc2" });
  }
  // tronco (jaqueta / camisa rasgada)
  const corTronco = V.camisa;
  const largQ = 54;
  const largO = 64;
  const tronco = zumbi
    ? [[quadril[0] - largQ, quadril[1] + 6], [quadril[0] - largQ + 14, quadril[1] - 18], [quadril[0] - largQ + 26, quadril[1] + 2], [quadril[0] - 6, quadril[1] - 16], [quadril[0] + 14, quadril[1] + 8], [quadril[0] + largQ - 16, quadril[1] - 12], [quadril[0] + largQ, quadril[1] + 4],
       [ombro[0] + largO - 6, ombro[1] + 10], [ombro[0] + 20, ombro[1] - 10], [ombro[0] - largO + 12, ombro[1] + 4]]
    : [[quadril[0] - largQ, quadril[1] + 8], [quadril[0] + largQ, quadril[1] + 8], [ombro[0] + largO - 4, ombro[1] + 14], [ombro[0] + 18, ombro[1] - 8], [ombro[0] - largO + 6, ombro[1] + 8]];
  forma(g, tronco, { cor: corTronco, contorno, t, id: id + "tr", amp: 1.2 });
  if (V.colete) {
    // colete escuro por cima da camisa (o Rui, ex-policial)
    forma(g, [[lx(0.02) - 50, ly(0.02) + 4], [lx(0.02) + 52, ly(0.02) + 4], [lx(0.92) + 48, ly(0.92) + 6], [lx(0.98) + 14, ly(0.98) - 2], [lx(0.98) - 10, ly(0.98) + 10], [lx(0.92) - 54, ly(0.92)]],
      { cor: V.colete, contorno, t, id: id + "colete" });
    for (const f of [0.28, 0.55]) forma(g, [[lx(f) + 10, ly(f)], [lx(f) + 44, ly(f)], [lx(f) + 44, ly(f) - 26], [lx(f) + 10, ly(f) - 26]], { cor: sombra(V.colete, 0.8), contorno: 4, t, id: id + "bol" + f, amp: 0.5 });
  }
  if (V.estetoscopio) {
    g.strokeStyle = COR.contorno;
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(ombro[0] - 26, ombro[1] + 10);
    g.quadraticCurveTo(lx(0.55) + 20, ly(0.55), ombro[0] + 34, ombro[1] + 14);
    g.stroke();
    g.strokeStyle = "#8C9CA8";
    g.lineWidth = 5;
    g.stroke();
    elipse(g, lx(0.55) + 24, ly(0.55) + 8, 10, 10, "#B8C4CC", { contorno: 4, t, id: id + "est", n: 8 });
  }
  if (V.jaqueta) {
    // zíper, bolso e gola da jaqueta; alça da mochila
    g.strokeStyle = COR.contorno;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(lx(0.05) + 26, ly(0.05));
    g.lineTo(lx(0.92) + 30, ly(0.92));
    g.stroke();
    forma(g, [[lx(0.18) + 34, ly(0.18)], [lx(0.36) + 36, ly(0.36)], [lx(0.36) + 54, ly(0.36)], [lx(0.18) + 52, ly(0.18)]], { cor: COR.jaquetaSombra, contorno: 4, t, id: id + "bolso", amp: 0.6 });
    if (V.mochila) membro(g, [[lx(1.0) - 10, ly(1.0) + 6], [lx(0.45) - 30, ly(0.45)]], 13, COR.mochilaSombra, { contorno: 4, t, id: id + "alca" });
    forma(g, [[ombro[0] - 34, ombro[1] + 8], [ombro[0] + 2, ombro[1] - 14], [ombro[0] + 44, ombro[1] + 2], [ombro[0] + 30, ombro[1] + 22], [ombro[0] - 20, ombro[1] + 24]], { cor: COR.jaquetaSombra, contorno: 5, t, id: id + "gola" });
  } else if (zumbi) {
    // rasgos na camisa
    g.strokeStyle = COR.contorno;
    g.lineWidth = 4;
    for (const [f, w] of [[0.35, 18], [0.6, 12]]) {
      g.beginPath();
      g.moveTo(lx(f) - w, ly(f));
      g.lineTo(lx(f) - w / 3, ly(f) + 8);
      g.lineTo(lx(f) + w / 3, ly(f) - 4);
      g.lineTo(lx(f) + w, ly(f) + 6);
      g.stroke();
    }
  }
  desenharPerna(frente, false);
  // pescoço e cabeça
  membro(g, [[ombro[0] + 6, ombro[1] + 6], [cab[0] - 6, cab[1] + 50]], 34, pele, { contorno, t, id: id + "pesc" });
  g.save();
  g.translate(cab[0], cab[1]);
  g.rotate((rig.cabeca ?? 0) + (zumbi ? Math.sin(t * 1.3 + (rig.semente ?? 0)) * 0.08 + 0.12 : 0));
  cabeca(g, rig, t, zumbi, pele, contorno, id, V);
  g.restore();
  desenharBraco(bF);
  g.restore();
}

function cabeca(g, rig, t, zumbi, pele, contorno, id, V) {
  const R = 86;
  // orelha (atrás)
  const cab = V.cabelo || {};
  // cabelo comprido / rabo: atrás da cabeça
  if (cab.estilo === "comprido") forma(g, [[-70, -50], [-92, 20], [-84, 110], [-40, 128], [-6, 100], [-20, 40], [20, -40]], { cor: cab.cor, contorno, t, id: id + "cabtras", amp: 1.2 });
  if (cab.estilo === "rabo") forma(g, [[-70, -40], [-118, -10], [-128, 50], [-104, 70], [-96, 20], [-66, 0]], { cor: cab.cor, contorno, t, id: id + "rabo", amp: 1.2 });
  elipse(g, -30, 10, 16, 22, V.peleSombra, { contorno, t, id: id + "orelha", n: 9 });
  // crânio: um pouco mais largo embaixo (bochecha), queixo para a frente
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    let rx = R * 1.0;
    let ry = R * 1.05;
    if (Math.sin(a) > 0.3 && Math.cos(a) > -0.2) rx *= 1.06;
    pts.push([Math.cos(a) * rx + 6, Math.sin(a) * ry]);
  }
  forma(g, pts, { cor: pele, contorno, t, id: id + "cab", amp: 1.3 });
  if (zumbi) {
    // manchas e cabelo ralo
    elipse(g, -18, -40, 16, 11, COR.zumbiSombra, { contorno: 0, t, id: id + "mancha", n: 8 });
    g.strokeStyle = COR.contorno;
    g.lineWidth = 5;
    for (const [x0, y0, x1, y1] of [[-30, -78, -42, -102], [-6, -86, -4, -112], [18, -82, 30, -104]]) {
      g.beginPath();
      g.moveTo(x0, y0);
      g.quadraticCurveTo((x0 + x1) / 2 - 6, (y0 + y1) / 2, x1, y1);
      g.stroke();
    }
  } else if (cab.estilo === "careca") {
    // careca com os lados grisalhos
    forma(g, [[-84, 20], [-90, -24], [-70, -40], [-58, -10], [-62, 18]], { cor: cab.cor, contorno, t, id: id + "lado", amp: 0.9 });
  } else if (cab.estilo === "comprido" || cab.estilo === "rabo" || cab.estilo === "coque") {
    // franja e topo lisos
    forma(g, [[-84, 0], [-86, -50], [-56, -90], [-10, -104], [40, -96], [78, -66], [90, -34], [60, -50], [20, -58], [-20, -48], [-50, -30], [-64, -4]], { cor: cab.cor, contorno, t, id: id + "cabelo", amp: 1.1 });
    if (cab.estilo === "coque") elipse(g, -46, -96, 30, 26, cab.cor, { contorno, t, id: id + "coque", n: 10 });
  } else if (cab.estilo === "raspado") {
    forma(g, [[-84, -6], [-80, -54], [-40, -92], [10, -100], [56, -86], [82, -56], [60, -60], [10, -72], [-40, -58], [-66, -30]], { cor: cab.cor, contorno, t, id: id + "cabelo", amp: 0.9 });
  } else {
    // cabelo: mecha bagunçada por cima
    forma(g, [[-82, 6], [-88, -48], [-60, -88], [-26, -100], [4, -112], [22, -96], [52, -104], [70, -80], [88, -56], [60, -60], [40, -46], [10, -62], [-14, -46], [-40, -40], [-56, -14]],
      { cor: cab.cor || COR.cabelo, contorno, t, id: id + "cabelo", amp: 1.2 });
  }
  if (V.barba) forma(g, [[-30, 20], [-20, 70], [20, 96], [70, 90], [94, 50], [96, 26], [80, 40], [40, 62], [0, 50]], { cor: V.barba, contorno, t, id: id + "barba", amp: 1.0 });
  // olhos (perfil 3/4 para a direita)
  const olhar = rig.olhar ?? [0.5, 0];
  const piscar = rig.piscar ?? 0;
  const estado = rig.olho ?? (zumbi ? "vazio" : "aberto");
  for (const [ox, rx, nome] of [[30, 19, "o1"], [70, 15, "o2"]]) {
    const ry = estado === "assustado" ? 27 : 23;
    const fechado = estado === "fechado" || piscar > 0.6;
    if (fechado) {
      g.strokeStyle = COR.contorno;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(ox - rx, -8);
      g.quadraticCurveTo(ox, 2, ox + rx, -8);
      g.stroke();
      continue;
    }
    elipse(g, ox, -10, rx, ry * (1 - piscar * 0.8), zumbi ? "#E8F7C8" : "#FFFFFF", { contorno: 5, t, id: id + nome, n: 10, amp: 0.7 });
    if (zumbi) {
      // olho sem pupila, brilho verde-tóxico
      elipse(g, ox + olhar[0] * 4, -10 + olhar[1] * 4, rx * 0.55, ry * 0.5, COR.toxico, { contorno: 0, t, id: id + nome + "b", n: 8 });
    } else {
      const pr = estado === "assustado" ? 7 : 10;
      g.fillStyle = COR.contorno;
      g.beginPath();
      g.arc(ox + olhar[0] * rx * 0.45, -8 + olhar[1] * ry * 0.4, pr, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#FFFFFF";
      g.beginPath();
      g.arc(ox + olhar[0] * rx * 0.45 - 3, -12 + olhar[1] * ry * 0.4, 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (V.oculos) {
    g.strokeStyle = COR.contorno;
    g.lineWidth = 5;
    for (const [ox, rx] of [[30, 26], [70, 22]]) {
      g.beginPath();
      g.ellipse(ox, -10, rx, 24, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(50, -12);
    g.lineTo(52, -12);
    g.moveTo(4, -14);
    g.lineTo(-26, -6);
    g.stroke();
  }
  // sobrancelhas
  g.strokeStyle = COR.contorno;
  g.lineWidth = 7;
  g.lineCap = "round";
  const sob = rig.sobrancelha ?? (zumbi ? -0.3 : 0);
  for (const [ox, w] of [[30, 20], [70, 16]]) {
    g.beginPath();
    g.moveTo(ox - w, -40 - sob * 6);
    g.lineTo(ox + w, -42 + sob * 8);
    g.stroke();
  }
  // nariz
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(88, 2);
  g.quadraticCurveTo(100, 18, 84, 22);
  g.stroke();
  // boca
  const boca = rig.boca ?? (zumbi ? "aberta" : "neutra");
  g.lineWidth = 6;
  if (boca === "neutra") {
    g.beginPath();
    g.moveTo(44, 48);
    g.quadraticCurveTo(60, 50, 74, 46);
    g.stroke();
  } else if (boca === "sorriso") {
    g.beginPath();
    g.moveTo(40, 42);
    g.quadraticCurveTo(60, 62, 80, 40);
    g.stroke();
  } else if (boca === "torta") {
    g.beginPath();
    g.moveTo(40, 52);
    g.quadraticCurveTo(56, 44, 78, 50);
    g.stroke();
  } else {
    const ab = boca === "grito" ? 26 : 14;
    forma(g, [[40, 44], [62, 40], [80, 46], [74, 46 + ab], [52, 48 + ab]], { cor: "#3A1414", contorno: 5, t, id: id + "boca", amp: 0.8 });
    if (zumbi) {
      // dentes tortos
      g.fillStyle = "#E9E4C8";
      for (const x of [50, 62]) g.fillRect(x, 44, 7, 8);
    }
  }
}

function sombra(hex, k = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const gg = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${gg},${b})`;
}
export { sombra };

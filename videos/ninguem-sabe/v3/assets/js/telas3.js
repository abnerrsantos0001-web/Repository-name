// Telas do vídeo 3: celular (600 x 1302), TV (1506 x 845) e a folha do caderno.
// Regra 5: o que conta a história (7 dias, 14:07, 3:33, 52 anos...) sai em vermelho.
import { C, fonte, barraDeStatus } from "./telas.js";

export const VERMELHO = "#e3121b";

function caixaArred(g, x, y, w, h, r, cor) {
  g.fillStyle = cor;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
function quebrar(g, texto, x, y, larg, entre) {
  const palavras = texto.split(" ");
  let linha = "";
  let yy = y;
  for (const p of palavras) {
    const t = linha ? linha + " " + p : p;
    if (g.measureText(t).width > larg && linha) {
      g.fillText(linha, x, yy);
      linha = p;
      yy += entre;
    } else linha = t;
  }
  if (linha) g.fillText(linha, x, yy);
  return yy + entre;
}
function avatarLetra(g, x, y, r, letra, cor) {
  g.fillStyle = cor;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f4f2ee";
  g.font = fonte(800, r);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(letra, x, y + 2);
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
}

// tela bloqueada com a hora grande e a notificação do e-mail
export function telaBloqueio(g, W, H, { hora = "3:33", data = "", notificacao = null, brilho = 1 } = {}) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#2c3a58");
  grad.addColorStop(1, "#161b28");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  barraDeStatus(g, W, hora);
  g.textAlign = "center";
  g.fillStyle = C.texto;
  g.font = fonte(300, 190);
  g.fillText(hora, W / 2, 330);
  if (data) {
    g.font = fonte(600, 34);
    g.fillText(data, W / 2, 400);
  }
  if (notificacao) {
    caixaArred(g, 30, 470, W - 60, 230, 34, "rgba(58,62,72,0.92)");
    caixaArred(g, 58, 500, 64, 64, 16, "#3b6fd8");
    g.fillStyle = "#fff";
    g.font = fonte(800, 40);
    g.fillText("@", 90, 546);
    g.textAlign = "left";
    g.fillStyle = C.sec;
    g.font = fonte(600, 28);
    g.fillText("E-MAIL · agora", 140, 528);
    g.fillStyle = C.texto;
    g.font = fonte(700, 32);
    g.fillText(notificacao.de ?? "(sem remetente)", 140, 566);
    g.fillStyle = notificacao.vermelho ? VERMELHO : C.texto;
    g.font = fonte(800, 40);
    quebrar(g, notificacao.texto, 60, 632, W - 120, 46);
  }
  if (brilho < 1) {
    g.fillStyle = `rgba(0,0,0,${1 - brilho})`;
    g.fillRect(0, 0, W, H);
  }
}

// o e-mail aberto: sem remetente, sem assinatura, só uma frase (em vermelho); "pequenas" = letras miúdas lá embaixo
export function telaEmail(g, W, H, { hora = "7:05", assunto = "(sem assunto)", frase = "Você tem 7 dias.", pequenas = null, destaquePequenas = false, extra = null } = {}) {
  g.fillStyle = "#f2f1ee";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#e4e2dd";
  g.fillRect(0, 0, W, 190);
  barraDeStatus(g, W, hora);
  g.fillStyle = "#1a1c22";
  g.font = fonte(700, 40);
  g.textAlign = "left";
  g.fillText("←", 40, 150);
  g.font = fonte(800, 38);
  g.fillText(assunto, 100, 150);
  avatarLetra(g, 80, 270, 42, "?", "#8a8c90");
  g.fillStyle = "#5a5c62";
  g.font = fonte(700, 30);
  g.fillText("(sem remetente)", 140, 262);
  g.font = fonte(500, 24);
  g.fillText("para mim · " + hora, 140, 298);
  g.fillStyle = VERMELHO;
  g.font = fonte(900, 66);
  quebrar(g, frase, 40, 470, W - 80, 78);
  if (extra) {
    g.fillStyle = "#1a1c22";
    g.font = fonte(800, 52);
    quebrar(g, extra, 40, 700, W - 80, 62);
  }
  if (pequenas) {
    g.fillStyle = destaquePequenas ? VERMELHO : "#9a9ca0";
    g.font = fonte(destaquePequenas ? 800 : 500, destaquePequenas ? 34 : 18);
    g.fillText(pequenas, 40, H - 150);
    if (destaquePequenas) {
      g.strokeStyle = VERMELHO;
      g.lineWidth = 4;
      g.strokeRect(30, H - 192, g.measureText(pequenas).width + 20, 56);
    }
  }
}

// caixa de entrada: lista de e-mails; o primeiro pode estar sem abrir (negrito, ponto azul)
export function telaCaixa(g, W, H, { hora = "21:10", emails = [], naoLidos = 1 } = {}) {
  g.fillStyle = "#f2f1ee";
  g.fillRect(0, 0, W, H);
  barraDeStatus(g, W, hora);
  g.fillStyle = "#1a1c22";
  g.font = fonte(800, 48);
  g.textAlign = "left";
  g.fillText("Caixa de entrada", 40, 160);
  emails.forEach((e, i) => {
    const y = 220 + i * 150;
    g.fillStyle = i % 2 ? "#ebe9e4" : "#f2f1ee";
    g.fillRect(0, y, W, 150);
    const novo = i < naoLidos;
    if (novo) {
      g.fillStyle = "#3b6fd8";
      g.beginPath();
      g.arc(28, y + 60, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#1a1c22";
    g.font = fonte(novo ? 800 : 500, 30);
    g.fillText(e.de ?? "(sem remetente)", 52, y + 56);
    g.fillStyle = e.vermelho ? VERMELHO : novo ? "#1a1c22" : "#5a5c62";
    g.font = fonte(novo ? 800 : 500, 32);
    g.fillText(e.assunto, 52, y + 102);
    g.fillStyle = "#8a8c90";
    g.font = fonte(500, 24);
    g.textAlign = "right";
    g.fillText(e.hora ?? "", W - 30, y + 56);
    g.textAlign = "left";
  });
}

// conversa (grupo da escola, Lucas...): [{de, texto, minha, cor, foto, vermelho}]
export function telaChat(g, W, H, { titulo = "8º ANO B", hora = "7:40", mensagens = [], sub = "32 participantes" } = {}) {
  g.fillStyle = "#0f1a1a";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#1d2b2b";
  g.fillRect(0, 0, W, 200);
  barraDeStatus(g, W, hora);
  avatarLetra(g, 90, 140, 38, titulo[0], "#3d7a6a");
  g.textAlign = "left";
  g.fillStyle = C.texto;
  g.font = fonte(800, 36);
  g.fillText(titulo, 145, 135);
  g.fillStyle = C.sec;
  g.font = fonte(500, 24);
  g.fillText(sub, 145, 170);
  let y = H - 120;
  for (let i = mensagens.length - 1; i >= 0; i--) {
    const m = mensagens[i];
    const alt = m.foto ? 330 : m.grande ? 150 : 104;
    y -= alt + 22;
    const w = m.foto ? 360 : Math.min(W - 70, 120 + m.texto.length * (m.grande ? 34 : 20));
    const x = m.minha ? W - 30 - w : 30;
    caixaArred(g, x, y, w, alt, 26, m.minha ? "#1f5a4a" : "#243232");
    if (!m.minha && m.de) {
      g.fillStyle = m.cor ?? "#7fd0b0";
      g.font = fonte(800, 24);
      g.fillText(m.de, x + 22, y + 36);
    }
    if (m.foto) {
      caixaArred(g, x + 18, y + 52, w - 36, alt - 70, 16, "#f2f1ee");
      g.fillStyle = "#5a5c62";
      g.font = fonte(700, 18);
      g.fillText("(sem remetente)", x + 34, y + 92);
      g.fillStyle = VERMELHO;
      g.font = fonte(900, 46);
      g.fillText(m.foto, x + 34, y + 160);
      g.fillStyle = "#9a9ca0";
      g.font = fonte(500, 14);
      g.fillText(m.pequenas ?? "", x + 34, y + alt - 40);
    } else {
      g.fillStyle = m.vermelho ? "#ff4a50" : C.texto;
      g.font = fonte(m.vermelho || m.grande ? 900 : 600, m.grande ? 56 : 35);
      g.fillText(m.texto, x + 22, y + (m.de && !m.minha ? 80 : 66) + (m.grande ? 18 : 0));
    }
  }
  caixaArred(g, 24, H - 96, W - 48, 70, 35, "#243232");
}

// a conta no bloco de notas (parte 7)
export function telaConta(g, W, H, { hora = "23:58", linhas = [] } = {}) {
  g.fillStyle = "#16171a";
  g.fillRect(0, 0, W, H);
  barraDeStatus(g, W, hora);
  g.fillStyle = "#e9c46a";
  g.font = fonte(700, 34);
  g.textAlign = "left";
  g.fillText("‹ Notas", 34, 150);
  linhas.forEach((l, i) => {
    g.fillStyle = l.vermelho ? VERMELHO : C.texto;
    g.font = fonte(l.vermelho ? 900 : 700, l.vermelho ? 78 : 58);
    g.fillText(l.texto, 40, 330 + i * 130);
  });
}

// perfis com a data (parte 6): grade de perfis com "x dias" / "x anos"
export function telaPerfis(g, W, H, { hora = "13:20", perfis = [] } = {}) {
  g.fillStyle = "#101114";
  g.fillRect(0, 0, W, H);
  barraDeStatus(g, W, hora);
  g.fillStyle = C.texto;
  g.font = fonte(800, 44);
  g.textAlign = "left";
  g.fillText("Para você", 36, 160);
  perfis.forEach((p, i) => {
    const y = 210 + i * 210;
    caixaArred(g, 24, y, W - 48, 186, 26, "#1d1f24");
    avatarLetra(g, 100, y + 93, 54, p.nome[0], p.cor ?? "#5a6a7a");
    g.fillStyle = C.texto;
    g.font = fonte(800, 34);
    g.textAlign = "left";
    g.fillText(p.nome, 180, y + 78);
    g.fillStyle = VERMELHO;
    g.font = fonte(900, 40);
    g.fillText("⏳ " + p.data, 180, y + 132);
  });
}

// o boato (parte 10): posts dizendo que a data mudou
export function telaBoato(g, W, H, { hora = "18:44", posts = [] } = {}) {
  g.fillStyle = "#101114";
  g.fillRect(0, 0, W, H);
  barraDeStatus(g, W, hora);
  g.fillStyle = C.texto;
  g.font = fonte(800, 44);
  g.textAlign = "left";
  g.fillText("Em alta", 36, 160);
  g.fillStyle = VERMELHO;
  g.font = fonte(900, 40);
  g.fillText("#ADATAMUDOU", 36, 225);
  posts.forEach((p, i) => {
    const y = 270 + i * 250;
    caixaArred(g, 24, y, W - 48, 226, 26, "#1d1f24");
    avatarLetra(g, 84, y + 64, 38, p.nome[0], p.cor ?? "#5a6a7a");
    g.fillStyle = C.sec;
    g.font = fonte(700, 26);
    g.textAlign = "left";
    g.fillText(p.nome, 140, y + 72);
    g.fillStyle = C.texto;
    g.font = fonte(700, 33);
    quebrar(g, p.texto, 50, y + 140, W - 100, 40);
  });
}

// "deslizar para desligar" (parte 8); fundo = 0..1 do botão
export function telaDesligar(g, W, H, k = 0) {
  g.fillStyle = "#0b0c0f";
  g.fillRect(0, 0, W, H);
  caixaArred(g, 40, 200, W - 80, 120, 60, "#2a2c31");
  caixaArred(g, 48 + k * (W - 200), 208, 104, 104, 52, "#e9e7e3");
  g.fillStyle = VERMELHO;
  g.font = fonte(900, 46);
  g.textAlign = "center";
  g.fillText("⏻", 100 + k * (W - 200), 278);
  g.fillStyle = C.texto;
  g.font = fonte(600, 32);
  g.fillText("deslizar para desligar", W / 2 + 40, 275);
}
export function telaApagada(g, W, H) {
  g.fillStyle = "#050506";
  g.fillRect(0, 0, W, H);
}

// --------------------------------------------------------------- TV (1506 x 845)
// jornal: âncora em silhueta, faixa "AO VIVO", a manchete embaixo (vermelha)
export function tvJornal(g, W, H, { manchete = "ATAQUE HACKER?", sub = "", noite = false, mapa = 0, t = 0 } = {}) {
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, noite ? "#0e1a30" : "#18304e");
  grad.addColorStop(1, noite ? "#060b16" : "#0b1628");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  if (mapa > 0) {
    mapaMundo(g, W * 0.06, H * 0.08, W * 0.88, H * 0.62, mapa, t);
  } else {
    // estúdio: âncora (silhueta clara) e o telão atrás
    g.fillStyle = "#24476e";
    g.fillRect(W * 0.52, H * 0.1, W * 0.42, H * 0.46);
    mapaMundo(g, W * 0.54, H * 0.14, W * 0.38, H * 0.38, 0.6, t);
    g.fillStyle = "#c9b9a8";
    g.beginPath();
    g.arc(W * 0.3, H * 0.33, H * 0.11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#2a2f3a";
    g.beginPath();
    g.ellipse(W * 0.3, H * 0.68, H * 0.24, H * 0.22, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = "#3a4250";
    g.fillRect(W * 0.08, H * 0.6, W * 0.44, H * 0.1);
  }
  // faixa da manchete
  g.fillStyle = VERMELHO;
  g.fillRect(0, H * 0.74, W * 0.2, H * 0.12);
  g.fillStyle = "#fff";
  g.font = fonte(900, H * 0.06);
  g.textAlign = "center";
  g.fillText("AO VIVO", W * 0.1, H * 0.82);
  g.fillStyle = "#f4f2ee";
  g.fillRect(W * 0.2, H * 0.74, W * 0.8, H * 0.12);
  g.fillStyle = VERMELHO;
  g.font = fonte(900, H * 0.075);
  g.textAlign = "left";
  g.fillText(manchete, W * 0.23, H * 0.83);
  g.fillStyle = "#0b1628";
  g.fillRect(0, H * 0.86, W, H * 0.08);
  g.fillStyle = "#cfd6e0";
  g.font = fonte(700, H * 0.045);
  g.fillText(sub, W * 0.03, H * 0.915);
}
// mapa-múndi de pontos; "k" = quanto já se espalhou (os e-mails chegando)
const CONTINENTES = [
  [0.12, 0.2, 0.16, 0.22], [0.2, 0.42, 0.08, 0.14], [0.26, 0.62, 0.07, 0.2], [0.46, 0.22, 0.08, 0.1],
  [0.48, 0.45, 0.1, 0.24], [0.62, 0.22, 0.22, 0.2], [0.7, 0.42, 0.1, 0.12], [0.82, 0.66, 0.08, 0.1],
];
export function mapaMundo(g, x, y, w, h, k = 1, t = 0) {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (const [cx, cy, rx, ry] of CONTINENTES) {
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r());
      const px = x + w * (cx + rx * d * Math.cos(a));
      const py = y + h * (cy + ry * d * Math.sin(a));
      const aceso = r() < k;
      g.fillStyle = aceso ? (Math.sin(t * 6 + i) > 0.4 ? "#ff3a40" : VERMELHO) : "#5d7896";
      g.beginPath();
      g.arc(px, py, aceso ? w * 0.006 : w * 0.0045, 0, Math.PI * 2);
      g.fill();
    }
  }
}
// videogame (parte 3): dois lutadores de pixel e as barras de vida
export function tvJogo(g, W, H, t = 0) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#f0a85a");
  grad.addColorStop(1, "#6a3a5a");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#3a2a3a";
  g.fillRect(0, H * 0.78, W, H * 0.22);
  for (let i = 0; i < 6; i++) {
    g.fillStyle = "#4a3048";
    g.fillRect(W * (0.05 + i * 0.17), H * 0.4, W * 0.1, H * 0.38);
  }
  const lutador = (x, cor, f) => {
    const b = Math.sin(t * 9 + f) * 6;
    g.fillStyle = cor;
    g.fillRect(x, H * 0.5 + b, W * 0.06, H * 0.2);
    g.fillRect(x + W * 0.008, H * 0.4 + b, W * 0.045, H * 0.1);
    g.fillRect(x + (f ? -W * 0.05 : W * 0.06), H * 0.54 + b, W * 0.05, H * 0.035);
    g.fillRect(x, H * 0.7 + b, W * 0.022, H * 0.08);
    g.fillRect(x + W * 0.038, H * 0.7 + b, W * 0.022, H * 0.08);
  };
  const dx = Math.sin(t * 2.3) * W * 0.04;
  lutador(W * 0.36 + dx, "#2a6acc", 0);
  lutador(W * 0.56 - dx, "#c4161c", 1);
  for (const [x, v, c] of [[0.04, 0.7 + 0.2 * Math.sin(t), "#2a6acc"], [0.56, 0.5 + 0.2 * Math.cos(t * 1.3), "#c4161c"]]) {
    g.fillStyle = "#1a1a1a";
    g.fillRect(W * x, H * 0.06, W * 0.4, H * 0.06);
    g.fillStyle = c;
    g.fillRect(W * x + 4, H * 0.06 + 4, (W * 0.4 - 8) * v, H * 0.06 - 8);
  }
  g.fillStyle = "#fff";
  g.font = fonte(900, H * 0.08);
  g.textAlign = "center";
  g.fillText(String(60 - (Math.floor(t) % 60)).padStart(2, "0"), W / 2, H * 0.13);
}
// TV ligada sem som de madrugada (parte 11/12): um programa qualquer, só a luz mudando
export function tvMadrugada(g, W, H, t = 0) {
  const k = 0.5 + 0.5 * Math.sin(t * 0.7);
  g.fillStyle = `rgb(${40 + 30 * k},${60 + 25 * k},${95 + 30 * k})`;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#8aa0c0";
  g.beginPath();
  g.arc(W * (0.3 + 0.2 * Math.sin(t * 0.3)), H * 0.45, H * 0.18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1a2236";
  g.fillRect(0, H * 0.75, W, H * 0.25);
  g.fillStyle = "#cfd6e0";
  g.font = fonte(700, H * 0.05);
  g.textAlign = "left";
  g.fillText("🔇", W * 0.9, H * 0.12);
}

// --------------------------------------------------------------- a folha do caderno (lista)
// itens: [{texto, riscado (0..1), novo}]; escrito = 0..1 do quanto já foi escrito (a caneta avançando)
export function folhaLista(g, W, H, { itens = [], escrito = 1, dobras = false } = {}) {
  g.fillStyle = "#f3efe4";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "#a9c4dc";
  g.lineWidth = Math.max(2, H * 0.003);
  for (let y = H * 0.12; y < H; y += H * 0.07) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.strokeStyle = "#e08a8a";
  g.beginPath();
  g.moveTo(W * 0.12, 0);
  g.lineTo(W * 0.12, H);
  g.stroke();
  if (dobras) {
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = H * 0.006;
    for (const k of [1 / 3, 2 / 3]) {
      g.beginPath();
      g.moveTo(0, H * k);
      g.lineTo(W, H * k);
      g.stroke();
    }
  }
  const total = itens.reduce((a, i) => a + i.texto.length, 0);
  let usado = 0;
  itens.forEach((it, i) => {
    const y = H * (0.12 + 0.07 * (i * 1.5 + 1)) - H * 0.012;
    const n = Math.max(0, Math.min(it.texto.length, Math.round(escrito * total - usado)));
    usado += it.texto.length;
    if (n <= 0) return;
    g.fillStyle = it.novo ? VERMELHO : "#1c2a4a";
    g.font = `italic 600 ${H * 0.052}px "Segoe Print", "Comic Sans MS", Inter, cursive`;
    g.textAlign = "left";
    const tx = (i + 1) + ". " + it.texto;
    const corte = tx.slice(0, Math.min(tx.length, n + 3));
    g.fillText(corte, W * 0.16, y);
    if (it.riscado > 0) {
      const w = g.measureText(tx).width * it.riscado;
      g.strokeStyle = "#1c2a4a";
      g.lineWidth = H * 0.008;
      g.beginPath();
      g.moveTo(W * 0.15, y - H * 0.016);
      g.lineTo(W * 0.15 + w, y - H * 0.02);
      g.stroke();
    }
  });
}

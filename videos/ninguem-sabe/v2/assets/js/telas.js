// Telas do celular do personagem, desenhadas num canvas (600 x 1302) que vira textura da tela.
// Cada função desenha um estado completo; a cena decide qual mostrar em cada instante.
export const C = {
  fundo: "#0d0e10",
  texto: "#e9e7e3",
  sec: "#8a8c90",
  barra: "#2a2c30",
  barra2: "#3a3c41",
  vermelho: "#e01b22",
};
export const fonte = (peso, px) => `${peso} ${px}px Inter, "Helvetica Neue", Arial, sans-serif`;

export function fundo(ctx, W, H, cor = C.fundo) {
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, W, H);
}

export function barraDeStatus(ctx, W, hora = "7:12", { semSinal = false } = {}) {
  ctx.fillStyle = C.texto;
  ctx.font = fonte(600, 30);
  ctx.textAlign = "left";
  ctx.fillText(hora, 46, 62);
  ctx.fillStyle = C.sec;
  if (semSinal) {
    ctx.font = fonte(600, 24);
    ctx.textAlign = "right";
    ctx.fillText("sem serviço", 500, 60);
  } else {
    for (let i = 0; i < 4; i++) ctx.fillRect(452 + i * 14, 58 - (i + 1) * 7, 9, (i + 1) * 7);
  }
  ctx.strokeStyle = C.sec;
  ctx.lineWidth = 3;
  ctx.strokeRect(516, 38, 46, 24);
  ctx.fillRect(520, 42, semSinal ? 8 : 26, 16);
}

// ícone de pessoa (cabeça e ombros) dentro de um círculo
function avatar(ctx, x, y, r) {
  ctx.fillStyle = C.barra2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6a6c71";
  ctx.beginPath();
  ctx.arc(x, y - r * 0.18, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.62, r * 0.6, r * 0.42, 0, Math.PI, 0);
  ctx.fill();
}

function botaoDesligar(ctx, x, y, r, aceso = true) {
  ctx.fillStyle = aceso ? C.vermelho : "#4a1416";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI * 0.75);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-r * 0.5, -r * 0.14, r, r * 0.28, r * 0.14);
  ctx.fill();
  ctx.restore();
}

// chamada: estado "chamando" (pontinhos andando), "sem resposta" ou "encerrada" (em vermelho)
export function chamada(ctx, W, H, { nome, detalhe, estado, t, hora = "7:31" }) {
  fundo(ctx, W, H, "#101114");
  barraDeStatus(ctx, W, hora);
  avatar(ctx, W / 2, 360, 120);
  ctx.textAlign = "center";
  ctx.fillStyle = C.texto;
  ctx.font = fonte(700, 60);
  ctx.fillText(nome, W / 2, 580);
  ctx.fillStyle = C.sec;
  ctx.font = fonte(500, 32);
  ctx.fillText(detalhe, W / 2, 632);
  ctx.font = fonte(600, 38);
  if (estado === "chamando") {
    const pontos = ".".repeat(1 + (Math.floor(t * 2.5) % 3));
    ctx.fillStyle = C.texto;
    ctx.fillText("chamando" + pontos, W / 2, 740);
  } else if (estado === "sem resposta") {
    ctx.fillStyle = C.sec;
    ctx.fillText("sem resposta", W / 2, 740);
  } else {
    ctx.fillStyle = C.vermelho;
    ctx.fillText("chamada encerrada", W / 2, 740);
  }
  for (const x of [150, 300, 450]) {
    ctx.fillStyle = "#24262a";
    ctx.beginPath();
    ctx.arc(x, 930, 52, 0, Math.PI * 2);
    ctx.fill();
  }
  botaoDesligar(ctx, W / 2, 1110, 72, estado !== "encerrada");
}

// sem internet (parte 5)
export function semConexao(ctx, W, H, hora = "3:12") {
  fundo(ctx, W, H);
  barraDeStatus(ctx, W, hora, { semSinal: true });
  ctx.strokeStyle = C.barra2;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  for (const r of [150, 105, 60]) {
    ctx.beginPath();
    ctx.arc(W / 2, 640, r, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
  }
  ctx.fillStyle = C.barra2;
  ctx.beginPath();
  ctx.arc(W / 2, 640, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.vermelho;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, 470);
  ctx.lineTo(W / 2 + 150, 680);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = C.texto;
  ctx.font = fonte(700, 46);
  ctx.fillText("Sem conexão", W / 2, 800);
}

// lanterna ligada: tela quase preta com o botão aceso
export function lanterna(ctx, W, H) {
  fundo(ctx, W, H, "#050506");
  ctx.fillStyle = "#e9e7e3";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 70, 900, 140, 220, 40);
  ctx.fill();
}

// mensagem nova na tela de bloqueio (parte 10)
export function mensagemNova(ctx, W, H, { hora = "7:41", de, quando, texto, k = 1 }) {
  fundo(ctx, W, H, "#16181c");
  barraDeStatus(ctx, W, hora);
  ctx.textAlign = "center";
  ctx.fillStyle = C.texto;
  ctx.font = fonte(700, 150);
  ctx.fillText(hora, W / 2, 330);
  ctx.globalAlpha = k;
  const y = 470 + (1 - k) * 40;
  ctx.fillStyle = "#2a2c31";
  ctx.beginPath();
  ctx.roundRect(36, y, W - 72, 330, 34);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = C.sec;
  ctx.font = fonte(600, 26);
  ctx.fillText("MENSAGENS", 70, y + 56);
  ctx.textAlign = "right";
  ctx.fillStyle = C.vermelho;
  ctx.font = fonte(700, 28);
  ctx.fillText(quando, W - 70, y + 56);
  ctx.textAlign = "left";
  ctx.fillStyle = C.texto;
  ctx.font = fonte(700, 34);
  ctx.fillText(de, 70, y + 112);
  ctx.font = fonte(500, 32);
  const linhas = texto.split("\n");
  linhas.forEach((l, i) => ctx.fillText(l, 70, y + 172 + i * 46));
  ctx.globalAlpha = 1;
}

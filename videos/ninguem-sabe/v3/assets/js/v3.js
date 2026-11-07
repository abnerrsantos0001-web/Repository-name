// Apoio comum às cenas do vídeo 3: eixos do boneco, mãos, câmera de ponto de vista do celular, celulares extras
// (o da mãe, o do Lucas, o da Júlia), a folha do caderno em 3D e figurantes.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import { pontosDoBoneco, MEDIDAS } from "./personagem.js";
import { criarCelular, DESLOCAMENTO } from "./mundo.js";
import { placa } from "./mundo3.js";
import { folhaLista } from "./telas3.js";

export const PI = Math.PI;
export const ALT = MEDIDAS.quadrilEmPe;

export const eixos = (b) => {
  const g = b.rotation.y;
  return { frente: new THREE.Vector3(Math.sin(g), 0, Math.cos(g)), direita: new THREE.Vector3(-Math.cos(g), 0, Math.sin(g)), cima: new THREE.Vector3(0, 1, 0) };
};
export const em = (base, ...pares) => pares.reduce((v, [d, k]) => v.addScaledVector(d, k), base.clone());
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// ponto local de um cenário -> mundo
export const no = (cenario, x, y, z) => new THREE.Vector3(x, y, z).add(DESLOCAMENTO[cenario]);

// mãos descansando nas coxas (sentado)
export const noColo = (b, abre = 0.11) => {
  const { frente, direita } = eixos(b);
  const q = b.position.clone();
  return { alvoE: em(q, [frente, 0.3], [direita, -abre]).setY(q.y + 0.12), pesoE: 1, alvoD: em(q, [frente, 0.3], [direita, abre]).setY(q.y + 0.12), pesoD: 1 };
};
// as duas mãos segurando o celular na frente do rosto (longe = distância à frente da cabeça; baixo = abaixo dela)
export const segurandoCelular = (pts, b, longe = 0.52, baixo = 0.2) => {
  const { frente, direita, cima } = eixos(b);
  const alvo = em(pts.cabeca, [frente, longe], [cima, -baixo]);
  return { alvoE: alvo, pesoE: 1, alvoD: em(alvo, [direita, 0.05], [cima, -0.03]), pesoD: 0.85 };
};
// câmera de ponto de vista olhando a tela do celular (perto = distância da câmera à tela)
export function cameraTela(perto, alto = 0.0, fov = 34, cel = null) {
  return (tt, ctx) => {
    const c = cel ? cel(ctx) : ctx.celular;
    const b = cel ? null : ctx.boneco;
    c.updateMatrixWorld(true);
    const alvo = c.localToWorld(new THREE.Vector3(0, -0.005, 0));
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(c.matrixWorld);
    let pos;
    if (b) {
      const { cabeca } = pontosDoBoneco(b);
      const dir = alvo.clone().sub(cabeca).normalize();
      pos = alvo.clone().addScaledVector(dir, -perto);
    } else pos = alvo.clone().addScaledVector(normal, perto);
    pos.y += alto;
    return { pos, alvo, fov };
  };
}
// câmera presa a um ponto do boneco (segue a cabeça), com deslocamento no espaço do corpo
export function cameraSegue(quem, frenteK, ladoK, cimaK, alvoF = 0, alvoC = 0, fov = 40) {
  return (tt, ctx) => {
    const b = quem === "ele" ? ctx.boneco : ctx.outros[quem].boneco;
    const { cabeca } = pontosDoBoneco(b);
    const { frente, direita, cima } = eixos(b);
    return { pos: em(cabeca, [frente, frenteK], [direita, ladoK], [cima, cimaK]), alvo: em(cabeca, [frente, alvoF], [cima, alvoC]), fov };
  };
}

// celular extra (o da mãe, do Lucas, da Júlia): segue a mão esquerda de um boneco, tela virada para "olhar"
export function celularExtra(cena) {
  const cel = criarCelular();
  cel.userData.vidro.material.toneMapped = false;
  cena.add(cel);
  const g2 = cel.userData.tela.getContext("2d");
  let chave;
  return {
    obj: cel,
    mostrar(k, fn) {
      if (k === chave) return;
      chave = k;
      fn(g2, 600, 1302);
      cel.userData.textura.needsUpdate = true;
    },
    // na mão (lado "E" ou "D") virado para o ponto "olhar" (Vector3 do mundo)
    naMao(b, olhar, lado = "E") {
      const p = new THREE.Vector3();
      b.updateMatrixWorld(true);
      b.userData.rig[lado === "E" ? "bracoE" : "bracoD"].pega.getWorldPosition(p);
      cel.position.copy(p);
      cel.lookAt(olhar);
      cel.translateY(0.055);
      cel.translateZ(0.035);
      cel.updateMatrixWorld(true);
      cel.visible = true;
    },
    em(pos, rot) {
      cel.position.copy(pos);
      cel.rotation.set(...rot);
      cel.updateMatrixWorld(true);
      cel.visible = true;
    },
    esconder() {
      cel.visible = false;
    },
  };
}

// a folha do caderno (21 x 29,7 cm): desenho da lista em canvas, dobrável (escala em y)
export function criarFolha(cena) {
  const grupo = new THREE.Group();
  cena.add(grupo);
  let estado = null;
  let chave;
  const m = placa(grupo, 0.21, 0.297, (g, W, H) => folhaLista(g, W, H, estado || {}), { ppm: 2600 });
  m.material.side = THREE.DoubleSide;
  m.userData.passavel = true;
  return {
    grupo,
    mostrar(k, e) {
      if (k === chave) return;
      chave = k;
      estado = e;
      m.userData.redesenhar();
    },
    // dobra = 0 (aberta) .. 1 (dobrada em três): a folha encolhe na altura
    dobrar(k) {
      m.scale.set(1 - 0.35 * k, 1 - 0.66 * k, 1);
    },
  };
}

// figurantes sentados (sala de aula, fila do aeroporto...): lista de defs para cfg.outros
export function figurante(id, variante, onde, pos, giro, o = {}) {
  const sentado = o.sentado;
  const sem = o.semente ?? id.length * 7 + Math.round(pos[0] * 13 + pos[2] * 7);
  return {
    id,
    variante,
    semente: sem,
    onde: [[0, onde]],
    pos: o.posK ?? [[0, pos]],
    passos: o.passos,
    pose: {
      giro: o.giroK ?? [[0, giro]],
      quadril: [[0, sentado ? -PI / 2 : 0]],
      joelho: [[0, sentado ? 1.5 : 0]],
      inclinar: [[0, o.inclinar ?? (sentado ? 0.12 : 0.03)]],
      cabecaInclina: o.cabecaInclina ?? [[0, 0.12 + 0.1 * Math.sin(sem)]],
      cabecaGiro: o.cabecaGiro ?? [[0, 0.15 * Math.sin(sem * 1.7)]],
      ombro: [[0, o.ombro ?? (sentado ? -0.55 : 0)]],
      cotovelo: [[0, o.cotovelo ?? (sentado ? 1.3 : 0.15)]],
      ...(o.pose || {}),
    },
    maos: o.maos,
    visivel: o.visivel,
  };
}

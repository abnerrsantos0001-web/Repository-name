// O personagem do canal "Ninguém Sabe": boneco de cabeça redonda e moletom escuro.
// Todas as partes importam este arquivo, então ele é sempre o mesmo em todas as cenas.
// A pose é um objeto de parâmetros (ver POSE_BASE); a cena calcula a pose a partir do tempo.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";

export const COR_PERSONAGEM = {
  pele: 0xcfcbc4,
  moletom: 0x1b1c20,
  moletomSombra: 0x131417,
  cordao: 0x8c8c8c,
  calca: 0x2c2e34,
  tenis: 0x0d0d0e,
  sola: 0x5c5d60,
  olho: 0x050505,
  boca: 0x1a0d0d,
};

const cacheMat = new Map();
function mat(cor) {
  if (!cacheMat.has(cor)) {
    cacheMat.set(
      cor,
      new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, metalness: 0, flatShading: true }),
    );
  }
  return cacheMat.get(cor);
}

function malha(geo, cor, sombra = true) {
  const m = new THREE.Mesh(geo, mat(cor));
  m.castShadow = sombra;
  m.receiveShadow = true;
  return m;
}

// Medidas em metros, antes da escala final (ESCALA). Pivôs nas juntas.
const M = {
  quadril: 0.88,
  coxa: 0.42,
  canela: 0.42,
  tronco: 0.6,
  braco: 0.3,
  antebraco: 0.28,
  ombroX: 0.29,
  cabeca: 0.3,
};
export const ESCALA = 0.86;

export const POSE_BASE = {
  // posição e orientação do corpo (o pivô fica no quadril)
  x: 0,
  y: M.quadril * ESCALA,
  z: 0,
  giro: 0, // rotação em Y (para onde o corpo olha)
  deitar: 0, // rotação em X do corpo inteiro (-PI/2 = deitado de costas)
  inclinar: 0, // tronco para frente (+) ou para trás (-)
  // cabeça
  cabecaGiro: 0,
  cabecaInclina: 0, // + olha para baixo
  cabecaTomba: 0,
  // pernas: quadril e joelho, esquerda (E) e direita (D)
  quadrilE: 0,
  quadrilD: 0,
  joelhoE: 0,
  joelhoD: 0,
  // braços: ombro para frente (X), ombro para o lado (Z), cotovelo
  ombroE: 0,
  ombroD: 0,
  aberturaE: 0.12,
  aberturaD: 0.12,
  cotoveloE: 0.15,
  cotoveloD: 0.15,
  // rosto
  olhos: 1, // 1 aberto, 0 fechado
  apertar: 0, // olhos semicerrados de desconfiança
  boca: 0, // 0 fechada, 1 grito
  // vida
  respirar: 0, // fase da respiração (radianos)
  andar: 0, // fase do passo (radianos)
  passo: 0, // 0 parado, 1 andando
  // mãos indo até um ponto do mundo (THREE.Vector3), com peso de 0 a 1
  alvoE: null,
  pesoE: 0,
  alvoD: null,
  pesoD: 0,
};

// alturas úteis para posicionar o boneco
export const MEDIDAS = {
  quadrilEmPe: M.quadril * ESCALA,
  quadrilAteCabeca: (M.tronco + 0.06 + M.cabeca * 0.92) * ESCALA,
  raioTronco: 0.29 * ESCALA,
};

// Variações do mesmo boneco-base para os outros personagens (a mulher, a família).
// Só mudam roupa e cabelo; o rig e as poses são os mesmos.
const VARIANTES = {
  ele: {},
  mulher: { moletom: 0x6b6e75, moletomSombra: 0x55585e, calca: 0x24252a, cabelo: "comprido", cachecol: 0x7a1418, capuz: false },
  mae: { moletom: 0x5b5e66, moletomSombra: 0x4a4d54, calca: 0x2e3036, cabelo: "coque", capuz: false },
  pai: { moletom: 0x3d4048, moletomSombra: 0x30333a, calca: 0x26282d, cabelo: "curto", capuz: false },
};

export function criarPersonagem(variante = "ele") {
  const V = { ...COR_PERSONAGEM, capuz: true, ...VARIANTES[variante] };
  const raiz = new THREE.Group();
  raiz.name = "personagem-" + variante;
  const corpo = new THREE.Group(); // pivô no quadril
  raiz.add(corpo);
  corpo.scale.setScalar(ESCALA);

  // ---- pernas
  function perna(lado) {
    const quadril = new THREE.Group();
    quadril.position.set(lado * 0.12, 0, 0);
    const coxa = malha(new THREE.CylinderGeometry(0.095, 0.085, M.coxa, 7), V.calca);
    coxa.position.y = -M.coxa / 2;
    quadril.add(coxa);
    const joelho = new THREE.Group();
    joelho.position.y = -M.coxa;
    quadril.add(joelho);
    const canela = malha(new THREE.CylinderGeometry(0.085, 0.075, M.canela, 7), V.calca);
    canela.position.y = -M.canela / 2;
    joelho.add(canela);
    const tenis = malha(new THREE.BoxGeometry(0.15, 0.09, 0.27), COR_PERSONAGEM.tenis);
    tenis.position.set(0, -M.canela - 0.0, 0.05);
    joelho.add(tenis);
    const sola = malha(new THREE.BoxGeometry(0.155, 0.025, 0.28), COR_PERSONAGEM.sola, false);
    sola.position.set(0, -M.canela - 0.045, 0.05);
    joelho.add(sola);
    corpo.add(quadril);
    return { quadril, joelho };
  }
  const pernaE = perna(1);
  const pernaD = perna(-1);

  // ---- tronco: o moletom
  const tronco = new THREE.Group();
  corpo.add(tronco);
  const moletom = malha(new THREE.CylinderGeometry(0.25, 0.29, M.tronco, 8), V.moletom);
  moletom.position.y = M.tronco / 2 - 0.02;
  tronco.add(moletom);
  const barra = malha(new THREE.CylinderGeometry(0.295, 0.295, 0.07, 8), V.moletomSombra);
  barra.position.y = 0.0;
  tronco.add(barra);
  const bolso = malha(new THREE.BoxGeometry(0.3, 0.15, 0.04), V.moletomSombra, false);
  bolso.position.set(0, 0.13, 0.265);
  bolso.rotation.x = -0.07;
  tronco.add(bolso);
  for (const lado of [1, -1]) {
    const ombro = malha(new THREE.SphereGeometry(0.12, 7, 5), V.moletom);
    ombro.position.set(lado * M.ombroX * 0.92, M.tronco - 0.08, 0);
    tronco.add(ombro);
  }
  if (V.capuz) {
    // capuz caído atrás do pescoço
    const capuz = malha(new THREE.SphereGeometry(0.24, 8, 6), V.moletom);
    capuz.scale.set(1.05, 0.62, 0.78);
    capuz.position.set(0, M.tronco - 0.02, -0.1);
    tronco.add(capuz);
    // cordões do capuz
    for (const lado of [1, -1]) {
      const cordao = malha(new THREE.CylinderGeometry(0.011, 0.011, 0.2, 4), COR_PERSONAGEM.cordao, false);
      cordao.position.set(lado * 0.06, M.tronco - 0.14, 0.235);
      cordao.rotation.x = -0.12;
      tronco.add(cordao);
    }
  } else {
    const gola = malha(new THREE.CylinderGeometry(0.15, 0.2, 0.08, 8), V.moletomSombra);
    gola.position.y = M.tronco - 0.01;
    tronco.add(gola);
  }
  if (V.cachecol) {
    const cachecol = malha(new THREE.TorusGeometry(0.13, 0.05, 5, 10), V.cachecol);
    cachecol.rotation.x = Math.PI / 2;
    cachecol.position.y = M.tronco + 0.02;
    tronco.add(cachecol);
    const ponta = malha(new THREE.BoxGeometry(0.09, 0.26, 0.04), V.cachecol);
    ponta.position.set(0.08, M.tronco - 0.12, 0.2);
    ponta.rotation.z = 0.1;
    tronco.add(ponta);
  }

  // ---- cabeça
  const pescoco = malha(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 6), COR_PERSONAGEM.pele);
  pescoco.position.y = M.tronco + 0.02;
  tronco.add(pescoco);
  const cabeca = new THREE.Group();
  cabeca.position.y = M.tronco + 0.06;
  tronco.add(cabeca);
  const cranio = malha(new THREE.IcosahedronGeometry(M.cabeca, 1), COR_PERSONAGEM.pele);
  cranio.position.y = M.cabeca * 0.92;
  cabeca.add(cranio);
  const olhos = [];
  for (const lado of [1, -1]) {
    const olho = malha(new THREE.SphereGeometry(0.042, 8, 6), COR_PERSONAGEM.olho, false);
    olho.position.set(lado * 0.105, M.cabeca * 0.98, M.cabeca * 0.9);
    olho.scale.set(1, 1.25, 0.5);
    cabeca.add(olho);
    olhos.push(olho);
  }
  const boca = malha(new THREE.SphereGeometry(0.05, 8, 6), COR_PERSONAGEM.boca, false);
  boca.position.set(0, M.cabeca * 0.6, M.cabeca * 0.9);
  cabeca.add(boca);
  // cabelo das variantes (o personagem principal é careca, como na parte 01)
  const corCabelo = 0x1c1c1e;
  if (V.cabelo) {
    const topo = malha(new THREE.IcosahedronGeometry(M.cabeca * 1.06, 1), corCabelo);
    topo.scale.set(1.02, 0.62, 1.0);
    topo.position.set(0, M.cabeca * 1.28, -0.03);
    cabeca.add(topo);
  }
  if (V.cabelo === "comprido") {
    const costas = malha(new THREE.CylinderGeometry(0.27, 0.22, 0.62, 8, 1, true), corCabelo);
    costas.position.set(0, M.cabeca * 0.55, -0.1);
    costas.scale.set(1.05, 1, 0.8);
    cabeca.add(costas);
    for (const lado of [1, -1]) {
      const mecha = malha(new THREE.BoxGeometry(0.07, 0.42, 0.1), corCabelo);
      mecha.position.set(lado * 0.26, M.cabeca * 0.62, 0.08);
      cabeca.add(mecha);
    }
  }
  if (V.cabelo === "coque") {
    const coque = malha(new THREE.IcosahedronGeometry(0.12, 0), corCabelo);
    coque.position.set(0, M.cabeca * 1.55, -0.18);
    cabeca.add(coque);
  }

  // ---- braços
  function braco(lado) {
    const ombro = new THREE.Group();
    ombro.position.set(lado * M.ombroX, M.tronco - 0.1, 0);
    tronco.add(ombro);
    const manga = malha(new THREE.CylinderGeometry(0.078, 0.07, M.braco, 7), V.moletom);
    manga.position.y = -M.braco / 2;
    ombro.add(manga);
    const cotovelo = new THREE.Group();
    cotovelo.position.y = -M.braco;
    ombro.add(cotovelo);
    const anteb = malha(new THREE.CylinderGeometry(0.07, 0.066, M.antebraco, 7), V.moletom);
    anteb.position.y = -M.antebraco / 2;
    cotovelo.add(anteb);
    const punho = malha(new THREE.CylinderGeometry(0.068, 0.068, 0.04, 7), V.moletomSombra, false);
    punho.position.y = -M.antebraco + 0.01;
    cotovelo.add(punho);
    const mao = malha(new THREE.IcosahedronGeometry(0.068, 0), COR_PERSONAGEM.pele);
    mao.position.y = -M.antebraco - 0.05;
    cotovelo.add(mao);
    // ponto onde a mão segura objetos (ex.: celular)
    const pega = new THREE.Group();
    pega.position.set(0, -M.antebraco - 0.07, 0.05);
    cotovelo.add(pega);
    return { ombro, cotovelo, pega };
  }
  const bracoE = braco(1);
  const bracoD = braco(-1);

  raiz.userData.rig = { corpo, tronco, cabeca, olhos, boca, pernaE, pernaD, bracoE, bracoD };
  return raiz;
}

// Aplica uma pose (parâmetros de POSE_BASE). Caminhada e respiração somam por cima da pose.
export function poseBoneco(raiz, p) {
  const r = raiz.userData.rig;
  const q = Object.assign({}, POSE_BASE, p);

  // passo: as partes não se movem juntas; a cabeça vai à frente, os braços seguem
  const s = Math.sin(q.andar);
  const c = Math.cos(q.andar);
  const pa = q.passo;
  const quique = Math.abs(Math.cos(q.andar)) * 0.035 * pa;
  const resp = Math.sin(q.respirar) * 0.012;

  raiz.position.set(q.x, q.y + quique, q.z);
  raiz.rotation.set(0, q.giro, 0);
  r.corpo.rotation.set(q.deitar, 0, 0);

  r.tronco.rotation.set(q.inclinar + 0.05 * pa, 0.06 * s * pa, 0);
  r.tronco.scale.set(1 + resp * 0.6, 1 + resp, 1 + resp * 0.6);

  r.cabeca.rotation.set(q.cabecaInclina - 0.04 * pa, q.cabecaGiro - 0.05 * s * pa, q.cabecaTomba);

  r.pernaE.quadril.rotation.x = q.quadrilE + 0.48 * s * pa;
  r.pernaD.quadril.rotation.x = q.quadrilD - 0.48 * s * pa;
  r.pernaE.joelho.rotation.x = q.joelhoE + Math.max(0, -c) * 0.7 * pa + 0.1 * pa;
  r.pernaD.joelho.rotation.x = q.joelhoD + Math.max(0, c) * 0.7 * pa + 0.1 * pa;

  r.bracoE.ombro.rotation.set(q.ombroE - 0.36 * s * pa, 0, q.aberturaE);
  r.bracoD.ombro.rotation.set(q.ombroD + 0.32 * s * pa, 0, -q.aberturaD);
  r.bracoE.cotovelo.rotation.x = -(q.cotoveloE + 0.25 * pa + Math.max(0, s) * 0.2 * pa);
  r.bracoD.cotovelo.rotation.x = -(q.cotoveloD + 0.25 * pa + Math.max(0, -s) * 0.2 * pa);

  const aberto = Math.max(0.06, q.olhos) * (1 - 0.55 * q.apertar);
  for (const o of r.olhos) o.scale.set(1, 1.25 * aberto, 0.5);
  const b = q.boca;
  r.boca.scale.set(0.9 + 0.5 * b, 0.12 + 1.35 * b, 0.35 + 0.3 * b);

  // mão até um ponto do mundo (IK de dois ossos), misturada com a pose pelo peso
  if (q.alvoE && q.pesoE > 0) alcancar(raiz, r.bracoE, 1, q.alvoE, q.pesoE);
  if (q.alvoD && q.pesoD > 0) alcancar(raiz, r.bracoD, -1, q.alvoD, q.pesoD);
}

const _alvo = new THREE.Vector3();
function alcancar(raiz, braco, lado, alvoMundo, peso) {
  raiz.updateMatrixWorld(true);
  const tronco = braco.ombro.parent;
  _alvo.copy(alvoMundo);
  tronco.worldToLocal(_alvo);
  _alvo.sub(braco.ombro.position);
  const L1 = M.braco;
  const L2 = M.antebraco + 0.07;
  const D = THREE.MathUtils.clamp(_alvo.length(), 0.05, L1 + L2 - 0.001);
  const dir = _alvo.normalize();
  // direção do braço d = (sen φ, -cos φ cos θ, -cos φ sen θ), com a rotação local (θ em X, φ em Z)
  const phi = Math.asin(THREE.MathUtils.clamp(dir.x, -1, 1));
  const theta = Math.atan2(-dir.z, -dir.y);
  const cosCotovelo = (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2);
  const dobra = Math.PI - Math.acos(THREE.MathUtils.clamp(cosCotovelo, -1, 1));
  const desvio = Math.acos(THREE.MathUtils.clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
  const ombroX = theta + desvio;
  const mistura = (a, b) => a + (b - a) * peso;
  braco.ombro.rotation.x = mistura(braco.ombro.rotation.x, ombroX);
  braco.ombro.rotation.z = mistura(braco.ombro.rotation.z, phi);
  braco.cotovelo.rotation.x = mistura(braco.cotovelo.rotation.x, -dobra);
}

// posição da cabeça e do ponto de pega da mão no mundo (para câmera e objetos)
export function pontosDoBoneco(raiz) {
  const r = raiz.userData.rig;
  raiz.updateMatrixWorld(true);
  const cabeca = new THREE.Vector3(0, M.cabeca * 0.92, 0);
  r.cabeca.localToWorld(cabeca);
  const frente = new THREE.Vector3(0, 0, 1).transformDirection(r.cabeca.matrixWorld);
  const maoE = new THREE.Vector3();
  r.bracoE.pega.getWorldPosition(maoE);
  const maoD = new THREE.Vector3();
  r.bracoD.pega.getWorldPosition(maoD);
  return { cabeca, frente, maoE, maoD };
}

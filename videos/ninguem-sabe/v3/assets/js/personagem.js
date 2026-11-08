// O personagem do canal "Ninguém Sabe": boneco de cabeça redonda e moletom escuro.
// Todas as partes importam este arquivo, então ele é sempre o mesmo em todas as cenas.
// Vídeo 3: cordões vermelhos no "ele", Lucas de boné, Júlia de cabelo comprido e lágrimas (choro).
// Vídeo 2: rosto mais expressivo (sobrancelhas, brilho nos olhos, sorriso que pode ficar grande demais,
// língua, careta) e outras roupas para a mãe e para os passageiros.
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
      new THREE.MeshLambertMaterial({ color: cor, flatShading: true }),
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
  sorriso: 0, // 0 neutro, 1 sorriso normal
  sorrisoLargo: 0, // 0 normal, 1 o sorriso grande demais (mostra os dentes)
  lingua: 0, // 0 dentro, 1 para fora
  sobrancelha: 0, // -1 franzida, +1 levantada (susto)
  sobrancelhaMedo: 0, // pontas de dentro para cima (medo, preocupação)
  choro: 0, // 0 sem lágrimas, 1 lágrimas descendo
  choroFase: 0, // avança com o tempo (a cena passa t): as gotas descem e recomeçam
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
  // vídeo 3: você, moletom escuro com os cordões vermelhos
  ele: { cordao: 0xc4161c },
  // Lucas, o melhor amigo: moletom azul, boné azul-escuro (aba para a frente), cabelo curto aparecendo atrás
  lucas: { moletom: 0x3e5878, moletomSombra: 0x31465f, calca: 0x2a2c31, cabelo: "curto", corCabelo: 0x2b211b, capuz: false, bone: 0x1d2c44, abaBone: 0x17233a },
  // Júlia: cabelo comprido castanho, blusa rosada apagada
  julia: { moletom: 0x8a6e72, moletomSombra: 0x70585c, calca: 0x2b2d36, cabelo: "comprido", corCabelo: 0x3b2a20, capuz: false },
  // o professor (parte 5): paletó marrom, cabelo grisalho
  professor: { moletom: 0x5b5446, moletomSombra: 0x4a4438, calca: 0x2e3036, cabelo: "curto", corCabelo: 0x8a8a86, capuz: false, blusa: 0xd9d6cf, botoes: 0x2e3036 },
  // colegas de sala e gente nas filas
  aluno: { moletom: 0x5a6670, moletomSombra: 0x48525a, calca: 0x2b2d33, cabelo: "curto", corCabelo: 0x241e1a, capuz: false },
  aluna: { moletom: 0x6f6458, moletomSombra: 0x5a5148, calca: 0x2a2b30, cabelo: "comprido", corCabelo: 0x2e231c, capuz: false },
  mulher: { moletom: 0x6b6e75, moletomSombra: 0x55585e, calca: 0x24252a, cabelo: "comprido", cachecol: 0x7a1418, capuz: false },
  // a mãe: cardigã marrom-claro com botões, blusa clara, saia e coque castanho
  mae: { moletom: 0x8a7a6b, moletomSombra: 0x6b5d50, calca: 0x3a3c44, cabelo: "coque", corCabelo: 0x3d3029, capuz: false, saia: 0x41444f, botoes: 0xd9d2c5, blusa: 0xcdc6b8 },
  // passageiros e gente na rua (só roupa e cabelo mudam)
  passageiro: { moletom: 0x4b5866, moletomSombra: 0x3c4753, calca: 0x2b2d33, cabelo: "curto", corCabelo: 0x2a2522, capuz: false },
  passageira: { moletom: 0x5f6b5c, moletomSombra: 0x4c5649, calca: 0x2a2b30, cabelo: "comprido", corCabelo: 0x4a3a2e, capuz: false },
  idosa: { moletom: 0x6d6470, moletomSombra: 0x585060, calca: 0x33343a, cabelo: "coque", corCabelo: 0x9a9a98, capuz: false, saia: 0x3b3a44 },
  padeiro: { moletom: 0xd8d6d0, moletomSombra: 0xbdbab3, calca: 0x2e3036, cabelo: "curto", corCabelo: 0x2a2522, capuz: false },
  pai: { moletom: 0x3d4048, moletomSombra: 0x30333a, calca: 0x26282d, cabelo: "curto", capuz: false },
};

// Leva uma geometria desenhada no plano do rosto (x, y relativos à cabeça) para a superfície da esfera
// da cabeça, para sobrancelha e sorriso ficarem colados na face em vez de flutuar.
const CENTRO_CABECA = M.cabeca * 0.92;
function naFace(geo, cx, cy, folga = 0.004) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx;
    const y = pos.getY(i) + cy;
    const dy = y - CENTRO_CABECA;
    const r = M.cabeca * 0.985 + folga + pos.getZ(i);
    const z = Math.sqrt(Math.max(0.0001, r * r - x * x - dy * dy));
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

// fita em arco (sorriso): largura (meia-abertura em x), curva (quanto as pontas sobem), espessura
function fitaSorriso(largura, curva, esp, cy) {
  const n = 14;
  const pts = [];
  const idx = [];
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    const x = u * largura;
    const y = cy + curva * u * u;
    pts.push(x, y + esp / 2, 0, x, y - esp / 2, 0);
    if (i < n) {
      const a = 2 * i;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  geo.setIndex(idx);
  return naFace(geo, 0, 0, 0.003);
}
// boca aberta em meia-lua (o sorriso grande demais): contorno de baixo curvo, dentes em cima
function meiaLua(largura, fundo, cy) {
  const n = 16;
  const pts = [0, cy, 0];
  const idx = [];
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    pts.push(u * largura, cy + (u * u - 1) * fundo + fundo * 0.15 * u * u, 0);
    if (i < n) idx.push(0, i + 2, i + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  geo.setIndex(idx);
  return naFace(geo, 0, 0, 0.002);
}
const matSorriso = new THREE.MeshBasicMaterial({ color: COR_PERSONAGEM.boca, side: THREE.DoubleSide });
const matDentes = new THREE.MeshBasicMaterial({ color: 0xe9e6df, side: THREE.DoubleSide });
const cacheSorriso = new Map();
function formaSorriso(s, largo) {
  const k = Math.round(s * 10) + "|" + Math.round(largo * 10);
  if (!cacheSorriso.has(k)) {
    const g = new THREE.Group();
    const cy = M.cabeca * 0.62;
    if (largo < 0.05) {
      g.add(new THREE.Mesh(fitaSorriso(0.05 + 0.03 * s, 0.035 * s, 0.014, cy), matSorriso));
    } else {
      // grande demais: a boca abre quase de orelha a orelha, com uma fileira de dentes
      const lar = 0.08 + 0.12 * largo;
      g.add(new THREE.Mesh(meiaLua(lar, 0.03 + 0.035 * largo, cy + 0.03 * largo), matSorriso));
      g.add(new THREE.Mesh(fitaSorriso(lar * 0.9, 0.008 * largo, 0.016, cy + 0.03 * largo - 0.012), matDentes));
    }
    cacheSorriso.set(k, g);
  }
  return cacheSorriso.get(k);
}

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
    coxa.name = "coxa";
    quadril.add(coxa);
    const joelho = new THREE.Group();
    joelho.position.y = -M.coxa;
    quadril.add(joelho);
    const canela = malha(new THREE.CylinderGeometry(0.085, 0.075, M.canela, 7), V.calca);
    canela.position.y = -M.canela / 2;
    canela.name = "canela";
    joelho.add(canela);
    const tenis = malha(new THREE.BoxGeometry(0.15, 0.09, 0.27), COR_PERSONAGEM.tenis);
    tenis.position.set(0, -M.canela - 0.0, 0.05);
    tenis.name = "tenis";
    joelho.add(tenis);
    const sola = malha(new THREE.BoxGeometry(0.155, 0.025, 0.28), COR_PERSONAGEM.sola, false);
    sola.position.set(0, -M.canela - 0.045, 0.05);
    sola.name = "tenis";
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
  moletom.name = "tronco";
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
    capuz.name = "capuz";
    tronco.add(capuz);
    // cordões do capuz
    for (const lado of [1, -1]) {
      const cordao = malha(new THREE.CylinderGeometry(0.011, 0.011, 0.2, 4), V.cordao, false);
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

  if (V.saia) {
    // saia: cobre as coxas e abre embaixo, para as pernas andarem por dentro sem atravessar o tecido
    const saia = malha(new THREE.CylinderGeometry(0.27, 0.36, 0.5, 9, 1, true), V.saia);
    saia.material = saia.material.clone();
    saia.material.side = THREE.DoubleSide;
    saia.position.y = -0.2;
    corpo.add(saia);
    const cinto = malha(new THREE.CylinderGeometry(0.275, 0.275, 0.05, 9), V.saia);
    cinto.position.y = 0.04;
    corpo.add(cinto);
    // sentada: a saia vira um caimento sobre as coxas (gira junto com elas a partir do quadril)
    const geoS = new THREE.BoxGeometry(0.5, 0.44, 0.22);
    geoS.translate(0, -0.2, 0);
    const saiaSentada = malha(geoS, V.saia);
    saiaSentada.name = "saia";
    saiaSentada.visible = false;
    corpo.add(saiaSentada);
    saia.name = "saia";
    raiz.userData.saias = { em_pe: saia, sentada: saiaSentada };
  }
  if (V.botoes) {
    // cardigã aberto sobre a blusa clara: faixa da blusa na frente e botões
    const blusa = malha(new THREE.BoxGeometry(0.13, M.tronco - 0.12, 0.02), V.blusa ?? 0xcfc8ba, false);
    blusa.position.set(0, M.tronco / 2 + 0.02, 0.272);
    blusa.rotation.x = 0.07;
    tronco.add(blusa);
    for (let i = 0; i < 4; i++) {
      const bt = malha(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6), V.botoes, false);
      bt.rotation.x = Math.PI / 2;
      bt.position.set(0.085, 0.12 + i * 0.12, 0.27 - i * 0.007);
      tronco.add(bt);
    }
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
  cranio.name = "cabeca";
  cabeca.add(cranio);
  const olhos = [];
  for (const lado of [1, -1]) {
    const olho = malha(new THREE.SphereGeometry(0.042, 10, 8), COR_PERSONAGEM.olho, false);
    olho.position.set(lado * 0.105, M.cabeca * 0.98, M.cabeca * 0.9);
    olho.scale.set(1, 1.25, 0.5);
    cabeca.add(olho);
    // brilho no olho: o rosto fica vivo; some junto quando o olho fecha
    const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 6, 5), new THREE.MeshBasicMaterial({ color: 0xf4f2ee }));
    brilho.position.set(0.013 * lado, 0.016, 0.036);
    olho.add(brilho);
    olhos.push(olho);
  }
  // sobrancelhas: sobem no susto, descem franzidas, pontas de dentro sobem no medo
  const sobrancelhas = [];
  for (const lado of [1, -1]) {
    const geo = naFace(new THREE.BoxGeometry(0.085, 0.017, 0.012, 4, 1, 1), lado * 0.105, M.cabeca * 1.2);
    geo.computeBoundingBox();
    const centro = geo.boundingBox.getCenter(new THREE.Vector3());
    geo.translate(-centro.x, -centro.y, -centro.z);
    const sb = malha(geo, COR_PERSONAGEM.olho, false);
    sb.position.copy(centro);
    sb.userData = { lado, base: centro.clone() };
    cabeca.add(sb);
    sobrancelhas.push(sb);
  }
  const boca = malha(new THREE.SphereGeometry(0.05, 8, 6), COR_PERSONAGEM.boca, false);
  boca.position.set(0, M.cabeca * 0.6, M.cabeca * 0.9);
  cabeca.add(boca);
  // sorriso: uma fita curva colada na face; o sorriso "grande demais" abre com dentes
  const sorriso = new THREE.Group();
  cabeca.add(sorriso);
  const lingua = malha(new THREE.SphereGeometry(0.045, 8, 6), 0xa6474c, false);
  lingua.scale.set(1, 0.55, 1.1);
  lingua.position.set(0, M.cabeca * 0.55, M.cabeca * 0.92);
  lingua.visible = false;
  cabeca.add(lingua);
  // cabelo das variantes (o personagem principal é careca, como na parte 01)
  const corCabelo = V.corCabelo ?? 0x1c1c1e;
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
  if (V.bone) {
    // boné: copa achatada por cima do cabelo, alta o bastante para não cobrir as sobrancelhas, e aba à frente
    const copa = malha(new THREE.IcosahedronGeometry(1, 2), V.bone);
    copa.scale.set(0.315, 0.17, 0.315);
    copa.position.set(0, 0.46, -0.005);
    copa.name = "bone";
    cabeca.add(copa);
    const botao = malha(new THREE.SphereGeometry(0.022, 6, 4), V.abaBone, false);
    botao.position.set(0, 0.628, -0.005);
    cabeca.add(botao);
    const aba = malha(new THREE.CylinderGeometry(0.2, 0.2, 0.022, 14, 1, false, -Math.PI / 2, Math.PI), V.abaBone);
    aba.scale.set(1, 1, 1.15);
    aba.position.set(0, 0.425, 0.2);
    aba.rotation.x = 0.16;
    aba.name = "bone";
    cabeca.add(aba);
  }
  // lágrimas: duas gotas por olho descendo pela bochecha (pose.choro = intensidade, pose.choroFase = tempo)
  const lagrimas = [];
  const matLagrima = new THREE.MeshBasicMaterial({ color: 0x8fc4ff, transparent: true, opacity: 0.95 });
  for (const lado of [1, -1]) {
    for (let k = 0; k < 2; k++) {
      const gota = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), matLagrima);
      gota.scale.set(0.8, 1.35, 0.6);
      gota.visible = false;
      gota.userData = { lado, k };
      cabeca.add(gota);
      lagrimas.push(gota);
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
    manga.name = "braco";
    ombro.add(manga);
    const cotovelo = new THREE.Group();
    cotovelo.position.y = -M.braco;
    ombro.add(cotovelo);
    const anteb = malha(new THREE.CylinderGeometry(0.07, 0.066, M.antebraco, 7), V.moletom);
    anteb.position.y = -M.antebraco / 2;
    anteb.name = "antebraco";
    cotovelo.add(anteb);
    const punho = malha(new THREE.CylinderGeometry(0.068, 0.068, 0.04, 7), V.moletomSombra, false);
    punho.position.y = -M.antebraco + 0.01;
    cotovelo.add(punho);
    const mao = malha(new THREE.IcosahedronGeometry(0.068, 0), COR_PERSONAGEM.pele);
    mao.position.y = -M.antebraco - 0.05;
    mao.name = "mao";
    cotovelo.add(mao);
    // ponto onde a mão segura objetos (ex.: celular)
    const pega = new THREE.Group();
    pega.position.set(0, -M.antebraco - 0.07, 0.05);
    cotovelo.add(pega);
    return { ombro, cotovelo, pega };
  }
  const bracoE = braco(1);
  const bracoD = braco(-1);

  raiz.userData.rig = { corpo, tronco, cabeca, olhos, boca, pernaE, pernaD, bracoE, bracoD, sobrancelhas, sorriso, lingua, lagrimas, formaSorriso: null };
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
  // sorriso troca a boca redonda pela fita curva (ou pela boca aberta com dentes)
  const sorri = q.sorriso > 0.04 || q.sorrisoLargo > 0.04;
  r.boca.visible = !sorri || b > 0.15;
  const forma = sorri ? formaSorriso(Math.min(1, q.sorriso), Math.min(1, q.sorrisoLargo)) : null;
  if (forma !== r.formaSorriso) {
    // cada boneco tem a sua cópia (as geometrias são compartilhadas pelo cache)
    r.sorriso.clear();
    if (forma) r.sorriso.add(forma.clone());
    r.formaSorriso = forma;
  }
  r.lingua.visible = q.lingua > 0.02;
  r.lingua.position.z = M.cabeca * (0.86 + 0.14 * q.lingua);
  r.lingua.scale.set(1, 0.55, 0.4 + 0.8 * q.lingua);
  for (const sb of r.sobrancelhas) {
    const lado = sb.userData.lado;
    sb.position.y = sb.userData.base.y + 0.022 * q.sobrancelha + 0.006 * q.sobrancelhaMedo;
    // franzida (sobrancelha < 0): pontas de dentro descem; medo: pontas de dentro sobem
    sb.rotation.z = lado * (0.38 * Math.max(0, -q.sobrancelha) - 0.32 * q.sobrancelhaMedo);
  }

  // saia da mãe: em pé, o cilindro; sentada (coxas para a frente), o caimento que acompanha as coxas
  if (raiz.userData.saias) {
    const qm = (q.quadrilE + q.quadrilD) / 2;
    const sentada = qm < -0.75;
    raiz.userData.saias.em_pe.visible = !sentada;
    raiz.userData.saias.sentada.visible = sentada;
    raiz.userData.saias.sentada.rotation.x = qm;
  }
  // lágrimas: descem do canto de baixo do olho pela superfície da face; cada gota tem o seu ciclo
  for (const g of r.lagrimas) {
    const on = q.choro > 0.02;
    g.visible = on;
    if (!on) continue;
    const ciclo = (q.choroFase * 0.55 + g.userData.k * 0.5 + (g.userData.lado > 0 ? 0 : 0.27)) % 1;
    const x = g.userData.lado * (0.118 + 0.012 * ciclo);
    const y = M.cabeca * 0.9 - 0.02 - 0.15 * ciclo;
    const dy = y - CENTRO_CABECA;
    const rr = M.cabeca * 0.985 + 0.008;
    g.position.set(x, y, Math.sqrt(Math.max(0.0001, rr * rr - x * x - dy * dy)));
    const s = Math.min(1, q.choro) * (ciclo < 0.12 ? ciclo / 0.12 : ciclo > 0.85 ? (1 - ciclo) / 0.15 : 1);
    g.scale.set(0.8 * s, 1.35 * s, 0.6 * s);
  }

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

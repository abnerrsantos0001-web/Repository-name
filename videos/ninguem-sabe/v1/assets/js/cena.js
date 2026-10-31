// Motor das partes do vídeo 1: uma cena Three.js por parte, com os planos (cortes de câmera e de cenário)
// em tempos da narração. Cada parte (compositions/parteNN.html) só descreve os seus dados: planos, câmera,
// poses do personagem, celular e o que muda quadro a quadro. Tudo é render(t), puxado pelo relógio GSAP.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";
import { DESLOCAMENTO, criarQuarto, criarBairro, criarCidade, criarCelular, rng } from "./mundo.js";
import { criarTerreo, criarShopping, criarConcessionaria, criarEscadaria, criarApartamento } from "./mundo2.js";
import { criarPersonagem, poseBoneco, pontosDoBoneco, MEDIDAS } from "./personagem.js";

export { THREE, DESLOCAMENTO, MEDIDAS, rng };

const CONSTRUTORES = {
  quarto: criarQuarto,
  bairro: criarBairro,
  cidade: criarCidade,
  terreo: criarTerreo,
  shopping: criarShopping,
  concessionaria: criarConcessionaria,
  escadaria: criarEscadaria,
  apartamento: criarApartamento,
};

// ------------------------------------------------------------ curvas e chaves
export const CURVA = {
  linear: (k) => k,
  suave: (k) => k * k * (3 - 2 * k),
  entra: (k) => k * k * k,
  sai: (k) => 1 - Math.pow(1 - k, 3),
  ambos: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  longa: (k) => 1 - Math.pow(1 - k, 4),
};
// chaves: [[t, valor, curva?], ...]; valor é número ou lista. Duas chaves no mesmo t = corte seco.
export function trilha(chaves, t) {
  if (t <= chaves[0][0]) return chaves[0][1];
  for (let i = 1; i < chaves.length; i++) {
    const [t1, v1, nome = "suave"] = chaves[i];
    if (t <= t1) {
      const [t0, v0] = chaves[i - 1];
      const k = CURVA[nome]((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * k) : v0 + (v1 - v0) * k;
    }
  }
  return chaves[chaves.length - 1][1];
}
export function degrau(chaves, t) {
  let v = chaves[0][1];
  for (const [ti, vi] of chaves) if (t >= ti) v = vi;
  return v;
}
// pisca determinístico: aceso uma fração do período
export const pisca = (t, periodo, aceso = 0.5) => ((t % periodo) + periodo) % periodo < periodo * aceso;

// Tempos das palavras: T("escadas") = início da 1ª ocorrência; T("chama", 3) = da 3ª; T.fim(...) = fim.
const chave = (s) => s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}:]/gu, "");
export function tempos(palavras) {
  const achar = (texto, n = 1) => {
    const alvo = texto.split(/\s+/).map(chave);
    let visto = 0;
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, j) => chave(palavras[i + j].text) === a) && ++visto === n) return i;
    }
    throw new Error(`palavra não encontrada: ${texto} (${n})`);
  };
  const T = (texto, n) => palavras[achar(texto, n)].start;
  T.fim = (texto, n) => {
    const i = achar(texto, n);
    return palavras[i + texto.split(/\s+/).length - 1].end;
  };
  return T;
}

// tremor de câmera na mão: soma de senos com fases fixas
const fase = rng(91);
const F = Array.from({ length: 6 }, () => fase() * Math.PI * 2);
export const tremor = (t, a) => [
  a * (Math.sin(1.1 * t + F[0]) + 0.5 * Math.sin(2.7 * t + F[1]) + 0.25 * Math.sin(5.3 * t + F[2])),
  a * (Math.sin(0.9 * t + F[3]) + 0.5 * Math.sin(2.3 * t + F[4]) + 0.25 * Math.sin(4.9 * t + F[5])),
];

// pós-efeito do "mundo paralelo": onda leve, separação de cor e tom azulado
const SHADER_POS = {
  uniforms: { tDiffuse: { value: null }, onda: { value: 0 }, tom: { value: 0 }, tempo: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float onda; uniform float tom; uniform float tempo; varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      uv.x += sin(uv.y * 16.0 + tempo * 1.7) * 0.0028 * onda;
      uv.y += sin(uv.x * 12.0 + tempo * 1.3) * 0.0018 * onda;
      float d = 0.0018 * onda;
      vec3 c = vec3(texture2D(tDiffuse, uv + vec2(d, 0.0)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - vec2(d, 0.0)).b);
      float l = dot(c, vec3(0.3, 0.55, 0.15));
      c = mix(c, l * vec3(0.72, 0.9, 1.25), tom);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
};

// ------------------------------------------------------------ a parte
// O HyperFrames roda o script da composição mais de uma vez (uma cópia escondida registra as animações,
// outra é a que aparece). Cada passada cria um relógio (host) e avisa; a cena é montada para cada um,
// sempre no canvas daquela cópia.
export function iniciarParte(cfg) {
  const id = cfg.host.replace(/^__/, "");
  const feitos = new WeakSet();
  const montar = (host) => {
    if (!host || feitos.has(host)) return;
    feitos.add(host);
    montarParte(cfg, host);
  };
  window.__aoHost = window.__aoHost || {};
  window.__aoHost[id] = montar;
  montar(window[cfg.host]);
}

function montarParte(cfg, host) {
  const vars = host.vars || {};
  const vertical = vars.formato === "vertical";
  const inicio = Number(vars.inicio) || 0;
  const W = vertical ? 1080 : 1920;
  const H = vertical ? 1920 : 1080;

  const tela = host.tela;
  tela.width = W;
  tela.height = H;
  tela.style.width = W + "px";
  tela.style.height = H + "px";
  if (cfg.aoFormato) cfg.aoFormato({ vertical, W, H });

  const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const cena = new THREE.Scene();
  cena.fog = new THREE.Fog(0x000000, 10, 100);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.03, 900);
  const luzDaCamera = new THREE.PointLight(0xc8ccd2, 0, 14, 1.6);
  cena.add(luzDaCamera);
  const PREENCHIMENTO = { quarto: 1.6, bairro: 0, cidade: 2.5, terreo: 1.4, shopping: 0.6, concessionaria: 0.8, escadaria: 0.35, apartamento: 1.0, ...(cfg.preenchimento || {}) };

  const cenarios = {};
  for (const nome of cfg.cenarios) cenarios[nome] = CONSTRUTORES[nome](cena);

  // personagem principal e os outros (mulher, família)
  const boneco = criarPersonagem();
  cena.add(boneco);
  const outros = {};
  for (const o of cfg.outros || []) {
    const b = criarPersonagem(o.variante);
    cena.add(b);
    outros[o.id] = { ...o, boneco: b };
  }

  // o celular é do personagem: vai de um lugar fixo para a mão e volta
  const celular = criarCelular();
  cena.add(celular);
  const lanterna = new THREE.SpotLight(0xf2f0ea, 0, 14, 0.45, 0.55, 1.2);
  lanterna.castShadow = false;
  cena.add(lanterna);
  cena.add(lanterna.target);
  const ctxTela = celular.userData.tela.getContext("2d");

  // pós-efeito (só liga quando a parte pede)
  const alvoPos = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const matPos = new THREE.ShaderMaterial({ ...SHADER_POS, uniforms: THREE.UniformsUtils.clone(SHADER_POS.uniforms), depthTest: false, depthWrite: false });
  const triangulo = new THREE.BufferGeometry();
  triangulo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  triangulo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const cenaPos = new THREE.Scene();
  cenaPos.add(new THREE.Mesh(triangulo, matPos));
  const cameraPos = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const ctx = { THREE, cena, camera, cenarios, boneco, outros, celular, lanterna, vertical, W, H, trilha, degrau, pisca };
  if (cfg.montar) cfg.montar(ctx);

  const planos = cfg.planos;
  const planoEm = (t) => planos.reduce((a, p) => (t >= p.de ? p : a), planos[0]);
  const escuro = host.escuro || null;

  // passo sem escorregar: a fase anda com a distância percorrida (meio passo = 0.62 m, correndo 0.9 m)
  function distancia(posChaves, t0, t) {
    let d = 0;
    let a = trilha(posChaves, t0);
    for (let s = t0 + 1 / 30; s <= t + 1e-6; s += 1 / 30) {
      const b = trilha(posChaves, s);
      d += Math.hypot(b[0] - a[0], b[2] - a[2]);
      a = b;
    }
    return d;
  }

  function poseDe(def, t) {
    const p = {};
    for (const [k, chaves] of Object.entries(def.pose || {})) p[k] = trilha(chaves, t);
    const [x, y, z] = trilha(def.pos, t);
    const onde = degrau(def.onde, t);
    const o = DESLOCAMENTO[onde];
    const pose = {
      x: x + o.x,
      y: y + o.y,
      z: z + o.z,
      giro: p.giro ?? 0,
      deitar: p.deitar ?? 0,
      inclinar: p.inclinar ?? 0,
      cabecaGiro: p.cabecaGiro ?? 0,
      cabecaInclina: p.cabecaInclina ?? 0,
      cabecaTomba: p.cabecaTomba ?? 0,
      quadrilE: p.quadrilE ?? p.quadril ?? 0,
      quadrilD: p.quadrilD ?? p.quadril ?? 0,
      joelhoE: p.joelhoE ?? p.joelho ?? 0,
      joelhoD: p.joelhoD ?? p.joelho ?? 0,
      ombroE: p.ombroE ?? p.ombro ?? 0,
      ombroD: p.ombroD ?? (p.ombro ?? 0) * 0.9,
      aberturaE: p.aberturaE ?? p.abertura ?? 0.12,
      aberturaD: p.aberturaD ?? (p.abertura ?? 0.12) * 1.1,
      cotoveloE: p.cotoveloE ?? p.cotovelo ?? 0.15,
      cotoveloD: p.cotoveloD ?? (p.cotovelo ?? 0.15) * 0.95,
      olhos: p.olhos ?? 1,
      apertar: p.apertar ?? 0,
      boca: p.boca ?? 0,
      respirar: t * 1.9,
    };
    // caminhada / corrida: trechos [t0, t1, amplitude, meioPasso]
    for (const [t0, t1, amp = 1, meio = 0.62] of def.passos || []) {
      if (t >= t0 && t <= t1 + 0.6) {
        pose.andar = (Math.PI * distancia(def.pos, t0, Math.min(t, t1))) / meio;
        pose.passo = amp * trilha([[t0, 0], [t0 + 0.25, 1], [t1, 1], [t1 + 0.5, 0, "sai"]], t);
      }
    }
    return { pose, onde };
  }

  function aplicarPersonagem(b, def, t, plano) {
    const { pose, onde } = poseDe(def, t);
    poseBoneco(b, pose);
    if (def.maos) {
      const pts = pontosDoBoneco(b);
      const m = def.maos(t, pts, ctx);
      if (m && (m.pesoE > 0 || m.pesoD > 0)) poseBoneco(b, { ...pose, ...m });
    }
    b.visible = onde === plano.cenario && (!def.visivel || def.visivel(t, plano));
    return onde;
  }

  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  let ultimaTela = null;

  function render(tLocal) {
    const t = (Number(tLocal) || 0) + inicio;
    const plano = planoEm(t);
    const atual = cenarios[plano.cenario];
    for (const [nome, c] of Object.entries(cenarios)) c.grupo.visible = nome === plano.cenario;
    if (atual.modo) atual.modo(plano.modo || "dia", t);
    const nevoa = atual.nevoaAtual || atual.nevoa;
    cena.fog.color.setHex(nevoa[0]);
    cena.fog.near = nevoa[1];
    cena.fog.far = nevoa[2];
    renderer.setClearColor(atual.fundoAtual ?? atual.fundo);

    aplicarPersonagem(boneco, cfg.personagem, t, plano);
    for (const o of Object.values(outros)) aplicarPersonagem(o.boneco, o, t, plano);
    boneco.userData.rig.cabeca.visible = !(cfg.semCabeca && cfg.semCabeca(t, plano));

    // celular: na mão esquerda virado para o rosto, ou parado num lugar, ou guardado
    const lugar = cfg.celular ? cfg.celular(t, plano, ctx) : null;
    celular.visible = !!lugar;
    if (lugar === "mao") {
      boneco.userData.rig.bracoE.pega.getWorldPosition(_a);
      celular.position.copy(_a);
      celular.lookAt(pontosDoBoneco(boneco).cabeca);
      celular.translateY(0.055);
      celular.translateZ(0.035);
    } else if (lugar) {
      const o = DESLOCAMENTO[lugar.cenario];
      celular.position.set(lugar.pos[0] + o.x, lugar.pos[1] + o.y, lugar.pos[2] + o.z);
      celular.rotation.set(...lugar.rot);
    }
    if (cfg.tela) {
      const chaveTela = cfg.tela(ctxTela, t, null);
      if (chaveTela !== ultimaTela) {
        cfg.tela(ctxTela, t, true);
        celular.userData.textura.needsUpdate = true;
        ultimaTela = chaveTela;
      }
    }
    const luzLanterna = cfg.lanterna ? cfg.lanterna(t, plano) : 0;
    lanterna.intensity = luzLanterna * 60;
    if (luzLanterna > 0) {
      celular.updateMatrixWorld(true);
      celular.getWorldPosition(lanterna.position);
      lanterna.target.position.copy(lanterna.position).add(_b.set(0, 0, -1).transformDirection(celular.matrixWorld).multiplyScalar(4));
    }

    if (cfg.quadro) cfg.quadro(t, plano, ctx);

    // câmera: chaves [t, posição, alvo, fov, curva?] no espaço do cenário, ou uma função
    const o = DESLOCAMENTO[plano.cenario];
    const cam = cfg.cameras[plano.nome];
    let fov;
    if (typeof cam === "function") {
      const r = cam(t, ctx);
      camera.position.copy(r.pos);
      camera.up.set(0, 1, 0);
      camera.lookAt(r.alvo);
      fov = r.fov;
    } else {
      const chaves = (vertical && cam.v) || cam.k;
      const pos = trilha(chaves.map(([ti, p, , , c]) => [ti, p, c ?? "suave"]), t);
      const alvo = trilha(chaves.map(([ti, , a, , c]) => [ti, a, c ?? "suave"]), t);
      fov = trilha(chaves.map(([ti, , , f, c]) => [ti, f, c ?? "suave"]), t);
      camera.position.set(pos[0] + o.x, pos[1] + o.y, pos[2] + o.z);
      const d = Math.hypot(alvo[0] - pos[0], alvo[1] - pos[1], alvo[2] - pos[2]);
      const extra = cfg.chacoalhar ? cfg.chacoalhar(t, plano) : 0;
      const [dx, dy] = tremor(t * (1 + extra * 2.5), (cam.tremor ?? 0.003) * (1 + extra * 2));
      camera.up.set(0, 1, 0);
      camera.lookAt(alvo[0] + o.x + dx * d, alvo[1] + o.y + dy * d, alvo[2] + o.z);
    }
    // na vertical o quadro é estreito: abre o campo vertical para manter o assunto inteiro
    camera.fov = vertical && !(cam.v) ? Math.min(78, fov * 1.3) : fov;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    luzDaCamera.position.copy(camera.position).add(_b.set(0, 0.3, 0));
    luzDaCamera.intensity = (plano.preenchimento ?? PREENCHIMENTO[plano.cenario]) || 0;

    for (const c of Object.values(cenarios)) if (c.atualizar) c.atualizar(t);

    if (escuro) {
      const nivel = cfg.escurecer ? cfg.escurecer(t) : 0;
      escuro.style.opacity = nivel.toFixed(3);
    }

    const pos = cfg.pos ? cfg.pos(t, plano) : null;
    if (pos && (pos.onda > 0 || pos.tom > 0)) {
      renderer.setRenderTarget(alvoPos);
      renderer.render(cena, camera);
      renderer.setRenderTarget(null);
      matPos.uniforms.tDiffuse.value = alvoPos.texture;
      matPos.uniforms.onda.value = pos.onda || 0;
      matPos.uniforms.tom.value = pos.tom || 0;
      matPos.uniforms.tempo.value = t;
      renderer.render(cenaPos, cameraPos);
    } else {
      renderer.render(cena, camera);
    }
  }

  // escurece alguns quadros antes de trocar de mundo, para o corte ficar intencional
  if (!cfg.escurecer && cfg.cortesEscuros) {
    cfg.escurecer = (t) => {
      const c = cfg.cortesEscuros.find((x) => t >= x - 0.14 && t < x);
      return c ? (0.55 * (t - (c - 0.14))) / 0.14 : 0;
    };
  }

  function preparar() {
    // as fontes do canvas (Inter, Montserrat) carregam junto com a página; textos se redesenham a cada estado novo
    document.fonts.load("700 66px Inter").catch(() => {});
    // compila os shaders de cada plano (uma vez por cenário e modo) antes do primeiro quadro
    const vistos = new Set();
    for (const p of planos) {
      const k = p.cenario + "|" + (p.modo || "dia") + "|" + (cfg.pos ? 1 : 0);
      if (vistos.has(k) || p.de < inicio - 0.01) continue;
      vistos.add(k);
      render(Math.max(0, p.de - inicio + 0.05));
    }
    host.render = render;
    render(host.relogio.t);
    host.pronto();
  }
  preparar();
  return ctx;
}

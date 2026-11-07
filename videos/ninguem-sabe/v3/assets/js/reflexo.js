// Reflexos do vídeo 2.
// - EspelhoPlano: superfície que reflete a cena de verdade (câmera espelhada renderizando numa textura),
//   usada na tela preta do celular, na vitrine da padaria, na janela do ônibus e no espelho do quarto.
//   Antes de cada reflexo o motor troca o personagem pelo "dublê" (GANCHOS), e é assim que o reflexo
//   pode atrasar, piscar ou ficar sentado reto enquanto o personagem faz outra coisa.
// - materialVidro: o vidro do espelho do banheiro (o mundo espelhado fica atrás dele, ver mundo3.js):
//   quase invisível, com brilho, toques que fazem ondinhas e o efeito de "água" da parte 7.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/+esm";

// o motor preenche: antes(espelho) troca personagem por dublê; depois(espelho) desfaz
export const GANCHOS = { antes: null, depois: null };

const TOQUES = 4;
const TRECHO_TOQUES = `
  uniform vec4 toques[${TOQUES}]; // (u, v, instante, força)
  uniform float tempo;
  float anel(vec2 uv, vec2 aspecto) {
    float soma = 0.0;
    for (int i = 0; i < ${TOQUES}; i++) {
      vec4 tq = toques[i];
      float dt = tempo - tq.z;
      if (tq.w <= 0.0 || dt < 0.0 || dt > 1.6) continue;
      float d = length((uv - tq.xy) * aspecto);
      float raio = 0.02 + dt * 0.22;
      float fino = 0.012 + dt * 0.01;
      soma += tq.w * exp(-pow((d - raio) / fino, 2.0)) * (1.0 - dt / 1.6);
    }
    return soma;
  }
`;

export class EspelhoPlano extends THREE.Mesh {
  // largura, altura em metros; o: { resolucao (px do lado maior), cor (tom), mistura (0-1 de reflexo),
  // transparente (vidro que também deixa ver o outro lado), brilho }
  constructor(largura, altura, o = {}) {
    const geo = new THREE.PlaneGeometry(largura, altura);
    const lado = o.resolucao ?? 1024;
    const w = largura >= altura ? lado : Math.round((lado * largura) / altura);
    const h = largura >= altura ? Math.round((lado * altura) / largura) : lado;
    const alvo = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType });
    const mat = new THREE.ShaderMaterial({
      transparent: !!o.transparente,
      depthWrite: !o.transparente,
      uniforms: {
        tDiffuse: { value: alvo.texture },
        textureMatrix: { value: new THREE.Matrix4() },
        cor: { value: new THREE.Color(o.cor ?? 0xffffff) },
        mistura: { value: o.mistura ?? 1 },
        brilho: { value: o.brilho ?? 0.06 },
        aspecto: { value: new THREE.Vector2(largura / Math.max(largura, altura), altura / Math.max(largura, altura)) },
        toques: { value: Array.from({ length: TOQUES }, () => new THREE.Vector4(0, 0, 0, 0)) },
        tempo: { value: 0 },
        onda: { value: 0 },
      },
      vertexShader: `
        uniform mat4 textureMatrix; varying vec4 vProj; varying vec2 vUv;
        void main() {
          vUv = uv;
          vProj = textureMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec3 cor; uniform float mistura; uniform float brilho;
        uniform vec2 aspecto; uniform float onda;
        varying vec4 vProj; varying vec2 vUv;
        ${TRECHO_TOQUES}
        void main() {
          float a = anel(vUv, aspecto);
          vec4 p = vProj;
          p.xy += vec2(sin(vUv.y * 40.0 + tempo * 3.0), cos(vUv.x * 36.0 + tempo * 2.6)) * (0.004 * onda + 0.006 * a) * p.w;
          vec3 base = texture2DProj(tDiffuse, p).rgb * cor;
          // brilho diagonal suave do vidro e o reflexo das ondinhas dos toques
          float faixa = smoothstep(0.0, 0.25, 1.0 - abs(vUv.x + vUv.y * 0.6 - 0.75) * 3.0);
          base += vec3(brilho * faixa) + vec3(0.55, 0.6, 0.65) * a;
          gl_FragColor = vec4(base, clamp(mistura + a * 0.5, 0.0, 1.0));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    super(geo, mat);
    this.alvo = alvo;
    this.camVirtual = new THREE.PerspectiveCamera();
    this.desvio = o.desvio ?? 0.003;
    this.ativo = true;
    const plano = new THREE.Plane();
    const normal = new THREE.Vector3();
    const posEsp = new THREE.Vector3();
    const posCam = new THREE.Vector3();
    const rot = new THREE.Matrix4();
    const olhar = new THREE.Vector3();
    const vista = new THREE.Vector3();
    const alvoV = new THREE.Vector3();
    const corte = new THREE.Vector4();
    const q = new THREE.Vector4();
    const self = this;
    this.onBeforeRender = function (renderer, cena, camera) {
      if (!self.ativo || camera === self.camVirtual) return;
      posEsp.setFromMatrixPosition(self.matrixWorld);
      posCam.setFromMatrixPosition(camera.matrixWorld);
      rot.extractRotation(self.matrixWorld);
      normal.set(0, 0, 1).applyMatrix4(rot);
      vista.subVectors(posEsp, posCam);
      if (vista.dot(normal) > 0) return; // olhando por trás
      vista.reflect(normal).negate().add(posEsp);
      rot.extractRotation(camera.matrixWorld);
      olhar.set(0, 0, -1).applyMatrix4(rot).add(posCam);
      alvoV.subVectors(posEsp, olhar).reflect(normal).negate().add(posEsp);
      const cv = self.camVirtual;
      cv.position.copy(vista);
      cv.up.set(0, 1, 0).applyMatrix4(rot).reflect(normal);
      cv.lookAt(alvoV);
      cv.far = camera.far;
      cv.updateMatrixWorld();
      cv.projectionMatrix.copy(camera.projectionMatrix);
      const tm = self.material.uniforms.textureMatrix.value;
      tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      tm.multiply(cv.projectionMatrix).multiply(cv.matrixWorldInverse).multiply(self.matrixWorld);
      // plano de corte oblíquo: nada atrás do espelho entra no reflexo
      plano.setFromNormalAndCoplanarPoint(normal, posEsp).applyMatrix4(cv.matrixWorldInverse);
      corte.set(plano.normal.x, plano.normal.y, plano.normal.z, plano.constant);
      const pm = cv.projectionMatrix.elements;
      q.x = (Math.sign(corte.x) + pm[8]) / pm[0];
      q.y = (Math.sign(corte.y) + pm[9]) / pm[5];
      q.z = -1;
      q.w = (1 + pm[10]) / pm[14];
      corte.multiplyScalar(2 / corte.dot(q));
      pm[2] = corte.x;
      pm[6] = corte.y;
      pm[10] = corte.z + 1 - self.desvio;
      pm[14] = corte.w;
      self.visible = false;
      if (GANCHOS.antes) GANCHOS.antes(self);
      const alvoAtual = renderer.getRenderTarget();
      const sombras = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(self.alvo);
      renderer.state.buffers.depth.setMask(true);
      renderer.clear();
      renderer.render(cena, cv);
      renderer.shadowMap.autoUpdate = sombras;
      renderer.setRenderTarget(alvoAtual);
      if (camera.viewport !== undefined) renderer.state.viewport(camera.viewport);
      if (GANCHOS.depois) GANCHOS.depois(self);
      self.visible = true;
    };
  }
  // toques: lista de [u, v, instante, força] (até 4)
  toques(lista, tempo) {
    const u = this.material.uniforms;
    u.tempo.value = tempo;
    u.toques.value.forEach((v, i) => (lista[i] ? v.set(...lista[i]) : v.set(0, 0, 0, 0)));
  }
}

// Vidro do espelho do banheiro: o reflexo é o mundo espelhado atrás dele; o vidro só dá brilho,
// ondinhas dos toques e, na parte 7, a superfície mole como água (ondas que escurecem e brilham).
export function materialVidro(largura, altura) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      aspecto: { value: new THREE.Vector2(largura / Math.max(largura, altura), altura / Math.max(largura, altura)) },
      toques: { value: Array.from({ length: TOQUES }, () => new THREE.Vector4(0, 0, 0, 0)) },
      tempo: { value: 0 },
      agua: { value: 0 },
      centroAgua: { value: new THREE.Vector2(0.5, 0.5) },
      opaco: { value: 0 }, // 1 = vidro sem reflexo (espelho "vazio", só escuro)
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec2 aspecto; uniform float agua; uniform vec2 centroAgua; uniform float opaco;
      varying vec2 vUv;
      ${TRECHO_TOQUES}
      void main() {
        float a = anel(vUv, aspecto);
        float faixa = smoothstep(0.0, 0.3, 1.0 - abs(vUv.x + vUv.y * 0.55 - 0.8) * 2.6);
        // água: anéis concêntricos que saem do ponto onde a mão atravessa, e um tremor na superfície toda
        float d = length((vUv - centroAgua) * aspecto);
        float ondas = sin(d * 70.0 - tempo * 7.0) * 0.5 + 0.5;
        float tremor = sin(vUv.x * 23.0 + tempo * 4.1) * sin(vUv.y * 19.0 - tempo * 3.3);
        float w = agua * (0.55 * ondas * exp(-d * 2.2) + 0.25 * (tremor * 0.5 + 0.5));
        vec3 cor = vec3(0.82, 0.88, 0.92);
        float alfa = 0.035 + 0.05 * faixa + 0.55 * a + 0.45 * w;
        vec3 c = cor * (0.6 * faixa + a + w * 1.1);
        c = mix(c, vec3(0.05, 0.06, 0.07), opaco);
        alfa = mix(alfa, 0.97, opaco);
        gl_FragColor = vec4(c, clamp(alfa, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function toquesNoVidro(material, lista, tempo) {
  const u = material.uniforms;
  u.tempo.value = tempo;
  u.toques.value.forEach((v, i) => (lista[i] ? v.set(...lista[i]) : v.set(0, 0, 0, 0)));
}

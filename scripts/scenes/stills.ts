import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// The rest of the hero lake's story, rendered once to pictures by
// scripts/render-scenes.mjs. The hero's rowing boat drifts with its lantern
// lit, looking for somewhere; these stills follow it on the same lake, under
// the same violet sky, crescent moon, cloud banks, pine shores, mist and grade.
//
// voyage: deeper into the night the boat is under way, its wake opening behind
//         it, heading for one warm light far off between the shores.
// island: it has arrived. The light was the window of a log cabin between two
//         pines on a small island; the boat is tied up at its jetty and its
//         lantern now hangs by the door. The middle of the frame stays open
//         for copy.

export type Kind = 'voyage' | 'island';
export type Layout = 'portrait' | 'wide';

const twilight = {
  skyTop: '#0a0520',
  skyMid: '#25134f',
  horizon: '#6c4ea4',
  glow: '#b67ec4',
  cloudDark: '#1f1440',
  cloudLit: '#ab98e2',
  cloudAlpha: 0.96,
  moon: '#efeaff',
  moonGlow: 0.75,
  stars: 0.7,
  milky: 0.28,
  shore: '#1a1238',
  mist: '#8f76c6',
  mistAmount: 0.6,
  deep: '#0a0822',
  bedA: '#2b2f52',
  bedB: '#4a4f78',
  reed: '#0b0818',
  grass: '#1b1a3c',
  dust: 0.45,
  bloom: 0.6,
};

const hex = (value: string) => {
  const n = parseInt(value.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const NOISE = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

const NOISE_TEXTURE = /* glsl */ `
  uniform sampler2D uNoise;
  float fbmT(vec2 p) {
    return texture2D(uNoise, p * 0.25).r;
  }
`;

const WORLD_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Shading shared by every solid: a little sky from above, the moon's rim, the
// scene's one warm or cool light with a soft falloff, and the mist with depth.
const LIGHTING = /* glsl */ `
  uniform vec3 uLight, uLightPos, uHorizon, uSkyMid, uGlow, uMoon, uMoonDir, uMist;
  uniform float uLightPower, uMoonGlow, uMistAmount, uLightReach;
  vec3 shade(vec3 base, vec3 n, vec3 world, float wrap) {
    vec3 toL = uLightPos - world;
    float d = length(toL);
    float diffuse = max((dot(n, toL / d) + wrap) / (1.0 + wrap), 0.0);
    vec3 color = base * (uHorizon * 0.3 + uGlow * 0.1 + uSkyMid * max(n.y, 0.0) * 0.5);
    color += base * uLight * uLightPower * diffuse * 3.0 / (1.0 + d * d * uLightReach);
    vec3 v = normalize(cameraPosition - world);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * max(dot(n, uMoonDir) * 0.5 + 0.5, 0.0);
    color += uMoon * rim * 0.14 * uMoonGlow;
    float fog = smoothstep(8.0, 90.0, distance(world, cameraPosition));
    return mix(color, uMist * 0.55, fog * uMistAmount * 0.5);
  }
`;

export async function renderStill(
  canvas: HTMLCanvasElement,
  { kind, layout, width, height }: { kind: Kind; layout: Layout; width: number; height: number },
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 3000);
  camera.rotation.order = 'YXZ';
  const portrait = layout === 'portrait';
  const random = mulberry(kind === 'voyage' ? 23 : 41);

  // ——— Shared look ———
  const p = twilight;
  const u = {
    uTime: { value: 20 },
    uSkyTop: { value: hex(p.skyTop) },
    uSkyMid: { value: hex(p.skyMid) },
    uHorizon: { value: hex(p.horizon) },
    uGlow: { value: hex(p.glow) },
    uCloudDark: { value: hex(p.cloudDark) },
    uCloudLit: { value: hex(p.cloudLit) },
    uCloudAlpha: { value: p.cloudAlpha },
    uCloudGap: { value: 0.2 },
    uMoon: { value: hex(p.moon) },
    uMoonGlow: { value: p.moonGlow },
    uMoonDir: { value: new THREE.Vector3(0.3, 0.3, -1).normalize() },
    uStars: { value: p.stars },
    uMilky: { value: p.milky },
    uShore: { value: hex(p.shore) },
    uMist: { value: hex(p.mist) },
    uMistAmount: { value: p.mistAmount },
    uDeep: { value: hex(p.deep) },
    uBedA: { value: hex(p.bedA) },
    uBedB: { value: hex(p.bedB) },
    uReed: { value: hex(p.reed) },
    uGrass: { value: hex(p.grass) },
    uDust: { value: p.dust },
    // The scene's one practical light, the hero's lantern colour: the boat's
    // lantern under way, the cabin's window on arrival.
    uLight: { value: hex('#ffac58') },
    uLightPower: { value: 1 },
    uLightReach: { value: kind === 'voyage' ? 1.4 : 0.35 },
    uLightPos: { value: new THREE.Vector3() },
    // A far light that only glints on the water: xyz and strength.
    uBeacon: { value: new THREE.Vector4() },
    // How much of the moon's path shows on the water.
    uMoonPath: { value: kind === 'voyage' ? 0.4 : 1 },
    // The boat's wake: bow x, z, heading, and whether it is under way.
    uWake: { value: new THREE.Vector4() },
    uNoise: { value: null as THREE.Texture | null },
    uPixel: { value: Math.max(1, height / 900) },
  };
  if (kind === 'voyage') {
    // Later in the same night: darker overhead, more stars, a clearer Milky Way.
    u.uSkyTop.value = hex('#070417');
    u.uStars.value = 0.95;
    u.uMilky.value = 0.42;
  }

  // ——— Baked, tileable fbm noise ———
  const noiseTarget = new THREE.WebGLRenderTarget(512, 512, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    depthBuffer: false,
  });
  {
    const bakeScene = new THREE.Scene();
    bakeScene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = vec4(position.xy, 0.0, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            ${NOISE}
            float periodic(vec2 p, float period) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(hash12(mod(i, period)), hash12(mod(i + vec2(1.0, 0.0), period)), u.x),
                mix(hash12(mod(i + vec2(0.0, 1.0), period)), hash12(mod(i + vec2(1.0, 1.0), period)), u.x),
                u.y);
            }
            void main() {
              vec2 p = vUv * 4.0;
              float period = 4.0;
              float v = 0.0;
              float a = 0.5;
              for (int i = 0; i < 5; i++) {
                v += a * periodic(p, period);
                p = p * 2.0 + vec2(17.0, 9.0);
                period *= 2.0;
                a *= 0.5;
              }
              gl_FragColor = vec4(v, v, v, 1.0);
            }
          `,
        }),
      ),
    );
    renderer.setRenderTarget(noiseTarget);
    renderer.render(bakeScene, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
    renderer.setRenderTarget(null);
    u.uNoise.value = noiseTarget.texture;
  }

  // ——— Camera ———
  let horizonLine: number;
  let yaw = 0;
  if (kind === 'voyage') {
    // Following the boat from a little behind and above.
    camera.fov = portrait ? 44 : 38;
    camera.position.set(0, 1.9, 6);
    horizonLine = 0.44;
  } else {
    camera.fov = portrait ? 52 : 40;
    camera.position.set(0, 1.45, 12);
    horizonLine = portrait ? 0.62 : 0.6;
    yaw = portrait ? -0.06 : 0;
  }
  camera.updateProjectionMatrix();
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const pitch = Math.atan((horizonLine - 0.5) * 2 * Math.tan(halfFov));
  camera.rotation.set(pitch, yaw, 0);
  camera.updateMatrixWorld();
  const halfWidth = Math.atan(Math.tan(halfFov) * camera.aspect);
  u.uCloudGap.value = Math.min(0.24, halfWidth * 0.42);
  {
    // The moon sits on the side away from the subject.
    const side = kind === 'voyage' ? 1 : -1;
    const azimuth = side * Math.min(0.36, halfWidth * 0.62) + yaw * -1;
    const elevation = kind === 'voyage' ? 0.2 : portrait ? 0.36 : 0.26;
    u.uMoonDir.value
      .set(
        Math.sin(azimuth) * Math.cos(elevation),
        Math.sin(elevation),
        -Math.cos(azimuth) * Math.cos(elevation),
      )
      .normalize();
  }

  // ——— Sky (the hero's recipe) ———
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: u,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 pos = projectionMatrix * modelViewMatrix * vec4(position + cameraPosition, 1.0);
          gl_Position = pos.xyww;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime, uCloudAlpha, uCloudGap, uMoonGlow, uStars, uMilky;
        uniform vec3 uSkyTop, uSkyMid, uHorizon, uGlow, uCloudDark, uCloudLit, uMoon, uMoonDir;
        varying vec3 vDir;
        ${NOISE}
        ${NOISE_TEXTURE}
        float hash13(vec3 p) {
          p = fract(p * .1031);
          p += dot(p, p.zyx + 31.32);
          return fract((p.x + p.y) * p.z);
        }
        vec3 hash33(vec3 p) {
          p = fract(p * vec3(.1031, .1030, .0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.xxy + p.yxx) * p.zyx);
        }
        float stars(vec3 d, float scale, float keep, float size) {
          vec3 sp = d * scale;
          vec3 cell = floor(sp);
          float h = hash13(cell);
          if (h < keep) return 0.0;
          vec3 f = fract(sp) - 0.5 - (hash33(cell) - 0.5) * 0.55;
          f -= d * dot(f, d);
          float pixel = length(fwidth(sp)) * 0.8;
          float radius = max(size, pixel);
          float b = smoothstep(radius, radius * 0.15, length(f)) * mix(1.0, size / radius, 0.6);
          float twinkle = 0.6 + 0.4 * sin(uTime * (1.2 + h * 4.0) + h * 80.0);
          return b * twinkle * (0.35 + 0.65 * (h - keep) / (1.0 - keep));
        }
        void main() {
          vec3 d = normalize(vDir);
          float e = asin(clamp(d.y, -1.0, 1.0));
          float a = atan(d.x, -d.z);
          float up = max(e, 0.0);

          vec3 color = mix(uHorizon, uSkyMid, smoothstep(0.0, 0.28, up));
          color = mix(color, uSkyTop, smoothstep(0.22, 1.0, up));
          color += uGlow * exp(-up * 18.0) * (0.22 + 0.2 * exp(-a * a * 4.0));

          vec3 axis = normalize(vec3(0.55, 0.5, 0.67));
          float band = exp(-pow(dot(d, axis), 2.0) * 26.0);
          vec2 mw = vec2(dot(d, normalize(vec3(-0.77, 0.0, 0.63))), dot(d, axis)) * 7.0;
          float dust = fbmT(mw + 3.0) * band;
          float lane = smoothstep(0.45, 0.75, fbmT(mw * 1.8 + 11.0)) * band;
          vec3 milky = mix(vec3(0.42, 0.36, 0.78), vec3(0.85, 0.8, 1.0), dust) * (dust * 0.95 - lane * 0.3);
          float horizonFade = smoothstep(0.02, 0.28, up);

          float s = stars(d, 360.0, 0.976, 0.12) * 1.5 + stars(d, 720.0, 0.958 - band * 0.07, 0.14) * 0.9 + stars(d, 160.0, 0.993, 0.08) * 2.4;
          vec3 starTint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.86, 0.78), hash13(floor(d * 300.0)));

          float md = dot(d, uMoonDir);
          float r = 0.99985;
          float disc = smoothstep(r - 0.00003, r + 0.00003, md);
          vec3 shadowDir = normalize(uMoonDir + vec3(-0.011, 0.005, 0.002));
          float shadow = smoothstep(r - 0.00003, r + 0.00003, dot(d, shadowDir));
          vec2 maria = vec2(d.x, d.y) * 900.0;
          vec3 moon = uMoon * disc * mix(1.0, 0.07, shadow) * (0.86 + 0.14 * vnoise(maria));
          vec3 halo = uMoon * (pow(max(md, 0.0), 3000.0) * 0.35 + pow(max(md, 0.0), 120.0) * 0.12 + pow(max(md, 0.0), 10.0) * 0.05) * uMoonGlow;

          color += (milky * uMilky + starTint * s * uStars) * horizonFade + halo;
          color += moon * uMoonGlow;

          if (e > 0.0) {
            vec2 q = vec2(a * 3.0, e * 6.0) + vec2(uTime * 0.005, 0.0);
            vec2 w = vec2(fbmT(q + vec2(0.0, uTime * 0.012)), fbmT(q + vec2(5.2, 1.3) - uTime * 0.01));
            float dens = fbmT(q + w * 1.7);
            float side = smoothstep(uCloudGap, uCloudGap + 0.16, abs(a)) * smoothstep(0.06, 0.24, e);
            float crown = smoothstep(0.42, 0.75, e) * 0.7;
            float mask = max(side, crown);
            vec2 moonQ = vec2(atan(uMoonDir.x, -uMoonDir.z) * 3.0, asin(uMoonDir.y) * 6.0) + vec2(uTime * 0.005, 0.0);
            vec2 toMoon = moonQ - q;
            float shape = dens + (mask - 1.0) * 0.8 - exp(-length(toMoon) * 2.6) * 0.28;
            float cover = smoothstep(0.3, 0.6, shape);
            float near = exp(-length(toMoon) * 0.8);
            float lit = clamp((dens - fbmT(q + w * 1.7 + normalize(toMoon) * 0.1)) * 4.0 + 0.45, 0.0, 1.0);
            vec3 cloud = mix(uCloudDark, uCloudLit, 0.22 + lit * (0.45 + 0.33 * near));
            float lining = smoothstep(0.28, 0.36, shape) * (1.0 - smoothstep(0.36, 0.52, shape));
            cloud += uMoon * lining * near * 0.85 * uMoonGlow;
            cloud += uGlow * 0.28 * (1.0 - smoothstep(0.08, 0.32, e));
            color = mix(color, cloud, cover * uCloudAlpha);
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -3;
  scene.add(sky);

  // ——— Far shores: pine silhouettes, open in the middle ———
  const shore = (
    z: number,
    seed: number,
    haze: number,
    open: [number, number],
    scale: number,
    pines: number,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.abs(z) * 5, 60),
      new THREE.ShaderMaterial({
        uniforms: {
          ...u,
          uSeed: { value: seed },
          uHaze: { value: haze },
          uOpen: { value: new THREE.Vector2(...open) },
          uScale: { value: scale },
          uPines: { value: pines },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uShore, uHorizon, uGlow, uMist;
          uniform float uSeed, uHaze, uScale, uMistAmount, uPines;
          uniform vec2 uOpen;
          varying vec3 vWorld;
          ${NOISE}
          void main() {
            float x = vWorld.x;
            float open = smoothstep(uOpen.x, uOpen.y, abs(x));
            float hills = (2.0 + 4.0 * vnoise(vec2(x * 0.018, uSeed)) + 1.6 * vnoise(vec2(x * 0.06, uSeed + 3.0))) * mix(0.35, 1.0, open);
            float cw = 1.5;
            float cell = floor(x / cw);
            float lx = fract(x / cw) - 0.5 - (hash12(vec2(cell, uSeed)) - 0.5) * 0.4;
            float tall = (0.8 + hash12(vec2(cell, uSeed + 7.0)) * 2.6) * open * uPines;
            float pine = tall * max(0.0, 1.0 - abs(lx) * 2.4);
            float top = (hills + pine) * uScale;
            if (vWorld.y > top) discard;
            float edge = smoothstep(top - 0.6 * uScale, top, vWorld.y);
            vec3 color = mix(uShore, uHorizon, uHaze);
            color += uGlow * edge * 0.08;
            float mist = (1.0 - smoothstep(0.0, 3.5 * uScale, vWorld.y)) * uMistAmount;
            color = mix(color, uMist, mist * 0.45);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    );
    mesh.position.set(0, 28, z);
    return mesh;
  };
  scene.add(shore(-260, 2.0, 0.52, [16, 70], 1.6, 1), shore(-120, 9.0, 0.22, [22, 60], 0.85, 1));

  // ——— Low mist ———
  [-18, -42, -75, -115, -170].forEach((z, i) => {
    const tall = 6 + i * 2;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.abs(z) * 4 + 80, tall),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { ...u, uLayer: { value: i } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorld;
          void main() {
            vUv = uv;
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uMist, uLight, uLightPos;
          uniform float uTime, uMistAmount, uLayer, uLightPower;
          varying vec2 vUv;
          varying vec3 vWorld;
          ${NOISE}
          ${NOISE_TEXTURE}
          void main() {
            float drift = uTime * (0.012 + uLayer * 0.003);
            float n = fbmT(vec2(vWorld.x * 0.035 + drift * 8.0 + uLayer * 13.0, vUv.y * 1.6 - drift));
            float body = smoothstep(0.35, 0.8, n);
            float vertical = (1.0 - smoothstep(0.05, 1.0, vUv.y)) * smoothstep(0.0, 0.08, vUv.y);
            float sides = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
            float alpha = body * vertical * sides * uMistAmount * (0.28 + uLayer * 0.04);
            float warm = uLightPower / (1.0 + pow(distance(vWorld, uLightPos) * 0.3, 2.0));
            gl_FragColor = vec4(uMist + uLight * warm * 0.35, alpha);
          }
        `,
      }),
    );
    mesh.position.set(0, tall / 2 - 0.4, z);
    mesh.renderOrder = 4 + (4 - i);
    scene.add(mesh);
  });

  // ——— Materials ———
  const solid = (color: string, detail = '', wrap = 0.2) =>
    new THREE.ShaderMaterial({
      uniforms: { ...u, uBase: { value: hex(color) } },
      side: THREE.DoubleSide,
      vertexShader: WORLD_VERTEX,
      fragmentShader: /* glsl */ `
        uniform vec3 uBase;
        varying vec3 vNormal;
        varying vec3 vWorld;
        varying vec2 vUv;
        ${NOISE}
        ${LIGHTING}
        void main() {
          vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
          vec3 base = uBase;
          ${detail}
          gl_FragColor = vec4(shade(base, n, vWorld, ${wrap.toFixed(2)}), 1.0);
        }
      `,
    });
  const glowMaterial = (color: THREE.Vector3, core: number, spread: number, gain: number) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: color },
        uCore: { value: core },
        uSpread: { value: spread },
        uGain: { value: gain },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uCore, uSpread, uGain;
        varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float glow = exp(-r * uCore) + exp(-r * uSpread) * 0.25;
          glow *= smoothstep(1.0, 0.6, r);
          gl_FragColor = vec4(uColor * glow * uGain, 1.0);
        }
      `,
    });
  const glow = (
    at: THREE.Vector3,
    size: number,
    color: THREE.Vector3,
    core: number,
    spread: number,
    gain: number,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      glowMaterial(color, core, spread, gain),
    );
    mesh.position.copy(at);
    mesh.quaternion.copy(camera.quaternion);
    mesh.renderOrder = 10;
    scene.add(mesh);
  };

  // ——— Instanced blades: grass on the island, reeds along the shore ———
  const blades = (
    count: number,
    place: (i: number) => [number, number, number, number, number, number],
    stiff: number,
  ) => {
    const geometry = new THREE.InstancedBufferGeometry();
    const positions: number[] = [];
    const index: number[] = [];
    const segments = 5;
    for (let i = 0; i < segments; i++) positions.push(-0.5, i / segments, 0, 0.5, i / segments, 0);
    positions.push(0, 1, 0);
    for (let i = 0; i < segments - 1; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    index.push((segments - 1) * 2, (segments - 1) * 2 + 1, segments * 2);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(index);
    const offsets = new Float32Array(count * 3);
    const params = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const [x, y, z, h, w, seed] = place(i);
      offsets.set([x, y, z], i * 3);
      params.set([h, w, random() * Math.PI * 2, seed], i * 4);
    }
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute('params', new THREE.InstancedBufferAttribute(params, 4));
    geometry.instanceCount = count;
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: { ...u, uStiff: { value: stiff } },
        vertexShader: /* glsl */ `
          attribute vec3 offset;
          attribute vec4 params;
          uniform float uTime, uStiff;
          varying float vT;
          varying float vSeed;
          varying vec3 vWorld;
          ${NOISE}
          void main() {
            float t = position.y;
            float h = params.x;
            float seed = params.w;
            float gust = vnoise(offset.xz * 0.4 + uTime * vec2(0.3, 0.1));
            vec2 bend = vec2(0.22 + gust * 0.35, 0.05) + vec2(sin(uTime * 1.3 + seed * 6.28), cos(uTime * 1.1 + seed * 9.0)) * 0.12;
            bend *= uStiff;
            float c = cos(params.z);
            float s = sin(params.z);
            vec3 p = vec3(position.x * params.y * (1.0 - t * 0.9), t * h, 0.0);
            p.xz = mat2(c, -s, s, c) * p.xz;
            p.xz += bend * t * t * h * 0.5;
            vec4 world = modelMatrix * vec4(offset + p, 1.0);
            vWorld = world.xyz;
            vT = t;
            vSeed = seed;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uReed, uGrass, uMoon, uLight, uLightPos, uGlow, uMist, uHorizon;
          uniform float uMoonGlow, uLightPower, uMistAmount, uLightReach, uStiff;
          varying float vT;
          varying float vSeed;
          varying vec3 vWorld;
          void main() {
            vec3 base = uStiff > 0.5 ? uReed : uGrass;
            vec3 color = base * (0.4 + vSeed * 0.6) * (0.35 + 0.65 * vT);
            color *= mix(vec3(1.0), vec3(0.85, 1.05, 1.0), fract(vSeed * 7.0));
            color += uGlow * 0.05 * vT;
            color += uMoon * pow(vT, 3.0) * 0.07 * uMoonGlow;
            float d = distance(vWorld, uLightPos);
            color += uLight * uLightPower * (0.2 + 0.8 * vT * vT) * 1.1 / (1.0 + d * d * uLightReach * 1.6);
            float fog = smoothstep(9.0, 70.0, distance(vWorld, cameraPosition));
            color = mix(color, mix(uHorizon, uMist, 0.5) * 0.5, fog * uMistAmount * 0.8);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    );
    mesh.frustumCulled = false;
    scene.add(mesh);
  };

  // ——— Points: dust and fireflies ———
  const points = (positions: Float32Array, tint: THREE.Vector3, size: number, gain: number) => {
    const count = positions.length / 3;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      'seed',
      new THREE.BufferAttribute(
        Float32Array.from({ length: count }, () => random()),
        1,
      ),
    );
    const mesh = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { ...u, uTint: { value: tint }, uSize: { value: size }, uGain: { value: gain } },
        vertexShader: /* glsl */ `
          attribute float seed;
          uniform float uPixel, uSize, uTime;
          varying float vBlink;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vBlink = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(uTime * (0.6 + seed * 2.0) + seed * 60.0), 3.0);
            gl_PointSize = (1.0 + seed * 1.6) * uSize * uPixel * (14.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTint;
          uniform float uGain;
          varying float vBlink;
          void main() {
            float r = length(gl_PointCoord - 0.5);
            gl_FragColor = vec4(uTint * exp(-r * r * 26.0) * vBlink * uGain, 1.0);
          }
        `,
      }),
    );
    mesh.frustumCulled = false;
    mesh.renderOrder = 12;
    scene.add(mesh);
  };
  const scatter = (count: number, f: () => [number, number, number]) => {
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) out.set(f(), i * 3);
    return out;
  };
  points(
    scatter(420, () => [(random() - 0.5) * 34, 0.2 + random() * 7, -28 + random() * 34]),
    new THREE.Vector3(0.8, 0.85, 1.0),
    1.4,
    p.dust * 0.7,
  );

  // ——— The hero's lantern: a hexagonal cage of glass with a cap and a hook ———
  function buildLantern() {
    const lantern = new THREE.Group();
    const metal = solid('#0c0912', '', 0.2);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 6), metal);
    cap.position.y = 0.2;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.04, 6), metal);
    base.position.y = -0.13;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 12), metal);
    hook.position.y = 0.29;
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.26, 6, 1, true),
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uLight;
          uniform float uLightPower;
          varying vec2 vUv;
          void main() {
            float bars = smoothstep(0.0, 0.05, abs(fract(vUv.x * 6.0) - 0.5) * 2.0);
            float core = exp(-pow((vUv.y - 0.45) * 3.0, 2.0));
            vec3 color = uLight * (0.9 + core * 1.6) * uLightPower * mix(0.15, 1.0, bars);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    );
    lantern.add(cap, base, hook, glass);
    return lantern;
  }

  // ——— The hero's rowing boat: the same lofted hull, thwarts and oars ———
  function buildBoat({ lantern: lit, rowing }: { lantern: boolean; rowing: boolean }) {
    const boat = new THREE.Group();
    const wood = solid(
      '#2c1e2e',
      /* glsl */ `
        float seam = smoothstep(0.0, 0.1, abs(fract(vUv.y * 8.0) - 0.5) * 2.0);
        float grain = vnoise(vec2(vUv.x * 46.0, vUv.y * 8.0 + 3.0)) * 0.5 + vnoise(vec2(vUv.x * 140.0, vUv.y * 40.0)) * 0.5;
        base *= (0.62 + 0.38 * seam) * (0.8 + 0.4 * grain);
        float trim = smoothstep(0.05, 0.0, min(vUv.y, 1.0 - vUv.y));
        base = mix(base, base * 1.9 + 0.02, trim);
        if (!gl_FrontFacing) base *= 0.55;
      `,
      0.15,
    );
    const length = 4.3;
    const beam = 1.35;
    const draft = 0.62;
    const sheer = (t: number) => 0.32 + 0.2 * t * t;
    const hull = new THREE.BufferGeometry();
    {
      const along = 48;
      const around = 22;
      const positions: number[] = [];
      const hullUv: number[] = [];
      const index: number[] = [];
      for (let i = 0; i <= along; i++) {
        const t = (i / along) * 2 - 1;
        const half = (beam / 2) * Math.pow(Math.max(1 - t * t, 0), 0.62);
        const depth = draft * (0.55 + 0.45 * Math.sqrt(Math.max(1 - t * t, 0)));
        for (let j = 0; j <= around; j++) {
          const phi = j / around;
          const theta = (phi - 0.5) * Math.PI;
          const flare = 1 + 0.12 * Math.cos(theta);
          positions.push(
            (t * length) / 2,
            sheer(t) - depth * Math.pow(Math.cos(theta), 0.8),
            half * Math.sin(theta) * flare,
          );
          hullUv.push(i / along, phi);
        }
      }
      const row = around + 1;
      for (let i = 0; i < along; i++)
        for (let j = 0; j < around; j++) {
          const a = i * row + j;
          index.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
        }
      hull.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      hull.setAttribute('uv', new THREE.Float32BufferAttribute(hullUv, 2));
      hull.setIndex(index);
      hull.computeVertexNormals();
    }
    boat.add(new THREE.Mesh(hull, wood));
    for (const t of [-0.42, 0.05, 0.48]) {
      const half = (beam / 2) * Math.pow(1 - t * t, 0.62);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, half * 2 * 0.94), wood);
      seat.position.set((t * length) / 2, sheer(t) - 0.17, 0);
      boat.add(seat);
    }
    // Oars: out over each side with blades in the water when under way,
    // otherwise shipped along the thwarts.
    for (const side of rowing ? [-1, 1] : [1]) {
      const oar = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.8, 8), wood);
      shaft.rotation.z = Math.PI / 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 0.15), wood);
      blade.position.x = -1.55;
      oar.add(shaft, blade);
      if (rowing) {
        // Across the gunwale, swept towards the stern, blade dipped.
        oar.position.set(0.1, 0.42, side * 0.6);
        oar.rotation.set(0, side * (Math.PI / 2 + 0.35), 0.25);
        oar.translateX(-1.0);
      } else {
        oar.position.set(-0.2, 0.3, side * 0.25);
        oar.rotation.set(0.05, 0.06, 0.04);
      }
      boat.add(oar);
    }
    // The lantern post at the stern.
    const metal = solid('#0c0912', '', 0.2);
    const postX = (0.66 * length) / 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.15, 8), metal);
    post.position.set(postX, sheer(0.66) + 0.42, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), metal);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(postX - 0.19, sheer(0.66) + 0.98, 0);
    boat.add(post, arm);
    let lantern: THREE.Group | null = null;
    if (lit) {
      lantern = buildLantern();
      lantern.position.set(postX - 0.36, sheer(0.66) + 0.7, 0);
      lantern.rotation.z = 0.05;
      boat.add(lantern);
    }
    return { boat, lantern, length };
  }

  // ——— Water: the hero's shallow, pebbled lake, as a true mirror ———
  function buildWater() {
    const water = new Reflector(new THREE.PlaneGeometry(4000, 4000), {
      textureWidth: Math.round(width * 0.6),
      textureHeight: Math.round(height * 0.6),
      clipBias: 0.003,
      multisample: 4,
      shader: {
        name: 'StillWater',
        uniforms: {
          color: { value: null },
          tDiffuse: { value: null },
          textureMatrix: { value: null },
        },
        vertexShader: /* glsl */ `
          uniform mat4 textureMatrix;
          varying vec4 vReflect;
          varying vec3 vWorld;
          void main() {
            vReflect = textureMatrix * vec4(position, 1.0);
            vec4 world = modelMatrix * vec4(position, 1.0);
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D tDiffuse;
          uniform vec3 uDeep, uBedA, uBedB, uLight, uLightPos, uMoon, uMoonDir, uMist;
          uniform vec4 uBeacon, uWake;
          uniform float uTime, uLightPower, uMoonGlow, uMistAmount, uMoonPath;
          varying vec4 vReflect;
          varying vec3 vWorld;
          ${NOISE}
          float swell(vec2 p, float t) {
            float h = 0.0;
            h += sin(dot(p, vec2(0.16, 0.98)) * 1.3 + t * 0.9) * 0.035;
            h += sin(dot(p, vec2(-0.72, 0.69)) * 2.1 + t * 1.25) * 0.02;
            h += sin(dot(p, vec2(0.93, 0.36)) * 3.4 + t * 1.7) * 0.011;
            h += (vnoise(p * 1.4 + vec2(t * 0.22, t * 0.31)) - 0.5) * 0.045;
            h += (vnoise(p * 3.6 - vec2(t * 0.45, t * 0.18)) - 0.5) * 0.018;
            return h;
          }
          // A Kelvin wake: crests along two arms opening at about 19.5° from
          // the bow, transverse waves between them, a churned line astern.
          float wake(vec2 p) {
            if (uWake.w < 0.5) return 0.0;
            vec2 fwd = vec2(sin(uWake.z), -cos(uWake.z));
            vec2 d = p - uWake.xy;
            float along = -dot(d, fwd);
            float across = dot(d, vec2(-fwd.y, fwd.x));
            float behind = smoothstep(-0.4, 0.6, along);
            float a = max(along, 0.0);
            float fade = exp(-a * 0.045);
            float arm = abs(across) - a * 0.354;
            float spread = 0.22 + a * 0.06;
            float arms = exp(-arm * arm / (spread * spread)) * sin(a * 2.8 + abs(across) * 1.6);
            float inside = smoothstep(0.1, -0.5, arm);
            float transverse = inside * sin(a * 2.6) * 0.35 * exp(-a * 0.05);
            float trail = exp(-across * across * 5.0) * (vnoise(vec2(a * 2.5, across * 5.0)) - 0.5) * 1.3 * exp(-a * 0.08);
            return (arms + transverse + trail) * behind * fade * 0.14;
          }
          vec3 bed(vec2 q) {
            vec2 i = floor(q);
            vec2 f = fract(q);
            float d1 = 8.0;
            float d2 = 8.0;
            vec2 id = vec2(0.0);
            for (int y = -1; y <= 1; y++)
              for (int x = -1; x <= 1; x++) {
                vec2 g = vec2(float(x), float(y));
                vec2 r = g + hash22(i + g) * 0.85 - f;
                float d = dot(r, r);
                if (d < d1) { d2 = d1; d1 = d; id = i + g; }
                else if (d < d2) d2 = d;
              }
            float stone = smoothstep(0.0, 0.4, sqrt(d2) - sqrt(d1));
            vec3 color = mix(uBedA, uBedB, hash12(id)) * (0.62 + 0.38 * stone);
            return color * (0.75 + 0.5 * vnoise(q * 2.7));
          }
          void main() {
            vec2 p = vWorld.xz;
            float dist = distance(vWorld, cameraPosition);
            float detail = 1.0 / (1.0 + dist * 0.035);
            float e = 0.04;
            vec2 grad = vec2(
              swell(p + vec2(e, 0.0), uTime) - swell(p - vec2(e, 0.0), uTime),
              swell(p + vec2(0.0, e), uTime) - swell(p - vec2(0.0, e), uTime)) / (2.0 * e);
            grad *= detail;
            grad += vec2(
              wake(p + vec2(e, 0.0)) - wake(p - vec2(e, 0.0)),
              wake(p + vec2(0.0, e)) - wake(p - vec2(0.0, e))) / (2.0 * e);
            vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
            vec3 v = normalize(cameraPosition - vWorld);
            vec4 uv = vReflect;
            uv.xy += n.xz * vec2(0.9, 1.4) * uv.w * 0.06;
            vec3 reflection = texture2DProj(tDiffuse, uv).rgb;

            float depth = mix(0.45, 5.0, smoothstep(3.0, 40.0, dist));
            vec2 bedP = p - v.xz / max(v.y, 0.12) * depth * 0.6 + n.xz * 0.35;
            vec3 body = uDeep;
            if (dist < 42.0) {
              vec3 stones = mix(bed(bedP * 3.4), bed(bedP * 7.0 + 19.0), 0.35);
              float toLight = distance(bedP, uLightPos.xz);
              stones *= vec3(0.25) + uLight * uLightPower * 0.6 / (1.0 + toLight * toLight * 0.12);
              body = mix(mix(stones, uDeep, 1.0 - exp(-depth * 0.75)), uDeep, smoothstep(30.0, 42.0, dist));
            }
            float cosT = max(dot(n, v), 0.0);
            float fresnel = 0.03 + 0.97 * pow(1.0 - cosT, 5.0);
            fresnel = clamp(fresnel * 1.15 + smoothstep(18.0, 90.0, dist) * 0.25, 0.0, 1.0);
            vec3 color = mix(body, reflection, fresnel);

            vec3 r = reflect(-v, n);
            vec3 toL = uLightPos - vWorld;
            float ld = length(toL);
            float glint = pow(max(dot(r, toL / ld), 0.0), 260.0) * 1.1 + pow(max(dot(r, toL / ld), 0.0), 18.0) * 0.05;
            color += uLight * uLightPower * glint;
            color += uLight * uLightPower * 0.06 / (1.0 + ld * ld * 0.12);
            vec3 toB = normalize(uBeacon.xyz - vWorld);
            color += uLight * uBeacon.w * pow(max(dot(r, toB), 0.0), 2500.0) * 0.7;
            float moonGlint = pow(max(dot(r, uMoonDir), 0.0), 1600.0) * 1.6 + pow(max(dot(r, uMoonDir), 0.0), 80.0) * 0.025;
            color += uMoon * moonGlint * uMoonGlow * uMoonPath;
            color = mix(color, uMist, smoothstep(40.0, 400.0, dist) * uMistAmount * 0.25);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      },
    });
    water.rotation.x = -Math.PI / 2;
    Object.assign((water.material as THREE.ShaderMaterial).uniforms, u);
    scene.add(water);
  }

  // ——— Under way: the boat heading for a far light ———
  function buildVoyage() {
    const { boat, lantern, length } = buildBoat({ lantern: true, rowing: true });
    const heading = -0.06;
    boat.position.set(0.2, -0.05, -4.2);
    boat.rotation.set(0.012, -Math.PI / 2 - heading, -0.025);
    scene.add(boat);
    boat.updateMatrixWorld(true);
    const forward = new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
    const bow = boat.position.clone().addScaledVector(forward, length / 2);
    u.uWake.value.set(bow.x, bow.z, heading, 1);
    const lanternWorld = lantern!.localToWorld(new THREE.Vector3());
    u.uLightPos.value.copy(lanternWorld);
    glow(lanternWorld, 2.6, u.uLight.value, 12, 3.5, 0.45);
    glow(lanternWorld, 14, u.uLight.value, 6, 2.2, 0.05);

    // Far ahead, in the gap between the shores: the island, small and dark,
    // with one lit window. The same island the last scene arrives at.
    const far = new THREE.Vector3(-5, 0, -95);
    const { frontWindow } = makeIsland(far, 0.55);
    const light = frontWindow.localToWorld(new THREE.Vector3(0, 0, 0.05));
    u.uBeacon.value.set(light.x, light.y, light.z, 1);
    glow(light, 2.6, u.uLight.value, 14, 4, 0.7);
    glow(light, 9, u.uLight.value, 8, 3, 0.03);

    // Reeds the boat has just left behind, in the lower corners.
    const spread = portrait ? 0.6 : 1;
    blades(
      900,
      () => {
        const right = random() < 0.4;
        const clump = Math.floor(random() * 3);
        const cx = (right ? 3.4 + clump * 0.7 : -3.2 - clump * 0.8) * spread;
        const cz = 3.6 + clump * 0.9;
        const r = Math.pow(random(), 0.7) * 0.8;
        const a = random() * Math.PI * 2;
        return [
          cx + Math.cos(a) * r * spread,
          -0.05,
          cz + Math.sin(a) * r,
          (0.6 + random() * 1.2) * (1.1 - r * 0.4),
          0.03 + random() * 0.035,
          random(),
        ];
      },
      1,
    );

    buildWater();
  }

  if (kind === 'voyage') buildVoyage();
  else buildIsland();

  // ——— The island: a log cabin between two pines ———
  function makeIsland(at: THREE.Vector3, turn: number) {
    const island = new THREE.Group();
    island.position.copy(at);
    island.rotation.y = turn;

    // The mound: a low, uneven hump whose rocky edge slips under the water.
    const rx = 3.6;
    const rz = 2.7;
    const moundGeometry = new THREE.BufferGeometry();
    {
      const rings = 28;
      const around = 96;
      const positions: number[] = [];
      const index: number[] = [];
      positions.push(0, 0.62, 0);
      for (let i = 1; i <= rings; i++) {
        const r = i / rings;
        for (let j = 0; j < around; j++) {
          const a = (j / around) * Math.PI * 2;
          const wobble =
            1 +
            0.12 * Math.sin(a * 3 + 1) +
            0.06 * Math.sin(a * 7 + 2) +
            (random() - 0.5) * 0.03 * r;
          const x = Math.cos(a) * r * rx * wobble;
          const z = Math.sin(a) * r * rz * wobble;
          const y =
            0.62 * Math.pow(Math.max(1 - r * r, 0), 0.7) -
            0.25 * r * r * r +
            (random() - 0.5) * 0.04 * r;
          positions.push(x, y, z);
        }
      }
      for (let j = 0; j < around; j++) index.push(0, 1 + ((j + 1) % around), 1 + j);
      for (let i = 0; i < rings - 1; i++)
        for (let j = 0; j < around; j++) {
          const a = 1 + i * around + j;
          const b = 1 + i * around + ((j + 1) % around);
          const c = a + around;
          const d = b + around;
          index.push(a, b, c, b, d, c);
        }
      moundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      moundGeometry.setIndex(index);
      moundGeometry.computeVertexNormals();
      moundGeometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 2), 2),
      );
    }
    island.add(
      new THREE.Mesh(
        moundGeometry,
        solid(
          '#1f1d40',
          /* glsl */ `
            float rock = 1.0 - smoothstep(0.02, 0.22, vWorld.y);
            float stones = vnoise(vWorld.xz * 6.0) * 0.6 + vnoise(vWorld.xz * 19.0) * 0.4;
            base = mix(base * (0.7 + 0.5 * vnoise(vWorld.xz * 3.0)), vec3(0.2, 0.19, 0.3) * (0.6 + 0.7 * stones), rock);
          `,
          0.3,
        ),
      ),
    );

    // The cabin, its front and one gable end turned to the lake.
    const cabin = new THREE.Group();
    const w = 2.2;
    const h = 1.35;
    const d = 1.7;
    const logs = solid(
      '#4a3036',
      /* glsl */ `
        float y = vWorld.y * 7.5;
        float log_ = abs(fract(y) - 0.5) * 2.0;
        float round_ = sqrt(max(1.0 - log_ * log_, 0.0));
        float grain = vnoise(vec2(vWorld.x * 5.0 + vWorld.z * 5.0, y * 4.0));
        base *= (0.35 + 0.75 * round_) * (0.8 + 0.4 * grain);
      `,
      0.3,
    );
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), logs);
    walls.position.y = h / 2;
    cabin.add(walls);
    // Gable ends: triangles of the same logs.
    const gable = new THREE.Shape();
    gable.moveTo(-d / 2, 0);
    gable.lineTo(d / 2, 0);
    gable.lineTo(0, 0.75);
    gable.closePath();
    const gableGeometry = new THREE.ExtrudeGeometry(gable, {
      depth: w - 0.02,
      bevelEnabled: false,
    });
    gableGeometry.translate(0, 0, -(w - 0.02) / 2);
    const gables = new THREE.Mesh(gableGeometry, logs);
    gables.rotation.y = Math.PI / 2;
    gables.position.y = h;
    cabin.add(gables);
    // Roof: two shingled slabs with an overhang.
    const roofMaterial = solid(
      '#2a2036',
      /* glsl */ `
        float row = fract(vUv.y * 10.0);
        float shingle = smoothstep(0.0, 0.15, row) * (0.75 + 0.25 * hash12(floor(vec2(vUv.x * 14.0 + floor(vUv.y * 10.0) * 0.5, vUv.y * 10.0))));
        base *= 0.55 + 0.6 * shingle;
      `,
      0.2,
    );
    const slope = Math.atan2(0.75, d / 2);
    const slab = Math.hypot(0.75, d / 2) + 0.28;
    for (const side of [-1, 1]) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.07, slab), roofMaterial);
      roof.position.set(0, h + 0.375 + 0.06, (side * d) / 4 + side * 0.06);
      roof.rotation.x = side * slope;
      cabin.add(roof);
    }
    // Chimney.
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.9, 0.3),
      solid(
        '#3a3048',
        /* glsl */ `
          vec2 b = vec2(vWorld.x * 7.0 + floor(vWorld.y * 9.0) * 0.5 + vWorld.z * 7.0, vWorld.y * 9.0);
          base *= 0.55 + 0.45 * step(0.12, fract(b.x)) * step(0.15, fract(b.y));
        `,
      ),
    );
    chimney.position.set(-0.6, h + 0.75, -0.25);
    cabin.add(chimney);
    // Door: dark planks with a sliver of light under it.
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.95),
      solid(
        '#24161c',
        /* glsl */ `
          base *= 0.7 + 0.3 * step(0.1, fract(vUv.x * 5.0));
        `,
      ),
    );
    door.position.set(-0.5, 0.48, d / 2 + 0.006);
    cabin.add(door);
    // Windows: warm panes split by a cross of mullions.
    const windowMaterial = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uLight;
        uniform float uLightPower;
        varying vec2 vUv;
        void main() {
          vec2 q = abs(vUv - 0.5);
          float frame = step(0.42, max(q.x, q.y));
          float mullion = step(q.x, 0.035) + step(q.y, 0.035);
          float inside = exp(-dot(vUv - vec2(0.45, 0.4), vUv - vec2(0.45, 0.4)) * 4.0);
          vec3 light = uLight * (1.1 + inside * 1.4) * uLightPower;
          vec3 color = mix(light, vec3(0.06, 0.035, 0.04), clamp(frame + mullion, 0.0, 1.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    const frontWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.52), windowMaterial);
    frontWindow.position.set(0.42, 0.72, d / 2 + 0.008);
    cabin.add(frontWindow);
    const sideWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), windowMaterial);
    sideWindow.rotation.y = -Math.PI / 2;
    sideWindow.position.set(-w / 2 - 0.008, 0.75, 0.1);
    cabin.add(sideWindow);
    // A step and a small woodpile by the door.
    const plank = solid('#3a2830');
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.3), plank);
    step.position.set(-0.5, 0.04, d / 2 + 0.15);
    cabin.add(step);
    for (let i = 0; i < 9; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10), plank);
      log.rotation.x = Math.PI / 2;
      log.position.set(
        0.85 + (i % 3) * 0.13 + (Math.floor(i / 3) % 2) * 0.065,
        0.06 + Math.floor(i / 3) * 0.11,
        d / 2 + 0.3,
      );
      cabin.add(log);
    }
    cabin.position.set(-0.2, 0.5, 0.1);
    cabin.rotation.y = -0.55;
    island.add(cabin);

    // Two pines behind the cabin, jagged rather than perfect cones.
    const needles = solid(
      '#121a2e',
      /* glsl */ `
        base *= 0.6 + 0.6 * vnoise(vWorld.xy * 14.0 + vWorld.z * 9.0);
      `,
      0.4,
    );
    const trunkMaterial = solid('#1f1418');
    const pine = (x: number, z: number, height: number) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.12, height * 0.35, 8),
        trunkMaterial,
      );
      trunk.position.y = height * 0.17;
      tree.add(trunk);
      const tiers = 6;
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers;
        const radius = (1 - t * 0.82) * height * 0.24;
        const tall = height * 0.3;
        const cone = new THREE.ConeGeometry(radius, tall, 22, 3, true);
        const position = cone.attributes.position;
        for (let k = 0; k < position.count; k++) {
          const px = position.getX(k);
          const pz = position.getZ(k);
          const jag = 1 + (random() - 0.5) * 0.45;
          position.setX(k, px * jag);
          position.setZ(k, pz * jag);
          position.setY(k, position.getY(k) - Math.hypot(px, pz) * 0.25 * random());
        }
        cone.computeVertexNormals();
        const tier = new THREE.Mesh(cone, needles);
        tier.position.y = height * (0.22 + t * 0.66);
        tier.rotation.y = random() * Math.PI;
        tree.add(tier);
      }
      tree.position.set(x, 0.3, z);
      island.add(tree);
    };
    pine(1.4, -0.9, 5.4);
    pine(-1.9, -0.4, 4.1);

    // Rocks at the waterline.
    const stone = solid('#2c2a44', '', 0.3);
    for (let i = 0; i < 14; i++) {
      const a = random() * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + random() * 0.22, 0), stone);
      rock.position.set(
        Math.cos(a) * rx * (0.88 + random() * 0.15),
        -0.02,
        Math.sin(a) * rz * (0.88 + random() * 0.15),
      );
      rock.rotation.set(random() * 3, random() * 3, random() * 3);
      rock.scale.y = 0.6;
      island.add(rock);
    }

    scene.add(island);
    island.updateMatrixWorld(true);
    return { island, cabin, door, frontWindow, sideWindow, rx, rz, d };
  }

  // ——— Arrival: the island close by, the boat tied up at its jetty ———
  function buildIsland() {
    const at = portrait ? new THREE.Vector3(5.6, 0, -11) : new THREE.Vector3(8.6, 0, -9.5);
    const { island, cabin, door, frontWindow, sideWindow, rx, rz, d } = makeIsland(at, 0.25);
    const windowWorld = frontWindow.localToWorld(new THREE.Vector3(0, 0, 0.02));
    u.uLightPos.value.copy(frontWindow.localToWorld(new THREE.Vector3(0, -0.1, 1.4)));
    glow(windowWorld, 1.8, u.uLight.value, 10, 3.0, 0.38);
    glow(windowWorld, 10, u.uLight.value, 6, 2.2, 0.05);
    glow(
      sideWindow.localToWorld(new THREE.Vector3(0, 0, 0.02)),
      1.1,
      u.uLight.value,
      10,
      3.0,
      0.25,
    );

    // Grass tufts on the mound, reeds in the foreground corners.
    blades(
      1800,
      () => {
        const r = Math.sqrt(random()) * 0.95;
        const a = random() * Math.PI * 2;
        const ground = 0.62 * Math.pow(Math.max(1 - r * r, 0), 0.7) - 0.25 * r * r * r - 0.03;
        const world = island.localToWorld(
          new THREE.Vector3(Math.cos(a) * r * rx, ground, Math.sin(a) * r * rz),
        );
        return [
          world.x,
          world.y,
          world.z,
          0.12 + random() * 0.28,
          0.02 + random() * 0.02,
          random(),
        ];
      },
      0.4,
    );
    const spread = portrait ? 0.55 : 1;
    blades(
      portrait ? 800 : 1200,
      (i) => {
        // Mostly on the left; a small clump on the right, clear of the
        // island's reflection.
        const right = !portrait && i % 3 === 0;
        const clump = Math.floor(random() * 4);
        const cx = right ? 5.6 + clump * 0.5 : (-3.0 - clump * 0.8) * spread;
        const cz = right ? 6.6 + clump * 0.6 : 4.2 + clump * 1.1;
        const r = Math.pow(random(), 0.7) * 0.9;
        const a = random() * Math.PI * 2;
        return [
          cx + Math.cos(a) * r * spread,
          -0.05,
          cz + Math.sin(a) * r,
          (0.55 + random() * 1.15) * (1.1 - r * 0.4),
          0.03 + random() * 0.035,
          random(),
        ];
      },
      1,
    );

    // Fireflies about the island.
    points(
      scatter(40, () => [
        at.x + (random() - 0.5) * 7,
        0.4 + random() * 2.2,
        at.z + (random() - 0.5) * 5 + 1,
      ]),
      hex('#ffd77a'),
      1.3,
      0.8,
    );

    // A short jetty out from the shore towards the open water.
    const plank = solid(
      '#3a2a34',
      /* glsl */ `
        base *= 0.75 + 0.35 * vnoise(vec2(vWorld.x * 2.0 + vWorld.z * 2.0, vWorld.y * 30.0));
      `,
      0.3,
    );
    const jetty = new THREE.Group();
    const run = 3.4;
    for (let k = 0; k < 15; k++) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.2), plank);
      board.position.set((random() - 0.5) * 0.04, 0.32, -k * 0.23);
      board.rotation.y = (random() - 0.5) * 0.04;
      jetty.add(board);
    }
    for (const side of [-1, 1])
      for (let k = 0; k < 4; k++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 8), plank);
        post.position.set(side * 0.45, 0.05 + (k === 3 ? 0.12 : 0), -k * (run / 3.2));
        jetty.add(post);
      }
    // Its land end sits on the island's front edge; it reaches towards the lake.
    const landing = island.localToWorld(new THREE.Vector3(-rx * 0.62, 0, rz * 0.62));
    const reach = new THREE.Vector3(-0.72, 0, 0.7).normalize();
    jetty.position.copy(landing).addScaledVector(reach, run);
    jetty.rotation.y = Math.atan2(reach.x, reach.z);
    scene.add(jetty);

    // The boat from the opening scene, tied alongside with its oars shipped.
    // Its lantern post stands empty.
    const { boat } = buildBoat({ lantern: false, rowing: false });
    const across = new THREE.Vector3(reach.z, 0, -reach.x);
    boat.position
      .copy(landing)
      .addScaledVector(reach, run * 0.55)
      .addScaledVector(across, 1.05);
    boat.position.y = -0.04;
    boat.rotation.set(0.015, Math.atan2(reach.x, reach.z) - Math.PI / 2, 0.02);
    boat.scale.setScalar(0.72);
    scene.add(boat);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 5), solid('#4a3a40'));
    rope.position
      .copy(boat.position)
      .addScaledVector(across, -0.5)
      .addScaledVector(reach, run * 0.25);
    rope.position.y = 0.28;
    rope.rotation.set(0, Math.atan2(across.x, across.z), Math.PI / 2 - 0.25);
    scene.add(rope);

    // And its lantern, now hung on a bracket by the cabin door.
    const lantern = buildLantern();
    cabin.add(lantern);
    lantern.position.set(door.position.x - 0.42, 1.12, d / 2 + 0.16);
    const bracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6),
      solid('#120e18'),
    );
    bracket.rotation.x = Math.PI / 2;
    bracket.position.set(lantern.position.x, 1.42, d / 2 + 0.08);
    cabin.add(bracket);
    cabin.updateMatrixWorld(true);
    const lanternWorld = lantern.localToWorld(new THREE.Vector3());
    glow(lanternWorld, 1.4, u.uLight.value, 12, 3.5, 0.4);

    buildWater();
  }
  // ——— Post: bloom, then the hero's grade with a lighter grain ———
  const composer = new EffectComposer(
    renderer,
    new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 }),
  );
  composer.setPixelRatio(1);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), p.bloom, 0.55, 0.78),
  );
  const grade = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: new THREE.Vector2(width, height) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform vec2 uResolution;
      varying vec2 vUv;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      void main() {
        vec2 q = vUv - 0.5;
        float aberration = dot(q, q) * 0.004;
        vec3 color = vec3(
          texture2D(tDiffuse, vUv + q * aberration).r,
          texture2D(tDiffuse, vUv).g,
          texture2D(tDiffuse, vUv - q * aberration).b);
        float vignette = smoothstep(0.95, 0.25, length(q * vec2(1.0, 1.25)));
        color *= mix(0.72, 1.0, vignette);
        color += (hash(vUv * uResolution) - 0.5) * 0.014;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  composer.addPass(grade);

  await renderer.compileAsync(scene, camera);
  composer.render(0);
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

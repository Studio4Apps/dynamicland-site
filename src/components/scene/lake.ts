import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// A cold violet lake for the hero. A small rowing boat rests in the middle
// with a lantern burning at its stern; cloud banks hang over both shoulders of
// the sky, and the shallow water mirrors all of it. The surface is a live wave
// field, so the pointer, the boat and the odd rising fish all leave rings.
// Every colour is a display (sRGB) value written straight to the screen.

// The twilight look: a dark violet sky, a lantern lit, the first stars out.
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
  bedLight: 0.25,
  caustics: 0.25,
  lantern: '#ffac58',
  lanternPower: 1,
  wood: '#2c1e2e',
  reed: '#0b0818',
  dust: 0.45,
  bloom: 0.55,
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
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = p * 2.02 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }
`;

// Cloud, dust and mist detail is read from a noise texture baked once at
// start-up instead of being summed octave by octave on every pixel.
const NOISE_TEXTURE = /* glsl */ `
  uniform sampler2D uNoise;
  float fbmT(vec2 p) {
    return texture2D(uNoise, p * 0.25).r;
  }
`;

// The water's resting state; the interactive field is added on top of it.
const SURFACE = /* glsl */ `
  float swell(vec2 p, float t) {
    float h = 0.0;
    h += sin(dot(p, vec2(0.16, 0.98)) * 1.3 + t * 0.9) * 0.035;
    h += sin(dot(p, vec2(-0.72, 0.69)) * 2.1 + t * 1.25) * 0.02;
    h += sin(dot(p, vec2(0.93, 0.36)) * 3.4 + t * 1.7) * 0.011;
    h += (vnoise(p * 1.4 + vec2(t * 0.22, t * 0.31)) - 0.5) * 0.045;
    h += (vnoise(p * 3.6 - vec2(t * 0.45, t * 0.18)) - 0.5) * 0.018;
    return h;
  }
`;

// Phones: the reflection painted from the same ingredients as the sky.
const FAKE_REFLECTION = /* glsl */ `
  uniform vec3 uSkyTop, uSkyMid, uGlow, uCloudDark, uCloudLit, uShore, uWood, uBoat;
  uniform float uCloudAlpha, uCloudGap;
  ${NOISE_TEXTURE}
  vec3 fakeReflection(vec3 r, vec2 p) {
    float e = max(asin(clamp(r.y, -1.0, 1.0)), 0.0);
    float a = atan(r.x, -r.z);
    vec3 color = mix(uHorizon, uSkyMid, smoothstep(0.0, 0.28, e));
    color = mix(color, uSkyTop, smoothstep(0.22, 1.0, e));
    color += uGlow * exp(-e * 18.0) * (0.22 + 0.2 * exp(-a * a * 4.0));
    // Cloud banks: one texture read instead of the sky's domain warp.
    float dens = fbmT(vec2(a * 3.0, e * 6.0) + vec2(uTime * 0.005, 0.0));
    float side = smoothstep(uCloudGap, uCloudGap + 0.16, abs(a)) * smoothstep(0.06, 0.24, e);
    float cover = smoothstep(0.3, 0.6, dens + (side - 1.0) * 0.8);
    color = mix(color, mix(uCloudDark, uCloudLit, 0.45), cover * uCloudAlpha);
    // Pine shores on both sides, open in the middle like the real horizon.
    float open = smoothstep(0.07, 0.3, abs(a));
    float pines = 0.01 * abs(sin(a * 420.0)) * open;
    float shore = (0.022 + 0.03 * vnoise(vec2(a * 12.0, 2.0))) * open + pines;
    color = mix(color, mix(uShore, uHorizon, 0.35), step(e, shore) * open);
    // The hull's dark reflection, just in front of the boat.
    vec2 d = p - uBoat.xy - vec2(0.0, 0.45);
    float c = cos(uBoat.z);
    float s = sin(uBoat.z);
    vec2 local = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
    float hull = 1.0 - smoothstep(0.75, 1.0, length(local / vec2(2.15, 0.8)));
    color = mix(color, uWood * 0.5, hull * 0.85);
    return color;
  }
`;

const RIPPLE_MIN = new THREE.Vector2(-16, -26);
const RIPPLE_SIZE = new THREE.Vector2(32, 32);
const RIPPLE_RES = 256;

export type Lake = {
  setActive: (active: boolean) => void;
  pointer: (clientX: number, clientY: number) => void;
  press: (clientX: number, clientY: number) => void;
  leave: () => void;
  dispose: () => void;
};

export function createLake(
  canvas: HTMLCanvasElement,
  {
    still,
    compact,
    lite,
    onReady,
    onLost,
    onLayout,
  }: {
    still: boolean;
    compact: boolean;
    lite: boolean;
    onReady: () => void;
    onLost: (lost: boolean) => void;
    onLayout: (horizon: number) => void;
  },
): Lake {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  // The scene is soft (mist, glow, blurred reflections), so a Retina screen
  // gains little above 1.5× while paying for nearly twice the pixels.
  const screenRatio = window.devicePixelRatio || 1;
  let dpr = Math.min(screenRatio, lite ? 1 : 1.5);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000);
  camera.rotation.order = 'YXZ';
  camera.layers.enable(1);
  const eye = new THREE.Vector3(0, 1.45, 12);
  camera.position.copy(eye);
  let pitch = 0.07;

  // ——— Shared, animated look ———
  const p = twilight;
  const u = {
    uTime: { value: 0 },
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
    uBedLight: { value: p.bedLight },
    uCaustics: { value: p.caustics },
    uLantern: { value: hex(p.lantern) },
    uLanternPower: { value: p.lanternPower },
    uLanternPos: { value: new THREE.Vector3() },
    uBoat: { value: new THREE.Vector3() },
    uFlicker: { value: 1 },
    uWood: { value: hex(p.wood) },
    uReed: { value: hex(p.reed) },
    uDust: { value: p.dust },
    uShootA: { value: new THREE.Vector2() },
    uShootDir: { value: new THREE.Vector2(1, 0) },
    uShootT: { value: 0 },
    uShootFade: { value: 0 },
    uRipple: { value: null as THREE.Texture | null },
    uNoise: { value: null as THREE.Texture | null },
    uRippleMin: { value: RIPPLE_MIN },
    uRippleSize: { value: RIPPLE_SIZE },
    uTexel: { value: new THREE.Vector2(1 / RIPPLE_RES, 1 / RIPPLE_RES) },
    uPixel: { value: dpr },
  };

  // ——— Baked, tileable fbm noise (period of 4 units in the shaders' space) ———
  const noiseTarget = new THREE.WebGLRenderTarget(512, 512, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    depthBuffer: false,
  });
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
  const bakeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const bake = () => {
    renderer.setRenderTarget(noiseTarget);
    renderer.render(bakeScene, bakeCamera);
    renderer.setRenderTarget(null);
  };
  bake();
  u.uNoise.value = noiseTarget.texture;

  // ——— Sky: gradient, stars, milky way, a crescent moon and two cloud banks ———
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
        uniform float uTime, uCloudAlpha, uCloudGap, uMoonGlow, uStars, uMilky, uShootT, uShootFade;
        uniform vec3 uSkyTop, uSkyMid, uHorizon, uGlow, uCloudDark, uCloudLit, uMoon, uMoonDir;
        uniform vec2 uShootA, uShootDir;
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
          // Measure across the sky, not through it, so every star lands on the dome.
          f -= d * dot(f, d);
          // Never let a star shrink below a pixel or it shimmers out of existence.
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

          // Milky way: a tilted band of dust with a dark lane through it.
          vec3 axis = normalize(vec3(0.55, 0.5, 0.67));
          float band = exp(-pow(dot(d, axis), 2.0) * 26.0);
          vec2 mw = vec2(dot(d, normalize(vec3(-0.77, 0.0, 0.63))), dot(d, axis)) * 7.0;
          float dust = fbmT(mw + 3.0) * band;
          float lane = smoothstep(0.45, 0.75, fbmT(mw * 1.8 + 11.0)) * band;
          vec3 milky = mix(vec3(0.42, 0.36, 0.78), vec3(0.85, 0.8, 1.0), dust) * (dust * 0.95 - lane * 0.3);
          float horizonFade = smoothstep(0.02, 0.28, up);

          float s = stars(d, 360.0, 0.976, 0.12) * 1.5 + stars(d, 720.0, 0.958 - band * 0.07, 0.14) * 0.9 + stars(d, 160.0, 0.993, 0.08) * 2.4;
          vec3 starTint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.86, 0.78), hash13(floor(d * 300.0)));

          // Crescent moon with a soft halo and a hint of earthshine.
          float md = dot(d, uMoonDir);
          float r = 0.99985;
          float disc = smoothstep(r - 0.00003, r + 0.00003, md);
          vec3 shadowDir = normalize(uMoonDir + vec3(-0.011, 0.005, 0.002));
          float shadow = smoothstep(r - 0.00003, r + 0.00003, dot(d, shadowDir));
          vec2 maria = vec2(dot(d, vec3(1.0, 0.0, 0.0)), d.y) * 900.0;
          vec3 moon = uMoon * disc * mix(1.0, 0.07, shadow) * (0.86 + 0.14 * vnoise(maria));
          vec3 halo = uMoon * (pow(max(md, 0.0), 3000.0) * 0.35 + pow(max(md, 0.0), 120.0) * 0.12 + pow(max(md, 0.0), 10.0) * 0.05) * uMoonGlow;

          // Shooting star.
          vec2 ae = vec2(a, e);
          vec2 head = uShootA + uShootDir * uShootT;
          vec2 tail = head - uShootDir * 0.16;
          vec2 ab = head - tail;
          float k = clamp(dot(ae - tail, ab) / dot(ab, ab), 0.0, 1.0);
          float streak = smoothstep(0.0022, 0.0, distance(ae, tail + ab * k)) * k * k * uShootFade;

          vec3 night = (milky * uMilky + starTint * s * uStars + vec3(1.0, 0.95, 0.9) * streak * uStars) * horizonFade;
          color += night + halo;
          color += moon * uMoonGlow;

          // Cloud banks over the left and right shoulders, clear in the middle.
          if (e > 0.0) {
            vec2 q = vec2(a * 3.0, e * 6.0) + vec2(uTime * 0.005, 0.0);
            vec2 w = vec2(fbmT(q + vec2(0.0, uTime * 0.012)), fbmT(q + vec2(5.2, 1.3) - uTime * 0.01));
            float dens = fbmT(q + w * 1.7);
            float side = smoothstep(uCloudGap, uCloudGap + 0.16, abs(a)) * smoothstep(0.06, 0.24, e);
            float crown = smoothstep(0.42, 0.75, e) * 0.7;
            float mask = max(side, crown);
            vec2 moonQ = vec2(atan(uMoonDir.x, -uMoonDir.z) * 3.0, asin(uMoonDir.y) * 6.0) + vec2(uTime * 0.005, 0.0);
            vec2 toMoon = moonQ - q;
            // Part the clouds around the moon so it peeks through.
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

  // ——— Far shores: pine silhouettes that leave the middle of the horizon open ———
  const shore = (z: number, seed: number, haze: number, open: [number, number], scale: number) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.abs(z) * 5, 60),
      new THREE.ShaderMaterial({
        uniforms: {
          ...u,
          uSeed: { value: seed },
          uHaze: { value: haze },
          uOpen: { value: new THREE.Vector2(...open) },
          uScale: { value: scale },
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
          uniform float uSeed, uHaze, uScale, uLanternPower, uMistAmount;
          uniform vec2 uOpen;
          varying vec3 vWorld;
          ${NOISE}
          void main() {
            float x = vWorld.x;
            float open = smoothstep(uOpen.x, uOpen.y, abs(x));
            float hills = (2.0 + 4.0 * vnoise(vec2(x * 0.018, uSeed)) + 1.6 * vnoise(vec2(x * 0.06, uSeed + 3.0))) * open;
            float cw = 1.5;
            float cell = floor(x / cw);
            float lx = fract(x / cw) - 0.5 - (hash12(vec2(cell, uSeed)) - 0.5) * 0.4;
            float tall = (0.8 + hash12(vec2(cell, uSeed + 7.0)) * 2.6) * open;
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
  const shoreFar = shore(-260, 2.0, 0.52, [16, 70], 1.6);
  const shoreNear = shore(-120, 9.0, 0.22, [22, 60], 0.85);
  scene.add(shoreFar, shoreNear);

  // ——— Low mist drifting across the water ———
  const mists: THREE.Mesh[] = [];
  [-18, -42, -75, -115, -170].forEach((z, i) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.abs(z) * 4 + 80, 6 + i * 2),
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
          uniform vec3 uMist, uLantern, uLanternPos;
          uniform float uTime, uMistAmount, uLayer, uLanternPower;
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
            float warm = uLanternPower / (1.0 + pow(distance(vWorld, uLanternPos) * 0.35, 2.0));
            vec3 color = uMist + uLantern * warm * 0.35;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    );
    mesh.position.set(0, (6 + i * 2) / 2 - 0.4, z);
    mesh.renderOrder = 4 + (4 - i);
    mists.push(mesh);
    scene.add(mesh);
  });

  // ——— The boat ———
  const boat = new THREE.Group();
  const woodMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: u,
    vertexShader: /* glsl */ `
      attribute vec2 hull;
      varying vec2 vHull;
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vHull = hull;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uWood, uLantern, uLanternPos, uHorizon, uGlow, uMoon, uMoonDir, uMist;
      uniform float uLanternPower, uFlicker, uMoonGlow, uMistAmount;
      varying vec2 vHull;
      varying vec3 vNormal;
      varying vec3 vWorld;
      ${NOISE}
      void main() {
        vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
        float seam = smoothstep(0.0, 0.1, abs(fract(vHull.y * 8.0) - 0.5) * 2.0);
        float grain = vnoise(vec2(vHull.x * 46.0, vHull.y * 8.0 + 3.0)) * 0.5 + vnoise(vec2(vHull.x * 140.0, vHull.y * 40.0)) * 0.5;
        vec3 base = uWood * (0.62 + 0.38 * seam) * (0.8 + 0.4 * grain);
        float trim = smoothstep(0.05, 0.0, min(vHull.y, 1.0 - vHull.y));
        base = mix(base, uWood * 1.9 + 0.02, trim * step(0.001, vHull.y + vHull.x));
        if (!gl_FrontFacing) base *= 0.55;
        vec3 toL = uLanternPos - vWorld;
        float d = length(toL);
        float diffuse = max(dot(n, toL / d), 0.0) * 0.85 + 0.15;
        vec3 color = base * (uHorizon * 0.35 + uGlow * 0.12);
        color += base * uLantern * uLanternPower * uFlicker * diffuse * 3.2 / (1.0 + d * d * 1.4);
        vec3 v = normalize(cameraPosition - vWorld);
        float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * max(dot(n, uMoonDir) * 0.5 + 0.5, 0.0);
        color += uMoon * rim * 0.12 * uMoonGlow;
        color = mix(color, uMist, uMistAmount * 0.08);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  // Hull: a lofted U-section that narrows to a stem at each end and whose
  // sheer line rises towards bow and stern.
  const length = 4.3;
  const beam = 1.35;
  const draft = 0.62;
  const sheer = (t: number) => 0.32 + 0.2 * t * t;
  const hullGeometry = new THREE.BufferGeometry();
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
    hullGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    hullGeometry.setAttribute('hull', new THREE.Float32BufferAttribute(hullUv, 2));
    hullGeometry.setIndex(index);
    hullGeometry.computeVertexNormals();
  }
  boat.add(new THREE.Mesh(hullGeometry, woodMaterial));
  // Thwarts.
  for (const t of [-0.42, 0.05, 0.48]) {
    const half = (beam / 2) * Math.pow(1 - t * t, 0.62);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, half * 2 * 0.94), woodMaterial);
    seat.position.set((t * length) / 2, sheer(t) - 0.17, 0);
    boat.add(seat);
  }
  // An oar resting across the boat, its blade dipped in the water.
  const oar = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.8, 8), woodMaterial);
  shaft.rotation.z = Math.PI / 2;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 0.15), woodMaterial);
  blade.position.x = -1.55;
  oar.add(shaft, blade);
  oar.position.set(-0.35, 0.34, 0.5);
  oar.rotation.set(0.1, -0.5, 0.17);
  boat.add(oar);

  // Lantern on a crooked post at the stern.
  const metal = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLantern, uLanternPos, uHorizon;
      uniform float uLanternPower, uFlicker;
      varying vec3 vNormal;
      varying vec3 vWorld;
      void main() {
        vec3 toL = uLanternPos - vWorld;
        float d = length(toL);
        float lit = max(dot(normalize(vNormal), toL / max(d, 0.001)), 0.0);
        vec3 color = vec3(0.025, 0.02, 0.035) + uHorizon * 0.05 + uLantern * uLanternPower * uFlicker * lit * 0.6 / (1.0 + d * d * 8.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const postX = (0.66 * length) / 2;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.15, 8), metal);
  post.position.set(postX, sheer(0.66) + 0.42, 0);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), metal);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(postX - 0.19, sheer(0.66) + 0.98, 0);
  const lantern = new THREE.Group();
  lantern.position.set(postX - 0.36, sheer(0.66) + 0.7, 0);
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
        uniform vec3 uLantern;
        uniform float uLanternPower, uFlicker;
        varying vec2 vUv;
        void main() {
          float bars = smoothstep(0.0, 0.05, abs(fract(vUv.x * 6.0) - 0.5) * 2.0);
          float core = exp(-pow((vUv.y - 0.45) * 3.0, 2.0));
          vec3 color = uLantern * (0.9 + core * 1.6) * uLanternPower * uFlicker * mix(0.15, 1.0, bars);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  lantern.add(cap, base, hook, glass);
  const glowMaterial = (core: number, spread: number, gain: number) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        ...u,
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
        uniform vec3 uLantern;
        uniform float uLanternPower, uFlicker, uCore, uSpread, uGain;
        varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float glow = exp(-r * uCore) + exp(-r * uSpread) * 0.25;
          glow *= smoothstep(1.0, 0.6, r);
          gl_FragColor = vec4(uLantern * glow * uLanternPower * uFlicker * uGain, 1.0);
        }
      `,
    });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), glowMaterial(12, 3.5, 0.45));
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), glowMaterial(6, 2.2, 0.05));
  halo.renderOrder = 10;
  haze.renderOrder = 9;
  scene.add(halo, haze);
  boat.add(post, arm, lantern);
  boat.position.set(0.5, -0.06, -6.5);
  boat.rotation.y = -0.34;
  scene.add(boat);
  const lanternWorld = new THREE.Vector3();

  // ——— Reeds framing the lower corners ———
  const reedCount = lite ? 700 : 1500;
  const reedBlade = new THREE.InstancedBufferGeometry();
  {
    const positions: number[] = [];
    const index: number[] = [];
    const segments = 7;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      positions.push(-0.5, t, 0, 0.5, t, 0);
    }
    positions.push(0, 1, 0);
    for (let i = 0; i < segments - 1; i++) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    index.push((segments - 1) * 2, (segments - 1) * 2 + 1, segments * 2);
    reedBlade.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    reedBlade.setIndex(index);
  }
  const random = mulberry(11);
  const reedOffsets = new Float32Array(reedCount * 3);
  const reedParams = new Float32Array(reedCount * 4);
  const spread = compact ? 0.55 : 1;
  for (let i = 0; i < reedCount; i++) {
    const right = i % 2 === 0;
    // Each side is a few clumps rather than an even lawn.
    const clump = Math.floor(random() * 4);
    const cx = (right ? 3.2 + clump * 0.75 : -3.0 - clump * 0.8) * spread;
    const cz = 4.2 + clump * 1.1 + (right ? 0.4 : 0);
    const r = Math.pow(random(), 0.7) * 0.9;
    const a = random() * Math.PI * 2;
    reedOffsets.set([cx + Math.cos(a) * r * spread, -0.05, cz + Math.sin(a) * r], i * 3);
    reedParams.set(
      [
        (0.55 + random() * 1.15) * (1.1 - r * 0.4),
        0.03 + random() * 0.035,
        random() * Math.PI * 2,
        random(),
      ],
      i * 4,
    );
  }
  reedBlade.setAttribute('offset', new THREE.InstancedBufferAttribute(reedOffsets, 3));
  reedBlade.setAttribute('params', new THREE.InstancedBufferAttribute(reedParams, 4));
  reedBlade.instanceCount = reedCount;
  const reeds = new THREE.Mesh(
    reedBlade,
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: u,
      vertexShader: /* glsl */ `
        attribute vec3 offset;
        attribute vec4 params;
        uniform float uTime;
        varying float vT;
        varying float vSeed;
        varying vec3 vWorld;
        ${NOISE}
        void main() {
          float t = position.y;
          float h = params.x;
          float seed = params.w;
          float gust = vnoise(offset.xz * 0.4 + uTime * vec2(0.3, 0.1));
          vec2 bend = vec2(0.22 + gust * 0.35, 0.05) + vec2(sin(uTime * 1.3 + seed * 6.28), cos(uTime * 1.1 + seed * 9.0)) * 0.06;
          bend.x *= sign(offset.x) * 0.6 + 0.4;
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
        uniform vec3 uReed, uMoon, uLantern, uLanternPos, uGlow;
        uniform float uMoonGlow, uLanternPower;
        varying float vT;
        varying float vSeed;
        varying vec3 vWorld;
        void main() {
          vec3 color = uReed * (0.7 + vSeed * 0.6);
          color += uGlow * 0.05 * vT;
          color += uMoon * pow(vT, 3.0) * 0.05 * uMoonGlow;
          color += uLantern * uLanternPower * 0.04 * vT / (1.0 + pow(distance(vWorld, uLanternPos) * 0.15, 2.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  reeds.frustumCulled = false;
  scene.add(reeds);

  // ——— Cold dust in the air, and moths circling the lantern ———
  const dustCount = lite ? 220 : 480;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPositions.set([(random() - 0.5) * 34, 0.2 + random() * 7, -28 + random() * 36], i * 3);
    dustSeeds[i] = random();
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('seed', new THREE.BufferAttribute(dustSeeds, 1));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: u,
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime, uPixel;
        varying float vBlink;
        void main() {
          vec3 p = position;
          float t = uTime * (0.05 + seed * 0.06);
          p += vec3(sin(t * 2.0 + seed * 40.0) * 1.2, sin(t * 1.3 + seed * 13.0) * 0.6, cos(t * 1.7 + seed * 21.0) * 1.2);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vBlink = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.6 + seed * 2.0) + seed * 60.0), 4.0);
          gl_PointSize = (1.4 + seed * 2.2) * uPixel * (14.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uDust;
        varying float vBlink;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          float glow = exp(-r * r * 28.0);
          gl_FragColor = vec4(vec3(0.8, 0.85, 1.0) * glow * vBlink * uDust * 0.7, 1.0);
        }
      `,
    }),
  );
  dust.frustumCulled = false;
  dust.renderOrder = 12;
  dust.layers.set(1);
  scene.add(dust);

  const mothCount = 14;
  const mothGeometry = new THREE.BufferGeometry();
  mothGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(mothCount * 3), 3),
  );
  mothGeometry.setAttribute(
    'seed',
    new THREE.BufferAttribute(
      Float32Array.from({ length: mothCount }, () => random()),
      1,
    ),
  );
  const moths = new THREE.Points(
    mothGeometry,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: u,
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime, uPixel;
        uniform vec3 uLanternPos;
        varying float vBlink;
        void main() {
          float t = uTime * (0.9 + seed * 1.4) + seed * 30.0;
          vec3 p = uLanternPos + vec3(sin(t) * (0.25 + seed * 0.35), sin(t * 1.7 + seed * 5.0) * 0.3 + 0.1, cos(t * 1.2) * (0.25 + seed * 0.35));
          vec4 mv = viewMatrix * vec4(p, 1.0);
          vBlink = 0.5 + 0.5 * sin(uTime * 9.0 + seed * 40.0);
          gl_PointSize = (1.6 + seed) * uPixel * (14.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uLantern;
        uniform float uLanternPower;
        varying float vBlink;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(uLantern * exp(-r * r * 30.0) * (0.4 + vBlink * 0.6) * uLanternPower, 1.0);
        }
      `,
    }),
  );
  moths.frustumCulled = false;
  moths.renderOrder = 12;
  moths.layers.set(1);
  scene.add(moths);

  // ——— Interactive wave field (Hugo Elias), ping-ponged on the GPU ———
  const rippleOptions = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  } as const;
  let rippleRead = new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, rippleOptions);
  let rippleWrite = new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, rippleOptions);
  const drops = Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0.01, 0));
  const simUniforms = {
    uPrev: { value: rippleRead.texture as THREE.Texture },
    uTexel: u.uTexel,
    uFrom: { value: new THREE.Vector2(-1, -1) },
    uTo: { value: new THREE.Vector2(-1, -1) },
    uTrail: { value: 0 },
    uDrops: { value: drops },
  };
  const simScene = new THREE.Scene();
  const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  simScene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: simUniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uPrev;
          uniform vec2 uTexel, uFrom, uTo;
          uniform float uTrail;
          uniform vec4 uDrops[4];
          varying vec2 vUv;
          void main() {
            vec4 c = texture2D(uPrev, vUv);
            float avg = (
              texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r +
              texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r +
              texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r +
              texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
            float h = (avg * 2.0 - c.g) * 0.986;
            vec2 ab = uTo - uFrom;
            float k = clamp(dot(vUv - uFrom, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
            float d = distance(vUv, uFrom + ab * k);
            h -= uTrail * smoothstep(0.012, 0.0, d);
            for (int i = 0; i < 4; i++) {
              float dd = distance(vUv, uDrops[i].xy);
              h += uDrops[i].w * (0.5 + 0.5 * cos(3.14159 * clamp(dd / uDrops[i].z, 0.0, 1.0))) * step(dd, uDrops[i].z);
            }
            float edge = smoothstep(0.0, 0.03, min(min(vUv.x, vUv.y), min(1.0 - vUv.x, 1.0 - vUv.y)));
            gl_FragColor = vec4(h * edge, c.r * edge, 0.0, 1.0);
          }
        `,
      }),
    ),
  );
  const calm = () => {
    for (const target of [rippleRead, rippleWrite]) {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
    }
    renderer.setRenderTarget(null);
    u.uRipple.value = rippleRead.texture;
  };
  calm();

  // ——— Water: a shallow, pebbled bed under a reflective surface ———
  // Desktop mirrors the real scene with a second render. Phones skip that
  // render and paint the reflection from the sky's own recipe instead: sky
  // gradient, cloud banks, the shoreline and a dark hull, all in one pass.
  const waterFragment = (fake: boolean) => /* glsl */ `
        uniform sampler2D uRipple;
        ${fake ? '' : 'uniform sampler2D tDiffuse;\n        varying vec4 vReflect;'}
        uniform vec2 uRippleMin, uRippleSize, uTexel;
        uniform vec3 uDeep, uBedA, uBedB, uLantern, uLanternPos, uMoon, uMoonDir, uHorizon, uMist;
        uniform float uTime, uBedLight, uCaustics, uLanternPower, uFlicker, uMoonGlow, uMistAmount;
        varying vec3 vWorld;
        ${NOISE}
        ${SURFACE}
        ${fake ? FAKE_REFLECTION : ''}
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

          vec2 ruv = (p - uRippleMin) / uRippleSize;
          if (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) {
            vec2 rg = vec2(
              texture2D(uRipple, ruv + vec2(uTexel.x, 0.0)).r - texture2D(uRipple, ruv - vec2(uTexel.x, 0.0)).r,
              texture2D(uRipple, ruv + vec2(0.0, uTexel.y)).r - texture2D(uRipple, ruv - vec2(0.0, uTexel.y)).r);
            grad += rg * 9.0;
          }
          vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
          vec3 v = normalize(cameraPosition - vWorld);

          ${
            fake
              ? 'vec3 reflection = fakeReflection(reflect(-v, n), p + n.xz * 0.4);'
              : `vec4 uv = vReflect;
          uv.xy += n.xz * vec2(0.9, 1.4) * uv.w * 0.06;
          vec3 reflection = texture2DProj(tDiffuse, uv).rgb;`
          }

          // Looking down through clear, shallow water onto the stones.
          float depth = mix(0.45, 5.0, smoothstep(3.0, 40.0, dist));
          vec2 bedP = p - v.xz / max(v.y, 0.12) * depth * 0.6 + n.xz * 0.35;
          // Past ~40 units the bed is lost under the reflection, so skip it.
          vec3 body = uDeep;
          if (dist < 42.0) {
            vec3 stones = mix(bed(bedP * 3.4), bed(bedP * 7.0 + 19.0), 0.35);
            float caustic = pow(1.0 - abs(vnoise(bedP * 1.6 + uTime * 0.35) - vnoise(bedP * 1.6 - uTime * 0.28 + 7.0)), 9.0);
            float toLantern = distance(bedP, uLanternPos.xz);
            vec3 bedLight = vec3(uBedLight) + uLantern * uLanternPower * uFlicker * 1.6 / (1.0 + toLantern * toLantern * 0.12);
            stones *= bedLight + caustic * uCaustics * (0.6 + bedLight);
            body = mix(mix(stones, uDeep, 1.0 - exp(-depth * 0.75)), uDeep, smoothstep(30.0, 42.0, dist));
          }

          float cosT = max(dot(n, v), 0.0);
          float fresnel = 0.03 + 0.97 * pow(1.0 - cosT, 5.0);
          fresnel = clamp(fresnel * 1.15 + smoothstep(18.0, 90.0, dist) * 0.25, 0.0, 1.0);
          vec3 color = mix(body, reflection, fresnel);

          // Lantern and moon glitter: sharp highlights broken by the surface.
          vec3 r = reflect(-v, n);
          vec3 toL = uLanternPos - vWorld;
          float ld = length(toL);
          float glint = pow(max(dot(r, toL / ld), 0.0), 260.0) * 1.1 + pow(max(dot(r, toL / ld), 0.0), 18.0) * 0.04;
          color += uLantern * uLanternPower * uFlicker * glint;
          color += uLantern * uLanternPower * uFlicker * 0.07 / (1.0 + ld * ld * 0.35);
          float moonGlint = pow(max(dot(r, uMoonDir), 0.0), 1600.0) * 1.6 + pow(max(dot(r, uMoonDir), 0.0), 80.0) * 0.025;
          color += uMoon * moonGlint * uMoonGlow;

          color = mix(color, uMist, smoothstep(40.0, 400.0, dist) * uMistAmount * 0.25);
          gl_FragColor = vec4(color, 1.0);
        }
`;
  const waterGeometry = new THREE.PlaneGeometry(4000, 4000);
  const water: THREE.Mesh = compact
    ? new THREE.Mesh(
        waterGeometry,
        new THREE.ShaderMaterial({
          uniforms: u,
          vertexShader: /* glsl */ `
            varying vec3 vWorld;
            void main() {
              vec4 world = modelMatrix * vec4(position, 1.0);
              vWorld = world.xyz;
              gl_Position = projectionMatrix * viewMatrix * world;
            }
          `,
          fragmentShader: waterFragment(true),
        }),
      )
    : new Reflector(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        clipBias: 0.003,
        // The ripples smear the reflection anyway, so it needs no anti-aliasing.
        multisample: 0,
        shader: {
          name: 'LakeWater',
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
          fragmentShader: waterFragment(false),
        },
      });
  water.rotation.x = -Math.PI / 2;
  if (water instanceof Reflector)
    Object.assign((water.material as THREE.ShaderMaterial).uniforms, u);
  scene.add(water);

  // ——— Post: bloom for the lights, then a gentle grade with grain and vignette ———
  const composerTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    // A Retina canvas is already supersampled; MSAA there only costs bandwidth.
    samples: lite || screenRatio >= 2 ? 0 : 4,
  });
  const composer = new EffectComposer(renderer, composerTarget);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), p.bloom, 0.55, 0.78);
  // The glow is a wide blur, so a quarter of the pixels look the same.
  const setBloomSize = bloom.setSize.bind(bloom);
  bloom.setSize = (w: number, h: number) => setBloomSize(Math.round(w / 2), Math.round(h / 2));
  // Phones and lighter machines skip the glow passes; the lantern's own halo
  // still carries the light.
  bloom.enabled = !lite;
  composer.addPass(bloom);
  const grade = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: u.uTime,
      uResolution: { value: new THREE.Vector2(1, 1) },
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
      uniform float uTime;
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
        color *= mix(0.68, 1.0, vignette);
        color += (hash(vUv * uResolution + fract(uTime * 7.0) * 91.0) - 0.5) * 0.022;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  grade.uniforms.uTime = u.uTime;
  composer.addPass(grade);

  // ——— Pointer ———
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const look = new THREE.Vector2();
  const lookGoal = new THREE.Vector2();
  const surface = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let pointerUv: THREE.Vector2 | null = null;
  let lastUv: THREE.Vector2 | null = null;
  let pointerFresh = 0;
  let pressed: THREE.Vector2 | null = null;

  const toRipple = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const point = raycaster.ray.intersectPlane(surface, new THREE.Vector3());
    if (!point) return null;
    const uv = new THREE.Vector2(
      (point.x - RIPPLE_MIN.x) / RIPPLE_SIZE.x,
      (point.z - RIPPLE_MIN.y) / RIPPLE_SIZE.y,
    );
    return uv.x > 0 && uv.x < 1 && uv.y > 0 && uv.y < 1 ? uv : null;
  };

  // ——— Size ———
  let width = 0;
  let height = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    const portrait = camera.aspect < 0.8;
    camera.fov = portrait ? 62 : camera.aspect < 1.2 ? 50 : 40;
    camera.updateProjectionMatrix();
    // Place the horizon a little below the middle, lower on tall screens.
    const horizon = portrait ? 0.64 : 0.6;
    pitch = Math.atan((horizon - 0.5) * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const halfWidth = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    u.uCloudGap.value = Math.min(0.24, halfWidth * 0.42);
    const moonAzimuth = Math.min(0.36, halfWidth * 0.66);
    const moonElevation = portrait ? 0.4 : 0.27;
    u.uMoonDir.value
      .set(
        Math.sin(moonAzimuth) * Math.cos(moonElevation),
        Math.sin(moonElevation),
        -Math.cos(moonAzimuth) * Math.cos(moonElevation),
      )
      .normalize();
    const reflectionScale = lite ? 0.33 : 0.4;
    if (water instanceof Reflector)
      water
        .getRenderTarget()
        .setSize(
          Math.round(width * dpr * reflectionScale),
          Math.round(height * dpr * reflectionScale),
        );
    (grade.uniforms.uResolution.value as THREE.Vector2).set(width * dpr, height * dpr);
    onLayout(horizon);
    if (!running) render(0);
  };
  const observer = new ResizeObserver(resize);

  // ——— Loop ———
  let running = false;
  let compiled = false;
  let lost = false;
  let wanted = false;
  let frame = 0;
  let last = performance.now();
  let clock = 0;
  let ready = false;
  let slowFrames = 0;
  let sampled = 0;
  let nextFish = 3;
  let nextShoot = 6;
  let shoot = -1;

  const simulate = (dt: number) => {
    // The boat's gentle bob sends out slow rings from each end.
    const boatUv = new THREE.Vector2(
      (boat.position.x - RIPPLE_MIN.x) / RIPPLE_SIZE.x,
      (boat.position.z - RIPPLE_MIN.y) / RIPPLE_SIZE.y,
    );
    drops[0].set(boatUv.x + 0.035, boatUv.y + 0.012, 0.018, Math.sin(clock * 1.6) * 0.0035);
    drops[1].set(boatUv.x - 0.035, boatUv.y - 0.012, 0.018, Math.sin(clock * 1.6 + 1.2) * 0.0035);
    drops[2].w = 0;
    drops[3].w = 0;
    nextFish -= dt;
    if (nextFish <= 0) {
      nextFish = 2.5 + Math.random() * 4;
      drops[2].set(0.15 + Math.random() * 0.7, 0.25 + Math.random() * 0.6, 0.012, 0.22);
    }
    if (pressed) {
      drops[3].set(pressed.x, pressed.y, 0.03, -0.9);
      pressed = null;
    }
    if (pointerUv && pointerFresh > 0) {
      simUniforms.uFrom.value.copy(lastUv ?? pointerUv);
      simUniforms.uTo.value.copy(pointerUv);
      const speed = lastUv ? Math.min(lastUv.distanceTo(pointerUv) * 60, 1) : 0;
      simUniforms.uTrail.value = 0.08 + speed * 0.25;
    } else simUniforms.uTrail.value = 0;
    lastUv = pointerUv ? pointerUv.clone() : null;
    pointerFresh = Math.max(0, pointerFresh - dt);

    // Two wave steps per 60 Hz frame, so ripples spread at the same speed
    // whatever rate the lake is drawn at.
    const steps = Math.min(Math.max(Math.round(dt * 120), 1), 4);
    for (let step = 0; step < steps; step++) {
      simUniforms.uPrev.value = rippleRead.texture;
      renderer.setRenderTarget(rippleWrite);
      renderer.render(simScene, simCamera);
      [rippleRead, rippleWrite] = [rippleWrite, rippleRead];
      if (step === 0) {
        simUniforms.uTrail.value = 0;
        for (const drop of drops) drop.w = 0;
      }
    }
    renderer.setRenderTarget(null);
    u.uRipple.value = rippleRead.texture;
  };

  const render = (dt: number) => {
    if (!compiled || lost) return;
    if (dt > 0) simulate(dt);

    look.lerp(lookGoal, 1 - Math.exp(-dt * 2));
    camera.position.set(eye.x + look.x * 0.35, eye.y, eye.z);
    camera.rotation.set(pitch, -look.x * 0.012, 0);

    boat.position.y = -0.06 + Math.sin(clock * 0.8) * 0.03;
    boat.rotation.z = Math.sin(clock * 0.62) * 0.022;
    boat.rotation.x = Math.sin(clock * 0.71 + 1.0) * 0.016;
    boat.updateMatrixWorld();
    u.uBoat.value.set(boat.position.x, boat.position.z, boat.rotation.y);
    lantern.rotation.z = Math.sin(clock * 1.1) * 0.06;
    lantern.getWorldPosition(lanternWorld);
    u.uLanternPos.value.copy(lanternWorld);
    u.uFlicker.value =
      0.9 +
      0.06 * Math.sin(clock * 11.3) +
      0.04 * Math.sin(clock * 23.7 + 1.3) +
      0.03 * Math.sin(clock * 5.1);
    halo.position.copy(lanternWorld);
    haze.position.copy(lanternWorld);
    halo.quaternion.copy(camera.quaternion);
    haze.quaternion.copy(camera.quaternion);

    // An occasional shooting star across the upper sky.
    if (shoot < 0) {
      nextShoot -= dt;
      if (nextShoot <= 0) {
        shoot = 0;
        const side = Math.random() < 0.5 ? -1 : 1;
        u.uShootA.value.set(side * (0.1 + Math.random() * 0.3), 0.32 + Math.random() * 0.14);
        u.uShootDir.value.set(-side * 0.85, -0.42).normalize();
      }
    } else {
      shoot += dt;
      const life = 1.1;
      u.uShootT.value = shoot * 0.42;
      u.uShootFade.value = Math.sin(Math.min(shoot / life, 1) * Math.PI);
      if (shoot > life) {
        shoot = -1;
        u.uShootFade.value = 0;
        nextShoot = 7 + Math.random() * 10;
      }
    }

    composer.render(dt);
    if (!ready) {
      ready = true;
      onReady();
    }
  };

  // Phones draw the lake at 30 fps: water and mist move slowly enough that it
  // reads as smooth, and the freed time keeps scrolling and touch responsive.
  const budget = lite ? 1 / 30 : 1 / 60;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (now - last < budget * 1000 - 4) return;
    const dt = Math.min((now - last) / 1000, 0.066);
    last = now;
    clock += dt;
    u.uTime.value = clock;
    render(dt);
    // When most recent frames miss the budget, step resolution down.
    if (dt > budget * 1.2) slowFrames++;
    if (++sampled >= 90) {
      if (slowFrames > 50 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        u.uPixel.value = dpr;
        renderer.setPixelRatio(dpr);
        composer.setPixelRatio(dpr);
        resize();
      }
      sampled = 0;
      slowFrames = 0;
    }
  };

  const start = () => {
    if (running || still || lost) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  if (still) {
    clock = 20;
    u.uTime.value = clock;
  }
  observer.observe(canvas);
  resize();

  // Build every shader off the main thread where the driver allows it, so the
  // page never stalls while the scene warms up; draw only once all are ready.
  renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .then(() => {
      compiled = true;
      if (wanted && !document.hidden) start();
      else render(0);
    });

  // The browser may take the GPU back (sleep, memory pressure, driver reset).
  // Show the poster meanwhile, then rebuild what lived only on the GPU.
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stop();
    onLost(true);
  };
  const contextRestored = () => {
    lost = false;
    bake();
    calm();
    onLost(false);
    if (wanted && !document.hidden) start();
    else render(0);
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);

  return {
    setActive(active) {
      wanted = active;
      if (active && !document.hidden && compiled) start();
      else stop();
    },
    pointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      lookGoal.set(((clientX - rect.left) / rect.width) * 2 - 1, 0);
      pointerUv = toRipple(clientX, clientY);
      if (!pointerUv) lastUv = null;
      pointerFresh = 0.1;
    },
    press(clientX, clientY) {
      pressed = toRipple(clientX, clientY);
    },
    leave() {
      pointerUv = null;
      lastUv = null;
      lookGoal.set(0, 0);
    },
    dispose() {
      stop();
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      const release = (root: THREE.Object3D) =>
        root.traverse((object) => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          (mesh.material as THREE.Material | undefined)?.dispose();
        });
      release(scene);
      release(simScene);
      release(bakeScene);
      noiseTarget.dispose();
      if (water instanceof Reflector) water.dispose();
      rippleRead.dispose();
      rippleWrite.dispose();
      composer.dispose();
      composerTarget.dispose();
      bloom.dispose();
      renderer.dispose();
    },
  };
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

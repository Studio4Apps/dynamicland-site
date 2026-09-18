'use client';

import { useEffect, useRef } from 'react';

const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 resolution;
  uniform vec2 uvOrigin;
  uniform vec2 uvX;
  uniform vec2 uvY;
  uniform vec2 pointer;
  uniform float pressed;
  uniform sampler2D scene;

  float roundedBoxSdf(vec2 point, vec2 halfSize, float radius) {
    vec2 q = abs(point) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  vec2 sceneCoordinate(vec2 local) {
    return uvOrigin + (uvX * local.x) + (uvY * local.y);
  }

  void main() {
    vec2 local = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);
    vec2 pixel = (local - 0.5) * resolution;
    float radius = (resolution.y * 0.5) - 1.0;
    float distanceToEdge = roundedBoxSdf(pixel, (resolution * 0.5) - 1.0, radius);
    float inside = clamp(-distanceToEdge, 0.0, radius);
    float rim = 1.0 - smoothstep(0.0, 13.0, inside);
    float body = smoothstep(0.0, min(38.0, radius), inside);

    vec2 axis = local - 0.5;
    vec2 direction = normalize(vec2(axis.x * (resolution.x / resolution.y), axis.y) + vec2(0.0001));
    vec2 localShift = axis * (0.026 + pressed * 0.012) * body;
    localShift += direction * (0.010 + pressed * 0.006) * rim;

    vec2 refracted = sceneCoordinate(local - localShift);
    vec2 chromatic = sceneCoordinate(local + direction * 0.0026) - sceneCoordinate(local);
    chromatic *= rim * (1.0 + pressed * 0.7);

    vec4 center = texture2D(scene, refracted);
    float red = texture2D(scene, refracted + chromatic).r;
    float blue = texture2D(scene, refracted - chromatic).b;
    vec3 color = vec3(red, center.g, blue);

    float pointerLight = exp(-distance(local, pointer) * 7.0);
    float directional = pow(max(dot(direction, normalize(vec2(-0.72, -0.7))), 0.0), 5.0);
    float highlight = rim * (0.08 + directional * 0.34 + pointerLight * 0.2);
    float lowerShade = rim * pow(max(dot(direction, normalize(vec2(0.65, 0.76))), 0.0), 4.0);
    color += vec3(1.0, 0.95, 1.0) * highlight;
    color += vec3(0.22, 0.04, 0.34) * lowerShade * 0.16;
    color = mix(color, color * vec3(1.04, 0.98, 1.08), 0.18 + rim * 0.22);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function makeShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function LiquidGlassLens() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = canvas?.parentElement;
    const image = document.querySelector<HTMLImageElement>('.hero-landscape-image');
    const landscape = document.querySelector<HTMLElement>('.hero-landscape');
    if (!canvas || !surface || !image || !landscape) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const vertex = makeShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = makeShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'resolution'),
      uvOrigin: gl.getUniformLocation(program, 'uvOrigin'),
      uvX: gl.getUniformLocation(program, 'uvX'),
      uvY: gl.getUniformLocation(program, 'uvY'),
      pointer: gl.getUniformLocation(program, 'pointer'),
      pressed: gl.getUniformLocation(program, 'pressed'),
      scene: gl.getUniformLocation(program, 'scene'),
    };
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let pointerX = 0.22;
    let pointerY = 0.1;
    let isPressed = 0;
    let frame = 0;
    let textureReady = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const uploadTexture = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
      surface.dataset.lensReady = 'true';
      scheduleDraw();
    };

    const imageUv = (viewportX: number, viewportY: number) => {
      const heroRect = landscape.getBoundingClientRect();
      const width = landscape.clientWidth;
      const height = landscape.clientHeight;
      const heroDocumentLeft = heroRect.left + window.scrollX;
      const heroDocumentTop = heroRect.top + window.scrollY;
      const localX = viewportX - heroDocumentLeft;
      const localY = viewportY - heroDocumentTop;

      const naturalWidth = image.naturalWidth || 1536;
      const naturalHeight = image.naturalHeight || 1024;
      const scale = Math.max(width / naturalWidth, height / naturalHeight);
      const renderedWidth = naturalWidth * scale;
      const renderedHeight = naturalHeight * scale;
      const offsetX = (width - renderedWidth) * 0.5;
      const offsetY = (height - renderedHeight) * 0.6;
      return [(localX - offsetX) / renderedWidth, (localY - offsetY) / renderedHeight] as const;
    };

    const draw = () => {
      frame = 0;
      if (!textureReady) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * ratio);
      const height = Math.round(rect.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const origin = imageUv(rect.left, rect.top);
      const right = imageUv(rect.right, rect.top);
      const bottom = imageUv(rect.left, rect.bottom);
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform2f(uniforms.uvOrigin, origin[0], origin[1]);
      gl.uniform2f(uniforms.uvX, right[0] - origin[0], right[1] - origin[1]);
      gl.uniform2f(uniforms.uvY, bottom[0] - origin[0], bottom[1] - origin[1]);
      gl.uniform2f(uniforms.pointer, pointerX, pointerY);
      gl.uniform1f(uniforms.pressed, isPressed);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.scene, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const scheduleDraw = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      const rect = surface.getBoundingClientRect();
      pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      scheduleDraw();
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0 || reducedMotion.matches) return;
      isPressed = 1;
      surface.dataset.glassActive = 'true';
      move(event);
    };
    const release = () => {
      isPressed = 0;
      delete surface.dataset.glassActive;
      scheduleDraw();
    };
    const leave = () => {
      pointerX = 0.22;
      pointerY = 0.1;
      release();
    };

    const observer = new ResizeObserver(scheduleDraw);
    observer.observe(surface);
    window.addEventListener('resize', scheduleDraw, { passive: true });
    surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerdown', press, { passive: true });
    surface.addEventListener('pointerleave', leave, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });

    if (image.complete && image.naturalWidth) uploadTexture();
    else image.addEventListener('load', uploadTexture, { once: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      image.removeEventListener('load', uploadTexture);
      window.removeEventListener('resize', scheduleDraw);
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerdown', press);
      surface.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      delete surface.dataset.lensReady;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} className="nav-glass-lens" aria-hidden="true" />;
}

export function LiquidGooFilter() {
  return (
    <svg className="liquid-filter-defs" aria-hidden="true">
      <defs>
        <filter id="dynamicland-goo" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix
            in="blur"
            result="goo"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -9"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

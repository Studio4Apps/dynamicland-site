export interface GlassOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  refraction?: number;
  bezel?: number;
  curvature?: number;
  ior?: number;
  chroma?: number;
  blur?: number;
  specular?: number;
  specularWidth?: number;
  lightAngle?: number;
  mapScale?: number;
  hidden?: boolean;
  fit?: boolean;
  clip?: boolean;
  sync?: boolean;
  mode?: 'content' | 'backdrop';
  fallback?: string;
}

export interface GlassController {
  update(options: GlassOptions): void;
  flush(): void;
  readonly params: GlassOptions;
  readonly filterId: string;
  destroy(): void;
}

export function createGlass(target: HTMLElement, options?: GlassOptions): GlassController;

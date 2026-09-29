import { createGlass, type GlassController } from '@/lib/vendor/liquid-glass/liquid-glass.js';

// The owner's liquidglass.dev playground settings. Frost and Highlight are
// named blur and specular in the reference engine's public API.
export const MENU_GLASS = Object.freeze({
  radius: 19,
  refraction: 40,
  bezel: 0.85,
  curvature: 4,
  chroma: 0,
  blur: 0.5,
  specular: 0.25,
});

/** Keep optics on the animated surface, never on scrolling page content. */
export function createMobileMenuGlass(root: HTMLDetailsElement, header: HTMLElement) {
  if (typeof ResizeObserver !== 'function' || !document.createElement('canvas').getContext('2d'))
    return () => {};

  const trigger = root.querySelector<HTMLElement>('[data-menu-trigger-glass]')!;
  const surface = root.querySelector<HTMLElement>('[data-menu-glass]')!;
  const compact = matchMedia('(max-width: 760px)');
  const opaque = matchMedia('(prefers-reduced-transparency: reduce)');
  const abort = new AbortController();
  let controller: GlassController | undefined;
  let target: HTMLElement | undefined;
  let frame = 0;
  let destroyed = false;

  const clear = () => {
    controller?.destroy();
    controller = undefined;
    target = undefined;
    delete root.dataset.liquidGlass;
  };
  const render = () => {
    frame = 0;
    if (destroyed) return;
    if (!compact.matches || opaque.matches || document.hidden) {
      clear();
      return;
    }
    const lens = root.open ? surface : trigger;
    const rect = lens.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      clear();
      return;
    }
    const corner = getComputedStyle(lens).borderTopLeftRadius;
    const radius = Math.min(
      corner.endsWith('%') ? (rect.width * parseFloat(corner)) / 100 : parseFloat(corner),
      rect.width / 2,
      rect.height / 2,
    );
    if (target !== lens) {
      clear();
      target = lens;
      controller = createGlass(lens, {
        ...MENU_GLASS,
        radius,
        mode: 'backdrop',
        fit: true,
        sync: true,
        mapScale: 1,
        // WebKit/Firefox do not support SVG backdrop filters. Keep their
        // native frost attached to the same surface, without filtering sections.
        fallback: 'blur(0.5px)',
      });
    } else controller?.update({ radius });
    root.dataset.liquidGlass = 'ready';
    if (root.dataset.menuState === 'opening' || root.dataset.menuState === 'closing') schedule();
  };
  const schedule = () => {
    if (!destroyed && !frame) frame = requestAnimationFrame(render);
  };
  const changes = new MutationObserver(schedule);
  changes.observe(root, { attributes: true, attributeFilter: ['data-menu-state', 'open'] });
  const size = new ResizeObserver(schedule);
  size.observe(header);
  size.observe(surface);
  window.addEventListener('resize', schedule, { passive: true, signal: abort.signal });
  document.addEventListener('visibilitychange', schedule, { signal: abort.signal });
  compact.addEventListener('change', schedule, { signal: abort.signal });
  opaque.addEventListener('change', schedule, { signal: abort.signal });
  schedule();

  return () => {
    destroyed = true;
    if (frame) cancelAnimationFrame(frame);
    abort.abort();
    changes.disconnect();
    size.disconnect();
    clear();
  };
}

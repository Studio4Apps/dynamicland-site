'use client';

import { useEffect, type RefObject } from 'react';

/** Keep the original renderer bounded to the navigation, with live HTML controls. */
export function useLiquidNavigation(headerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = headerRef.current;
    const nav = header?.querySelector<HTMLElement>('.product-nav');
    if (!header || !nav) return;
    const reduced = matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)');
    let disposed = false;
    let release = () => {};

    async function start() {
      const { LiquidGlass, DEFAULTS } = await import('@ybouane/liquidglass');
      if (disposed || reduced.matches || !nav || !header) return;
      // The renderer is public. We supply bounded, cached section captures instead
      // of asking the orchestrator to rasterize the entire long page every frame.
      const engine = new LiquidGlass({ root: nav, glassElements: [] });
      const canvas = document.createElement('canvas');
      canvas.className = 'navigation-glass';
      canvas.setAttribute('aria-hidden', 'true');
      nav.prepend(canvas);
      const ctx = canvas.getContext('2d')!;
      const scene = document.createElement('canvas');
      const paint = scene.getContext('2d')!;
      const cache = new Map<HTMLElement, HTMLCanvasElement>();
      const pending = new Set<HTMLElement>();
      const failed = new Set<HTMLElement>();
      let epoch = 0;
      let frame = 0;
      let refresh: ReturnType<typeof setTimeout> | undefined;
      const sources = [
        ...document.querySelectorAll<HTMLElement>(
          'main > :not(script):not(.hero), .hero-landscape, .hero-product, body > footer',
        ),
      ];
      function schedule() {
        if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(draw);
      }
      async function capture(el: HTMLElement) {
        if (pending.has(el) || failed.has(el)) return;
        pending.add(el);
        const generation = epoch;
        const shot = await engine.capture.captureToCanvas(el, el.offsetWidth, el.offsetHeight);
        pending.delete(el);
        if (disposed) return;
        if (generation !== epoch) {
          schedule();
          return;
        }
        if (shot) {
          if (cache.size >= 3) cache.delete(cache.keys().next().value!);
          cache.set(el, shot);
        } else failed.add(el);
        schedule();
      }
      function draw() {
        frame = 0;
        if (disposed || !nav || !header) return;
        nav.removeAttribute('data-liquid');
        if (reduced.matches || engine.renderer.contextLost || nav.classList.contains('menu-open'))
          return;
        const rect = nav.getBoundingClientRect();
        const pad = 20;
        const box = {
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        };
        const visible = sources.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.bottom > box.top && r.top < box.top + box.height && r.height > 0;
        });
        // Sticky scenes cannot be represented by a static snapshot. Retain native
        // live backdrop blur there, also while a new section is being captured.
        if (!visible.length || visible.some((el) => el.offsetHeight > 2200)) return;
        for (const el of visible) if (!cache.has(el)) void capture(el);
        if (visible.some((el) => !cache.has(el))) return;
        const dpr = Math.min(devicePixelRatio, 1.5);
        const w = Math.round(box.width * dpr),
          h = Math.round(box.height * dpr);
        if (scene.width !== w || scene.height !== h) {
          scene.width = w;
          scene.height = h;
          canvas.width = Math.round(rect.width * dpr);
          canvas.height = Math.round(rect.height * dpr);
          engine.renderer.resize(w, h);
        }
        paint.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint.fillStyle = '#faf9f6';
        paint.fillRect(0, 0, box.width, box.height);
        for (const el of visible) {
          const r = el.getBoundingClientRect();
          paint.drawImage(cache.get(el)!, r.left - box.left, r.top - box.top, r.width, r.height);
        }
        const onHero = !header.hasAttribute('data-scrolled') && !!document.querySelector('.hero');
        paint.fillStyle = onHero ? 'rgba(38, 16, 63, .16)' : 'rgba(250, 248, 252, .78)';
        paint.fillRect(0, 0, box.width, box.height);
        const config = {
          ...DEFAULTS,
          blurAmount: 0.9,
          cornerRadius: parseFloat(getComputedStyle(nav).borderRadius),
          shadowOpacity: 0.12,
          refraction: 0.69,
          chromAberration: 0.025,
          edgeHighlight: 0.05,
          fresnel: 1,
          specular: 0.06,
        };
        engine.renderer.uploadAndBlur(scene, 0, 0, w, h, config.blurAmount);
        engine.renderer.clear();
        engine.renderer.renderGlassPanel(config, rect.width, rect.height, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          engine.renderer.canvas,
          pad * dpr,
          pad * dpr,
          canvas.width,
          canvas.height,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        nav.setAttribute('data-liquid', 'webgl');
      }
      function invalidate() {
        epoch++;
        cache.clear();
        failed.clear();
        schedule();
      }
      const resize = new ResizeObserver(invalidate);
      resize.observe(nav);
      const mutation = new MutationObserver(schedule);
      mutation.observe(header, { attributes: true, attributeFilter: ['data-scrolled'] });
      mutation.observe(nav, { attributes: true, attributeFilter: ['class'] });
      const contentChanged = () => {
        clearTimeout(refresh);
        refresh = setTimeout(invalidate, 400);
      };
      const refreshVisible = () => {
        const rect = nav!.getBoundingClientRect();
        for (const el of sources) {
          const r = el.getBoundingClientRect();
          if (r.bottom > rect.top - 20 && r.top < rect.bottom + 20 && el.offsetHeight <= 2200)
            void capture(el);
        }
      };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('scrollend', refreshVisible);
      window.addEventListener('resize', invalidate);
      document.addEventListener('visibilitychange', schedule);
      document.querySelector('main')?.addEventListener('click', contentChanged);
      reduced.addEventListener('change', schedule);
      engine.renderer.canvas.addEventListener('webglcontextlost', schedule);
      engine.renderer.canvas.addEventListener('webglcontextrestored', schedule);
      release = () => {
        cancelAnimationFrame(frame);
        clearTimeout(refresh);
        resize.disconnect();
        mutation.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('scrollend', refreshVisible);
        window.removeEventListener('resize', invalidate);
        document.removeEventListener('visibilitychange', schedule);
        document.querySelector('main')?.removeEventListener('click', contentChanged);
        reduced.removeEventListener('change', schedule);
        engine.renderer.canvas.removeEventListener('webglcontextlost', schedule);
        engine.renderer.canvas.removeEventListener('webglcontextrestored', schedule);
        nav.removeAttribute('data-liquid');
        canvas.remove();
        cache.clear();
        engine.destroy();
      };
      await document.fonts.ready;
      await engine.capture.prefetchFontEmbedCSS();
      await Promise.all(
        [...document.querySelectorAll<HTMLImageElement>('.hero img')].map((img) =>
          img.decode().catch(() => {}),
        ),
      );
      if (!disposed) schedule();
    }
    void start().catch(() => {
      release();
    });
    return () => {
      disposed = true;
      release();
    };
  }, [headerRef]);
}

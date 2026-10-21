'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './LakeHero.module.css';

// How far the headline travels for each pixel scrolled while the stage is pinned.
const SINK = 0.62;

// The pinned stage of the hero: a lake scene with the headline hanging between
// the clouds. Scrolling lowers the headline towards its own reflection until
// it slips under the water; scrolling back raises it again.
export function LakeHero({
  title,
  intro,
  poster,
}: {
  title: ReactNode;
  intro: ReactNode;
  poster: ReactNode;
}) {
  const sticky = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const above = useRef<HTMLDivElement>(null);
  const under = useRef<HTMLDivElement>(null);
  const reflection = useRef<HTMLDivElement>(null);
  const seam = useRef<HTMLDivElement>(null);
  const introduction = useRef<HTMLDivElement>(null);
  const horizon = useRef(0.6);
  const [state, setState] = useState<'loading' | 'ready' | 'lost' | 'fallback'>('loading');

  // Scroll choreography for the headline, its underwater ghost and its
  // reflection. Each copy sits in a box clipped at the waterline, so a scroll
  // frame only moves layers with transforms: no layout, no repaint.
  useEffect(() => {
    const root = sticky.current;
    const space = spacer.current;
    const layers = [above.current, under.current, reflection.current];
    const copies = [heading.current, ghost.current, mirror.current];
    const line = seam.current;
    const words = introduction.current;
    const section = root?.closest('section');
    if (!root || !space || !line || !words || !section) return;
    if (layers.some((layer) => !layer) || copies.some((copy) => !copy)) return;
    const [aboveBox, underBox, mirrorBox] = layers as HTMLDivElement[];
    const [dry, wet, flipped] = copies as HTMLElement[];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    // Scroll-driven animations keep the motion on the compositor; script then
    // only supplies distances. Otherwise script drives the transforms per frame.
    const compositor =
      !reduced.matches &&
      typeof CSS !== 'undefined' &&
      CSS.supports('animation-timeline: scroll()');
    horizon.current = innerWidth / innerHeight < 0.8 ? 0.64 : 0.6;
    let top = 0;
    let height = 0;
    let water = 0;
    let frame = 0;
    let shift = 0;
    const measure = () => {
      water = Math.round(horizon.current * root.offsetHeight);
      // Spare sky below the copy, split so the gap above the water stays a
      // little larger than the one below the header.
      const bottom = words.offsetTop + words.offsetHeight - shift;
      shift = Math.max(Math.round((water - bottom) * 0.4), 0);
      root.style.setProperty('--title-shift', `${shift}px`);
      top = space.getBoundingClientRect().top - root.getBoundingClientRect().top;
      height = space.offsetHeight;
      aboveBox.style.height = `${water}px`;
      underBox.style.top = `${water}px`;
      mirrorBox.style.top = `${water}px`;
      dry.style.top = `${top}px`;
      wet.style.top = `${top - water}px`;
      flipped.style.top = `${water - top - height}px`;
      line.style.top = `${water - 1}px`;
      // The pinned stretch, measured against the stable small viewport so the
      // collapsing toolbar on phones never changes it mid-scroll.
      const travel = Math.max(section.offsetHeight - root.offsetHeight, 1);
      root.style.setProperty('--travel', `${travel}px`);
      root.style.setProperty('--sink-end', `${travel * SINK}px`);
      root.style.setProperty('--seam-start', `${Math.max(water - top - height, 0) / SINK}px`);
      root.style.setProperty('--seam-end', `${Math.max(water - top, 1) / SINK}px`);
      root.dataset.measured = '';
    };
    const update = () => {
      frame = 0;
      if (compositor) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - root.offsetHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), travel);
      const sink = reduced.matches ? 0 : scrolled * SINK;
      dry.style.transform = `translate3d(0, ${sink}px, 0)`;
      wet.style.transform = `translate3d(0, ${sink}px, 0)`;
      flipped.style.transform = `translate3d(0, ${-sink}px, 0) scaleY(-1.06)`;
      const under = Math.min(Math.max((top + sink + height - water) / height, 0), 1);
      const glow = under > 0 && under < 1 ? Math.sin(under * Math.PI) : 0;
      line.style.opacity = String(glow);
      line.style.transform = `translate3d(-50%, 0, 0) scaleX(${0.6 + glow * 0.4})`;
      const fade = Math.min(scrolled / (root.offsetHeight * 0.22), 1);
      words.style.opacity = String(1 - fade);
      words.style.transform = `translate3d(0, ${fade * -24}px, 0)`;
      root.dataset.intro = fade > 0.97 ? 'gone' : 'shown';
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const relayout = () => {
      measure();
      update();
    };
    relayout();
    document.fonts?.ready.then(relayout);
    const observer = new ResizeObserver(relayout);
    observer.observe(root);
    observer.observe(space);
    observer.observe(words);
    if (!compositor) addEventListener('scroll', request, { passive: true });
    addEventListener('lakelayout', relayout);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('scroll', request);
      removeEventListener('lakelayout', relayout);
    };
  }, []);

  // The WebGL scene itself, loaded after first paint.
  useEffect(() => {
    const element = canvas.current;
    const section = sticky.current?.closest('section');
    if (!element || !section) return;
    let disposed = false;
    let cleanup = () => {};
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    // Few cores or little memory: start at the lighter quality tier straight
    // away instead of waiting for slow frames to step it down.
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = compact || (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    import('./lake')
      .then(({ createLake }) => {
        if (disposed) return;
        const scene = createLake(element, {
          still: reduced,
          compact,
          lite,
          onReady: () => setState('ready'),
          onLost: (lost) => setState(lost ? 'lost' : 'ready'),
          onLayout: (line) => {
            horizon.current = line;
            dispatchEvent(new Event('lakelayout'));
          },
        });
        const move = (event: PointerEvent) => scene.pointer(event.clientX, event.clientY);
        const press = (event: PointerEvent) => {
          if ((event.target as Element).closest('a, button, summary, details')) return;
          scene.press(event.clientX, event.clientY);
        };
        const leave = () => scene.leave();
        const observer = new IntersectionObserver(([entry]) =>
          scene.setActive(!!entry?.isIntersecting),
        );
        const visibility = () => scene.setActive(!document.hidden && onScreen(section));
        section.addEventListener('pointermove', move, { passive: true });
        section.addEventListener('pointerdown', press, { passive: true });
        section.addEventListener('pointerleave', leave);
        document.addEventListener('visibilitychange', visibility);
        observer.observe(section);
        cleanup = () => {
          section.removeEventListener('pointermove', move);
          section.removeEventListener('pointerdown', press);
          section.removeEventListener('pointerleave', leave);
          document.removeEventListener('visibilitychange', visibility);
          observer.disconnect();
          scene.dispose();
        };
      })
      // No WebGL (or a context lost at start): the poster stays in place.
      .catch(() => setState('fallback'));
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className={styles.track}>
      {/* Safari colours its status bar from pinned layers at the top edge. */}
      <div className={styles.tint} aria-hidden="true" />
      <div className={styles.pin}>
        <div ref={sticky} className={styles.sticky} data-state={state}>
          <div className={styles.scene}>
            {/* A still of the scene, painted before any script runs. */}
            <div className={styles.poster} data-hero-artwork>
              {poster}
            </div>
            <div className={styles.stage} aria-hidden="true">
              <canvas ref={canvas} className={styles.canvas} />
            </div>
          </div>

          {/* The headline above the water, clipped at the waterline. */}
          <div ref={above} className={styles.above}>
            <h1
              ref={heading}
              id="hero-title"
              className={`${styles.title} ${styles.copy} ${styles.dry}`}
            >
              {title}
            </h1>
          </div>
          {/* What has sunk: dim, cold and wavering, fading with depth. */}
          <div ref={under} className={styles.under} aria-hidden="true">
            <div ref={ghost} className={`${styles.title} ${styles.copy} ${styles.wet}`}>
              <div className={styles.waver}>{title}</div>
            </div>
          </div>
          {/* Its reflection on the surface. */}
          <div ref={reflection} className={styles.mirror} aria-hidden="true">
            <div ref={mirror} className={`${styles.title} ${styles.copy} ${styles.flipped}`}>
              <div className={styles.waver}>{title}</div>
            </div>
          </div>
          <div ref={seam} className={styles.seam} aria-hidden="true" />

          <div className={styles.content}>
            {/* Holds the headline's place so the introduction flows beneath it. */}
            <div ref={spacer} className={`${styles.title} ${styles.spacer}`} aria-hidden="true">
              {title}
            </div>
            <div ref={introduction} className={styles.intro}>
              {intro}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function onScreen(element: Element) {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < innerHeight;
}

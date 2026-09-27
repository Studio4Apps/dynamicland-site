import { animate } from 'motion/mini';

// Reference geometry, with a slower handoff and a small damped rebound
// after the owner's visual review: rise → capsule → playback bubble.
export const GALLERY_ENTRANCE = { duration: 1.3, bottomInset: 32 } as const;
// Keep the reviewed choreography in proportion when adjusting its overall pace.
const timing = (seconds: number) => (seconds / 1.65) * GALLERY_ENTRANCE.duration;

export function createGalleryEntrance(root: HTMLElement, seen: { current: boolean }) {
  const anchor = root.querySelector<HTMLElement>('[data-gallery-controls]');
  const group = root.querySelector<HTMLElement>('[data-playback-group]');
  const shell = root.querySelector<HTMLElement>('[data-gallery-capsule]');
  const rotation = root.querySelector<HTMLElement>('[data-rotation]');
  const pagination = root.querySelector<HTMLElement>('[data-pagination-content]');
  if (!anchor || !group || !shell || !rotation || !pagination) return () => {};

  const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-gallery-dot]'));
  const indicators = Array.from(root.querySelectorAll<HTMLElement>('[data-indicator]'));
  const icon = rotation.querySelector('svg')!;
  const count = anchor.querySelector<HTMLElement>('[data-gallery-count]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const animations: ReturnType<typeof animate>[] = [];
  const animated = [group, shell, pagination, rotation, icon, count, ...dots, ...indicators];
  const originalStyles = animated.map((element) => element.getAttribute('style'));
  let observer: IntersectionObserver | undefined;
  let visible = false;
  let disposed = false;

  const restore = () => {
    // Do not erase the gallery clock's --expansion or dwell styles.
    animated.forEach((element, index) => {
      for (const property of ['opacity', 'transform', 'width', 'height', 'clip-path'])
        element.style.removeProperty(property);
      if (originalStyles[index] && (element === group || element === shell))
        element.setAttribute('style', originalStyles[index]!);
    });
  };
  const settle = () => {
    if (disposed) return;
    seen.current = true;
    observer?.disconnect();
    animations.splice(0).forEach((animation) => animation.cancel());
    restore();
    root.dataset.controlsIntro = 'settled';
  };
  const enter = () => {
    if (seen.current || !visible || document.hidden || disposed) return;
    if (reduced.matches) return settle();
    seen.current = true;
    observer?.disconnect();
    const bounds = group.getBoundingClientRect();
    const width = shell.parentElement!.getBoundingClientRect().width;
    const height = rotation.offsetHeight;
    const shift = (bounds.width - width) / 2;
    const viewportBottom = window.visualViewport
      ? window.visualViewport.offsetTop + window.visualViewport.height
      : innerHeight;
    const rise = Math.max(height * 1.5, viewportBottom - bounds.top + height * 0.25);
    const times = [0, 0.16, 0.24, 0.32, 0.4, 0.49, 0.57, 0.65, 0.74, 0.82, 1];
    root.dataset.controlsIntro = 'entering';
    try {
      animations.push(
        animate(
          group,
          {
            transform: [
              `translateY(${rise}px)`,
              'translateY(-6px)',
              'translateY(2px)',
              'translateY(0px)',
            ],
          },
          {
            duration: timing(1.02),
            times: [0, 0.6, 0.8, 1],
            ease: [
              [0.22, 0.8, 0.34, 1],
              [0.42, 0, 0.58, 1],
              [0.42, 0, 0.58, 1],
            ],
          },
        ),
        animate(
          shell,
          {
            width: [
              height * 0.9,
              height * 0.92,
              height * 0.87,
              width * 0.4,
              width * 0.8,
              width * 1.075,
              width * 1.09,
              width * 1.06,
              width * 1.006,
              width * 0.984,
              width,
            ].map((v) => `${v}px`),
            height: [0.9, 0.79, 0.74, 0.65, 0.64, 0.76, 0.94, 1.04, 1.05, 1.02, 1].map(
              (v) => `${height * v}px`,
            ),
            transform: [1, 1, 1, 0.78, 0.45, 0.2, -0.08, -0.1, 0, 0.03, 0].map(
              (v) => `translate(-50%, -50%) translateX(${shift * v}px)`,
            ),
          },
          { duration: GALLERY_ENTRANCE.duration, times, ease: 'linear' },
        ),
        animate(
          pagination,
          { clipPath: ['inset(0 45%)', 'inset(0 -4px)'] },
          { delay: timing(0.59), duration: timing(0.43), ease: [0.25, 0.65, 0.35, 1] },
        ),
        animate(
          dots,
          {
            opacity: [0, 1],
            transform: [`translateX(${height * 0.45}px)`, 'none'],
          },
          { delay: timing(0.59), duration: timing(0.55), ease: [0.25, 0.65, 0.35, 1] },
        ),
        animate(
          indicators,
          { transform: ['scaleX(0.45)', 'scaleX(1)'] },
          {
            delay: timing(0.59),
            duration: timing(0.47),
            ease: [0.25, 0.65, 0.35, 1],
          },
        ),
        animate(
          rotation,
          {
            transform: [
              `translateX(${-height * 0.8}px) scale(0.5)`,
              `translateX(${-height * 0.48}px) scale(0.78)`,
              'translateX(2.5px) scale(1.025)',
              'translateX(-0.8px) scale(0.994)',
              'none',
            ],
          },
          {
            delay: timing(0.76),
            duration: timing(0.86),
            times: [0, 0.32, 0.7, 0.86, 1],
            ease: [
              [0.25, 0.1, 0.5, 1],
              [0.22, 0.75, 0.35, 1],
              [0.42, 0, 0.58, 1],
              [0.42, 0, 0.58, 1],
            ],
          },
        ),
        animate(
          rotation,
          { opacity: [0, 1] },
          { delay: timing(0.76), duration: timing(0.42), ease: [0.33, 0, 0.67, 1] },
        ),
        animate(icon, { opacity: [0, 1] }, { delay: timing(1), duration: timing(0.42) }),
        animate(count, { opacity: [0, 1] }, { delay: timing(1.02), duration: timing(0.34) }),
      );
      void Promise.all(animations).then(() => {
        if (!disposed && root.dataset.controlsIntro === 'entering') settle();
      });
    } catch {
      settle();
    }
  };

  // A focus or click always gets usable, stationary controls immediately.
  anchor.addEventListener('focusin', settle, { signal: abort.signal });
  anchor.addEventListener('pointerdown', settle, { signal: abort.signal });
  reduced.addEventListener(
    'change',
    () => {
      if (reduced.matches) settle();
    },
    { signal: abort.signal },
  );
  window.addEventListener(
    'resize',
    () => {
      if (root.dataset.controlsIntro === 'entering') settle();
    },
    { signal: abort.signal, passive: true },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden && root.dataset.controlsIntro === 'entering') settle();
      else if (!document.hidden) enter();
    },
    { signal: abort.signal },
  );

  if (
    seen.current ||
    reduced.matches ||
    typeof IntersectionObserver !== 'function' ||
    !group.animate
  ) {
    settle();
  } else {
    root.dataset.controlsIntro = 'waiting';
    observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.99;
        enter();
      },
      { rootMargin: `0px 0px -${GALLERY_ENTRANCE.bottomInset}px 0px`, threshold: [0, 1] },
    );
    observer.observe(anchor);
  }
  return () => {
    if (root.dataset.controlsIntro === 'entering') settle();
    disposed = true;
    abort.abort();
    observer?.disconnect();
    delete root.dataset.controlsIntro;
  };
}

'use client';

import { useEffect, useRef } from 'react';
import { Arrow } from '@/components/Icon';
import { createMotionScope, springEasing } from '@/lib/motion';
import styles from './FeatureExplorer.module.css';

const destinations = [
  { href: '#home', title: 'Your Home', detail: 'The essentials, together.', icon: 'home' },
  { href: '#music', title: 'Your music', detail: 'Keep your soundtrack close.', icon: 'music' },
  {
    href: '#everyday',
    title: 'Everyday tools',
    detail: 'Small things. Fewer detours.',
    icon: 'tools',
  },
  {
    href: '#customization',
    title: 'Make it yours',
    detail: 'Your island. Your style.',
    icon: 'style',
  },
] as const;

function FeatureIcon({ kind }: { kind: (typeof destinations)[number]['icon'] }) {
  const paths = {
    home: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    music: 'M9 18V5l11-2v13M9 8l11-2M9 18c0 2-5 4-6 1s6-5 6-1Zm11-2c0 2-5 4-6 1s6-5 6-1Z',
    tools: 'M8 4H5v17h14V4h-3M8 2h8v5H8zM8 12h8M8 16h5',
    style: 'M5 3v18M12 3v18M19 3v18M2 8h6M9 16h6M16 7h6',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}

// A real navigation surface: its shell grows from the invoking control,
// while the same four visual anchors travel to their destination positions.
export function FeatureExplorer() {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const summary = root.querySelector('summary')!;
    const panel = root.querySelector<HTMLElement>('[data-explorer-panel]')!;
    const content = root.querySelector<HTMLElement>('[data-explorer-content]')!;
    const seeds = Array.from(root.querySelectorAll<HTMLElement>('[data-seed]'));
    const icons = Array.from(root.querySelectorAll<HTMLElement>('[data-destination-icon]'));
    const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-explorer-copy]'));
    const abort = new AbortController();
    let expanded = false;
    let restoreFocus = false;
    let sourceClip = '';
    let anchorTop = 0;
    let iconOrigins: string[] = [];
    const place = () => {
      const anchor = summary.getBoundingClientRect();
      anchorTop = anchor.top;
      const width = panel.offsetWidth,
        height = panel.offsetHeight;
      const x = Math.max(
        20,
        Math.min(innerWidth - width - 20, anchor.left + anchor.width / 2 - width / 2),
      );
      const y = Math.max(88, Math.min(anchor.top, innerHeight - height - 16));
      const parent = root.getBoundingClientRect();
      panel.style.left = `${x - parent.left}px`;
      panel.style.top = `${y - parent.top}px`;
      sourceClip = `inset(${anchor.top - y}px ${x + width - anchor.right}px ${y + height - anchor.bottom}px ${anchor.left - x}px round 24px)`;
      iconOrigins = icons.map((icon, i) => {
        const from = seeds[i].getBoundingClientRect(),
          to = icon.getBoundingClientRect();
        return `translate(${from.left + from.width / 2 - to.left - to.width / 2}px, ${from.top + from.height / 2 - to.top - to.height / 2}px) scale(${from.width / to.width})`;
      });
    };
    const finish = () => {
      root.open = expanded;
      panel.inert = !expanded;
      summary.tabIndex = expanded ? -1 : 0;
      summary.setAttribute('aria-expanded', String(expanded));
      if (expanded) {
        root.dataset.expanded = 'true';
        if (document.activeElement === summary)
          panel.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
      } else {
        delete root.dataset.expanded;
        panel.style.removeProperty('left');
        panel.style.removeProperty('top');
        if (restoreFocus) summary.focus({ preventScroll: true });
      }
      restoreFocus = false;
    };
    const scope = createMotionScope(() => {
      if (expanded) place();
      finish();
    });
    const setOpen = (next: boolean, restore = false, instant = false) => {
      if (next === expanded && !scope.isAnimating(panel)) return;
      const running = scope.isAnimating(panel);
      const clip = running ? getComputedStyle(panel).clipPath : null;
      // Hidden details do not need a presentation snapshot. Reading their
      // computed styles forces work on a skipped subtree on the first click.
      const appearances = running
        ? [...icons, ...labels].map((el) => {
            const css = getComputedStyle(el);
            return { transform: css.transform, opacity: css.opacity, filter: css.filter };
          })
        : [];
      expanded = next;
      restoreFocus = restore;
      scope.cancel();
      root.open = true;
      // Measure the final layout only once per fresh opening, never per frame.
      if (next && !running) place();
      root.dataset.expanded = String(next);
      summary.setAttribute('aria-expanded', String(next));
      panel.inert = !next;
      if (instant || scope.reduced.matches || typeof panel.animate !== 'function') {
        finish();
        return;
      }
      const duration = next ? 620 : 380;
      const easing = springEasing(duration, next ? 0.44 : 0.34, next ? 0.82 : 0.95);
      icons.forEach((icon, i) =>
        scope.animate(
          icon,
          [
            running ? appearances[i] : { transform: next ? iconOrigins[i] : 'none', opacity: 1 },
            { transform: next ? 'none' : iconOrigins[i], opacity: 1 },
          ],
          { duration, easing },
        ),
      );
      labels.forEach((label, i) =>
        scope.animate(
          label,
          [
            running
              ? appearances[i + icons.length]
              : {
                  transform: next ? 'translateY(12px)' : 'none',
                  opacity: next ? 0 : 1,
                  filter: next ? 'blur(5px)' : 'none',
                },
            {
              transform: next ? 'none' : 'translateY(-6px)',
              opacity: next ? 1 : 0,
              filter: next ? 'none' : 'blur(4px)',
            },
          ],
          {
            duration: next ? 260 : 130,
            delay: next && !running ? 130 + i * 18 : 0,
            fill: 'both',
            easing: 'ease-out',
          },
        ),
      );
      scope.animate(
        panel,
        [
          { clipPath: clip || (next ? sourceClip : 'inset(0px 0px 0px 0px round 28px)') },
          { clipPath: next ? 'inset(0px 0px 0px 0px round 28px)' : sourceClip },
        ],
        { duration, easing },
        finish,
      );
    };
    summary.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        setOpen(!expanded, true);
      },
      { signal: abort.signal },
    );
    panel
      .querySelector('button')!
      .addEventListener('click', () => setOpen(false, true), { signal: abort.signal });
    content.addEventListener(
      'click',
      (event) => {
        if ((event.target as Element).closest('a')) setOpen(false, false, true);
      },
      { signal: abort.signal },
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && root.open) {
          event.preventDefault();
          setOpen(false, true);
        }
      },
      { signal: abort.signal },
    );
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (root.open && !root.contains(event.target as Node)) setOpen(false);
      },
      { signal: abort.signal },
    );
    document.addEventListener(
      'focusin',
      (event) => {
        if (expanded && !root.contains(event.target as Node)) setOpen(false);
      },
      { signal: abort.signal },
    );
    window.addEventListener(
      'scroll',
      () => {
        if (root.open && Math.abs(summary.getBoundingClientRect().top - anchorTop) > 2)
          setOpen(false, false, true);
      },
      { signal: abort.signal, passive: true },
    );
    root.dataset.enhanced = 'true';
    return () => {
      abort.abort();
      expanded = false;
      scope.destroy();
      delete root.dataset.enhanced;
    };
  }, []);

  return (
    <details ref={ref} className={styles.explorer} data-feature-explorer>
      <summary className={styles.trigger} aria-controls="feature-explorer-panel">
        <span className={styles.seeds} aria-hidden="true">
          {destinations.map((item) => (
            <span data-seed key={item.icon}>
              <FeatureIcon kind={item.icon} />
            </span>
          ))}
        </span>
        <span>Explore the features</span>
        <Arrow size={16} direction="down" />
      </summary>
      <div id="feature-explorer-panel" data-explorer-panel className={styles.panel}>
        <div data-explorer-content>
          <div className={styles.panelHeader} data-explorer-copy>
            <div>
              <span className={styles.eyebrow}>A LITTLE MORE CONNECTED</span>
              <p>Find your space.</p>
            </div>
            <button type="button" aria-label="Close feature explorer" className={styles.close}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <nav aria-label="Explore DynamicLand" className={styles.destinations}>
            {destinations.map((item) => (
              <a href={item.href} key={item.icon}>
                <span className={styles.icon} data-destination-icon>
                  <FeatureIcon kind={item.icon} />
                </span>
                <span data-explorer-copy>
                  <strong>{item.title}</strong>
                  <span className={styles.description}>{item.detail}</span>
                </span>
                <span className={styles.destinationArrow} data-explorer-copy>
                  <Arrow size={17} />
                </span>
              </a>
            ))}
          </nav>
          <a href="#features" className={styles.allFeatures} data-explorer-copy>
            See the highlights <Arrow size={16} />
          </a>
        </div>
      </div>
    </details>
  );
}

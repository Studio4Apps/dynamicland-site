'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { ProBadge } from '@/components/ProBadge';
import { createMotionScope, MOTION, springEasing } from '@/lib/motion';
import styles from './DetailSelector.module.css';
type DetailItem = {
  id: string;
  title: string;
  description: string;
  pro: boolean;
  media: ReactNode;
};
export function DetailSelector({ items }: { items: DetailItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const controls = Array.from(element.querySelectorAll<HTMLInputElement>('input'));
    const previews = Array.from(element.querySelectorAll<HTMLElement>('[data-preview]'));
    const options = element.querySelector<HTMLElement>('fieldset')!;
    const indicator = element.querySelector<HTMLElement>('[data-style-indicator]')!;
    let active = Math.max(
      0,
      controls.findIndex((input) => input.checked),
    );
    const placeIndicator = () => {
      const selected = controls.find((input) => input.checked)?.closest('label');
      if (!selected) return;
      const parent = options.getBoundingClientRect();
      const target = selected.getBoundingClientRect();
      indicator.style.width = `${target.width}px`;
      indicator.style.height = `${target.height}px`;
      indicator.style.transform = `translate(${target.left - parent.left}px, ${target.top - parent.top}px)`;
    };
    const scope = createMotionScope(placeIndicator);
    placeIndicator();
    element.dataset.selectorReady = 'true';
    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            scope.cancel();
            placeIndicator();
          })
        : null;
    observer?.observe(options);
    const select = () => {
      const next = controls.findIndex((input) => input.checked);
      if (next === active || next < 0) return;
      // Read the rendered state before canceling: reversing mid-transition
      // resumes from these values, including partially visible old previews.
      const appearance = previews.map((preview, index) => {
        if (scope.isAnimating(preview)) {
          const style = getComputedStyle(preview);
          return { opacity: Number(style.opacity), transform: style.transform };
        }
        return {
          opacity: index === active ? 1 : 0,
          transform: index === active ? 'none' : 'scale(1.012)',
        };
      });
      const fromIndicator = getComputedStyle(indicator).transform;
      const fromWidth = getComputedStyle(indicator).width;
      const fromHeight = getComputedStyle(indicator).height;
      scope.cancel();
      placeIndicator();
      scope.animate(
        indicator,
        [
          { transform: fromIndicator, width: fromWidth, height: fromHeight },
          {
            transform: indicator.style.transform,
            width: indicator.style.width,
            height: indicator.style.height,
          },
        ],
        { duration: 520, easing: springEasing(520, 0.38, 0.9) },
      );
      const incoming = previews[next],
        outgoing = previews[active];
      outgoing?.querySelectorAll('video').forEach((video) => video.pause());
      previews.forEach((preview, index) => {
        if (index === next || appearance[index].opacity <= 0) return;
        scope.animate(
          preview,
          [
            {
              opacity: appearance[index].opacity,
              transform: appearance[index].transform,
              visibility: 'visible',
            },
            { opacity: 0, transform: appearance[index].transform, visibility: 'visible' },
          ],
          { duration: MOTION.sectionExitMs, easing: MOTION.exitEase },
        );
      });
      if (incoming) {
        const start = appearance[next];
        const delay = start.opacity > 0 ? 0 : MOTION.sectionDelayMs;
        scope.animate(incoming, [{ transform: start.transform }, { transform: 'none' }], {
          duration: MOTION.sectionMs,
          delay,
          fill: 'backwards',
          easing: springEasing(MOTION.sectionMs),
        });
        scope.animate(incoming, [{ opacity: start.opacity }, { opacity: 1 }], {
          duration: 180,
          delay,
          fill: 'backwards',
          easing: 'ease-out',
        });
      }
      active = next;
    };
    element.addEventListener('change', select);
    return () => {
      observer?.disconnect();
      scope.destroy();
      element.removeEventListener('change', select);
      delete element.dataset.selectorReady;
    };
  }, []);
  return (
    <div ref={root} className={styles.selector} data-motion="media">
      <div className={styles.previewStage}>
        {items.map((item) => (
          <div
            key={item.id}
            id={`preview-${item.id}`}
            data-preview={item.id}
            className={styles.preview}
          >
            {item.media}
          </div>
        ))}
      </div>
      <fieldset className={styles.options}>
        <legend className="srOnly">Explore island styles</legend>
        <span className={styles.indicator} data-style-indicator aria-hidden="true" />
        {items.map((item, index) => (
          <label key={item.id} className={styles.option}>
            <input
              type="radio"
              name="island-style"
              value={item.id}
              defaultChecked={index === 0}
              aria-describedby={`description-${item.id}`}
              aria-controls={`description-${item.id} preview-${item.id}`}
            />
            <span className={styles.glyph} aria-hidden="true">
              <StyleGlyph id={item.id} />
            </span>
            <span className={styles.optionTitle}>
              {item.title.split(' ').map((word, i) => (
                <span key={`${item.id}-${word}`}>
                  {i > 0 && ' '}
                  {word}
                </span>
              ))}
            </span>
            {item.pro && <ProBadge />}
            <span className={styles.optionHint} aria-hidden="true">
              {item.id === 'notch'
                ? 'At the screen’s edge'
                : item.id === 'pill'
                  ? 'A floating silhouette'
                  : 'A translucent finish'}
            </span>
          </label>
        ))}
      </fieldset>
      <div className={styles.descriptionStage}>
        {items.map((item) => (
          <p
            key={item.id}
            id={`description-${item.id}`}
            data-description={item.id}
            className={styles.description}
          >
            {item.description}
          </p>
        ))}
      </div>
    </div>
  );
}

function StyleGlyph({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 64 32" fill="none">
      {id === 'notch' ? (
        <>
          <path className={styles.edge} d="M3 5h58" />
          <path
            className={styles.silhouette}
            d="M13 5h38c-4 0-5 1-5 5v8c0 5-3 8-8 8H26c-5 0-8-3-8-8v-8c0-4-1-5-5-5Z"
          />
        </>
      ) : id === 'pill' ? (
        <rect className={styles.silhouette} x="11" y="7" width="42" height="20" rx="10" />
      ) : (
        <>
          <rect className={styles.glassBack} x="8" y="3" width="39" height="21" rx="10.5" />
          <rect className={styles.glassFront} x="17" y="9" width="39" height="21" rx="10.5" />
          <path className={styles.glassShine} d="M23 14c1-1 3-2 5-2h14" />
        </>
      )}
    </svg>
  );
}

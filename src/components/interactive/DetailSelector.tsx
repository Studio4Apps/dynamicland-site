'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { ProBadge } from '@/components/ProBadge';
import { createMotionScope, MOTION, springEasing } from '@/lib/motion';
import styles from './Interactive.module.css';
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
    const scope = createMotionScope();
    const controls = Array.from(element.querySelectorAll<HTMLInputElement>('input'));
    const previews = Array.from(element.querySelectorAll<HTMLElement>('[data-preview]'));
    let active = Math.max(
      0,
      controls.findIndex((input) => input.checked),
    );
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
      scope.cancel();
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
      scope.destroy();
      element.removeEventListener('change', select);
    };
  }, []);
  return (
    <div ref={root} className={styles.selector} data-motion="media">
      <fieldset className={styles.options}>
        <legend className="srOnly">Explore island styles</legend>
        {items.map((item, index) => (
          <label key={item.id} className={styles.option}>
            <input
              type="radio"
              name="island-style"
              value={item.id}
              defaultChecked={index === 0}
              aria-controls={`description-${item.id} preview-${item.id}`}
            />
            <span className={styles.optionTitle}>
              {item.title}
              {item.pro && <ProBadge />}
              <span className={styles.optionArrow} aria-hidden="true">
                ↗
              </span>
            </span>
            <span className={styles.optionBody}>
              <span id={`description-${item.id}`} className={styles.optionDescription}>
                <span>{item.description}</span>
              </span>
            </span>
          </label>
        ))}
      </fieldset>
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
    </div>
  );
}

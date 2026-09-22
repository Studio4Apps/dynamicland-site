'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { ProBadge } from '@/components/ProBadge';
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
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const controls = Array.from(element.querySelectorAll<HTMLInputElement>('input'));
    const previews = Array.from(element.querySelectorAll<HTMLElement>('[data-preview]'));
    let active = Math.max(
      0,
      controls.findIndex((input) => input.checked),
    );
    let animations: Animation[] = [];
    const settle = () => {
      animations.forEach((animation) => animation.cancel());
      animations = [];
    };
    const select = () => {
      const next = controls.findIndex((input) => input.checked);
      if (next === active || next < 0) return;
      settle();
      const incoming = previews[next],
        outgoing = previews[active];
      outgoing?.querySelectorAll('video').forEach((video) => video.pause());
      if (!preference.matches && incoming?.animate && outgoing?.animate) {
        animations = [
          outgoing.animate(
            [
              { opacity: 1, visibility: 'visible' },
              { opacity: 0, visibility: 'visible' },
            ],
            { duration: 180, easing: 'ease-in' },
          ),
          incoming.animate(
            [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 450, delay: 80, fill: 'backwards', easing: 'cubic-bezier(.22,.68,0,1)' },
          ),
        ];
      }
      active = next;
    };
    const visibility = () => {
      if (document.hidden) settle();
    };
    element.addEventListener('change', select);
    preference.addEventListener('change', settle);
    window.addEventListener('resize', settle);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      settle();
      element.removeEventListener('change', select);
      preference.removeEventListener('change', settle);
      window.removeEventListener('resize', settle);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return (
    <div ref={root} className={styles.selector}>
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
            <span id={`description-${item.id}`} className={styles.optionDescription}>
              {item.description}
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

'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createMotionScope, MOTION } from '@/lib/motion';

// The radios and CSS (:has) decide which island is shown, with or without
// script. Script only animates a change, and every preview starts from the
// opacity and scale it has at that moment: a choice made mid-fade carries on
// from there instead of jumping. Reduced motion keeps the change instant.
export function IslandPicker({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof root.animate !== 'function') return;
    const previews = Array.from(root.querySelectorAll<HTMLElement>('[data-preview]'));
    const scope = createMotionScope();
    let shown = root.querySelector<HTMLInputElement>('input:checked')?.value;
    const change = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.type !== 'radio') return;
      // By now CSS already shows the new choice, so a preview that is not
      // moving is sampled from where it rested before the change.
      const from = previews.map((preview) => {
        if (scope.isAnimating(preview)) {
          const style = getComputedStyle(preview);
          return { opacity: style.opacity, transform: style.transform };
        }
        return preview.dataset.style === shown
          ? { opacity: '1', transform: 'none' }
          : { opacity: '0', transform: 'scale(1.012)' };
      });
      shown = input.value;
      scope.cancel();
      previews.forEach((preview, i) => {
        const { opacity, transform } = from[i];
        if (preview.dataset.style === input.value) {
          const enter = { delay: MOTION.sectionDelayMs, fill: 'backwards' } as const;
          scope.animate(preview, [{ opacity }, { opacity: 1 }], {
            ...enter,
            duration: 180,
            easing: 'ease',
          });
          scope.animate(preview, [{ transform }, { transform: 'none' }], {
            ...enter,
            duration: MOTION.sectionMs,
            easing: 'cubic-bezier(.16, 1, .3, 1)',
          });
        } else if (Number(opacity) > 0) {
          scope.animate(
            preview,
            [
              { opacity, transform, visibility: 'visible' },
              { opacity: 0, transform: 'scale(1.012)', visibility: 'visible' },
            ],
            { duration: MOTION.sectionExitMs, easing: 'ease' },
          );
        }
      });
    };
    root.addEventListener('change', change);
    return () => {
      root.removeEventListener('change', change);
      scope.destroy();
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

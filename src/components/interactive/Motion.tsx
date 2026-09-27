'use client';
import { useEffect } from 'react';
import { createMotionScope, entranceFrames } from '@/lib/motion';
export function Motion() {
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function' || !Element.prototype.animate) return;
    const scope = createMotionScope();
    const compact = matchMedia('(max-width: 760px)');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (scope.reduced.matches || document.hidden) continue;
          const element = entry.target as HTMLElement;
          const duration = 680;
          scope.animate(
            element,
            entranceFrames({
              y: compact.matches ? 8 : 14,
              scale: 1,
              opacity: 1,
              blur: compact.matches ? 8 : 24,
              duration,
            }),
            {
              duration,
              fill: 'backwards',
              easing: 'linear',
            },
          );
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -3% 0px' },
    );
    document
      .querySelectorAll('[data-reveal="optical"]')
      .forEach((element) => observer.observe(element));
    const onFocus = () => scope.cancel();
    document.addEventListener('focusin', onFocus);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', onFocus);
      scope.destroy();
    };
  }, []);
  return null;
}

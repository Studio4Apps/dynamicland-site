'use client';
import { useEffect } from 'react';
export function Motion() {
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function' || !Element.prototype.animate) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (preference.matches || document.hidden) continue;
          const element = entry.target as HTMLElement;
          const optical = element.dataset.reveal === 'optical';
          const blur = matchMedia('(max-width: 600px)').matches ? 10 : 24;
          try {
            const animation = element.animate(
              [
                {
                  opacity: optical ? 0.6 : 0.5,
                  transform: 'translateY(14px)',
                  ...(optical ? { filter: `blur(${blur}px)` } : {}),
                },
                { opacity: 1, transform: 'none', ...(optical ? { filter: 'blur(0px)' } : {}) },
              ],
              { duration: optical ? 800 : 600, easing: 'cubic-bezier(.22,.68,0,1)' },
            );
            animations.add(animation);
            animation.finished
              .then(() => animations.delete(animation))
              .catch(() => animations.delete(animation));
          } catch {
            /* Enhancement failure preserves the visible base layout. */
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -4% 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    const settle = () => {
      if (preference.matches || document.hidden) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
    };
    preference.addEventListener('change', settle);
    document.addEventListener('visibilitychange', settle);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener('change', settle);
      document.removeEventListener('visibilitychange', settle);
    };
  }, []);
  return null;
}

'use client';
import { useEffect } from 'react';
/** Progressive enhancement: server HTML is always visible, including if JS fails. */
export function SceneMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      active.forEach((a) => a.cancel());
      active.clear();
      if (document.hidden || reduced.matches || !('IntersectionObserver' in window)) return;
      const styles = getComputedStyle(document.documentElement);
      const ease = styles.getPropertyValue('--cinematic').trim() || 'cubic-bezier(.16,1,.3,1)';
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const target = entry.target as HTMLElement;
            observer?.unobserve(target);
            // Short optical arrivals are local to the music headline and closing statement.
            const optical = target.dataset.motion === 'optical';
            const keyframes: Keyframe[] = optical
              ? [
                  { filter: 'blur(32px)', opacity: 0.15, transform: 'translateY(18px) scale(.98)' },
                  {
                    filter: 'blur(8px)',
                    opacity: 0.8,
                    transform: 'translateY(5px) scale(.997)',
                    offset: 0.45,
                  },
                  { filter: 'blur(0px)', opacity: 1, transform: 'translateY(0) scale(1)' },
                ]
              : [
                  { clipPath: 'inset(8% 3% 8% 3% round 28px)', transform: 'scale(.98)' },
                  { clipPath: 'inset(0% 0% 0% 0% round 24px)', transform: 'scale(1)' },
                ];
            const animation = target.animate(keyframes, {
              duration: optical ? 1100 : 1250,
              easing: ease,
              fill: 'none',
            });
            active.add(animation);
            animation.onfinish = () => active.delete(animation);
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      );
      document
        .querySelectorAll<HTMLElement>('[data-motion]')
        .forEach((el) => observer?.observe(el));
    };
    setup();
    reduced.addEventListener('change', setup);
    document.addEventListener('visibilitychange', setup);
    return () => {
      observer?.disconnect();
      active.forEach((a) => a.cancel());
      reduced.removeEventListener('change', setup);
      document.removeEventListener('visibilitychange', setup);
    };
  }, []);
  return null;
}

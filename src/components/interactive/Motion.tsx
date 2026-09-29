'use client';

import { useEffect } from 'react';

// The reference uses whole phrases and surfaces, not individual letters.
// Content stays readable without JS. Paused WAAPI effects prepare only unseen
// elements, and are removed entirely after their one-time entrance.
const EASE = 'cubic-bezier(.22, .8, .25, 1)';
type Entrance = {
  element: HTMLElement;
  group: HTMLElement | null;
  animation: Animation;
  state: 'waiting' | 'running' | 'done';
};

export function Motion() {
  useEffect(() => {
    if (!window.IntersectionObserver || !Element.prototype.animate) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;
    const compact = matchMedia('(max-width: 760px)');
    const entries = new Map<HTMLElement, Entrance>();
    const targets = new Map<HTMLElement, { kind: string; group: HTMLElement | null }>();
    document.querySelectorAll<HTMLElement>('[data-motion-group]').forEach((group) => {
      Array.from(group.children).forEach((child) => {
        if (child instanceof HTMLElement)
          targets.set(child, { kind: group.dataset.motionGroup || 'copy', group });
      });
    });
    document.querySelectorAll<HTMLElement>('[data-motion]').forEach((element) => {
      targets.set(element, { kind: element.dataset.motion || 'media', group: null });
    });

    const settle = (entry: Entrance) => {
      entry.state = 'done';
      entry.animation.cancel();
      entry.element.dataset.motionState = 'done';
    };
    const observer = new IntersectionObserver(
      (changes) => {
        const visible = changes
          .filter((change) => change.isIntersecting)
          .map((change) => entries.get(change.target as HTMLElement))
          .filter((entry): entry is Entrance => !!entry && entry.state === 'waiting');
        const waves = new Map<HTMLElement, { top: number; count: number }>();
        visible.forEach((entry) => {
          observer.unobserve(entry.element);
          if (reduced.matches || document.hidden) return settle(entry);
          let delay = 0;
          if (entry.group) {
            const top = entry.element.getBoundingClientRect().top;
            const wave = waves.get(entry.group);
            const copy = entry.group.dataset.motionGroup === 'copy';
            // Stagger a desktop row; mobile cards enter separately as reached.
            const index = wave && (copy || Math.abs(top - wave.top) < 96) ? wave.count : 0;
            delay = Math.min(index * (copy ? 95 : 135), 320);
            waves.set(entry.group, { top, count: index + 1 });
          }
          entry.animation.effect?.updateTiming({ delay });
          entry.state = 'running';
          entry.element.dataset.motionState = 'running';
          entry.animation.play();
        });
      },
      { threshold: 0, rootMargin: '0px 0px -7% 0px' },
    );

    targets.forEach(({ kind, group }, element) => {
      // Never animate an ancestor and a descendant at the same time.
      if ([...targets.keys()].some((other) => other !== element && other.contains(element))) return;
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= 0 || !rect.width || !rect.height) return;
      const surface = kind === 'cards' || kind === 'media';
      const distance = compact.matches ? (surface ? 28 : 18) : surface ? 48 : 28;
      let animation: Animation;
      try {
        animation = element.animate(
          [
            { opacity: 0, translate: `0 ${distance}px` },
            { opacity: 1, translate: '0 0' },
          ],
          { duration: surface ? 1000 : 820, easing: EASE, fill: 'both' },
        );
      } catch {
        return; // A partial animation implementation must never hide content.
      }
      animation.pause();
      const entry: Entrance = { element, group, animation, state: 'waiting' };
      entries.set(element, entry);
      element.dataset.motionState = 'waiting';
      animation.onfinish = () => settle(entry);
      observer.observe(element);
    });
    const finishAll = () => entries.forEach(settle);
    const onPreference = () => {
      if (reduced.matches) {
        observer.disconnect();
        finishAll();
      }
    };
    const onFocus = (event: FocusEvent) => {
      entries.forEach((entry) => {
        if (event.target instanceof Node && entry.element.contains(event.target)) settle(entry);
      });
    };
    const onVisibility = () => {
      if (document.hidden)
        entries.forEach((entry) => {
          if (entry.state === 'running') settle(entry);
        });
    };
    reduced.addEventListener('change', onPreference);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      finishAll();
      entries.forEach(({ element }) => delete element.dataset.motionState);
      reduced.removeEventListener('change', onPreference);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return null;
}

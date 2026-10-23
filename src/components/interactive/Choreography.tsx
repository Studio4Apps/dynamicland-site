'use client';

import { useEffect } from 'react';

// One controller for the page's editorial motion. Every effect is opt-in by
// data attribute and the markup is complete without it:
//   [data-reveal]          rises out of a soft blur when first seen
//   [data-reveal-group]    staggers its direct children the same way
//   [data-count]           counts up to the number already in the markup
//   [data-draw]            strokes its SVG paths in (pathLength="1")
//   [data-sweep]           a highlight passes over the words once seen
//   [data-scroll]          receives --p (0 → 1) while it crosses the viewport
// Content seen before hydration is never hidden after the fact.
const COUNT_MS = 1700;

export function Choreography() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || typeof IntersectionObserver !== 'function') {
      root.dataset.choreo = 'static';
      return;
    }
    root.dataset.choreo = 'live';
    const cleanups: (() => void)[] = [];
    const fold = innerHeight * 0.92;

    // Reveal and draw: prepare only what is still below the fold.
    const prepare = (element: HTMLElement, delay = 0) => {
      if (element.getBoundingClientRect().top < fold) return false;
      element.style.setProperty('--rd', `${delay}ms`);
      element.dataset.state = 'waiting';
      return true;
    };
    const pending: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      if (prepare(element, Number(element.dataset.reveal) || 0)) pending.push(element);
    });
    document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
      const step = Number(group.dataset.revealGroup) || 90;
      Array.from(group.children).forEach((child, index) => {
        if (child instanceof HTMLElement && prepare(child, Math.min(index * step, 540))) {
          child.dataset.revealChild = '';
          pending.push(child);
        }
      });
    });
    document
      .querySelectorAll<HTMLElement>('[data-draw], [data-sweep]')
      .forEach((element) => {
        if (element.getBoundingClientRect().top < fold) element.dataset.state = 'done';
        else {
          element.dataset.state = 'waiting';
          pending.push(element);
        }
      });

    const counters = new Map<HTMLElement, { target: number; decimals: number; text: string }>();
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((element) => {
      const text = element.textContent ?? '';
      const target = Number(element.dataset.count);
      if (!Number.isFinite(target)) return;
      const decimals = (element.dataset.count?.split('.')[1] ?? '').length;
      counters.set(element, { target, decimals, text });
      if (element.getBoundingClientRect().top >= fold) {
        element.textContent = format(0, decimals);
        pending.push(element);
      }
    });

    const frames = new Set<number>();
    const count = (element: HTMLElement) => {
      const counter = counters.get(element);
      if (!counter) return;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_MS);
        const eased = 1 - Math.pow(1 - t, 4);
        element.textContent =
          t === 1 ? counter.text : format(counter.target * eased, counter.decimals);
        if (t < 1) frames.add(requestAnimationFrame(tick));
      };
      frames.add(requestAnimationFrame(tick));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          if (counters.has(element) && element.dataset.state !== 'waiting') count(element);
          if (element.dataset.state === 'waiting') {
            element.dataset.state = 'running';
            if (counters.has(element)) count(element);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    pending.forEach((element) => observer.observe(element));
    cleanups.push(() => observer.disconnect());

    // A section well out of view is marked asleep, and its looping decoration
    // pauses: an endless animation otherwise restyles (and, for the notch
    // mock-up, lays out) the page on every frame of the visit.
    const sleeper = new IntersectionObserver(
      (entries) =>
        entries.forEach(({ target, isIntersecting }) =>
          (target as HTMLElement).toggleAttribute('data-asleep', !isIntersecting),
        ),
      { rootMargin: '25% 0px' },
    );
    document.querySelectorAll('main > section').forEach((section) => sleeper.observe(section));
    cleanups.push(() => {
      sleeper.disconnect();
      document
        .querySelectorAll('[data-asleep]')
        .forEach((section) => section.removeAttribute('data-asleep'));
    });

    // Scroll-linked progress. --p is 0 when the element's top meets
    // data-scroll-start (fraction of the viewport, default 1 = bottom edge)
    // and 1 when it reaches data-scroll-end (default 0 = top edge).
    const linked = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll]'));
    const bar = document.querySelector<HTMLElement>('[data-scroll-meter]');
    // A custom property restyles the whole subtree, so it is only written when it changes:
    // anything resting above or below its range stays untouched while the page scrolls.
    const written = new Map<HTMLElement, string>();
    const write = (element: HTMLElement, value: string) => {
      if (written.get(element) === value) return;
      written.set(element, value);
      element.style.setProperty('--p', value);
    };
    let queued = 0;
    let total = -1;
    const update = () => {
      queued = 0;
      const height = innerHeight;
      linked.forEach((element) => {
        const start = Number(element.dataset.scrollStart ?? 1) * height;
        const end = Number(element.dataset.scrollEnd ?? 0) * height;
        const top = element.getBoundingClientRect().top;
        const p = Math.min(1, Math.max(0, (start - top) / (start - end || 1)));
        write(element, p.toFixed(4));
      });
      if (bar) {
        // Read only after a resize, so a scroll frame never waits on layout for it.
        if (total < 0) total = root.scrollHeight - height;
        write(bar, total > 0 ? (scrollY / total).toFixed(4) : '0');
      }
    };
    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(update);
    };
    const resize = () => {
      total = -1;
      schedule();
    };
    update();
    const pageSize = new ResizeObserver(resize);
    pageSize.observe(document.body);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', resize, { passive: true });
    cleanups.push(() => {
      pageSize.disconnect();
      removeEventListener('scroll', schedule);
      removeEventListener('resize', resize);
      cancelAnimationFrame(queued);
    });

    // Keyboard focus never waits for an entrance.
    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      target
        ?.closest<HTMLElement>('[data-state="waiting"]')
        ?.setAttribute('data-state', 'done');
    };
    document.addEventListener('focusin', onFocus);
    cleanups.push(() => document.removeEventListener('focusin', onFocus));

    const onPreference = () => {
      if (!reduced.matches) return;
      root.dataset.choreo = 'static';
      document
        .querySelectorAll<HTMLElement>('[data-state="waiting"], [data-state="running"]')
        .forEach((element) => (element.dataset.state = 'done'));
      counters.forEach(({ text }, element) => (element.textContent = text));
    };
    reduced.addEventListener('change', onPreference);
    cleanups.push(() => reduced.removeEventListener('change', onPreference));

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      frames.forEach(cancelAnimationFrame);
      counters.forEach(({ text }, element) => (element.textContent = text));
    };
  }, []);

  return <div className="scrollMeter" data-scroll-meter aria-hidden="true" />;
}

function format(value: number, decimals: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

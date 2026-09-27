'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createMotionScope, MOTION, springEasing } from '@/lib/motion';

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof root.animate !== 'function') return;
    const summary = root.querySelector('summary')!;
    const content = root.querySelector<HTMLElement>('[data-disclosure-content]')!;
    let expanded = root.open;
    const finish = () => {
      root.open = expanded;
      content.style.removeProperty('overflow');
      content.inert = false;
      summary.removeAttribute('aria-expanded');
      delete root.dataset.expanded;
    };
    const scope = createMotionScope(finish);
    const click = (event: MouseEvent) => {
      event.preventDefault();
      expanded = !expanded;
      const from = root.open ? content.getBoundingClientRect().height : 0;
      const opacity = scope.isAnimating(content)
        ? getComputedStyle(content).opacity
        : expanded
          ? '0'
          : '1';
      scope.cancel();
      if (scope.reduced.matches || document.hidden) {
        finish();
        return;
      }
      root.open = true;
      const to = expanded ? content.getBoundingClientRect().height : 0;
      content.style.overflow = 'clip';
      root.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
      content.inert = !expanded;
      const duration = expanded ? MOTION.disclosureOpenMs : MOTION.disclosureCloseMs;
      scope.animate(
        content,
        expanded
          ? [{ opacity }, { opacity: 1 }]
          : [{ opacity }, { opacity: 0, offset: 0.7 }, { opacity: 0 }],
        {
          duration: expanded ? 180 : duration,
          delay: expanded ? 45 : 0,
          fill: 'both',
          easing: 'ease-out',
        },
      );
      scope.animate(
        content,
        [{ height: `${from}px` }, { height: `${to}px` }],
        {
          duration,
          easing: expanded ? springEasing(duration, 0.3, 0.9) : 'cubic-bezier(.22, .78, .22, 1)',
        },
        finish,
      );
    };
    const toggle = () => {
      if (!scope.isAnimating(content)) expanded = root.open;
    };
    summary.addEventListener('click', click);
    root.addEventListener('toggle', toggle);
    return () => {
      summary.removeEventListener('click', click);
      root.removeEventListener('toggle', toggle);
      scope.destroy();
    };
  }, []);
  return (
    <details ref={ref} data-disclosure>
      <summary>{title}</summary>
      <div data-disclosure-content>{children}</div>
    </details>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createMotionScope, springProgress } from '@/lib/motion';
import { product } from '@/content/product';
import { signInPath } from '@/lib/cloud/paths';
import { scrollToSection, sectionContentTop } from '@/lib/scroll';
import styles from './Layout.module.css';

export const navigationLinks = [
  { href: '/#overview', label: 'Overview' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
];

// Privacy and Terms sit with Support, as they do under “Here to help” in the footer.
const supportPaths = ['/support', '/privacy', '/terms'];

export function MorphNavigation() {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const indicator = nav.querySelector<HTMLElement>('[data-nav-indicator]')!;
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'));
    const abort = new AbortController();
    let selected = supportPaths.includes(pathname) ? 3 : 0;
    let applied = -1;
    let preview: number | null = null;
    let placed = false;
    let shown = -1;
    let frame = 0;
    let scrollSettle = 0;
    let navigating: number | null = null;
    let featureTop = Infinity,
      pricingTop = Infinity;
    const scope = createMotionScope();
    const move = (index: number, instant = false) => {
      if (!nav.offsetWidth) {
        placed = false;
        return;
      }
      if (shown === index && !instant) return;
      const container = nav.getBoundingClientRect(),
        target = links[index].getBoundingClientRect();
      const current = indicator.getBoundingClientRect();
      const fromX = current.left - container.left,
        fromWidth = current.width;
      const toX = target.left - container.left,
        toWidth = target.width;
      scope.cancel();
      indicator.style.width = `${toWidth}px`;
      indicator.style.transform = `translateX(${toX}px)`;
      nav.dataset.motionReady = 'true';
      links.forEach((link, i) => {
        link.dataset.highlighted = String(i === index);
      });
      if (placed && !instant) {
        const duration = 560;
        const distance = Math.abs(toX + toWidth / 2 - fromX - fromWidth / 2);
        scope.animate(
          indicator,
          Array.from({ length: 41 }, (_, i) => {
            const t = i / 40,
              p = i === 40 ? 1 : springProgress((t * duration) / 1000, 0.42, 0.78);
            // The centre travels while the edges stretch and rejoin: one surface,
            // not a new hover background appearing under each separate link.
            const stretch = Math.sin(Math.PI * t) * Math.min(distance * 0.18, 24);
            const width = fromWidth + (toWidth - fromWidth) * p + stretch;
            const center = fromX + fromWidth / 2 + (toX + toWidth / 2 - fromX - fromWidth / 2) * p;
            return {
              offset: t,
              width: `${width}px`,
              transform: `translateX(${center - width / 2}px)`,
              borderRadius: `${22 - 3 * Math.sin(Math.PI * t)}px`,
            };
          }),
          { duration, easing: 'linear' },
        );
      }
      placed = true;
      shown = index;
    };
    const currentSection = () => {
      frame = 0;
      // A section is current once its content reaches mid-screen, which is
      // also where a nav jump centres it.
      const position = scrollY + innerHeight / 2;
      selected =
        navigating !== null
          ? navigating
          : supportPaths.includes(pathname)
            ? 3
            : pathname !== '/'
              ? 0
              : position >= pricingTop
                ? 2
                : position >= featureTop
                  ? 1
                  : 0;
      // Scrolling within a section changes nothing: no attribute writes, no layout reads.
      if (selected === applied && (preview !== null || !placed || shown === selected)) return;
      applied = selected;
      links.forEach((link, i) => {
        if (i === selected && (pathname === '/' || pathname === '/support'))
          link.setAttribute('aria-current', pathname === '/' ? 'location' : 'page');
        else link.removeAttribute('aria-current');
      });
      if (preview === null) move(selected);
    };
    const measure = () => {
      const top = (id: string) => {
        const section = document.getElementById(id);
        return section ? sectionContentTop(section) : Infinity;
      };
      featureTop = top('features');
      pricingTop = top('pricing');
      currentSection();
      move(preview ?? selected, true);
    };
    links.forEach((link, index) => {
      link.addEventListener(
        'click',
        (event) => {
          if (
            index > 2 ||
            pathname !== '/' ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const hash = new URL(link.href).hash;
          const target = document.querySelector<HTMLElement>(hash);
          if (!target) return;
          event.preventDefault();
          navigating = index;
          preview = null;
          history.pushState(null, '', hash);
          currentSection();
          scrollToSection(target, scope.reduced.matches ? 'auto' : 'smooth');
          clearTimeout(scrollSettle);
          scrollSettle = window.setTimeout(
            () => {
              navigating = null;
              currentSection();
            },
            scope.reduced.matches ? 0 : 1200,
          );
        },
        { signal: abort.signal },
      );
      link.addEventListener(
        'pointerenter',
        () => {
          preview = index;
          move(index);
        },
        { signal: abort.signal },
      );
      link.addEventListener(
        'focus',
        () => {
          preview = index;
          move(index);
        },
        { signal: abort.signal },
      );
    });
    nav.addEventListener(
      'pointerleave',
      () => {
        preview = null;
        move(selected);
      },
      { signal: abort.signal },
    );
    nav.addEventListener(
      'focusout',
      (event) => {
        if (!nav.contains(event.relatedTarget as Node)) {
          preview = null;
          move(selected);
        }
      },
      { signal: abort.signal },
    );
    window.addEventListener(
      'scroll',
      () => {
        if (!frame) frame = requestAnimationFrame(currentSection);
        if (navigating !== null) {
          clearTimeout(scrollSettle);
          scrollSettle = window.setTimeout(() => {
            navigating = null;
            preview = null;
            currentSection();
          }, 140);
        }
      },
      { signal: abort.signal, passive: true },
    );
    window.addEventListener('resize', measure, { signal: abort.signal });
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(document.body);
    measure();
    // Arriving from another page (/#pricing) the browser only aligns the
    // section's padded top; centre it the way an in-page jump would.
    const arrival = links.find((link, i) => i < 3 && link.hash === location.hash);
    const arrivalTarget =
      pathname === '/' && arrival ? document.querySelector<HTMLElement>(arrival.hash) : null;
    if (arrivalTarget) scrollToSection(arrivalTarget, 'auto');
    return () => {
      abort.abort();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(scrollSettle);
      scope.destroy();
    };
  }, [pathname]);
  return (
    <nav ref={ref} aria-label="Main navigation" className={styles.desktopNav}>
      <span className={styles.navIndicator} data-nav-indicator aria-hidden="true" />
      {navigationLinks.map((link) => (
        <a key={link.href} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

/** Account and download actions, in their own glass at the end of the header. */
export function NavigationActions() {
  return (
    <div className={styles.navActions}>
      <a href={signInPath} className={styles.navSignIn}>
        Sign in
      </a>
      <a href={product.downloadUrl} className={styles.navDownload}>
        Download
      </a>
    </div>
  );
}

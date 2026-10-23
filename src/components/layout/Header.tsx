'use client';
import Image from 'next/image';
import { useEffect, useRef, type MouseEvent } from 'react';
import { product } from '@/content/product';
import { DownloadButton } from '@/components/DownloadButton';
import { Arrow } from '@/components/Icon';
import { createMobileMenuMotion } from './mobile-menu-motion';
import { createMobileMenuGlass } from './mobile-menu-glass';
import { MorphNavigation, NavigationActions, navigationLinks as links } from './MorphNavigation';
import { signInPath } from '@/lib/cloud/paths';
import { scrollToSection } from '@/lib/scroll';
import { whenIdle } from '@/lib/idle';
import styles from './Layout.module.css';

export function Header() {
  const header = useRef<HTMLElement>(null);
  const top = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const menuMotion = useRef<ReturnType<typeof createMobileMenuMotion> | null>(null);
  useEffect(() => {
    const disclosure = menu.current;
    const nav = header.current;
    const marker = top.current;
    if (!disclosure || !nav || !marker) return;
    menuMotion.current = createMobileMenuMotion(disclosure, nav);
    // The refraction map is drawn and PNG-encoded on the main thread; the CSS glass stands in
    // until the page is idle.
    let stopGlass = () => {};
    const cancelGlass = whenIdle(() => {
      stopGlass = createMobileMenuGlass(disclosure, nav);
    });
    // The header reads whatever is actually behind it: an explicit data-header-tone (night
    // artwork), otherwise the first opaque surface spanning most of the page, so small pieces
    // of an illustration passing underneath don't flip it. Sections can change colour freely.
    const toneAt = (x: number, y: number) => {
      for (const element of document.elementsFromPoint(x, y)) {
        if (nav.contains(element)) continue;
        const tone = (element as HTMLElement).dataset?.headerTone;
        if (tone) return tone === 'dark';
        const [r, g, b, a = 1] = (
          getComputedStyle(element).backgroundColor.match(/[\d.]+/g) ?? []
        ).map(Number);
        if (a >= 0.5 && element.getBoundingClientRect().width >= innerWidth * 0.85)
          return 0.299 * r + 0.587 * g + 0.114 * b < 128;
      }
      return false;
    };
    // A hit test forces layout, so it never runs per scroll frame: only when a surface that
    // could answer it crosses the header's midline, and once more when scrolling settles.
    let frame = 0;
    let settle = 0;
    let line: IntersectionObserver | undefined;
    let surfaces: HTMLElement[] = [];
    let band = '';
    const tone = () => {
      frame = 0;
      const dark = String(toneAt(innerWidth / 2, nav.offsetHeight / 2));
      if (nav.dataset.onDark !== dark) nav.dataset.onDark = dark;
    };
    const retone = () => {
      if (!frame) frame = requestAnimationFrame(tone);
    };
    const watch = () => {
      const middle = Math.round(nav.offsetHeight / 2);
      const margin = `-${middle}px 0px -${Math.max(innerHeight - middle - 1, 0)}px 0px`;
      if (margin === band || typeof IntersectionObserver !== 'function') return;
      band = margin;
      line?.disconnect();
      line = new IntersectionObserver(retone, { rootMargin: margin });
      surfaces.forEach((surface) => line?.observe(surface));
    };
    const collect = () => {
      surfaces = Array.from(document.body.querySelectorAll<HTMLElement>('*')).filter(
        (element) =>
          !nav.contains(element) &&
          (element.dataset.headerTone ||
            Number(getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.[3] ?? 1) >= 0.5),
      );
      band = '';
      watch();
    };
    // Reading scrollY in a scroll event forces layout; the marker 12px down the page reports
    // when it has scrolled out of view instead.
    const lifted = new IntersectionObserver(([entry]) => {
      nav.dataset.scrolled = String(!entry?.isIntersecting);
    });
    lifted.observe(marker);
    const scroll = () => {
      clearTimeout(settle);
      settle = window.setTimeout(retone, 120);
    };
    const resize = () => {
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        watch();
        retone();
      }, 120);
    };
    tone();
    // Reading every element's background is work for an idle moment, not for first paint.
    const cancelCollect = whenIdle(collect);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      cancelGlass();
      stopGlass();
      menuMotion.current?.destroy();
      menuMotion.current = null;
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      cancelCollect();
      line?.disconnect();
      lifted.disconnect();
    };
  }, []);
  const navigateMobile = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
    if (!anchor || !menu.current) return;
    const destination = new URL(anchor.href);
    const target = destination.hash ? document.querySelector<HTMLElement>(destination.hash) : null;
    if (
      location.pathname === '/' &&
      destination.pathname === '/' &&
      target &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      history.pushState(null, '', destination.hash);
      menuMotion.current?.close(false, true);
      requestAnimationFrame(() =>
        scrollToSection(
          target,
          matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        ),
      );
      return;
    }
    menuMotion.current?.close(false, true);
  };
  return (
    <>
      <span ref={top} className={styles.topMarker} aria-hidden="true" />
      <header ref={header} className={styles.header}>
        <div className={`container ${styles.headerInner}`} data-menu-backdrop>
          <a href="/" className={styles.brand} aria-label="DynamicLand home">
            <Image src={product.logo} alt="" width={34} height={34} priority unoptimized />
            <span>DynamicLand</span>
          </a>
          <MorphNavigation />
          <NavigationActions />
          <div className={styles.headerActions}>
            <DownloadButton compact />
            <span className={styles.menuSpace} aria-hidden="true" />
          </div>
        </div>
        <details ref={menu} className={styles.mobileMenu} data-mobile-menu>
          <summary aria-label="Open navigation menu" aria-controls="mobile-navigation">
            <span className={styles.triggerGlass} data-menu-trigger-glass aria-hidden="true" />
            <span className={styles.menuLines} data-menu-icon aria-hidden="true" />
          </summary>
          <div className={styles.mobilePanel} data-menu-panel>
            <span className={styles.menuGlass} data-menu-glass aria-hidden="true" />
            <div className={styles.menuClip} data-menu-clip>
              <nav id="mobile-navigation" aria-label="Mobile navigation" onClick={navigateMobile}>
                {links.map((link) => (
                  <a key={link.href} href={link.href}>
                    <span>{link.label}</span>
                    <Arrow size={16} />
                  </a>
                ))}
                <a href={signInPath} className={styles.menuSignIn}>
                  <span>Sign in</span>
                  <Arrow size={16} />
                </a>
              </nav>
            </div>
          </div>
        </details>
      </header>
    </>
  );
}

'use client';
import Image from 'next/image';
import { useEffect, useRef, type MouseEvent } from 'react';
import { product } from '@/content/product';
import { DownloadButton } from '@/components/DownloadButton';
import { Arrow } from '@/components/Icon';
import { createMotionScope, entranceFrames } from '@/lib/motion';
import { MorphNavigation, navigationLinks as links } from './MorphNavigation';
import styles from './Layout.module.css';

export function Header() {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const disclosure = menu.current;
    const nav = header.current;
    if (!disclosure || !nav) return;
    const motion = createMotionScope();
    const close = (restore = false) => {
      disclosure.open = false;
      if (restore) trigger.current?.focus();
    };
    const toggle = () => {
      motion.cancel();
      const panel = disclosure.querySelector<HTMLElement>('nav');
      if (disclosure.open && panel) {
        motion.animate(panel, entranceFrames({ y: -8, scale: 0.985, opacity: 1, duration: 340 }), {
          duration: 340,
          easing: 'linear',
        });
      }
      trigger.current?.setAttribute(
        'aria-label',
        disclosure.open ? 'Close navigation menu' : 'Open navigation menu',
      );
      // Safari does not necessarily focus a clicked summary. Establish a
      // predictable starting point without moving focus out of an open menu.
      if (disclosure.open && !disclosure.contains(document.activeElement))
        trigger.current?.focus({ preventScroll: true });
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && disclosure.open) {
        close(true);
        event.preventDefault();
      }
    };
    const pointer = (event: PointerEvent) => {
      if (disclosure.open && !nav.contains(event.target as Node)) close();
    };
    const focus = (event: FocusEvent) => {
      if (disclosure.open && !nav.contains(event.target as Node)) close();
    };
    const size = matchMedia('(min-width: 761px)');
    const resize = () => {
      if (size.matches && disclosure.open) {
        const restore = disclosure.contains(document.activeElement);
        close();
        if (restore) nav.querySelector<HTMLAnchorElement>('a')?.focus();
      }
    };
    const scroll = () => {
      nav.dataset.scrolled = String(window.scrollY > 12);
    };
    scroll();
    disclosure.addEventListener('toggle', toggle);
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('focusin', focus);
    size.addEventListener('change', resize);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      motion.destroy();
      disclosure.removeEventListener('toggle', toggle);
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('focusin', focus);
      size.removeEventListener('change', resize);
      window.removeEventListener('scroll', scroll);
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
      menu.current.open = false;
      requestAnimationFrame(() =>
        target.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        }),
      );
      return;
    }
    menu.current.open = false;
  };
  return (
    <header ref={header} className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <a href="/" className={styles.brand} aria-label="DynamicLand home">
          <Image src={product.logo} alt="" width={34} height={34} priority unoptimized />
          <span>DynamicLand</span>
        </a>
        <MorphNavigation />
        <div className={styles.headerActions}>
          <DownloadButton compact />
          <details ref={menu} className={styles.mobileMenu}>
            <summary
              ref={trigger}
              aria-label="Open navigation menu"
              aria-controls="mobile-navigation"
            >
              <span className={styles.menuLines} aria-hidden="true" />
            </summary>
            <nav id="mobile-navigation" aria-label="Mobile navigation" onClick={navigateMobile}>
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  <span>{link.label}</span>
                  <Arrow size={16} />
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

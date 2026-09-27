'use client';
import Image from 'next/image';
import { useEffect, useRef, type MouseEvent } from 'react';
import { product } from '@/content/product';
import { DownloadButton } from '@/components/DownloadButton';
import { Arrow } from '@/components/Icon';
import { createMobileMenuMotion } from './mobile-menu-motion';
import { MorphNavigation, navigationLinks as links } from './MorphNavigation';
import styles from './Layout.module.css';

export function Header() {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const menuMotion = useRef<ReturnType<typeof createMobileMenuMotion> | null>(null);
  useEffect(() => {
    const disclosure = menu.current;
    const nav = header.current;
    if (!disclosure || !nav) return;
    menuMotion.current = createMobileMenuMotion(disclosure, nav);
    const scroll = () => {
      nav.dataset.scrolled = String(window.scrollY > 12);
    };
    scroll();
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      menuMotion.current?.destroy();
      menuMotion.current = null;
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
      menuMotion.current?.close(false, true);
      requestAnimationFrame(() =>
        target.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        }),
      );
      return;
    }
    menuMotion.current?.close(false, true);
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
                </nav>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

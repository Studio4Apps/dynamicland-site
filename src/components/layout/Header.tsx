'use client';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { product } from '@/content/product';
import { DownloadButton } from '@/components/DownloadButton';
import styles from './Layout.module.css';

const links = [
  { href: '/#overview', label: 'Overview' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
];
export function Header() {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const disclosure = menu.current;
    const nav = header.current;
    if (!disclosure || !nav) return;
    const close = (restore = false) => {
      disclosure.open = false;
      if (restore) trigger.current?.focus();
    };
    const toggle = () => {
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
      disclosure.removeEventListener('toggle', toggle);
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('focusin', focus);
      size.removeEventListener('change', resize);
      window.removeEventListener('scroll', scroll);
    };
  }, []);
  return (
    <header ref={header} className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <a href="/" className={styles.brand} aria-label="DynamicLand home">
          <Image src={product.logo} alt="" width={34} height={34} priority unoptimized />
          <span>DynamicLand</span>
        </a>
        <nav aria-label="Main navigation" className={styles.desktopNav}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
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
            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a') && menu.current)
                  menu.current.open = false;
              }}
            >
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

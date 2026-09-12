'use client';
import { useEffect, useRef, useState } from 'react';
import { navigation } from '@/content/site';
import { DownloadButton } from '@/components/ui/DownloadButton';
export function Header() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const pointer = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setOpen(false);
    };
    const resize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', pointer);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', pointer);
      window.removeEventListener('resize', resize);
    };
  }, [open]);
  return (
    <header className="header-wrap" ref={header}>
      <nav className={`product-nav ${open ? 'menu-open' : ''}`} aria-label="Main navigation">
        <a href="/" className="wordmark" aria-label="DynamicLand home">
          <span className="brand-point" aria-hidden="true" />
          DynamicLand
        </a>
        <div className="desktop-links">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <DownloadButton compact />
          <button
            ref={trigger}
            className="menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
          </button>
        </div>
        <div className="mobile-menu" id="mobile-menu" inert={!open}>
          <div>
            {navigation.map((item) => (
              <a href={item.href} key={item.href} onClick={() => setOpen(false)}>
                {item.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

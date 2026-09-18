'use client';
import { useEffect, useRef, useState } from 'react';
import { navigation } from '@/content/site';
import { DownloadButton } from '@/components/ui/DownloadButton';
export function Header() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const surface = nav.current;
    if (!surface) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let x = 18;
    let y = 0;

    const paint = () => {
      frame = 0;
      surface.style.setProperty('--glass-x', `${x}%`);
      surface.style.setProperty('--glass-y', `${y}%`);
    };
    const schedulePaint = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      const bounds = surface.getBoundingClientRect();
      x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
      schedulePaint();
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0) return;
      surface.dataset.glassActive = 'true';
      move(event);
    };
    const release = () => {
      delete surface.dataset.glassActive;
      schedulePaint();
    };
    const leave = () => {
      release();
      x = 18;
      y = 0;
      schedulePaint();
    };

    surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerdown', press, { passive: true });
    surface.addEventListener('pointerleave', leave, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerdown', press);
      surface.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, []);
  useEffect(() => {
    const landscape = document.querySelector('.hero-landscape');
    if (!landscape || !header.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        header.current?.toggleAttribute('data-scrolled', !entry.isIntersecting);
      },
      { rootMargin: '-90px 0px 0px 0px' },
    );
    observer.observe(landscape);
    return () => observer.disconnect();
  }, []);
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
      <nav
        ref={nav}
        className={`product-nav ${open ? 'menu-open' : ''}`}
        aria-label="Main navigation"
      >
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

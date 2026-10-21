'use client';

import { useEffect, useRef } from 'react';
import { media } from '@/content/media';
import { validateMedia } from '@/lib/media-validation';
import styles from './MacShowcase.module.css';

const slot = media.showcase;
const DOCK = [
  '#2f7bf6',
  '#34c759',
  '#ff9f0a',
  '#ff375f',
  '#8e5cf7',
  '#5ac8fa',
  '#ffd60a',
  '#a2845e',
];

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// A MacBook, built as real 3D planes, that rises into view with DynamicLand
// running at the notch, then folds its lid down onto the keyboard as the
// visitor scrolls on. Script only turns scroll into
// two numbers, --enter and --close; every transform is derived from them in CSS.
export function MacShowcase() {
  validateMedia(slot);
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduced.matches) {
        root.style.setProperty('--enter', '1');
        root.style.setProperty('--close', '0');
        return;
      }
      const rect = root.getBoundingClientRect();
      const view = innerHeight;
      // Rising in: from the section's top entering the viewport to it reaching the top.
      const enter = easeOut(clamp(1 - rect.top / view));
      // Closing: a stretch of the pinned scroll, held open first so the island is seen.
      const pinned = Math.max(root.offsetHeight - view, 1);
      const progress = clamp(-rect.top / pinned);
      const close = easeInOut(clamp((progress - 0.15) / 0.7));
      root.style.setProperty('--enter', enter.toFixed(4));
      root.style.setProperty('--close', close.toFixed(4));
      root.dataset.closed = String(close > 0.98);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    reduced.addEventListener('change', request);

    // The screen recording only plays while the lid is up and in view.
    const clip = video.current;
    const observer =
      clip && typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            if (entry?.isIntersecting && !reduced.matches) clip.play().catch(() => {});
            else clip.pause();
          })
        : null;
    if (clip) observer?.observe(clip);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      removeEventListener('scroll', request);
      removeEventListener('resize', request);
      reduced.removeEventListener('change', request);
    };
  }, []);

  return (
    <section ref={section} className={styles.showcase} aria-labelledby="showcase-title">
      <div className={styles.pin}>
        <div className={styles.copy}>
          <div className={styles.lead}>
            <h2 id="showcase-title">It lives in your notch.</h2>
            <p>
              Music, widgets, and timers unfold right where you look, then tuck away the moment
              you&rsquo;re done.
            </p>
          </div>
          <p className={styles.outro} aria-hidden="true">
            Close the lid. It&rsquo;s ready when you are.
          </p>
        </div>

        <div className={styles.scene} aria-hidden="true">
          <div className={styles.laptop}>
            <div className={styles.lid}>
              <div className={styles.front}>
                <div className={styles.display}>
                  {slot.src ? (
                    <video
                      ref={video}
                      className={styles.recording}
                      src={slot.src}
                      poster={slot.poster}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className={styles.desktop}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.wallpaper}
                        src="/media/lake-960.webp"
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <div className={styles.menubar}>
                        <span>DynamicLand</span>
                        <span>File</span>
                        <span>Edit</span>
                        <span>View</span>
                        <span className={styles.clock}>9:41</span>
                      </div>
                      <div className={styles.dock}>
                        {DOCK.map((color) => (
                          <span key={color} style={{ background: color }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={styles.island}>
                    <span className={styles.art} />
                    <span className={styles.track}>
                      <b />
                      <i />
                    </span>
                    <span className={styles.bars}>
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                  <span className={styles.glare} />
                  <span className={styles.dim} />
                </div>
              </div>
              <div className={styles.back}>
                {/* The Apple logo set into the aluminium, polished dark as on a real lid. */}
                <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient id="lid-logo-polish" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#5d5f65" />
                      <stop offset="0.38" stopColor="#2c2d31" />
                      <stop offset="0.52" stopColor="#7a7c83" />
                      <stop offset="0.6" stopColor="#36373b" />
                      <stop offset="1" stopColor="#1f2023" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="url(#lid-logo-polish)"
                    stroke="#ffffff40"
                    strokeWidth="0.2"
                  />
                </svg>
              </div>
              <span className={styles.rim} />
            </div>
            {/* The base: its top deck lies flat, reaching towards the viewer. */}
            <div className={styles.deck}>
              <span className={styles.keyboard} />
              <span className={styles.trackpad} />
            </div>
            <div className={styles.edge}>
              <span className={styles.scoop} />
            </div>
            <span className={styles.shadow} />
          </div>
        </div>
      </div>
    </section>
  );
}

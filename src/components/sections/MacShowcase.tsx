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
              <div className={styles.back} />
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

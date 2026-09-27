'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createGalleryController, GALLERY_TIMING, type GalleryState } from './gallery-controller';
import styles from './Interactive.module.css';

type GalleryItem = { id: string; label: string; content: ReactNode };
export function Gallery({
  items,
  dwellMs = GALLERY_TIMING.dwellMs,
}: {
  items: GalleryItem[];
  dwellMs?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GalleryState>({
    current: 0,
    start: true,
    end: items.length <= 1,
    playback: 'Play',
    announcement: '',
  });
  useEffect(() => {
    if (!root.current || !items.length) return;
    return createGalleryController(root.current, dwellMs, setState);
  }, [items.length, dwellMs]);

  return (
    <div
      ref={root}
      className={styles.gallery}
      role="region"
      aria-roledescription="carousel"
      aria-label="DynamicLand highlights"
      data-timing={GALLERY_TIMING.mode}
    >
      {items.length > 1 && (
        <div className={`container ${styles.galleryControls}`}>
          <div className={styles.playbackGroup}>
            {/* First in reading/tab order, visually after the pagination. */}
            <button
              type="button"
              data-rotation
              className={styles.playback}
              aria-label={`${state.playback} slideshow`}
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
                {state.playback === 'Pause' ? (
                  <path d="M4 1h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm9 0h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" />
                ) : (
                  <path d="M4 2.1c0-.9.9-1.4 1.7-.9l12 7.9c.7.4.7 1.4 0 1.8l-12 7.9c-.8.5-1.7 0-1.7-.9z" />
                )}
              </svg>
            </button>
            <div className={styles.dots} role="group" aria-label="Choose a highlight">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  data-gallery-dot={index}
                  aria-label={`Show ${item.label}`}
                  aria-current={state.current === index ? 'true' : undefined}
                >
                  <span className={styles.indicator} data-indicator aria-hidden="true">
                    <span className={styles.fill} data-dwell-fill />
                  </span>
                </button>
              ))}
            </div>
          </div>
          <span className={styles.galleryCount} aria-hidden="true">
            {String(state.current + 1).padStart(2, '0')}
            <span> / {String(items.length).padStart(2, '0')}</span>
          </span>
        </div>
      )}
      <div
        data-gallery-track
        className={styles.track}
        role="group"
        aria-label="Highlight slides"
        tabIndex={0}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            data-gallery-card
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}: ${item.label}`}
          >
            {item.content}
          </div>
        ))}
        <div className={styles.trailer} aria-hidden="true" />
      </div>
      <p
        className="srOnly"
        aria-live={state.playback === 'Pause' ? 'off' : 'polite'}
        aria-atomic="true"
      >
        {state.announcement}
      </p>
    </div>
  );
}

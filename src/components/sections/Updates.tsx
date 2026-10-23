'use client';

import { useEffect, useRef, useState } from 'react';
import { updates, type ReleaseUpdate } from '@/content/updates';
import styles from './Updates.module.css';
import { applyImagePalette } from '@/lib/image-palette';
import { whenIdle } from '@/lib/idle';

// The rail scrolls natively on touch. Arrows and mouse drags move it card by
// card to exact snap positions, so smooth scrolling and snapping never fight.
function snapPoints(rail: HTMLElement) {
  const pad = parseFloat(getComputedStyle(rail).scrollPaddingLeft) || 0;
  const max = rail.scrollWidth - rail.clientWidth;
  return [...rail.querySelectorAll<HTMLElement>('[data-release]')].map((card) =>
    Math.max(0, Math.min(card.offsetLeft - pad, max)),
  );
}
function nearest(points: number[], left: number) {
  return points.reduce(
    (best, point, i) => (Math.abs(point - left) < Math.abs(points[best] - left) ? i : best),
    0,
  );
}
function glide(rail: HTMLElement, index: number, target: { current: number | null }) {
  const points = snapPoints(rail);
  const next = Math.max(0, Math.min(index, points.length - 1));
  // Already there: no scroll will run, so nothing must wait for one to end.
  target.current = Math.abs(points[next] - rail.scrollLeft) < 2 ? null : next;
  rail.scrollTo({
    left: points[next],
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}

export function Updates() {
  const [selected, setSelected] = useState<ReleaseUpdate | null>(null);
  const [closing, setClosing] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Card the rail is gliding to, so repeated presses build on it.
  const target = useRef<number | null>(null);
  const step = (direction: 1 | -1) => {
    const rail = track.current;
    if (!rail) return;
    const points = snapPoints(rail);
    const from = target.current ?? nearest(points, rail.scrollLeft);
    // The last cards can share one stop at the end of the rail; skip past them.
    let to = from + direction;
    while (to > 0 && to < points.length - 1 && points[to] === points[from]) to += direction;
    glide(rail, to, target);
  };

  useEffect(() => {
    const rail = track.current;
    if (!rail) return;
    const measure = () =>
      setEdges({
        start: rail.scrollLeft <= 2,
        end: rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2,
      });
    let settle: ReturnType<typeof setTimeout> | undefined;
    let start: { x: number; left: number } | null = null;
    const settled = () => {
      // Mid-drag the rail scrolls in small steps; only a finished glide counts.
      if (start) return;
      target.current = null;
      delete rail.dataset.dragging;
      measure();
    };
    const onScroll = () => {
      measure();
      // Fallback for browsers without scrollend.
      clearTimeout(settle);
      settle = setTimeout(settled, 160);
    };
    measure();
    rail.addEventListener('scroll', onScroll, { passive: true });
    rail.addEventListener('scrollend', settled);
    const observer = new ResizeObserver(measure);
    observer.observe(rail);

    // Mouse drag: follow the pointer, then glide to the card it was thrown towards.
    let moved = false;
    let last = { x: 0, t: 0, v: 0 };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      start = { x: event.clientX, left: rail.scrollLeft };
      moved = false;
      last = { x: event.clientX, t: event.timeStamp, v: 0 };
    };
    const move = (event: PointerEvent) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      if (!moved) {
        if (Math.abs(dx) < 6) return;
        moved = true;
        target.current = null;
        rail.dataset.dragging = 'true';
        rail.setPointerCapture(event.pointerId);
      }
      rail.scrollLeft = start.left - dx;
      const dt = Math.max(event.timeStamp - last.t, 1);
      last = { x: event.clientX, t: event.timeStamp, v: (event.clientX - last.x) / dt };
    };
    const up = (event: PointerEvent) => {
      if (!start) return;
      start = null;
      if (!moved) return;
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      // A drag is never a click on the card under the pointer. The click, if
      // any, follows this pointerup at once; the guard is gone a tick later.
      const swallow = (click: MouseEvent) => {
        click.preventDefault();
        click.stopPropagation();
      };
      rail.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => rail.removeEventListener('click', swallow, { capture: true }), 0);
      const points = snapPoints(rail);
      const thrown = rail.scrollLeft - last.v * 220;
      glide(rail, nearest(points, thrown), target);
    };
    rail.addEventListener('pointerdown', down);
    rail.addEventListener('pointermove', move);
    rail.addEventListener('pointerup', up);
    rail.addEventListener('pointercancel', up);
    return () => {
      clearTimeout(settle);
      rail.removeEventListener('scroll', onScroll);
      rail.removeEventListener('scrollend', settled);
      rail.removeEventListener('pointerdown', down);
      rail.removeEventListener('pointermove', move);
      rail.removeEventListener('pointerup', up);
      rail.removeEventListener('pointercancel', up);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selected || !dialog.current) return;
    const modal = dialog.current;
    const source = [...(track.current?.querySelectorAll<HTMLElement>('[data-release]') ?? [])].find(
      (card) => card.dataset.release === selected.id,
    );
    if (source)
      modal.style.setProperty(
        '--release-colors',
        getComputedStyle(source).getPropertyValue('--release-colors'),
      );
    const image = source?.querySelector('img');
    const syncPalette = () => {
      if (image) applyImagePalette(image, modal, selected.paletteTone);
    };
    if (image?.complete && image.naturalWidth) syncPalette();
    else image?.addEventListener('load', syncPalette, { once: true });
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const bodyWidth = document.body.style.width;
    const reserved = window.innerWidth - document.body.getBoundingClientRect().width;
    const keepWidth = () => {
      document.body.style.width = `${window.innerWidth - reserved}px`;
    };
    keepWidth();
    window.addEventListener('resize', keepWidth);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    modal.showModal();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      image?.removeEventListener('load', syncPalette);
      modal.close();
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.width = bodyWidth;
      window.removeEventListener('resize', keepWidth);
      opener?.focus({ preventScroll: true });
    };
  }, [selected]);

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
    timer.current = setTimeout(() => {
      setSelected(null);
      setClosing(false);
    }, duration);
  };

  return (
    <section id="updates" className={`section ${styles.section}`} aria-labelledby="updates-title">
      <div className={`container ${styles.heading}`}>
        <div data-motion-group="copy">
          <span className="eyebrow">The latest from DynamicLand</span>
          <h2 id="updates-title">A little more. With every update.</h2>
        </div>
        <p data-motion="copy">
          Every release brings something new to your island. Open an update to see everything that
          changed.
        </p>
      </div>
      <div
        ref={track}
        className={styles.track}
        data-motion="cards"
        aria-label="DynamicLand updates"
      >
        {updates.map((release) => (
          <UpdateCard key={release.id} release={release} onOpen={() => setSelected(release)} />
        ))}
      </div>
      <div className={`container ${styles.controls}`}>
        <button aria-label="Previous update" disabled={edges.start} onClick={() => step(-1)}>
          <Chevron direction="previous" />
        </button>
        <button aria-label="Next update" disabled={edges.end} onClick={() => step(1)}>
          <Chevron direction="next" />
        </button>
      </div>
      {selected && (
        <dialog
          ref={dialog}
          className={`${styles.dialog} ${closing ? styles.closing : ''}`}
          aria-labelledby="update-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            dismiss();
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const box = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < box.left ||
              event.clientX > box.right ||
              event.clientY < box.top ||
              event.clientY > box.bottom
            )
              dismiss();
          }}
        >
          <button
            className={styles.close}
            aria-label="Close update details"
            onClick={dismiss}
            autoFocus
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div
            className={styles.dialogContent}
            tabIndex={0}
            role="region"
            aria-label="Release notes"
          >
            <span className={styles.version}>DynamicLand {selected.version}</span>
            <h2 id="update-dialog-title">
              What’s new in <span>{selected.name}.</span>
            </h2>
            <div className={styles.notes}>
              {selected.notes ? (
                selected.notes.split(/\n\s*\n/).map((block, index) => (
                  <div key={index} className={styles.noteBlock}>
                    {block.split('\n').map((line, lineIndex) =>
                      /^[A-Z][A-Z ,-]+$/.test(line) ? (
                        <h3 key={lineIndex}>
                          {line.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}
                        </h3>
                      ) : line.startsWith('• ') ? (
                        <p key={lineIndex} className={styles.bullet}>
                          {line.slice(2)}
                        </p>
                      ) : (
                        <p key={lineIndex}>{line}</p>
                      ),
                    )}
                  </div>
                ))
              ) : (
                <p>Release notes will be available here soon.</p>
              )}
            </div>
            {selected.source && (
              <a className="textLink" href={selected.source} target="_blank" rel="noreferrer">
                View on the App Store ↗
              </a>
            )}
          </div>
        </dialog>
      )}
    </section>
  );
}

function UpdateCard({ release, onOpen }: { release: ReleaseUpdate; onOpen: () => void }) {
  const card = useRef<HTMLButtonElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const surface = card.current;
    const title = name.current;
    if (!surface || !title) return;
    const measure = () => {
      // Layout coordinates stay stable while the same title animates above the glass.
      const scale = 1.16;
      surface.style.setProperty(
        '--name-x',
        `${(surface.clientWidth - title.offsetWidth * scale) / 2 - title.offsetLeft}px`,
      );
      surface.style.setProperty(
        '--name-y',
        `${surface.clientHeight / 2 + 28 - title.offsetTop - title.offsetHeight / 2}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    observer.observe(title);
    measure();
    return () => observer.disconnect();
  }, []);
  // Sampling the palette decodes the image on the main thread, so it waits for an idle moment.
  const paint = (image: HTMLImageElement) =>
    whenIdle(() => {
      if (card.current) applyImagePalette(image, card.current, release.paletteTone);
    });
  return (
    <button
      ref={card}
      className={styles.card}
      data-release={release.id}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`See what’s new in ${release.name}, DynamicLand ${release.version}`}
    >
      <span className={styles.cardHeading}>
        <span className={styles.version}>DynamicLand {release.version}</span>
        <span ref={name} className={styles.name}>
          {release.name}
        </span>
      </span>
      <span className={styles.artwork}>
        {release.image && (
          // The 4096px original is a 35MB bitmap once decoded; phones take a reduced export.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={release.image}
            srcSet={release.imageSet}
            sizes="(max-width: 960px) 94vw, 896px"
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            ref={(image) => {
              // Loaded before hydration: no load event will follow.
              if (image?.complete && image.naturalWidth) paint(image);
            }}
            onLoad={(event) => paint(event.currentTarget)}
          />
        )}
      </span>
      <span className={styles.hover} aria-hidden="true">
        <span>See what’s new in</span>
      </span>
      <span className={styles.plus} aria-hidden="true">
        +
      </span>
    </button>
  );
}

function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <path
        d={direction === 'next' ? 'M15.5 11.5 22 18l-6.5 6.5' : 'M20.5 11.5 14 18l6.5 6.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { updates, type ReleaseUpdate } from '@/content/updates';
import styles from './Updates.module.css';
import { applyImagePalette } from '@/lib/image-palette';

export function Updates() {
  const [selected, setSelected] = useState<ReleaseUpdate | null>(null);
  const [closing, setClosing] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const rail = track.current;
    if (!rail) return;
    const measure = () =>
      setEdges({
        start: rail.scrollLeft <= 2,
        end: rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2,
      });
    measure();
    rail.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => {
      rail.removeEventListener('scroll', measure);
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
        <div>
          <span className="eyebrow">The latest from DynamicLand</span>
          <h2 id="updates-title">A little more. With every update.</h2>
        </div>
      </div>
      <div ref={track} className={styles.track} aria-label="DynamicLand updates">
        {updates.map((release) => (
          <UpdateCard key={release.id} release={release} onOpen={() => setSelected(release)} />
        ))}
      </div>
      <div className={`container ${styles.controls}`}>
        <button
          aria-label="Previous update"
          disabled={edges.start}
          onClick={() =>
            track.current?.scrollBy({
              left: -track.current.clientWidth * 0.75,
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            })
          }
        >
          ←
        </button>
        <button
          aria-label="Next update"
          disabled={edges.end}
          onClick={() =>
            track.current?.scrollBy({
              left: track.current.clientWidth * 0.75,
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            })
          }
        >
          →
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
          <Image
            src={release.image}
            alt=""
            fill
            sizes="(max-width: 960px) 94vw, 896px"
            onLoad={(event) => {
              if (card.current)
                applyImagePalette(event.currentTarget, card.current, release.paletteTone);
            }}
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

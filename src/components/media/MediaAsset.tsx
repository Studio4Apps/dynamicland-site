'use client';
import { useEffect, useRef, useState } from 'react';
import type { MediaSlot } from '@/content/media';
import styles from './MediaFrame.module.css';
import { validateMedia } from '@/lib/media-validation';

export function MediaAsset({ slot }: { slot: MediaSlot }) {
  validateMedia(slot);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const pause = () => element.pause();
    const visibility = () => {
      if (document.hidden) pause();
    };
    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            if (!entries[0]?.isIntersecting) pause();
          })
        : null;
    observer?.observe(element);
    preference.addEventListener('change', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      pause();
      observer?.disconnect();
      preference.removeEventListener('change', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  if (failed || !slot.src)
    return (
      <span className={styles.label} aria-hidden="true" data-nosnippet>
        {slot.label}
      </span>
    );
  if (slot.type === 'video')
    return (
      <video
        ref={video}
        className={styles.asset}
        src={slot.src}
        poster={slot.poster}
        controls
        playsInline
        muted
        preload="none"
        width={slot.width}
        height={slot.height}
        aria-label={slot.alt}
        onError={() => setFailed(true)}
      />
    );
  return (
    <picture className={styles.asset}>
      {slot.responsive?.map((source) => (
        <source
          key={source.srcSet}
          srcSet={source.srcSet}
          sizes={source.sizes}
          media={source.media}
        />
      ))}
      {/* Native picture keeps responsive sources and art direction explicit. */}
      <img
        src={slot.src}
        alt={slot.alt || ''}
        width={slot.width}
        height={slot.height}
        loading={slot.priority ? 'eager' : 'lazy'}
        fetchPriority={slot.priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}

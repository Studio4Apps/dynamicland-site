import type { CSSProperties } from 'react';
import { media, type SlotId, type MediaSlot } from '@/content/media';
import { MediaAsset } from './MediaAsset';
import styles from './MediaFrame.module.css';
export function MediaFrame({
  id,
  dark = false,
  className = '',
  configuration,
}: {
  id: SlotId;
  dark?: boolean;
  className?: string;
  configuration?: MediaSlot;
}) {
  const slot = configuration || media[id];
  return (
    <div
      data-media-slot={slot.id}
      data-empty={!slot.src}
      aria-hidden={!slot.src ? true : undefined}
      className={`${styles.frame} ${dark ? styles.dark : ''} ${className}`}
      style={
        {
          '--media-ratio': slot.ratio,
          '--media-fit': slot.fit,
          '--media-position': slot.position,
        } as CSSProperties
      }
    >
      {slot.src ? (
        <MediaAsset slot={slot} />
      ) : (
        <span className={styles.label} data-nosnippet>
          {slot.label}
        </span>
      )}
    </div>
  );
}

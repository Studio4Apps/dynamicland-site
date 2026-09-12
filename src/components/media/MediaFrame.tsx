import Image from 'next/image';
import type { CSSProperties } from 'react';
import { mediaSlots, type MediaKey } from '@/content/media';
export function MediaFrame({
  slot,
  className = '',
  priority = false,
}: {
  slot: MediaKey;
  className?: string;
  priority?: boolean;
}) {
  const media = mediaSlots[slot];
  return (
    <div
      className={`media-frame ${className}`}
      data-media-slot={media.id}
      style={{ '--media-ratio': media.ratio } as CSSProperties}
      aria-hidden={!media.src || undefined}
    >
      {media.src ? (
        media.type === 'photo' ? (
          <Image
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            sizes="(max-width: 767px) 92vw, (max-width: 1200px) 85vw, 1200px"
            loading={priority ? undefined : 'lazy'}
            preload={priority}
            style={{ objectFit: media.fit }}
          />
        ) : (
          <video
            controls
            playsInline
            preload="none"
            poster={media.poster}
            width={media.width}
            height={media.height}
            aria-label={media.alt}
            style={{ objectFit: media.fit }}
          >
            <source src={media.src} />
            {media.captions && (
              <track kind="captions" src={media.captions} srcLang="en" label="English" default />
            )}
          </video>
        )
      ) : (
        <span className="media-label">{media.label}</span>
      )}
    </div>
  );
}

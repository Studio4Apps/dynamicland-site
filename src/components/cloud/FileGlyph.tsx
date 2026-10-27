import { extensionOf } from '@/lib/cloud/files';
import type { CloudItem, FileCategory } from '@/lib/cloud/types';
import styles from './Cloud.module.css';

const tints: Record<FileCategory, string> = {
  folder: '#a970ff',
  image: '#ff9f0a',
  video: '#ff375f',
  audio: '#ff2d92',
  pdf: '#ff453a',
  document: '#0a84ff',
  spreadsheet: '#30b158',
  presentation: '#ff8a00',
  archive: '#8e8e93',
  code: '#5e5ce6',
  other: '#8e8e93',
};

/** A drawn stand-in for a thumbnail. Real previews only ever come from files chosen in this tab. */
export function FileGlyph({
  item,
  size = 'large',
}: {
  item: Pick<CloudItem, 'name' | 'category' | 'localUrl'>;
  size?: 'large' | 'small';
}) {
  const tint = tints[item.category];
  const small = size === 'small';
  if (item.category === 'image' && item.localUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={small ? styles.thumbSmall : styles.thumb}
        src={item.localUrl}
        alt=""
        draggable={false}
      />
    );
  if (item.category === 'folder')
    return (
      <svg
        className={small ? styles.glyphSmall : styles.glyph}
        viewBox="0 0 64 52"
        aria-hidden="true"
      >
        <path d="M4 10a5 5 0 0 1 5-5h14l5 5h27a5 5 0 0 1 5 5v2H4Z" fill={tint} opacity="0.72" />
        <rect x="4" y="14" width="56" height="34" rx="5" fill={tint} />
        <rect x="4" y="14" width="56" height="3" rx="1.5" fill="#fff" opacity="0.28" />
      </svg>
    );
  const ext = extensionOf(item.name).slice(0, 4).toUpperCase() || 'FILE';
  return (
    <svg
      className={small ? styles.glyphSmall : styles.glyph}
      viewBox="0 0 48 60"
      aria-hidden="true"
    >
      <path
        d="M6 2h25l13 13v39a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z"
        fill="var(--glyph-page)"
        stroke="var(--glyph-edge)"
      />
      <path d="M31 2v9a4 4 0 0 0 4 4h9" fill="var(--glyph-fold)" stroke="var(--glyph-edge)" />
      {item.category === 'image' && (
        <g>
          <rect x="8" y="18" width="32" height="22" rx="3" fill={tint} opacity="0.18" />
          <circle cx="16" cy="25" r="3" fill={tint} />
          <path d="m9 38 9-9 6 6 5-4 10 7Z" fill={tint} />
        </g>
      )}
      {item.category === 'video' && <path d="M19 21v16l13-8Z" fill={tint} />}
      {item.category === 'audio' && (
        <path d="M28 19v14.5a4 4 0 1 1-2-3.4V22l-8 2v11.5a4 4 0 1 1-2-3.4V21.5Z" fill={tint} />
      )}
      {!['image', 'video', 'audio'].includes(item.category) &&
        [20, 25, 30, 35].map((y, i) => (
          <rect
            key={y}
            x="9"
            y={y}
            width={i === 3 ? 18 : 30}
            height="2"
            rx="1"
            fill="var(--glyph-line)"
          />
        ))}
      {!small && (
        <>
          <rect x="6" y="43" width="36" height="11" rx="3" fill={tint} />
          <text
            x="24"
            y="51"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fill="#fff"
            fontFamily="var(--font-rounded)"
          >
            {ext}
          </text>
        </>
      )}
    </svg>
  );
}

export const kindLabel: Record<FileCategory, string> = {
  folder: 'Folder',
  image: 'Image',
  video: 'Movie',
  audio: 'Audio',
  pdf: 'PDF document',
  document: 'Document',
  spreadsheet: 'Spreadsheet',
  presentation: 'Presentation',
  archive: 'Archive',
  code: 'Source code',
  other: 'File',
};

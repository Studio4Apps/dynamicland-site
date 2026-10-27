import { clipLand } from './limits';

/** The same kinds DynamicLand's clipboard sorts copies into on the Mac. */
export type ClipKind = 'text' | 'richText' | 'url' | 'image' | 'file' | 'color' | 'code';

/** The app a clip was copied from, as the Mac reports it. */
export interface ClipSource {
  /** Shown in the card footer, e.g. “Safari”. */
  name: string;
  bundleId: string;
  /** The app icon's main colour, measured on the Mac (#RRGGBB). It tints the card header. */
  color?: string;
  /** A small app icon, once the Mac uploads them. Until then the card shows the kind's symbol. */
  icon?: string;
}

/** One copy, synced from DynamicLand's clipboard on the Mac. */
export interface Clip {
  id: string;
  kind: ClipKind;
  /** What Copy puts on the clipboard: the text, the link, the colour hex or the file names. */
  text: string;
  /** Page title of a link, or the name of a single file. */
  title?: string;
  image?: { src: string; width: number; height: number };
  /** Files stay on the Mac; only their names and sizes are synced. */
  files?: { name: string; size?: number }[];
  source?: ClipSource;
  pinned: boolean;
  copiedAt: string;
}

export const clipKinds: Record<ClipKind, { title: string; color: string }> = {
  text: { title: 'Text', color: '#2e85f5' },
  richText: { title: 'Rich Text', color: '#2e85f5' },
  url: { title: 'Link', color: '#858585' },
  image: { title: 'Picture', color: '#ffb81f' },
  file: { title: 'File', color: '#38c770' },
  color: { title: 'Color', color: '#ffb329' },
  code: { title: 'Code', color: '#b363ff' },
};

export type ClipFilter = 'all' | 'pinned' | 'links' | 'pictures' | 'code' | 'colors';
export const clipFilters: { id: ClipFilter; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#a3adb8' },
  { id: 'pinned', label: 'Pinned', color: '#ff941f' },
  { id: 'links', label: 'Links', color: '#ff4047' },
  { id: 'pictures', label: 'Pictures', color: '#ffb81a' },
  { id: 'code', label: 'Code', color: '#ad5cff' },
  { id: 'colors', label: 'Colors', color: '#26c757' },
];
const filterKind: Partial<Record<ClipFilter, ClipKind>> = {
  links: 'url',
  pictures: 'image',
  code: 'code',
  colors: 'color',
};

export function visibleClips(clips: Clip[], filter: ClipFilter, query: string): Clip[] {
  const q = query.trim().toLocaleLowerCase();
  return clips.filter((clip) => {
    if (filter === 'pinned' && !clip.pinned) return false;
    if (filterKind[filter] && clip.kind !== filterKind[filter]) return false;
    if (!q) return true;
    return [clip.text, clip.title, clip.source?.name, clipKinds[clip.kind].title]
      .filter(Boolean)
      .some((field) => field!.toLocaleLowerCase().includes(q));
  });
}

/** Newest first, as on the Mac. */
export const sortClips = (clips: Clip[]) =>
  [...clips].sort((a, b) => Date.parse(b.copiedAt) - Date.parse(a.copiedAt));

/**
 * Keeps the `keep` most recent unpinned clips plus every pinned one, as the Mac does.
 * The server runs the same trim after each insert, so a history never grows past its limit.
 */
export function keepRecent(clips: Clip[], keep: number): Clip[] {
  let unpinned = 0;
  return sortClips(clips).filter((clip) => clip.pinned || ++unpinned <= keep);
}
export const canPin = (clips: Clip[]) =>
  clips.filter((clip) => clip.pinned).length < clipLand.maxPinned;

function rgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (channels: number[]) =>
  `#${channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

/**
 * The header colour: the source app's colour, else the kind's. Like the Mac, it is dimmed until
 * white text reads on it; headers that stay bright (yellow, light green) switch to dark text.
 */
export function clipTone(clip: Clip): { color: string; ink: 'light' | 'dark' } {
  const base =
    rgb(clip.source?.color ?? '') ??
    (clip.kind === 'color' ? rgb(clip.text) : null) ??
    rgb(clipKinds[clip.kind].color)!;
  const luma = (c: number[]) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  const scale = Math.min(1, 0.72 / Math.max(luma(base), 0.001));
  const color = base.map((c) => c * scale);
  return { color: toHex(color), ink: luma(color) > 0.6 ? 'dark' : 'light' };
}
export function colorChannels(hex: string): string | null {
  const channels = rgb(hex);
  return channels ? channels.join(' ') : null;
}

export function clipAge(iso: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'} ago`;
  if (minutes < 1) return 'now';
  if (minutes < 60) return unit(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return unit(hours, 'hour');
  return unit(Math.floor(hours / 24), 'day');
}

/** The footer's right-hand detail, as on the Mac card. */
export function clipDetail(clip: Clip): string {
  if (clip.image) return `${clip.image.width} × ${clip.image.height}`;
  if (clip.files) return clip.files.length === 1 ? '1 file' : `${clip.files.length} files`;
  if (clip.kind === 'color')
    return colorChannels(clip.text) ? `RGB ${colorChannels(clip.text)}` : '';
  const chars = [...clip.text].length;
  return `${chars.toLocaleString()} char${chars === 1 ? '' : 's'}`;
}

/** Only web links open from a clip; anything else (javascript:, file:, custom schemes) stays text. */
export function webLink(text: string): URL | null {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

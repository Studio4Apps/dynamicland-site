export type MediaSlot = {
  id: string;
  label: string;
  role: string;
  type: 'image' | 'video';
  src: string | null;
  alt?: string;
  width?: number;
  height?: number;
  ratio: string;
  fit: 'contain' | 'cover';
  position: string;
  responsive?: { srcSet: string; sizes: string; media?: string }[];
  poster?: string;
  priority?: boolean;
};
const slot = (
  id: string,
  label: string,
  role: string,
  ratio = '16 / 10',
  type: MediaSlot['type'] = 'image',
): MediaSlot => ({ id, label, role, ratio, type, src: null, fit: 'contain', position: 'center' });
export const media = {
  hero: { ...slot('hero', 'Photo 01', 'Overview hero', '2 / 1'), priority: true },
  'highlight-home': slot('highlight-home', 'Photo 02', 'Home highlight', '16 / 9'),
  'highlight-music': slot('highlight-music', 'Photo 03', 'Music highlight', '16 / 9'),
  'highlight-activities': slot('highlight-activities', 'Photo 04', 'MiniLand highlight', '16 / 9'),
  'highlight-clipboard': slot('highlight-clipboard', 'Photo 05', 'Clipboard highlight', '16 / 9'),
  'highlight-customization': slot(
    'highlight-customization',
    'Photo 06',
    'Customization highlight',
    '16 / 9',
  ),
  home: slot('home', 'Photo 07', 'Home widget chapter', '6 / 5'),
  music: slot('music', 'Video 01', 'Now Playing chapter', '2 / 1', 'video'),
  activities: slot('activities', 'Photo 08', 'MiniLand activities', '16 / 9'),
  clipboard: slot('clipboard', 'Photo 09', 'Clipboard feature', '16 / 10'),
  tray: slot('tray', 'Photo 10', 'File Tray feature', '1 / 1'),
  tools: slot('tools', 'Photo 11', 'Timer and Voice Memos', '1 / 1'),
  'custom-notch': slot('custom-notch', 'Photo 12', 'Dynamic Notch preview', '4 / 3'),
  'custom-pill': slot('custom-pill', 'Photo 13', 'Dynamic Pill preview', '4 / 3'),
  'custom-glass': slot('custom-glass', 'Photo 14', 'Liquid Glass preview', '4 / 3'),
} satisfies Record<string, MediaSlot>;
export type SlotId = keyof typeof media;

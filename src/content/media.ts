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
  hero: {
    ...slot('hero', 'Lake at twilight', 'Poster for the live hero scene', '16 / 9'),
    src: '/media/lake-1600.webp',
    width: 1600,
    height: 900,
    alt: 'A rowing boat with a lit lantern on a still violet lake at twilight, under a crescent moon.',
    responsive: [
      {
        media: '(max-aspect-ratio: 4/5)',
        srcSet: '/media/lake-portrait-780.webp 780w',
        sizes: '100vw',
      },
      {
        srcSet:
          '/media/lake-960.webp 960w, /media/lake-1600.webp 1600w, /media/lake-2400.webp 2400w',
        sizes: '100vw',
      },
    ],
    priority: true,
  },
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
  'custom-notch': slot('custom-notch', 'Photo 12', 'Dynamic Notch preview', '16 / 9'),
  'custom-pill': slot('custom-pill', 'Photo 13', 'Dynamic Pill preview', '16 / 9'),
  'custom-glass': slot('custom-glass', 'Photo 14', 'Liquid Glass preview', '16 / 9'),
} satisfies Record<string, MediaSlot>;
export type SlotId = keyof typeof media;

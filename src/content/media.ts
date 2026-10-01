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
    ...slot('hero', 'Landing illustration', 'Full-width overview background', '1672 / 941'),
    src: '/media/landing-page-1672.webp',
    width: 1672,
    height: 941,
    alt: 'DynamicLand illustration: glowing widgets float above a MacBook notch in a purple and gold landscape.',
    responsive: [
      {
        srcSet: '/media/landing-page-840.webp 840w, /media/landing-page-1672.webp 1672w',
        sizes:
          '(max-width: 704px) 704px, (max-width: 760px) 100vw, (max-width: 1216px) 1216px, 100vw',
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

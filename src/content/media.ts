export type MediaSlot = {
  id: string;
  type: 'photo' | 'video';
  src: string | null;
  label: string;
  ratio: string;
  alt: string;
  width: number;
  height: number;
  fit: 'contain' | 'cover';
  poster?: string;
  captions?: string;
};
const photo = (
  id: string,
  label: string,
  ratio: string,
  width: number,
  height: number,
): MediaSlot => ({
  id,
  type: 'photo',
  src: null,
  label,
  ratio,
  alt: '',
  width,
  height,
  fit: 'contain',
});
export const mediaSlots = {
  heroPrimary: photo('hero-primary', 'PHOTO 01', '2.75 / 1', 1650, 600),
  homeMain: photo('home-main', 'PHOTO 02', '1.6 / 1', 1440, 900),
  homeDetail: photo('home-detail', 'PHOTO 03', '1.2 / 1', 720, 600),
  miniMain: photo('mini-main', 'PHOTO 04', '1.75 / 1', 1400, 800),
  miniDetail: photo('mini-detail', 'PHOTO 05', '1.4 / 1', 840, 600),
  widgets: photo('widgets', 'PHOTO 06', '2.3 / 1', 1380, 600),
  music: {
    id: 'music',
    type: 'video',
    src: null,
    label: 'VIDEO 01',
    ratio: '2.1 / 1',
    alt: '',
    width: 1680,
    height: 800,
    fit: 'contain',
  } as MediaSlot,
  customizationA: photo('customization-a', 'PHOTO 07', '1.25 / 1', 1000, 800),
  customizationB: photo('customization-b', 'PHOTO 08', '1.25 / 1', 1000, 800),
  customizationC: photo('customization-c', 'PHOTO 09', '1.25 / 1', 1000, 800),
  contextual: photo('contextual', 'PHOTO 10', '1.35 / 1', 1080, 800),
};
export type MediaKey = keyof typeof mediaSlots;

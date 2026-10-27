import type { Clip, ClipSource } from './clips';
import { categorize } from './files';
import type { CloudItem, Notice, ShareSettings } from './types';

const MB = 1_000_000;
const privateShare = (): ShareSettings => ({ link: false, expiry: '7d', allowDownload: true });

/** Sample library shown by local builds only, dated relative to the request so it always reads fresh. */
export function demoLibrary(nowIso: string): { items: CloudItem[]; notices: Notice[] } {
  const now = Date.parse(nowIso);
  const ago = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
  let n = 0;
  const item = (
    name: string,
    size: number,
    hours: number,
    extra: Partial<CloudItem> = {},
  ): CloudItem => ({
    id: `demo-${++n}`,
    name,
    category: extra.category ?? categorize(name),
    size,
    modified: ago(hours),
    parentId: null,
    starred: false,
    share: privateShare(),
    ...extra,
  });
  const folder = (name: string, hours: number, extra: Partial<CloudItem> = {}) =>
    item(name, 0, hours, { category: 'folder', ...extra });

  const documents = folder('Documents', 2);
  const exports = folder('DynamicLand Exports', 30, { starred: true });
  const photos = folder('Photos', 70);
  const trip = folder('Island Trip', 200, {
    share: { ...privateShare(), link: true, token: 'demo-island-trip' },
  });
  const items: CloudItem[] = [
    documents,
    exports,
    photos,
    trip,
    item('Morning notes.heic', 3.4 * MB, 0.4),
    item('Whiteboard sketch.heic', 2.9 * MB, 0.7),
    item('Study Guide.pdf', 1.8 * MB, 1.6, { starred: true }),
    item('Study Guide — annotated.pdf', 2.1 * MB, 1.7),
    item('Product & Design Roles.pdf', 4.6 * MB, 98, {
      share: { ...privateShare(), link: true, expiry: '14d', token: 'demo-roles' },
    }),
    item('Engineering Roles.pdf', 4.1 * MB, 98.2),
    item('Business Roles.pdf', 3.8 * MB, 98.4),
    item('Lake at dusk.mov', 940 * MB, 300, { starred: true }),
    item('Island timelapse.mov', 910 * MB, 320),
    item('Jetty at dawn.mp4', 450 * MB, 330),
    item('Widget layout.key', 28 * MB, 340),
    item('Budget 2026.numbers', 1.2 * MB, 410),
    item('Chapter 6 — CPU Scheduling.pptx', 9.6 * MB, 460),
    item('Chapter 4 — Threads.pptx', 8.9 * MB, 470),
    item('Chapter 3 — Processes.pptx', 7.7 * MB, 480),
    item('Mac backup.zip', 980 * MB, 900),
    item('Photo library export.zip', 870 * MB, 920),
    item('Release notes.md', 0.02 * MB, 26, { parentId: documents.id }),
    item('Contract draft.docx', 0.4 * MB, 50, { parentId: documents.id }),
    item('Invoices.xlsx', 0.3 * MB, 120, { parentId: documents.id }),
    item('Notch theme.dlpreset', 0.9 * MB, 30, { parentId: exports.id }),
    item('Clipboard history.json', 0.2 * MB, 31, { parentId: exports.id }),
    item('Cabin.jpg', 6.2 * MB, 70, { parentId: photos.id }),
    item('Jetty lantern.jpg', 5.8 * MB, 71, { parentId: photos.id }),
    item('Boat.jpg', 5.1 * MB, 72, { parentId: photos.id }),
    item('Itinerary.pages', 1.1 * MB, 190, { parentId: trip.id }),
    item('Old screenshot.png', 1.6 * MB, 120, { deletedAt: ago(100) }),
    item('Draft v1.docx', 0.6 * MB, 500, { deletedAt: ago(500) }),
  ];
  const notices: Notice[] = [
    {
      id: 'n1',
      kind: 'storage',
      tone: 'warning',
      title: 'CloudLand storage is almost full',
      body: 'Free up space so new files keep syncing.',
      at: ago(0.2),
      read: false,
    },
    {
      id: 'n2',
      kind: 'security',
      tone: 'info',
      title: 'New sign-in on MacBook Pro',
      body: 'Signed in with Apple. If this wasn’t you, sign out of all devices in Security.',
      at: ago(3),
      read: false,
    },
    {
      id: 'n3',
      kind: 'share',
      tone: 'info',
      title: 'Your link to “Island Trip” expires tomorrow',
      body: 'Make a new link if people still need it.',
      at: ago(20),
      read: true,
    },
  ];
  return { items, notices };
}

const apps = {
  safari: { name: 'Safari', bundleId: 'com.apple.Safari', color: '#1e7cf2' },
  notes: { name: 'Notes', bundleId: 'com.apple.Notes', color: '#e3a90f' },
  photos: { name: 'Photos', bundleId: 'com.apple.Photos', color: '#f28a0c' },
  pages: { name: 'Pages', bundleId: 'com.apple.iWork.Pages', color: '#f5820d' },
  dynamicland: { name: 'DynamicLand', bundleId: 'Amro.DynamicLand', color: '#7811de' },
  xcode: { name: 'Xcode', bundleId: 'com.apple.dt.Xcode', color: '#1b6fe0' },
  finder: { name: 'Finder', bundleId: 'com.apple.finder', color: '#2f8ff0' },
  messages: { name: 'Messages', bundleId: 'com.apple.MobileSMS', color: '#2fb64f' },
  mail: { name: 'Mail', bundleId: 'com.apple.mail', color: '#1a7ff0' },
  terminal: { name: 'Terminal', bundleId: 'com.apple.Terminal', color: '#3a3a3c' },
} satisfies Record<string, ClipSource>;

/** Sample ClipLand history for local builds: one of each kind, the way the Mac would sync them. */
export function demoClips(nowIso: string): Clip[] {
  const now = Date.parse(nowIso);
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  let n = 0;
  const clip = (
    minutes: number,
    fields: Omit<Clip, 'id' | 'copiedAt' | 'pinned'>,
    pinned = false,
  ) => ({
    id: `clip-${++n}`,
    copiedAt: ago(minutes),
    pinned,
    ...fields,
  });
  return [
    clip(0.4, {
      kind: 'url',
      text: 'https://developer.apple.com/design/human-interface-guidelines/',
      title: 'Human Interface Guidelines',
      source: apps.safari,
    }),
    clip(3, {
      kind: 'text',
      text: 'Pick-up: Jetty 4, North Shore\nThe boat leaves at 6:30 pm.\nBring the lantern from the cabin porch.',
      source: apps.notes,
    }),
    clip(125, {
      kind: 'image',
      text: '',
      image: { src: '/media/invite-island-840.webp', width: 840, height: 1120 },
      source: apps.photos,
    }),
    clip(370, {
      kind: 'richText',
      text: 'Make a little room for a better everyday. DynamicLand turns the notch into a calm place for the things you reach for most: music, timers, files and the last thing you copied.',
      source: apps.pages,
    }),
    clip(1_300, { kind: 'color', text: '#7811DE', source: apps.dynamicland }),
    clip(1_500, {
      kind: 'code',
      text: 'struct ClipCard: View {\n    let clip: Clip\n\n    var body: some View {\n        Text(clip.title)\n            .font(.headline)\n    }\n}',
      source: apps.xcode,
    }),
    clip(4_400, {
      kind: 'file',
      text: 'Mac backup.zip',
      title: 'Mac backup.zip',
      files: [{ name: 'Mac backup.zip', size: 980 * MB }],
      source: apps.finder,
    }),
    clip(4_500, {
      kind: 'text',
      text: 'Saw the lake at dusk from the jetty, and the cabin light was already on. Send me the photos when you’re back?',
      source: apps.messages,
    }),
    clip(
      5_900,
      {
        kind: 'image',
        text: '',
        image: { src: '/media/pro-voyage.webp', width: 1086, height: 1448 },
        source: apps.safari,
      },
      true,
    ),
    clip(
      7_300,
      {
        kind: 'url',
        text: 'https://apps.apple.com/app/id6785289988',
        title: 'DynamicLand on the Mac App Store',
        source: apps.mail,
      },
      true,
    ),
    clip(8_200, { kind: 'color', text: '#27F54D', source: apps.safari }),
    clip(8_600, { kind: 'code', text: 'node scripts/render-scenes.mjs', source: apps.terminal }),
  ];
}

export type ReleaseUpdate = {
  id: string;
  version: string;
  name: string;
  image: string | null;
  paletteTone?: 'cool';
  source: string | null;
  notes: string;
};

// Approved bento artwork preserves its original 4096 × 2160 dimensions.
export const updates: ReleaseUpdate[] = [
  {
    id: 'solara',
    paletteTone: 'cool',
    version: 'V3',
    name: 'Solara',
    image: '/images/updates/solara.webp',
    source: null,
    notes: 'Release details are coming later. Stay tuned.',
  },
  {
    id: 'darkveil',
    version: 'V2',
    name: 'Darkveil',
    image: '/images/updates/darkveil.webp',
    source: 'https://apps.apple.com/app/id6785289988',
    notes:
      'Introducing DynamicLand: Darkveil, our biggest update yet, with an all-new Home, beautiful new widgets, Mini Bubbles, a richer music experience, and improvements throughout the app.\n\nALL-NEW HOME\nA completely new space built around your day.\n• Add and arrange your favorite widgets\n• Choose from different widget sizes and styles\n• See more of what matters at a glance\n• Move smoothly between Home and the rest of DynamicLand\n\nNEW WIDGETS\nCalendar, Time, Timer, Weather, Battery, Music, Voice Memos, Photos and Videos, Mirror, and Apps and Folders, plus a Color Picker that grabs any color on your screen and copies it instantly.\n\nMINI BUBBLES\nKeep several activities close by at the same time.\n• Follow timers, music, recordings, transfers, AI tasks, and more\n• Quickly move between active activities\n• Stay informed without opening the full island\n\nMUSIC, REIMAGINED\n• A new Now Playing experience\n• Redesigned Synced lyrics\n• Click any line to jump to that part of the song\n• Improved playback controls\n• Richer song and album details\n• Smoother music animations\n\nPLAYLISTS\n• Explore your Apple Music playlists\n• Browse charts, For You, Replay, and curated collections\n• Play playlists and songs directly from DynamicLand\n\nA MORE REFINED ISLAND\n• Smoother opening and closing\n• More natural transitions\n• Cleaner compact and expanded views\n• Just hover the notch for a quick look at timers, recordings, music, and AI tasks\n• Improved animations across every activity\n\nCLIPBOARD\n• Faster browsing through your history\n• Previews for any item you copied\n• Easier drag and drop\n\nEXTERNAL DISPLAYS\n• Reworked to behave correctly on every connected screen\n• Better support for Sidecar\n\nBETTER ALERTS\n• New battery and charging alerts\n• Improved timer alerts\n• Clearer updates for AI tasks and file transfers\n• More reliable activity switching\n\nFASTER AND SMOOTHER\n• Faster navigation\n• Smoother widgets\n• Improved music and lyrics performance\n• Keyboard shortcuts to open DynamicLand and jump between tabs\n• Better stability throughout the app\n\nDynamicLand: Darkveil brings a more personal, useful, and beautifully connected experience to your Mac.',
  },
];

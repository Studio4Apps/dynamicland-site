export const product = {
  name: 'DynamicLand',
  description:
    'DynamicLand is a macOS app that brings widgets, music controls, clipboard history, and live activities to the space around your notch.',
  publisher: 'Amro Alghamdi',
  platform: 'macOS 26.0 or later',
  downloadUrl: 'https://apps.apple.com/app/id6785289988',
  supportEmail: 'Amroalgg10@icloud.com',
  privacyUrl: 'https://hypercubeapp.notion.site/Privacy-Policy-38849afb1e7580e79c38dac62054baa8',
  termsUrl:
    'https://hypercubeapp.notion.site/Terms-of-Use-End-User-License-Agreement-38849afb1e7580fb99a1d8c5486d4bbf',
  pricing: 'Free to download. Optional monthly or yearly DynamicLand Pro subscription.',
  logo: '/brand/dynamicland.png',
} as const;

export const highlights = [
  {
    id: 'home',
    label: 'A home for your day',
    title: 'Your essentials. One glance away.',
    description: 'Arrange your calendar, weather, music, and more in your own widget space.',
    slot: 'highlight-home',
    tag: 'Home',
    pro: true,
  },
  {
    id: 'music',
    label: 'Music within reach',
    title: 'Stay in your flow. Keep the music.',
    description: 'Control Apple Music and Spotify from the notch, without opening another window.',
    slot: 'highlight-music',
    tag: 'Now Playing',
    pro: false,
  },
  {
    id: 'activities',
    label: 'Live activities',
    title: 'A little space for what’s happening.',
    description: 'Follow timers, recordings, and transfers beside the notch with MiniLand.',
    slot: 'highlight-activities',
    tag: 'MiniLand',
    pro: true,
  },
  {
    id: 'clipboard',
    label: 'Clipboard and files',
    title: 'Pick up where you copied.',
    description: 'Return to your clipboard history or keep a file handy in the tray.',
    slot: 'highlight-clipboard',
    tag: 'Everyday tools',
    pro: false,
  },
  {
    id: 'customization',
    label: 'Make it yours',
    title: 'Fits your Mac. Feels like you.',
    description: 'Choose your layout, change your theme, and fine-tune how your island behaves.',
    slot: 'highlight-customization',
    tag: 'Customization',
    pro: false,
  },
] as const;

export const customizations = [
  {
    id: 'notch',
    title: 'Dynamic Notch',
    description:
      'Keep your island at the top of your screen. Adjust its size and position to fit the way you work.',
    slot: 'custom-notch',
    pro: false,
  },
  {
    id: 'pill',
    title: 'Dynamic Pill',
    description:
      'Choose a floating pill layout for a different look, with the same quick access to your everyday tools.',
    slot: 'custom-pill',
    pro: true,
  },
  {
    id: 'glass',
    title: 'Liquid Glass',
    description:
      'Give your island a translucent finish. Switch themes and choose the look that suits your desktop.',
    slot: 'custom-glass',
    pro: true,
  },
] as const;

export const faqs = [
  {
    question: 'What is DynamicLand?',
    answer:
      'DynamicLand is a macOS app that turns the space around your notch into a place for widgets, music controls, clipboard history, files, and live activities. Hover over the notch to open it.',
  },
  {
    question: 'Which Macs can run DynamicLand?',
    answer:
      'DynamicLand requires macOS 26.0 or later. Check the Mac App Store for compatibility with your Mac. External-display islands and Sidecar support are available with DynamicLand Pro.',
  },
  {
    question: 'Is DynamicLand free?',
    answer:
      'DynamicLand is free to download and includes a free portion. Pro adds the full Home widget grid, MiniLand live activities, synced lyrics, extended clipboard history and search, and more. Pro is available as a monthly or yearly subscription. Current prices and available plans are shown in the app and on the App Store.',
  },
  {
    question: 'Does it work with Apple Music and Spotify?',
    answer:
      'Yes. DynamicLand supports playback controls for Apple Music and Spotify. Apple Music playlist browsing is also available. Live synced lyrics and enhanced Apple Music artwork are Pro features. Some controls require permission in macOS.',
  },
  {
    question: 'Can I customize the island?',
    answer:
      'Yes. Adjust the island’s size and position, choose a theme, and hide it when idle or in full screen. Dynamic Pill, Liquid Glass, and global keyboard shortcuts are included with Pro.',
  },
  {
    question: 'Where can I get help?',
    answer:
      'Visit the Support page for setup and troubleshooting tips, or email the developer using the contact link there. Include your macOS version, DynamicLand version, and a short description of the issue.',
  },
] as const;

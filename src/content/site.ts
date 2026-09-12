type LegalSection = { heading: string; paragraphs: string[] };
export const site: {
  name: string;
  description: string;
  url: string;
  download: { url: string | null; label: string; unavailable: string };
  pricing: { amount: string; detail: string } | null;
  minimumOS: string | null;
  supportEmail: string | null;
  legal: { privacy: LegalSection[] | null; terms: LegalSection[] | null };
} = {
  name: 'DynamicLand',
  description:
    'DynamicLand is a macOS app that brings music, widgets, Mini Lands, live activities, and everyday tools to the space around your MacBook’s notch.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dynamicland-official.buzzy-mint-2975.chatgpt.site',
  download: {
    url: null,
    label: 'Download for Mac',
    unavailable: 'The official download link is not available on this preview yet.',
  },
  pricing: null,
  minimumOS: null,
  supportEmail: null,
  legal: { privacy: null, terms: null },
};
export const navigation = [
  { label: 'Explore', href: '/#explore' },
  { label: 'Music', href: '/#music' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Support', href: '/support/' },
];
export const faqs = [
  {
    question: 'What is DynamicLand?',
    answer:
      'DynamicLand is a macOS app built around the MacBook notch. It brings together Home, widgets, music, Mini Lands, live activities, and everyday utilities in that space.',
  },
  {
    question: 'What are Mini Lands?',
    answer:
      'Mini Lands let multiple live activities live around DynamicLand at the same time, so you can keep more than one activity in view.',
  },
  {
    question: 'Which music services does it work with?',
    answer: 'DynamicLand includes Apple Music and Spotify integration, along with lyrics.',
  },
  {
    question: 'Can I customize DynamicLand?',
    answer: 'Yes. DynamicLand includes customization for size, appearance, and layouts.',
  },
  {
    question: 'Where can I download it?',
    answer:
      'The verified download link and compatibility details will be added to this website when they are available.',
  },
];

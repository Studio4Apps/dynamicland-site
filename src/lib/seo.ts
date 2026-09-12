import type { Metadata } from 'next';
import { site } from '@/content/site';
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  noindex = false,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} — DynamicLand`,
      description,
      url: path,
      type: 'website',
      siteName: site.name,
      images: [
        {
          url: '/og.png',
          width: 1536,
          height: 1024,
          alt: 'DynamicLand — A new home for your Mac’s notch.',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og.png'],
      title: `${title} — DynamicLand`,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
export const productStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: 'en',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${site.url}/#software`,
      name: site.name,
      url: site.url,
      description: site.description,
      operatingSystem: 'macOS',
      applicationCategory: 'UtilitiesApplication',
      featureList: [
        'Home and widgets',
        'Mini Lands and simultaneous live activities',
        'Apple Music and Spotify integration',
        'Lyrics',
        'Clipboard and File Tray',
        'File sharing',
        'Timer',
        'Voice Memos',
        'Calendar',
        'Weather',
        'Battery',
        'AI activities',
        'Customization',
      ],
      ...(site.download.url ? { downloadUrl: site.download.url } : {}),
    },
  ],
};

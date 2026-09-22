import type { Metadata } from 'next';
import { product } from '@/content/product';
import { getSiteConfig } from './config';

export { serializeJsonLd } from './serialize';
export function pageMetadata(title: string, description: string, path = '/'): Metadata {
  const { origin, indexable } = getSiteConfig();
  return {
    title,
    description,
    alternates: origin ? { canonical: new URL(path, origin).href } : undefined,
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description,
      siteName: product.name,
      type: 'website',
      locale: 'en_US',
      ...(origin
        ? {
            url: new URL(path, origin).href,
            images: [
              {
                url: `${origin}/brand/social.png`,
                width: 1200,
                height: 630,
                alt: 'DynamicLand. Your Mac, a little more connected.',
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(origin ? { images: [`${origin}/brand/social.png`] } : {}),
    },
  };
}
export function structuredData() {
  const { origin } = getSiteConfig();
  const root = origin || product.downloadUrl;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', '@id': `${root}#publisher`, name: product.publisher },
      {
        '@type': 'SoftwareApplication',
        '@id': `${root}#app`,
        name: product.name,
        description: product.description,
        operatingSystem: product.platform,
        applicationCategory: 'UtilitiesApplication',
        downloadUrl: product.downloadUrl,
        publisher: { '@id': `${root}#publisher` },
        ...(origin ? { url: origin, image: `${origin}${product.logo}` } : {}),
      },
      ...(origin
        ? [
            {
              '@type': 'WebSite',
              '@id': `${origin}#website`,
              url: origin,
              name: product.name,
              publisher: { '@id': `${root}#publisher` },
            },
          ]
        : []),
    ],
  };
}

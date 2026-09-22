import type { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const { origin, indexable, training } = getSiteConfig();
  // Previews stay crawlable so crawlers can see the noindex response; access protection is a host responsibility.
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...(training === 'block'
        ? [
            {
              userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'],
              disallow: '/',
            },
          ]
        : []),
    ],
    ...(indexable && origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}

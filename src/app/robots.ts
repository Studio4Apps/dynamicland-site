import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
export const dynamic = 'force-static';
// Search access and foundation-model training are independent policies.
// This initial policy permits discovery while declining training use.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'], disallow: '/' },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}

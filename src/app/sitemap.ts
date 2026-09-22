import type { MetadataRoute } from 'next';
import { getSiteConfig } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  const { origin, indexable } = getSiteConfig();
  return indexable && origin
    ? ['/', '/support', '/privacy', '/terms'].map((path) => ({ url: new URL(path, origin).href }))
    : [];
}

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { getSiteConfig, httpsUrl } from '../src/lib/config';
import { product } from '../src/content/product';
async function main() {
  const issues: string[] = [];
  let config;
  try {
    config = getSiteConfig();
  } catch (error) {
    issues.push(String(error));
  }
  if (config?.mode !== 'production')
    issues.push('SITE_ENV must be production for an indexable public release.');
  if (!config?.origin) issues.push('Owner-approved SITE_ORIGIN is not configured.');
  if (!config?.legalContentReady || !config?.legalApproved)
    issues.push(
      'Website-specific privacy and terms must be supplied, reviewed, and marked approved.',
    );
  for (const [name, url] of Object.entries({
    download: product.downloadUrl,
    privacy: product.privacyUrl,
    terms: product.termsUrl,
  })) {
    try {
      httpsUrl(url, name);
    } catch {
      issues.push(`Invalid ${name} URL`);
    }
  }
  if (!product.supportEmail.includes('@')) issues.push('Missing verified support email.');
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
    );
  const allowed = new Set(['brand/dynamicland.png', 'brand/social.png']);
  for (const file of files('public')) {
    const relative = file.slice('public/'.length);
    if (
      !allowed.has(relative) &&
      !/^media\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp|avif|mp4|webm)$/.test(relative)
    )
      issues.push(`Unexpected public file: ${relative}`);
  }
  const privacy = readFileSync(resolve('src/app/privacy/page.tsx'), 'utf8');
  const terms = readFileSync(resolve('src/app/terms/page.tsx'), 'utf8');
  if (
    privacy.includes('data-legal-status="pending"') ||
    terms.includes('data-legal-status="pending"')
  )
    issues.push('Public legal routes still contain pending approval notices.');
  // Optional read-only check of an already running build, using the same explicit
  // configuration as that server. Never derive the canonical from this URL.
  if (process.env.RELEASE_BASE_URL && config) {
    const base = new URL(process.env.RELEASE_BASE_URL);
    if (!['http:', 'https:'].includes(base.protocol))
      issues.push('Invalid release verification protocol.');
    else {
      for (const path of ['/', '/support', '/privacy', '/terms']) {
        const response = await fetch(new URL(path, base));
        const html = await response.text();
        const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
        const expected = config.origin ? new URL(path, config.origin).href : undefined;
        if (response.status !== 200 || canonical !== expected)
          issues.push(`Response/canonical mismatch at ${path}`);
        if (
          (response.headers.get('x-robots-tag')?.includes('noindex') ?? false) === config.indexable
        )
          issues.push(`Indexing header contradicts deployment mode at ${path}`);
      }
      const sitemap = await (await fetch(new URL('/sitemap.xml', base))).text();
      const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
      const expected =
        config.indexable && config.origin
          ? ['/', '/support', '/privacy', '/terms'].map((path) => new URL(path, config.origin).href)
          : [];
      if (JSON.stringify(locations.sort()) !== JSON.stringify(expected.sort()))
        issues.push('Sitemap contradicts canonical/indexing configuration.');
      const robots = await (await fetch(new URL('/robots.txt', base))).text();
      if (robots.includes('Sitemap:') !== config.indexable)
        issues.push('Robots sitemap directive contradicts deployment mode.');
    }
  }
  if (issues.length) {
    console.error(
      'PUBLIC RELEASE BLOCKED\n' + [...new Set(issues)].map((issue) => `- ${issue}`).join('\n'),
    );
    console.info(
      'Local and protected preview implementation may continue. Missing product captures are intentional and are not a release-check failure.',
    );
    process.exitCode = 1;
  } else
    console.log(
      'Release configuration checks passed. Hosting, HTTPS, policy headers and external indexing still require deployment verification.',
    );
}
main().catch((error) => {
  console.error(
    'Release verification failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
});

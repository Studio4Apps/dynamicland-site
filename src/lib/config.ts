import { isIP } from 'node:net';

export function httpsUrl(value: string, name: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error(`${name} must be an HTTPS URL without credentials`);
  return url.toString();
}
export function getSiteConfig(env: Record<string, string | undefined> = process.env) {
  const mode = env.SITE_ENV || 'local';
  if (!['local', 'preview', 'production'].includes(mode)) throw new Error('Invalid SITE_ENV');
  let origin: string | undefined;
  if (env.SITE_ORIGIN) {
    const url = new URL(httpsUrl(env.SITE_ORIGIN, 'SITE_ORIGIN'));
    if (
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.port ||
      url.hostname === 'localhost' ||
      isIP(url.hostname.replace(/^\[|\]$/g, '')) !== 0 ||
      url.hostname.endsWith('.local')
    )
      throw new Error('SITE_ORIGIN must be a public origin without path, query or port');
    origin = url.origin;
  }
  const legalApproved = env.LEGAL_APPROVED === 'true';
  // Website-specific approved policy text has not yet been supplied.
  const legalContentReady = false;
  const indexable = mode === 'production' && Boolean(origin) && legalApproved && legalContentReady;
  const training = env.TRAINING_CRAWLERS || 'block';
  if (!['allow', 'block'].includes(training)) throw new Error('Invalid TRAINING_CRAWLERS');
  if (mode === 'production' && !indexable)
    throw new Error(
      'Production release blocked: configure origin and supply/approve website legal content. Use SITE_ENV=preview for review.',
    );
  return { mode, origin, indexable, legalApproved, legalContentReady, training };
}

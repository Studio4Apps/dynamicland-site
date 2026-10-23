import { NextRequest, NextResponse } from 'next/server';
import { getSiteConfig } from './lib/config';
import { cloudDemoEnabled, isCloudPath, sessionCookie, signInPath } from './lib/cloud/policy';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

// CloudLand holds people's files, so it gets the strictest isolation the platform offers.
const cloudHeaders: Record<string, string> = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Referrer-Policy': 'no-referrer',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'off',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), midi=(), display-capture=(), screen-wake-lock=(), publickey-credentials-get=(self), clipboard-write=(self), fullscreen=(self), interest-cohort=(), browsing-topics=()',
};

/** Rejects state-changing requests that a different site initiated (defence in depth for CSRF). */
function crossSite(request: NextRequest): boolean {
  if (safeMethods.has(request.method)) return false;
  // Browsers set Sec-Fetch-Site and pages can't forge it; Origin is the fallback for older clients.
  const site = request.headers.get('sec-fetch-site');
  if (site) return site !== 'same-origin';
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host !== request.headers.get('host');
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cloud = isCloudPath(pathname);
  if (cloud && crossSite(request))
    return new NextResponse('Cross-site request blocked', { status: 403 });
  const { indexable, mode } = getSiteConfig();
  if (
    cloud &&
    pathname !== signInPath &&
    !cloudDemoEnabled() &&
    !request.cookies.has(sessionCookie)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = signInPath;
    url.search = '';
    return NextResponse.redirect(url, 303);
  }
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' ${dev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    // Previews of files chosen in this tab are object URLs; nothing remote is ever rendered.
    `img-src 'self' data:${cloud ? ' blob:' : ''}`,
    "font-src 'self'",
    `media-src 'self'${cloud ? ' blob:' : ''}`,
    `connect-src 'self'${cloud ? ' blob:' : ''}${dev ? ' ws: wss:' : ''}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    ...(mode === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  if (mode === 'production')
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  if (cloud) {
    for (const [key, value] of Object.entries(cloudHeaders)) response.headers.set(key, value);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  } else if (!indexable) response.headers.set('X-Robots-Tag', 'noindex, noarchive');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|brand/|favicon.ico).*)'] };

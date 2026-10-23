import { getSiteConfig } from '../config';
import { cloudPrefix } from './paths';

export { cloudPrefix, signInPath } from './paths';

/** `__Host-` forces Secure, Path=/ and no Domain, so subdomains can never plant or read it. */
export const sessionCookie = '__Host-cloudland-session';

export function isCloudPath(pathname: string): boolean {
  return pathname === cloudPrefix || pathname.startsWith(`${cloudPrefix}/`);
}
/** Sample data is only ever served by a local build, and can be switched off there too. */
export function cloudDemoEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return getSiteConfig(env).mode === 'local' && env.CLOUDLAND_DEMO !== 'false';
}

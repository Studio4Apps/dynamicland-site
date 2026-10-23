import 'server-only';
import { cookies } from 'next/headers';
import { cloudDemoEnabled, sessionCookie } from './policy';

export interface CloudSession {
  name: string;
  email: string;
  demo: boolean;
}

/**
 * The only gate the CloudLand pages trust. The proxy's cookie check is an early redirect, not
 * authorisation. Until Sign in with Apple and the session store are connected nothing can be
 * verified, so every real request fails closed.
 */
export async function getCloudSession(): Promise<CloudSession | null> {
  if (cloudDemoEnabled()) return { name: 'Preview', email: 'preview@cloudland.local', demo: true };
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  return null;
}

import { redirect } from 'next/navigation';
import { SignIn } from '@/components/cloud/SignIn';
import { getCloudSession } from '@/lib/cloud/session';
import { cloudDemoEnabled } from '@/lib/cloud/policy';

export const metadata = { title: { absolute: 'Sign in · CloudLand' } };
export default async function SignInPage() {
  const session = await getCloudSession();
  if (session && !session.demo) redirect('/cloud');
  return <SignIn preview={cloudDemoEnabled()} />;
}

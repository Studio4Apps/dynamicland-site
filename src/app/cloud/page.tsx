import { redirect } from 'next/navigation';
import { CloudApp } from '@/components/cloud/CloudApp';
import { getCloudSession } from '@/lib/cloud/session';
import { demoClips, demoLibrary } from '@/lib/cloud/demo';
import { signInPath } from '@/lib/cloud/policy';

export const metadata = { title: { absolute: 'CloudLand' } };
export default async function CloudPage() {
  const session = await getCloudSession();
  if (!session) redirect(signInPath);
  const now = new Date().toISOString();
  const library = session.demo ? demoLibrary(now) : { items: [], notices: [] };
  return (
    <CloudApp
      user={{ name: session.name, email: session.email }}
      demo={session.demo}
      now={now}
      initialItems={library.items}
      initialNotices={library.notices}
      initialClips={session.demo ? demoClips(now) : []}
    />
  );
}

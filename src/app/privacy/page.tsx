import { LegalPage } from '@/components/layout/LegalPage';
import { site } from '@/content/site';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Privacy',
  'Privacy information for DynamicLand.',
  '/privacy/',
  !site.legal.privacy,
);
export default function Privacy() {
  return <LegalPage kind="privacy" />;
}

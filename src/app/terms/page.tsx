import { LegalPage } from '@/components/layout/LegalPage';
import { site } from '@/content/site';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Terms of use',
  'Terms of use for DynamicLand.',
  '/terms/',
  !site.legal.terms,
);
export default function Terms() {
  return <LegalPage kind="terms" />;
}

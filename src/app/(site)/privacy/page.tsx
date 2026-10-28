import { LegalPage } from '@/components/legal/LegalPage';
import { privacy } from '@/content/legal/privacy';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Privacy Policy',
  'How the DynamicLand macOS app handles your information, what stays on your Mac, and what may be shared.',
  '/privacy',
);
export default function Privacy() {
  return <LegalPage doc={privacy} />;
}

import { LegalPage } from '@/components/legal/LegalPage';
import { terms } from '@/content/legal/terms';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata(
  'Terms of Use',
  'The DynamicLand Terms of Use and End-User License Agreement for the DynamicLand macOS app.',
  '/terms',
);
export default function Terms() {
  return <LegalPage doc={terms} />;
}

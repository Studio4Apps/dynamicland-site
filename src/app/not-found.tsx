import { InformationPage } from '@/components/layout/InformationPage';
export default function NotFound() {
  return (
    <InformationPage
      eyebrow="404 · Page not found"
      title="A little off the island."
      intro="We couldn’t find that page. Let’s get you back to DynamicLand."
    >
      <a href="/" className="button buttonPrimary">
        Back to DynamicLand
      </a>
    </InformationPage>
  );
}

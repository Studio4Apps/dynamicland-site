import { InformationPage } from '@/components/layout/InformationPage';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
export default function NotFound() {
  return (
    <>
      <Header />
      <InformationPage
        eyebrow="404 · Page not found"
        title="A little off the island."
        intro="We couldn’t find that page. Let’s get you back to DynamicLand."
      >
        <a href="/" className="button buttonPrimary">
          Back to DynamicLand
        </a>
      </InformationPage>
      <Footer />
    </>
  );
}

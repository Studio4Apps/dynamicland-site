import { InformationPage } from '@/components/layout/InformationPage';
import { product } from '@/content/product';
import { pageMetadata } from '@/lib/seo';
import styles from '@/components/layout/Information.module.css';
export const metadata = pageMetadata(
  'Privacy',
  'Find the published DynamicLand app privacy policy and information about this website.',
  '/privacy',
);
export default function Privacy() {
  return (
    <InformationPage
      eyebrow="Privacy"
      title="Your information matters."
      intro="The DynamicLand app and this website are separate services. Their data handling should be considered separately."
    >
      <section>
        <h2>DynamicLand app</h2>
        <p>The app’s published privacy policy is available in the owner’s existing document.</p>
        <a href={product.privacyUrl} className="button buttonPrimary">
          Read the app privacy policy ↗
        </a>
      </section>
      <section>
        <h2>This website</h2>
        <p>
          This implementation includes no analytics scripts, advertising trackers, account system,
          or contact form. Download and support links take you to the App Store or your email
          application.
        </p>
        <p>
          The production hosting provider’s request logging, retention, and other data handling have
          not yet been confirmed.
        </p>
      </section>
      <section className={styles.notice} data-legal-status="pending">
        <h2>Website privacy notice</h2>
        <p>
          The website-specific privacy notice is awaiting the owner’s review before public launch.
          This page does not replace the app’s published policy.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          For a privacy question, email{' '}
          <a href={`mailto:${product.supportEmail}`}>{product.supportEmail}</a>.
        </p>
      </section>
    </InformationPage>
  );
}

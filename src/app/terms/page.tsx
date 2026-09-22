import { InformationPage } from '@/components/layout/InformationPage';
import { product } from '@/content/product';
import { pageMetadata } from '@/lib/seo';
import styles from '@/components/layout/Information.module.css';
export const metadata = pageMetadata(
  'Terms',
  'Find DynamicLand’s published app terms and end-user license agreement.',
  '/terms',
);
export default function Terms() {
  return (
    <InformationPage
      eyebrow="Terms"
      title="The details, in one place."
      intro="Use the published app terms for information about your use of DynamicLand."
    >
      <section>
        <h2>App terms and license</h2>
        <p>
          The owner’s published Terms of Use and End User License Agreement are linked below. Review
          that document for the app’s governing terms.
        </p>
        <a className="button buttonPrimary" href={product.termsUrl}>
          Read the app terms ↗
        </a>
      </section>
      <section>
        <h2>Downloads and purchases</h2>
        <p>
          DynamicLand is downloaded through the Mac App Store. Pro is offered as a monthly or yearly
          subscription. Review the current price, billing details, and applicable terms shown by the
          app and App Store before purchasing.
        </p>
      </section>
      <section className={styles.notice} data-legal-status="pending">
        <h2>Website terms</h2>
        <p>
          Website-specific terms are awaiting the owner’s approval before public launch. No
          additional license, warranty, refund policy, or purchase agreement is created by this
          preview page.
        </p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>
          Contact <a href={`mailto:${product.supportEmail}`}>{product.supportEmail}</a> if you need
          help finding the applicable terms.
        </p>
      </section>
    </InformationPage>
  );
}

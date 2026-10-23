import { InformationPage } from '@/components/layout/InformationPage';
import { product } from '@/content/product';
import { pageMetadata } from '@/lib/seo';
import styles from '@/components/layout/Information.module.css';
export const metadata = pageMetadata(
  'Support',
  'Get help with DynamicLand for macOS, music permissions, widgets, Pro purchases, and contacting the developer.',
  '/support',
);
export default function Support() {
  return (
    <InformationPage
      eyebrow="Here to help"
      title="A little help, right here."
      intro="Get started with DynamicLand, find a setting, or get in touch with the developer."
    >
      <section>
        <h2>Getting started</h2>
        <ol>
          <li>
            Download DynamicLand from the <a href={product.downloadUrl}>Mac App Store</a>. You’ll
            need {product.platform}.
          </li>
          <li>
            Open the app, then hover over the notch to open your island. You can also find
            DynamicLand in the menu bar.
          </li>
          <li>
            Open Settings to adjust the island’s layout, appearance, and behavior. The full Home
            widget grid and some styles require Pro.
          </li>
        </ol>
      </section>
      <section>
        <h2>Music controls and permissions</h2>
        <p>
          DynamicLand supports Apple Music and Spotify. Open your music app and start playback. If
          controls aren’t responding, check the permissions requested by DynamicLand in macOS System
          Settings → Privacy &amp; Security.
        </p>
        <p>
          Some features need their own permissions. Grant access when you choose to use the
          corresponding feature, and review it in System Settings whenever you need to.
        </p>
      </section>
      <section>
        <h2>Finding your island</h2>
        <p>
          If the island is hidden, check whether “hide in full screen” or “hide when idle” is
          enabled in DynamicLand’s settings. External-display islands are part of Pro and have
          per-display settings.
        </p>
      </section>
      <section>
        <h2>Pro and purchases</h2>
        <p>
          {product.pricing} Check the Pro screen in the app for current prices, available plans, and
          Restore Purchases.
        </p>
        <p>
          If a purchase isn’t showing up, make sure you’re using the Apple Account that made the
          purchase, then try Restore Purchases in DynamicLand. Contact the developer if the issue
          continues.
        </p>
      </section>
      <section className={styles.contact}>
        <h2>Talk to the developer.</h2>
        <p>
          Email <a href={`mailto:${product.supportEmail}`}>{product.supportEmail}</a> for support.
        </p>
        <p>
          Include your DynamicLand version, macOS version, and what you were doing when the issue
          occurred. Leave out private clipboard contents, personal files, passwords, and payment
          details.
        </p>
        <a
          className="button buttonPrimary"
          href={`mailto:${product.supportEmail}?subject=DynamicLand%20support`}
        >
          Email support
        </a>
      </section>
      <section>
        <h2>Privacy and terms</h2>
        <p>
          Find the owner’s published app documents on our <a href="/privacy">Privacy</a> and{' '}
          <a href="/terms">Terms</a> pages.
        </p>
      </section>
    </InformationPage>
  );
}

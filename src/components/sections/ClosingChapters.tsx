import Image from 'next/image';
import { DownloadButton } from '@/components/DownloadButton';
import { ProBadge } from '@/components/ProBadge';
import { Disclosure } from '@/components/interactive/Disclosure';
import { Arrow, Check } from '@/components/Icon';
import { faqs, product } from '@/content/product';
import styles from './Sections.module.css';
export function Pricing() {
  return (
    <section id="pricing" className={`section ${styles.pricing}`} aria-labelledby="pricing-title">
      <div className="container">
        <div className={`${styles.centerHeading} ${styles.pricingHeading}`}>
          <h2 id="pricing-title">
            Start free. <span className={styles.accent}>Go further.</span>
          </h2>
          <p>Make room for DynamicLand. Add Pro when you’re ready.</p>
        </div>
        <div className={styles.priceGrid}>
          <article className={styles.priceCard} aria-labelledby="free-plan-title">
            <span className={styles.planBrand}>DynamicLand</span>
            <h3 id="free-plan-title">Free</h3>
            <p className={styles.planTerms}>A little more connected. Free to download.</p>
            <ul className={styles.checkList}>
              {[
                'Music controls at a glance',
                'Clipboard history & File Tray',
                'A notch that feels like yours',
              ].map((item) => (
                <li key={item}>
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
            <div className={styles.planAction}>
              <DownloadButton />
              <p>macOS 26.0 or later</p>
            </div>
          </article>
          <article
            className={`${styles.priceCard} ${styles.proCard}`}
            aria-labelledby="pro-plan-title"
          >
            <span className={styles.planBrand}>DynamicLand</span>
            <h3 id="pro-plan-title">
              <ProBadge large />
            </h3>
            <p className={styles.planTerms}>Monthly or yearly subscription.</p>
            <ul className={styles.checkList}>
              {[
                'Full Home widgets & MiniLand',
                'Synced lyrics & clipboard search',
                'More tools, styles & displays',
              ].map((item) => (
                <li key={item}>
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
            <div className={styles.planAction}>
              <a className="button" href={product.downloadUrl}>
                Explore Pro <Arrow direction="external" size={18} />
              </a>
              <p>Upgrade in the app</p>
            </div>
          </article>
        </div>
        <p className={styles.priceNote}>
          Pro features require a subscription. See the app or App Store for current pricing.
        </p>
      </div>
    </section>
  );
}
export function FAQ() {
  return (
    <section id="faq" className={`section ${styles.faqSection}`} aria-labelledby="faq-title">
      <div className={`container ${styles.faq}`}>
        <div className={styles.faqIntro}>
          <div>
            <span className={styles.faqEyebrow}>GET TO KNOW DYNAMICLAND</span>
            <h2 id="faq-title">
              Good to
              <br />
              know<span>.</span>
            </h2>
            <p>
              A little clarity.
              <br />
              Before you make it yours.
            </p>
          </div>
          <a href="/support" className={styles.faqSupport}>
            <Image src={product.logo} width={44} height={44} alt="" unoptimized />
            <span>
              <strong>A little more help?</strong>
              <span>Visit DynamicLand Support</span>
            </span>
            <Arrow size={18} />
          </a>
        </div>
        <div className={styles.faqList}>
          {faqs.map((item, index) => (
            <Disclosure key={item.question} title={item.question} defaultOpen={index === 0}>
              <p>{item.answer}</p>
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Closing() {
  return (
    <section className={styles.closing} aria-labelledby="closing-title">
      <div className={`container ${styles.closingInner}`}>
        <Image src={product.logo} width={72} height={72} alt="" unoptimized />
        <h2 id="closing-title">
          Make a little room
          <br />
          for a better everyday.
        </h2>
        <p>Your Mac. Your island. Your DynamicLand.</p>
        <DownloadButton />
        <p className="fineprint">Free download · macOS 26.0 or later</p>
      </div>
    </section>
  );
}

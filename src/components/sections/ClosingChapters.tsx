import { closingChaptersCopy } from '@/content/copy';
import { site, faqs } from '@/content/site';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Arrow } from '@/components/ui/Arrow';
export function NativeChapter() {
  return (
    <section className="native-chapter content-width" aria-labelledby="native-heading">
      <p className="chapter-label">{closingChaptersCopy.atHomeOnMacOS}</p>
      <h2 id="native-heading" className="serif">
        {closingChaptersCopy.madeForTheMac}
        <br />
        {closingChaptersCopy.youAlreadyLove}
      </h2>
      <div>
        <p>{closingChaptersCopy.dynamiclandIsBuiltAroundThe}</p>
        <a className="text-link" href="/privacy/">
          {closingChaptersCopy.privacyInformation}
          <Arrow />
        </a>
      </div>
    </section>
  );
}
export function Pricing() {
  return (
    <section className="pricing content-width" id="pricing" aria-labelledby="pricing-heading">
      <div>
        <p className="chapter-label">{closingChaptersCopy.pricingAndAvailability}</p>
        <h2 id="pricing-heading">
          {closingChaptersCopy.makeRoom}
          <br />
          <span className="serif">{closingChaptersCopy.forDynamicLand}</span>
        </h2>
      </div>
      <div className="pricing-detail">
        <h3>{closingChaptersCopy.dynamiclandForMac}</h3>
        {site.pricing ? (
          <>
            <p className="price">{site.pricing.amount}</p>
            <p>{site.pricing.detail}</p>
          </>
        ) : (
          <p>
            {closingChaptersCopy.pricingAndReleaseDetailsWill}
            <br className="desktop-break" />
            {closingChaptersCopy.checkBackForTheOfficial}
          </p>
        )}
        <DownloadButton />
        {site.minimumOS && <p className="small-copy">{site.minimumOS}</p>}
      </div>
    </section>
  );
}
export function FAQ() {
  return (
    <section className="faq content-width" aria-labelledby="faq-heading">
      <div>
        <h2 id="faq-heading">
          {closingChaptersCopy.aFewThings}
          <br />
          <span className="serif">{closingChaptersCopy.youMightBeWondering}</span>
        </h2>
        <a className="text-link" href="/support/">
          {closingChaptersCopy.visitSupport}
          <Arrow />
        </a>
      </div>
      <div className="faq-list">
        {faqs.map((item) => (
          <details key={item.question} name="faq">
            <summary>
              {item.question}
              <span className="faq-plus" aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta stage-width" aria-labelledby="final-heading">
      <h2 id="final-heading" data-motion="optical">
        {closingChaptersCopy.makeYourself}
        <br />
        <span className="serif">{closingChaptersCopy.atHome}</span>
      </h2>
      <DownloadButton light />
      <p className="final-wordmark" aria-hidden="true">
        {closingChaptersCopy.dynamicland}
      </p>
    </section>
  );
}

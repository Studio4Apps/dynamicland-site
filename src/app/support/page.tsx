import { supportCopy } from '@/content/copy';
import { site } from '@/content/site';
import { pageMetadata } from '@/lib/seo';
import { Arrow } from '@/components/ui/Arrow';
export const metadata = pageMetadata(
  'Support',
  'Find help with DynamicLand for macOS, music integrations, Mini Lands, and downloads.',
  '/support/',
);
export default function Support() {
  return (
    <main id="main" className="reading-page">
      <a href="/" className="text-link back-link">
        {supportCopy.backToDynamicLand}
      </a>
      <h1>{supportCopy.hereToHelp}</h1>
      <p className="reading-lead">{supportCopy.supportForDynamicLandOnMacOS}</p>
      <section>
        <h2>{supportCopy.gettingStarted}</h2>
        <p>{supportCopy.dynamiclandBringsHomeWidgetsMini}</p>
        <a href="/#explore" className="text-link">
          {supportCopy.exploreDynamicLand}
          <Arrow />
        </a>
      </section>
      <section>
        <h2>{supportCopy.downloadsAndCompatibility}</h2>
        <p>{supportCopy.theOfficialDownloadLinkSupported}</p>
        <a href="/#pricing" className="text-link">
          {supportCopy.pricingAndAvailability}
          <Arrow />
        </a>
      </section>
      <section>
        <h2>{supportCopy.needAHand}</h2>
        {site.supportEmail ? (
          <a className="text-link" href={`mailto:${site.supportEmail}`}>
            {site.supportEmail}
            <Arrow />
          </a>
        ) : (
          <p>{supportCopy.contactDetailsWillBeAdded}</p>
        )}
        <p>{supportCopy.whenReportingAProblemInclude}</p>
      </section>
      <section>
        <h2>{supportCopy.productQuestions}</h2>
        <p>{supportCopy.findAnswersAboutMiniLands}</p>
        <a href="/#faq-heading" className="text-link">
          {supportCopy.readCommonQuestions}
          <Arrow />
        </a>
      </section>
    </main>
  );
}

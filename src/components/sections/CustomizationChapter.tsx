import { customizationChapterCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
export function CustomizationChapter() {
  return (
    <section
      className="customization stage-width"
      id="customization"
      aria-labelledby="customization-heading"
    >
      <div className="customization-intro">
        <h2 id="customization-heading">
          {customizationChapterCopy.itsYourMac}
          <br />
          <span className="serif">{customizationChapterCopy.letItFeelLikeIt}</span>
        </h2>
        <p>
          {customizationChapterCopy.adjustDynamicLandsSizeAppearanceAnd}
          <br className="desktop-break" />
          {customizationChapterCopy.toFindAnArrangementThat}
        </p>
      </div>
      <div
        className="customization-gallery"
        role="region"
        aria-label="Customization views"
        tabIndex={0}
      >
        <figure>
          <MediaFrame slot="customizationA" />
          <figcaption>{customizationChapterCopy.size}</figcaption>
        </figure>
        <figure>
          <MediaFrame slot="customizationB" />
          <figcaption>{customizationChapterCopy.appearance}</figcaption>
        </figure>
        <figure>
          <MediaFrame slot="customizationC" />
          <figcaption>{customizationChapterCopy.layouts}</figcaption>
        </figure>
      </div>
      <p className="gallery-hint">
        {customizationChapterCopy.scrollToExplore}
        <span aria-hidden="true">{customizationChapterCopy.text}</span>
      </p>
    </section>
  );
}

import { highlights } from '@/content/product';
import { Gallery } from '@/components/interactive/Gallery';
import { MediaFrame } from '@/components/media/MediaFrame';
import { ProBadge } from '@/components/ProBadge';
import styles from './Sections.module.css';
import galleryStyles from '@/components/interactive/Interactive.module.css';
export function Highlights() {
  return (
    <section
      id="features"
      className={`section ${styles.highlights}`}
      aria-labelledby="highlights-title"
    >
      <div className={`container ${styles.sectionHeading}`}>
        <div data-motion-group="copy">
          <span className="eyebrow">Less switching. More doing.</span>
          <h2 id="highlights-title">A closer look at your new space.</h2>
          <p>
            A few of the things that make the top of your screen
            <br className={styles.desktopBreak} /> a more useful place to be.
          </p>
        </div>
      </div>
      <Gallery
        items={highlights.map((item) => ({
          id: item.id,
          label: item.label,
          content: (
            <>
              <MediaFrame id={item.slot} />
              <div className={galleryStyles.highlightCopy} data-gallery-caption>
                <span>
                  {item.tag} {item.pro && <ProBadge />}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </>
          ),
        }))}
      />
    </section>
  );
}

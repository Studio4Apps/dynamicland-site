import { DownloadButton } from '@/components/DownloadButton';
import { Arrow } from '@/components/Icon';
import { MediaFrame } from '@/components/media/MediaFrame';
import styles from './Sections.module.css';
export function Hero() {
  return (
    <section id="overview" className={styles.hero} aria-labelledby="hero-title">
      <div className="container">
        <div className={styles.heroCopy}>
          <h1 id="hero-title">
            Your Mac.
            <br />
            <span className={styles.accent}>A little more connected.</span>
          </h1>
          <p>
            Music, widgets, and everyday essentials.
            <br className={styles.desktopBreak} /> Right where you look. Right at your notch.
          </p>
          <div className={styles.heroActions}>
            <DownloadButton />
            <a className="button buttonSecondary" href="#features">
              Explore the features <Arrow direction="down" size={16} />
            </a>
          </div>
          <p className="fineprint">
            Free download <span aria-hidden="true">·</span> macOS 26.0 or later{' '}
            <span aria-hidden="true">·</span> Pro available
          </p>
        </div>
        <div className={styles.heroMedia}>
          <MediaFrame id="hero" />
        </div>
        <div className={styles.heroCaption}>
          <span>One place for the little things that make your day.</span>
          <a href="#home" className={styles.captionLink}>
            Get to know DynamicLand <Arrow size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}

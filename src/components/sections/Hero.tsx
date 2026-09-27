import { DownloadButton } from '@/components/DownloadButton';
import { MediaAsset } from '@/components/media/MediaAsset';
import { media } from '@/content/media';
import { FeatureExplorer } from '@/components/interactive/FeatureExplorer';
import { IlluminatedText } from '@/components/interactive/IlluminatedText';
import styles from './Sections.module.css';
export function Hero() {
  return (
    <section id="overview" className={styles.hero} aria-labelledby="hero-title">
      <div className="container">
        <div className={styles.heroCopy}>
          <h1 id="hero-title">
            Your Mac.
            <br />
            <IlluminatedText lines={['A little more connected.']} />
          </h1>
          <p>
            Music, widgets, and everyday essentials.
            <br className={styles.desktopBreak} /> Right where you look. Right at your notch.
          </p>
          <div className={styles.heroActions}>
            <DownloadButton />
            <FeatureExplorer />
          </div>
          <p className="fineprint">
            Free download <span aria-hidden="true">·</span> macOS 26.0 or later{' '}
            <span aria-hidden="true">·</span> Pro available
          </p>
        </div>
      </div>
      <div className={styles.heroArtwork} data-hero-artwork aria-hidden="true">
        <MediaAsset slot={media.hero} />
      </div>
    </section>
  );
}

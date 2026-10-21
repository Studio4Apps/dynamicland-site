import { DownloadButton } from '@/components/DownloadButton';
import { MediaAsset } from '@/components/media/MediaAsset';
import { LakeHero } from '@/components/scene/LakeHero';
import { media } from '@/content/media';
import styles from './Home.module.css';

// A violet lake at nightfall. The headline hangs between the clouds and sinks
// beneath the water as the visitor scrolls on.
export function Hero() {
  return (
    <section id="overview" className={styles.hero} aria-labelledby="hero-title">
      <LakeHero
        poster={<MediaAsset slot={media.hero} />}
        title={
          <>
            <span className={styles.heroLine}>Your Mac.</span>{' '}
            <span className={styles.heroLine}>
              A little more <span className={styles.heroSheen}>connected.</span>
            </span>
          </>
        }
        intro={
          <div className={styles.heroIntro} data-reveal-group="110">
            <p>
              Music, widgets, and everyday essentials. Right where you look, right at your notch, so
              the things you reach for every day are always one hover away.
            </p>
            <div className={styles.heroActions}>
              <DownloadButton />
            </div>
            <p className={`fineprint ${styles.heroFine}`}>
              Free download <span aria-hidden="true">·</span> macOS 26.0 or later{' '}
              <span aria-hidden="true">·</span> Pro available
            </p>
          </div>
        }
      />
    </section>
  );
}

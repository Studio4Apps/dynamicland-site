import { MediaFrame } from '@/components/media/MediaFrame';
import { ProBadge } from '@/components/ProBadge';
import { DetailSelector } from '@/components/interactive/DetailSelector';
import { customizations } from '@/content/product';
import styles from './Sections.module.css';

export function MusicChapter() {
  return (
    <section id="music" className={`section ${styles.music}`} aria-labelledby="music-title">
      <div className="container">
        <div className={styles.sectionHeading}>
          <div className={styles.musicHeading} data-motion-group="copy">
            <span className="eyebrow">Now Playing</span>
            <h2 id="music-title">
              Your music.
              <br />
              Always in the right place.
            </h2>
            <p>
              Pause, skip, or switch your audio output from the notch. Keep your favorite soundtrack
              close while the rest of your day carries on.
            </p>
          </div>
          <div className={styles.musicPartners}>
            <span>Apple Music</span>
            <span>Spotify</span>
          </div>
        </div>
        <div data-motion="media">
          <MediaFrame id="music" dark />
        </div>
        <div className={styles.musicDetails} data-motion-group="details">
          <div>
            <h3>Keep the controls close.</h3>
            <p>See what’s playing and control your music without switching away from your work.</p>
          </div>
          <div>
            <h3>Find your next favorite.</h3>
            <p>Browse Apple Music playlists, charts, For You, and Replay from your island.</p>
          </div>
          <div>
            <h3>
              Follow every line. <ProBadge />
            </h3>
            <p>
              Read synced lyrics as the song plays. Select a line to jump straight to that moment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export function ActivityChapter() {
  return (
    <section className={`section ${styles.activity}`} aria-labelledby="activity-title">
      <div className={`container ${styles.split}`}>
        <div className={styles.chapterCopy} data-motion-group="copy">
          <span className="eyebrow">
            MiniLand <ProBadge />
          </span>
          <h2 id="activity-title">
            Life moves.
            <br />
            Stay in the loop.
          </h2>
          <p>
            A timer counting down. A voice memo recording. A file on its way. Keep several live
            activities beside your notch and jump back in when you need to.
          </p>
          <p>A quick glance, without opening the full island.</p>
        </div>
        <div data-motion="media">
          <MediaFrame id="activities" />
        </div>
      </div>
    </section>
  );
}
export function EverydayChapter() {
  return (
    <section
      id="everyday"
      className={`section ${styles.everyday}`}
      aria-labelledby="everyday-title"
    >
      <div className="container">
        <div className={styles.sectionHeading}>
          <div data-motion-group="copy">
            <span className="eyebrow">The everyday, considered</span>
            <h2 id="everyday-title">Small tools. Fewer detours.</h2>
            <p>For the things you do again, and again, and again.</p>
          </div>
        </div>
        <div className={styles.utilityGrid} data-motion-group="cards">
          <article className={styles.utilityCard}>
            <div className={styles.utilityCopy}>
              <h3>Copied. Kept. Found.</h3>
              <p>
                Return to your clipboard history, preview an item, and copy it again. Keep the
                things you reuse pinned and ready.
              </p>
              <p className="fineprint">Extended history and full search with Pro.</p>
            </div>
            <MediaFrame id="clipboard" />
          </article>
          <article className={styles.utilityCard}>
            <div className={styles.utilityCopy}>
              <h3>A place to drop it.</h3>
              <p>
                Drag files to the notch. Keep them in the tray, then drag them out when you need
                them.
              </p>
              <p className="fineprint">Sharing and conversions with Pro.</p>
            </div>
            <MediaFrame id="tray" />
          </article>
          <article className={styles.utilityCard}>
            <div className={styles.utilityCopy}>
              <h3>Catch the moment.</h3>
              <p>Set a timer, record a voice memo, or pick a color straight from your screen.</p>
              <ProBadge />
            </div>
            <MediaFrame id="tools" />
          </article>
        </div>
      </div>
    </section>
  );
}
export function CustomizationChapter() {
  return (
    <section
      id="customization"
      className={`section ${styles.customization}`}
      aria-labelledby="custom-title"
    >
      <div className="container">
        <div className={styles.sectionHeading}>
          <div data-motion-group="copy">
            <span className="eyebrow">Feels like your Mac</span>
            <h2 id="custom-title">Your island. Your way.</h2>
            <p>
              A familiar notch or a floating pill. A classic finish or Liquid Glass.
              <br className={styles.desktopBreak} /> Find your look, then make the details yours.
            </p>
          </div>
        </div>
        <DetailSelector
          items={customizations.map((item) => ({ ...item, media: <MediaFrame id={item.slot} /> }))}
        />
        <div className={styles.compatibility} data-motion-group="details">
          <div>
            <h3>Made for macOS.</h3>
            <p>
              DynamicLand runs on macOS 26.0 or later. Check the App Store for your Mac’s
              compatibility.
            </p>
          </div>
          <div>
            <h3>
              More screens, same feeling. <ProBadge />
            </h3>
            <p>
              Add an island to your external displays, with per-display settings and Sidecar
              support.
            </p>
          </div>
          <div>
            <h3>There when you need it.</h3>
            <p>
              Hide your island when idle or in full screen. Use global keyboard shortcuts with Pro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

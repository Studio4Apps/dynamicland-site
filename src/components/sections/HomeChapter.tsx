import { MediaFrame } from '@/components/media/MediaFrame';
import { Arrow } from '@/components/Icon';
import { ProBadge } from '@/components/ProBadge';
import styles from './Sections.module.css';
export function HomeChapter() {
  return (
    <section id="home" className={`section ${styles.home}`} aria-labelledby="home-title">
      <div className="container">
        <div className={styles.split}>
          <div className={styles.chapterCopy}>
            <span className="eyebrow">
              Your Home <ProBadge />
            </span>
            <h2 id="home-title">
              A small space.
              <br />A lot more you.
            </h2>
            <p>
              Your next meeting. The weather outside. The song on repeat. Bring the widgets you
              reach for into one personal space at the top of your Mac.
            </p>
            <p>Add, resize, and arrange them around your day.</p>
            <a href="#customization" className="textLink">
              Make yourself at home <Arrow size={16} />
            </a>
          </div>
          <div data-reveal="optical">
            <MediaFrame id="home" />
          </div>
        </div>
        <div className={styles.homeDetails}>
          <div data-reveal="quiet">
            <span className={styles.number}>01</span>
            <h3>Pick your essentials.</h3>
            <p>
              Calendar, weather, battery, music, photos, and more. Choose what belongs in your Home.
            </p>
          </div>
          <div data-reveal="quiet">
            <span className={styles.number}>02</span>
            <h3>Give everything its place.</h3>
            <p>Choose widget sizes and styles, then arrange them in a layout that works for you.</p>
          </div>
          <div data-reveal="quiet">
            <span className={styles.number}>03</span>
            <h3>Keep your day close.</h3>
            <p>Hover over the notch for a quick look, then get back to what you were doing.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

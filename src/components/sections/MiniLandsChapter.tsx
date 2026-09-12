import { miniLandsChapterCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
export function MiniLandsChapter() {
  return (
    <section className="mini-chapter content-width" id="mini-lands" aria-labelledby="mini-heading">
      <div className="mini-copy">
        <p className="chapter-label">{miniLandsChapterCopy.miniLands}</p>
        <h2 id="mini-heading">
          {miniLandsChapterCopy.keepMoreThanOne}
          <br />
          <span className="serif">{miniLandsChapterCopy.thingInView}</span>
        </h2>
        <p>
          {miniLandsChapterCopy.lifeDoesntHappenOneActivity}
          <br />
          {miniLandsChapterCopy.miniLandsLetMultipleLive}
        </p>
      </div>
      <div className="mini-scene">
        <div className="mini-sticky">
          <div className="mini-stack">
            <MediaFrame slot="miniMain" />
            <MediaFrame slot="miniDetail" className="mini-secondary" />
          </div>
          <p className="scene-note">{miniLandsChapterCopy.multipleLiveActivitiesOnePlace}</p>
        </div>
      </div>
    </section>
  );
}

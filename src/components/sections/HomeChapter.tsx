import { homeChapterCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
export function HomeChapter() {
  return (
    <section className="home-chapter stage-width" id="home" aria-labelledby="home-heading">
      <div className="home-intro">
        <p className="chapter-label">{homeChapterCopy.homeAndWidgets}</p>
        <h2 id="home-heading">
          {homeChapterCopy.aFamiliarPlace}
          <br />
          <span className="serif">{homeChapterCopy.forYourEveryday}</span>
        </h2>
        <p>
          {homeChapterCopy.yourCalendarTheWeatherWhats}
          <br />
          {homeChapterCopy.bringTheThingsYouCheck}
          <br className="desktop-break" />
          {homeChapterCopy.togetherInDynamicLandHome}
        </p>
      </div>
      <div className="home-composition">
        <MediaFrame slot="homeMain" />
        <MediaFrame slot="homeDetail" className="home-detail" />
      </div>
      <div className="widget-story">
        <div>
          <h3>{homeChapterCopy.theWidgetsYouReachFor}</h3>
          <p>{homeChapterCopy.keepCalendarWeatherAndBattery}</p>
        </div>
        <MediaFrame slot="widgets" />
      </div>
    </section>
  );
}

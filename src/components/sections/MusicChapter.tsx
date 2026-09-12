import { musicChapterCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
export function MusicChapter() {
  return (
    <section className="music-chapter stage-width" id="music" aria-labelledby="music-heading">
      <div className="music-intro">
        <p className="chapter-label">{musicChapterCopy.music}</p>
        <h2 id="music-heading" data-motion="optical">
          {musicChapterCopy.yourMusic}
          <br />
          <span className="serif">{musicChapterCopy.withRoomForTheLyrics}</span>
        </h2>
        <p>
          {musicChapterCopy.playbackYourMusicAndThe}
          <br className="desktop-break" />
          {musicChapterCopy.bringAppleMusicSpotifyAnd}
        </p>
      </div>
      <div className="music-stage" data-motion="aperture">
        <MediaFrame slot="music" className="dark-frame" />
      </div>
      <div className="music-caption">
        <span>{musicChapterCopy.appleMusic}</span>
        <span aria-hidden="true">{musicChapterCopy.text}</span>
        <span>{musicChapterCopy.spotify}</span>
        <span aria-hidden="true">{musicChapterCopy.text2}</span>
        <span>{musicChapterCopy.lyrics}</span>
      </div>
    </section>
  );
}

import { heroCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Arrow } from '@/components/ui/Arrow';
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <h1 id="hero-heading">
          {heroCopy.yourMacsNotch}
          <br />
          <span className="serif">{heroCopy.nowPartOfYourDay}</span>
        </h1>
        <p>
          {heroCopy.dynamiclandBringsYourMusicWidgets}
          <br className="desktop-break" />
          {heroCopy.intoTheSpaceAroundYour}
        </p>
        <DownloadButton />
      </div>
      <div className="hero-stage stage-width">
        <MediaFrame slot="heroPrimary" priority />
        <div className="hero-caption">
          <span>{heroCopy.dynamiclandForMacOS}</span>
          <a href="#explore">
            {heroCopy.takeACloserLook}
            <Arrow down />
          </a>
        </div>
      </div>
    </section>
  );
}

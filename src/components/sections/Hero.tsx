import { heroCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { Arrow } from '@/components/ui/Arrow';
import Image from 'next/image';
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-landscape">
        <Image
          src="/images/dynamicland-coast.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          className="hero-landscape-image"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-kicker">{heroCopy.introduction}</p>
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
          <DownloadButton light />
        </div>
        <div className="hero-caption content-width">
          <span>{heroCopy.dynamiclandForMacOS}</span>
          <a href="#explore">
            {heroCopy.takeACloserLook}
            <Arrow down />
          </a>
        </div>
      </div>
      <div className="hero-product content-width">
        <div className="hero-product-copy">
          <p className="serif">
            {heroCopy.moreToYourMac}
            <br />
            {heroCopy.rightAtTheTop}
          </p>
          <p>
            {heroCopy.productIntroduction}
            <br className="desktop-break" />
            {heroCopy.productLocation}
          </p>
        </div>
        <div className="hero-stage">
          <MediaFrame slot="heroPrimary" />
        </div>
      </div>
    </section>
  );
}

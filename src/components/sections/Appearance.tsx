import Image from 'next/image';
import { ProBadge } from '@/components/ProBadge';
import { IslandPicker } from '@/components/interactive/IslandPicker';
import { customizations } from '@/content/product';
import styles from './Home.module.css';

// One large screen, a segmented control under it and a caption that answers
// the choice. Native radios choose the style; CSS (:has) shows the matching
// island, slides the control's indicator and swaps the caption, so the picker
// works the same with or without script. Each island is drawn the way the
// app's own Settings preview draws it: its real silhouette and material.
export function Appearance() {
  return (
    <section id="customization" className={styles.appearance} aria-labelledby="custom-title">
      <div className="container">
        <header className={styles.appearanceHead}>
          <h2 id="custom-title" data-reveal>
            Your island. Your way.
          </h2>
          <p data-reveal="120">
            The shape. The finish. The little details.{' '}
            <strong>Choose the island that feels at home on your Mac,</strong> and change it
            whenever you like.
          </p>
        </header>
        <IslandPicker className={styles.studio}>
          <div className={styles.screenStage} aria-hidden="true">
            <div className={styles.screen}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.wallpaper}
                src="/media/lake-1600.webp"
                srcSet="/media/lake-1600.webp 1600w, /media/lake-2400.webp 2400w"
                sizes="(max-width: 760px) 260vw, 150vw"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className={styles.stageMenubar}>
                <b>Music</b>
                <span>File</span>
                <span>Edit</span>
                <span>Song</span>
                <span>View</span>
                <span className={styles.status}>
                  <svg viewBox="0 0 20 14">
                    <path d="M10 12.6 7.4 9.9a3.7 3.7 0 0 1 5.2 0zM4.8 7.3a7.4 7.4 0 0 1 10.4 0l-1.3 1.3a5.6 5.6 0 0 0-7.8 0zM2.2 4.7a11 11 0 0 1 15.6 0l-1.3 1.3a9.2 9.2 0 0 0-13 0z" />
                  </svg>
                  <svg viewBox="0 0 28 14">
                    <rect
                      x="1"
                      y="1.5"
                      width="22"
                      height="11"
                      rx="3.2"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.5"
                      strokeWidth="1.3"
                    />
                    <rect x="3" y="3.5" width="14" height="7" rx="1.6" />
                    <path d="M25 5.2v3.6a2 2 0 0 0 0-3.6Z" fillOpacity="0.5" />
                  </svg>
                  Fri 9:41
                </span>
              </span>
              {customizations.map((item) => (
                <div
                  key={item.id}
                  id={`preview-${item.id}`}
                  className={styles.island}
                  data-preview
                  data-style={item.id}
                >
                  <NowPlaying />
                </div>
              ))}
            </div>
          </div>
          <fieldset className={styles.styleSwitch}>
            <legend className="srOnly">Island style</legend>
            <span className={styles.switchIndicator} aria-hidden="true" />
            {customizations.map((item, index) => {
              const [first, ...rest] = item.title.split(' ');
              return (
                <label key={item.id}>
                  <input
                    type="radio"
                    name="island-style"
                    value={item.id}
                    defaultChecked={index === 0}
                    aria-describedby={`description-${item.id}`}
                  />
                  {/* Phones show only the second word; readers always hear both. */}
                  <span className={styles.switchFirst}>{first} </span>
                  {rest.join(' ')}
                </label>
              );
            })}
          </fieldset>
          <div className={styles.styleCaptions}>
            {customizations.map((item) => (
              <div key={item.id} className={styles.styleCaption} data-style={item.id}>
                <h3>
                  {item.title}
                  {item.pro ? <ProBadge /> : <span className={styles.free}>Free</span>}
                </h3>
                <p id={`description-${item.id}`}>{item.description}</p>
              </div>
            ))}
          </div>
        </IslandPicker>
      </div>
    </section>
  );
}

function NowPlaying() {
  return (
    <>
      <span className={styles.playerHead}>
        <Image
          className={styles.artwork}
          src="/media/pro-voyage.webp"
          width={1086}
          height={1448}
          alt=""
          unoptimized
        />
        <span className={styles.track}>
          <b>Night Crossing</b>
          <span>Lakeside</span>
        </span>
        <span className={styles.wave}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </span>
      <span className={styles.progress}>
        <span>0:48</span>
        <i />
        <span>-2:13</span>
      </span>
      <span className={styles.transport}>
        <svg viewBox="0 0 24 24">
          <path d="M21 6.5v11L13 12zM12 6.5v11L4 12z" />
        </svg>
        <svg viewBox="0 0 24 24">
          <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
          <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
        </svg>
        <svg viewBox="0 0 24 24">
          <path d="M3 6.5v11l8-5.5zM12 6.5v11l8-5.5z" />
        </svg>
      </span>
    </>
  );
}

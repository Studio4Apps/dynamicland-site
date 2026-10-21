import Image from 'next/image';
import type { CSSProperties } from 'react';
import { AppStoreBadge } from '@/components/DownloadButton';
import { ProBadge } from '@/components/ProBadge';
import { Disclosure } from '@/components/interactive/Disclosure';
import { MediaFrame } from '@/components/media/MediaFrame';
import { Arrow, Check } from '@/components/Icon';
import { media } from '@/content/media';
import { faqs, product } from '@/content/product';
import { Glyph, type GlyphName } from './Glyph';
import { SplitHeading } from './SplitHeading';
import styles from './Home.module.css';

type Capability = {
  title: string;
  label: string;
  text: string;
  tone: string;
  glyph?: GlyphName;
  figure?: { value: number; unit: string };
  image?: string;
};
const capabilities: Capability[] = [
  {
    title: 'Your day, at a glance.',
    label: 'Home.',
    text: 'Calendar, weather, battery, photos, and more, arranged around your day.',
    tone: 'violet',
    glyph: 'widgets',
  },
  {
    title: 'Keep the music playing.',
    label: 'Now Playing.',
    text: 'Pause, skip, and switch outputs for Apple Music and Spotify without leaving your work.',
    tone: 'midnight',
    glyph: 'music',
    figure: { value: 2, unit: 'apps' },
  },
  {
    title: 'Life moves. Stay in the loop.',
    label: 'MiniLand.',
    text: 'Follow timers, recordings, and transfers beside the notch, without opening the island.',
    tone: 'image',
    image: '/media/pro-card.webp',
  },
  {
    title: 'Copied. Kept. Found.',
    label: 'Clipboard.',
    text: 'Return to your history, preview an item, and copy it again. Pin the things you reuse.',
    tone: 'sun',
    glyph: 'clipboard',
  },
  {
    title: 'A place to drop it.',
    label: 'File Tray.',
    text: 'Drag files to the notch, keep them in the tray, and drag them out when you need them.',
    tone: 'ocean',
    glyph: 'tray',
  },
  {
    title: 'Catch the moment.',
    label: 'Tools.',
    text: 'Set a timer, record a voice memo, or pick any color straight from your screen.',
    tone: 'berry',
    glyph: 'timer',
    figure: { value: 3, unit: 'tools' },
  },
];

export function Capabilities() {
  return (
    <section id="everyday" className={styles.capabilities} aria-labelledby="capabilities-title">
      <div className="container">
        <SplitHeading id="capabilities-title" title="Everything you reach for. One hover away.">
          DynamicLand turns the space around your notch into a place for the things you do every
          day. No new windows. No detours. Just a glance at the top of your screen.
        </SplitHeading>
        <div className={styles.capabilityGrid} data-reveal-group="110">
          {capabilities.map((item) => (
            <article key={item.label} className={styles.capability}>
              <div className={styles.tile} data-tone={item.tone} data-draw>
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
                )}
                <h3>{item.title}</h3>
                {item.glyph && (
                  <span className={item.figure ? styles.tileGlyphSmall : styles.tileGlyph}>
                    <Glyph name={item.glyph} size={item.figure ? 28 : 64} />
                  </span>
                )}
                {item.figure && (
                  <p className={styles.tileFigure}>
                    <span data-count={item.figure.value}>{item.figure.value}</span>
                    <small>{item.figure.unit}</small>
                  </p>
                )}
                {item.image && <MiniBubbles />}
              </div>
              <p className={styles.caption}>
                <strong>{item.label}</strong> {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Three live activities, the way MiniLand keeps them beside the notch.
function MiniBubbles() {
  return (
    <span className={styles.bubbles} aria-hidden="true">
      <span className={styles.notchPill} />
      {['timer', 'wave', 'download'].map((name, i) => (
        <span key={name} className={styles.bubble} style={{ '--b': i } as CSSProperties}>
          <Glyph name={name as GlyphName} size={16} />
        </span>
      ))}
    </span>
  );
}

const musicNotes: { glyph: GlyphName; title: string; text: string }[] = [
  {
    glyph: 'wave',
    title: 'Keep the controls close.',
    text: 'See what’s playing and control your music without switching away.',
  },
  {
    glyph: 'playlist',
    title: 'Find your next favorite.',
    text: 'Browse Apple Music playlists, charts, For You, and Replay.',
  },
  {
    glyph: 'lyrics',
    title: 'Follow every line.',
    text: 'Read synced lyrics as the song plays. Select a line to jump to it.',
  },
  {
    glyph: 'output',
    title: 'Switch the output.',
    text: 'Move the sound to your speakers or headphones from the notch.',
  },
];

export function MusicStory() {
  return (
    <section id="music" className={styles.music} aria-labelledby="music-title">
      <div className="container">
        <h2 id="music-title" className={styles.musicTitle} data-reveal data-sweep>
          Your music doesn’t need another window. It needs{' '}
          <span className="sheen">the right place.</span>
        </h2>
        <p className={styles.musicLead} data-reveal="140">
          Pause, skip, or switch your audio output from the notch. Keep your favorite soundtrack
          close while the rest of your day carries on, with synced lyrics and richer artwork in Pro.
        </p>
        <figure className={styles.musicMedia} data-reveal="80">
          <MediaFrame id="music" dark />
          <figcaption>
            <span>Apple Music</span>
            <span>Spotify</span>
          </figcaption>
        </figure>
        <div className={styles.musicNotes} data-reveal-group="110">
          {musicNotes.map((note) => (
            <div key={note.title}>
              <span data-draw>
                <Glyph name={note.glyph} size={24} />
              </span>
              <p>
                <strong>{note.title}</strong> {note.text}
              </p>
            </div>
          ))}
        </div>
        <p className={styles.musicFine} data-reveal>
          Synced lyrics and enhanced Apple Music artwork are included with DynamicLand Pro.
        </p>
      </div>
    </section>
  );
}

const homeFigures: { glyph: GlyphName; value: number; unit: string; text: string }[] = [
  { glyph: 'widgets', value: 11, unit: 'widgets', text: 'to choose from, Calendar to Color Picker.' },
  { glyph: 'hover', value: 1, unit: 'hover', text: 'to open your Home, then back to work.' },
  { glyph: 'window', value: 0, unit: 'new windows', text: 'Everything stays at the top of your screen.' },
];

export function HomeSpotlight() {
  return (
    <section id="home" className={styles.spotlight} aria-labelledby="home-title">
      <div className="container">
        <SplitHeading
          id="home-title"
          title={
            <>
              Your Home.
              <br />A small space. A lot more you.
            </>
          }
        >
          Your next meeting. The weather outside. The song on repeat. Bring the widgets you reach
          for into one personal space, then add, resize, and arrange them around your day.
        </SplitHeading>
        <div
          className={styles.unfold}
          data-scroll
          data-scroll-start="1"
          data-scroll-end="0.3"
        >
          <MediaFrame id="home" configuration={{ ...media.home, ratio: '16 / 8.5' }} />
        </div>
        <dl className={styles.figures} data-reveal-group="120">
          {homeFigures.map((item) => (
            <div key={item.unit}>
              <dt>
                <span data-draw>
                  <Glyph name={item.glyph} size={22} />
                </span>
                <span data-count={item.value}>{item.value}</span>
                <small>{item.unit}</small>
              </dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const steps: { glyph: GlyphName; title: string; text: string; scene: string }[] = [
  {
    glyph: 'download',
    title: 'Download it once.',
    text: 'Free from the Mac App Store, for macOS 26.0 or later.',
    scene: 'store',
  },
  {
    glyph: 'hover',
    title: 'Hover your notch.',
    text: 'DynamicLand opens right where you look, then gets out of the way.',
    scene: 'open',
  },
  {
    glyph: 'sliders',
    title: 'Make it yours.',
    text: 'Choose your widgets, a style, and how the island behaves.',
    scene: 'tune',
  },
];

export function Journey() {
  return (
    <section id="how" className={styles.journey} aria-labelledby="journey-title">
      <div className="container">
        <div className={styles.journeyHeading}>
          <h2 id="journey-title" data-reveal>
            How DynamicLand fits your day.
          </h2>
          <p data-reveal="100">No setup marathon. Three steps, and your notch starts working for you.</p>
        </div>
        <div
          className={styles.route}
          data-scroll
          data-scroll-start="0.9"
          data-scroll-end="0.35"
          aria-hidden="true"
        >
          <span className={styles.routeTrack} />
          <span className={styles.routeIsland}>
            <i />
          </span>
        </div>
        <ol className={styles.steps} data-reveal-group="140">
          {steps.map((step, i) => (
            <li key={step.title}>
              <div className={styles.scene} data-scene={step.scene} aria-hidden="true">
                <span className={styles.stepIndex}>0{i + 1}</span>
                <span className={styles.screen}>
                  <span className={styles.screenNotch} />
                  {step.scene === 'store' && <span className={styles.storeBadge}>Get</span>}
                  {step.scene === 'open' && (
                    <span className={styles.openIsland}>
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {step.scene === 'tune' && (
                    <span className={styles.tuneRows}>
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                </span>
              </div>
              <span className={styles.stepGlyph} data-draw>
                <Glyph name={step.glyph} size={22} />
              </span>
              <p>
                <strong>{step.title}</strong> {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Plans() {
  return (
    <section id="pricing" className={styles.plans} aria-labelledby="pricing-title">
      <div className="container">
        <article className={styles.planCard} data-reveal>
          <div className={styles.planCopy}>
            <h2 id="pricing-title" data-sweep>
              Start free.
              <br />
              <span className="sweep">Go further</span> with Pro.
            </h2>
            <p>Make room for DynamicLand today. Add Pro when you’re ready for more.</p>
            <div className={styles.planColumns}>
              <div>
                <h3>Free</h3>
                <ul>
                  {[
                    'Music controls at a glance',
                    'Clipboard history & File Tray',
                    'A notch that feels like yours',
                  ].map((item) => (
                    <li key={item}>
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>
                  <ProBadge />
                </h3>
                <ul>
                  {[
                    'Full Home widgets & MiniLand',
                    'Synced lyrics & clipboard search',
                    'More tools, styles & displays',
                  ].map((item) => (
                    <li key={item}>
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.planActions}>
              <AppStoreBadge />
              <a className={styles.planLink} href={product.downloadUrl}>
                Explore Pro <Arrow direction="external" size={16} />
              </a>
            </div>
          </div>
          <div className={styles.planArt}>
            <Image
              src="/media/pro-card.webp"
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 40vw"
            />
            <span className={styles.planBadge}>
              <ProBadge large />
            </span>
            <span className={styles.chip}>
              <Glyph name="spark" size={14} /> Monthly or yearly
            </span>
          </div>
        </article>
        <p className={styles.planNote}>
          Pro features require a subscription. See the app or App Store for current pricing.
        </p>
      </div>
    </section>
  );
}

export function Questions() {
  return (
    <section id="faq" className={styles.questions} aria-labelledby="faq-title">
      <div className="container">
        <div className={styles.questionsHead}>
          <h2 id="faq-title" data-reveal>
            Good to know.
          </h2>
          <a href="/support" className={styles.support} data-reveal="100">
            <Image src={product.logo} width={36} height={36} alt="" unoptimized />
            <span>
              <strong>A little more help?</strong>
              <span>Visit DynamicLand Support</span>
            </span>
            <Arrow size={16} />
          </a>
        </div>
        <div className={styles.faqList} data-reveal="80">
          {faqs.map((item, index) => (
            <Disclosure key={item.question} title={item.question} defaultOpen={index === 0}>
              <p>{item.answer}</p>
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Invitation() {
  return (
    <section className={styles.invitation} aria-labelledby="closing-title">
      <div className="container">
        <div className={styles.inviteCard} data-reveal>
          <picture className={styles.inviteArt} aria-hidden="true">
            <source media="(max-width: 760px)" srcSet="/media/footer-840.webp" />
            <Image src="/media/footer-1448.webp" alt="" fill sizes="100vw" unoptimized />
          </picture>
          <div className={styles.inviteCopy}>
            <Image src={product.logo} width={64} height={64} alt="" unoptimized />
            <h2 id="closing-title">
              Make a little room
              <br />
              for a better everyday.
            </h2>
            <p>Your Mac. Your island. Your DynamicLand.</p>
            <AppStoreBadge />
            <p className={styles.inviteFine}>Free download · macOS 26.0 or later</p>
          </div>
        </div>
      </div>
    </section>
  );
}

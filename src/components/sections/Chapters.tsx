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
  image?: string;
};
const capabilities: Capability[] = [
  {
    title: 'Your day, at a glance.',
    label: 'Home.',
    text: 'Calendar, weather, battery, photos, and more, arranged around your day.',
    tone: 'violet',
  },
  {
    title: 'Keep the music playing.',
    label: 'Now Playing.',
    text: 'Pause, skip, and switch outputs for Apple Music and Spotify without leaving your work.',
    tone: 'midnight',
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
  },
  {
    title: 'A place to drop it.',
    label: 'File Tray.',
    text: 'Drag files to the notch, keep them in the tray, and drag them out when you need them.',
    tone: 'ocean',
  },
  {
    title: 'Catch the moment.',
    label: 'Tools.',
    text: 'Set a timer, record a voice memo, or pick any color straight from your screen.',
    tone: 'berry',
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
              <div className={styles.tile} data-tone={item.tone}>
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
                )}
                <h3>{item.title}</h3>
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

// Each note wears its own app-icon colour, top to bottom of its tile.
const musicNotes: { glyph: GlyphName; tint: [string, string]; title: string; text: string }[] = [
  {
    glyph: 'wave',
    tint: ['#ff6b8b', '#f2295b'],
    title: 'Keep the controls close.',
    text: 'See what’s playing and control your music without switching away.',
  },
  {
    glyph: 'playlist',
    tint: ['#ffb54d', '#ff7a1f'],
    title: 'Find your next favorite.',
    text: 'Browse Apple Music playlists, charts, For You, and Replay.',
  },
  {
    glyph: 'lyrics',
    tint: ['#5cb4ff', '#2563eb'],
    title: 'Follow every line.',
    text: 'Read synced lyrics as the song plays. Select a line to jump to it.',
  },
  {
    glyph: 'output',
    tint: ['#4ade80', '#16a34a'],
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
          <MediaFrame id="music" />
          <figcaption>
            <span>Apple Music</span>
            <span>Spotify</span>
          </figcaption>
        </figure>
        <div className={styles.musicNotes} data-reveal-group="110">
          {musicNotes.map((note) => (
            <div key={note.title}>
              <span
                className={styles.noteIcon}
                style={{ '--tint-top': note.tint[0], '--tint-bottom': note.tint[1] } as CSSProperties}
                data-draw
              >
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
        />
        <div className={styles.unfold} data-scroll data-scroll-start="1" data-scroll-end="0.3">
          <MediaFrame id="home" configuration={{ ...media.home, ratio: '16 / 8.5' }} />
        </div>
        <p className={styles.spotlightText} data-reveal="120">
          Your next meeting. The weather outside. The song on repeat. Bring the widgets you reach
          for into one personal space, then add, resize, and arrange them around your day.
        </p>
      </div>
    </section>
  );
}

// Each step shows the real thing it asks for, peeking up from the bottom of
// its card: the store listing, the island open under the cursor, and the
// settings that shape it. Still pictures; nothing here moves on its own.
const steps = [
  {
    title: 'Download it once.',
    text: 'Free from the Mac App Store, for macOS 26.0 or later.',
    scene: <StoreScene />,
  },
  {
    title: 'Hover your notch.',
    text: 'DynamicLand opens right where you look, then gets out of the way.',
    scene: <HoverScene />,
  },
  {
    title: 'Make it yours.',
    text: 'Choose your widgets, a style, and how the island behaves.',
    scene: <SettingsScene />,
  },
];

export function Journey() {
  return (
    <section id="how" className={styles.journey} aria-labelledby="journey-title">
      <div className="container">
        <SplitHeading id="journey-title" title="How DynamicLand fits your day.">
          No setup marathon. Three steps, and your notch starts working for you.
        </SplitHeading>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.stepCopy}>
                <span className={styles.stepLabel} aria-hidden="true">
                  Step {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
              {step.scene}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WindowBar({ title }: { title?: string }) {
  return (
    <span className={styles.windowBar} aria-hidden="true">
      <i />
      <i />
      <i />
      {title && <b>{title}</b>}
    </span>
  );
}

// The listing is real content, and its Get button is the real download link.
function StoreScene() {
  return (
    <div className={styles.stepScene}>
      <div className={styles.window}>
        <WindowBar />
        <div className={styles.listing}>
          <Image src={product.logo} width={56} height={56} alt="" unoptimized />
          <span>
            <strong>{product.name}</strong>
            <span>{product.publisher}</span>
          </span>
          <a
            href={product.downloadUrl}
            className={styles.get}
            aria-label="Get DynamicLand on the Mac App Store"
          >
            Get
          </a>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>Price</dt>
            <dd>Free</dd>
          </div>
          <div>
            <dt>Requires</dt>
            <dd>macOS 26</dd>
          </div>
          <div>
            <dt>Pro</dt>
            <dd>Optional</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const homeWidgets = ['calendar', 'weather', 'music'] as const;

function HoverScene() {
  return (
    <div className={styles.stepScene} aria-hidden="true">
      <div className={styles.display}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.wallpaper}
          src="/media/lake-960.webp"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span className={styles.menubar}>
          <b>Music</b>
          <span className={styles.clock}>9:41</span>
        </span>
        <span className={styles.hoverIsland}>
          {homeWidgets.map((name) => (
            <Image
              key={name}
              src={`/media/widgets/${name}.png`}
              width={160}
              height={160}
              alt=""
              unoptimized
            />
          ))}
        </span>
        <svg className={styles.cursor} viewBox="0 0 14 21" aria-hidden="true">
          <path d="M1 1v16.5l4.2-4 2.9 6.6 2.7-1.2-2.9-6.5H13.6z" />
        </svg>
      </div>
    </div>
  );
}

function SettingsScene() {
  return (
    <div className={styles.stepScene} aria-hidden="true">
      <div className={styles.window}>
        <WindowBar title="Appearance" />
        <div className={styles.settings}>
          <span>
            Style
            <span className={styles.segmented}>
              <b>Notch</b>
              <span>Pill</span>
            </span>
          </span>
          <span>
            Theme
            <span className={styles.popup}>
              Obsidian Glass
              <svg viewBox="0 0 8 12">
                <path d="M1.5 4.5 4 2l2.5 2.5M1.5 7.5 4 10l2.5-2.5" />
              </svg>
            </span>
          </span>
          <span>
            Hide in full screen
            <span className={styles.toggle} />
          </span>
          <span>
            Size
            <span className={styles.slider} />
          </span>
        </div>
      </div>
    </div>
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
            </div>
          </div>
          <div className={styles.planArt} data-header-tone="dark">
            <Image
              src="/media/pro-voyage.webp"
              alt=""
              fill
              sizes="(max-width: 960px) 100vw, 40vw"
            />
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
        <div className={styles.inviteCard} data-reveal data-header-tone="dark">
          <picture className={styles.inviteArt} aria-hidden="true">
            <source media="(max-width: 760px)" srcSet="/media/invite-island-840.webp" />
            <Image src="/media/invite-island-1600.webp" alt="" fill sizes="100vw" unoptimized />
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

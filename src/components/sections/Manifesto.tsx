'use client';

import Image from 'next/image';
import { Newsreader } from 'next/font/google';
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { springEasing } from '@/lib/motion';
import styles from './Manifesto.module.css';

const serif = Newsreader({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// An editorial statement with small, working pieces of DynamicLand set into
// the copy: the compact island, the Home widget icons, and a Mini Bubble.
// The sentence is complete without them, so they stay aria-hidden.
type Mark = 'island' | 'widgets' | 'bubble';
const story: (string | Mark | { accent: string })[] = [
  'Hover your notch',
  'island',
  'and DynamicLand opens into a home for',
  'widgets',
  'the things you use every day. Music, timers, and transfers stay',
  'bubble',
  'one glance away, so your Mac feels',
  { accent: 'a little more connected.' },
];

const WORD_STAGGER_MS = 42;

export function Manifesto() {
  const section = useRef<HTMLElement>(null);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // The island's own hover physics: bouncy on expand, critically damped on collapse.
    section.current?.style.setProperty('--island-open', springEasing(900, 0.55, 0.72));
    section.current?.style.setProperty('--island-close', springEasing(520, 0.34, 1));
    section.current?.style.setProperty('--pop', springEasing(800, 0.5, 0.62));
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver !== 'function') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Only prepare copy that is still below the fold; never hide what is seen.
    if (root.getBoundingClientRect().top < innerHeight * 0.82) return;
    root.dataset.reveal = 'waiting';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        root.dataset.reveal = 'running';
        const count = root.querySelectorAll('[data-token]').length;
        timer = setTimeout(() => delete root.dataset.reveal, count * WORD_STAGGER_MS + 1800);
      },
      { rootMargin: '0px 0px -20% 0px' },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      delete root.dataset.reveal;
    };
  }, []);

  let index = 0;
  const token = (content: ReactNode, key: string, className = styles.word) => (
    <span key={key} className={className} data-token style={{ '--i': index++ } as CSSProperties}>
      {content}
    </span>
  );
  const words = (text: string, key: string, accent = false) =>
    text.split(' ').map((word, i) => (
      <Fragment key={`${key}-${i}`}>
        {(i > 0 || !accent) && ' '}
        {token(
          <span className={styles.rise}>{word}</span>,
          `${key}-${i}`,
          accent ? `${styles.word} ${styles.accent}` : styles.word,
        )}
      </Fragment>
    ));

  return (
    <section ref={section} className={`section ${styles.section}`} aria-label="Why DynamicLand">
      <div className="container">
        <p ref={ref} className={`${serif.className} ${styles.statement}`}>
          {story.map((part, partIndex) => {
            if (typeof part === 'object')
              return (
                <Fragment key={partIndex}>
                  {' '}
                  <span className={styles.phrase}>{words(part.accent, `a${partIndex}`, true)}</span>
                </Fragment>
              );
            if (part === 'island')
              return [' ', token(<IslandMark />, `m${partIndex}`, styles.mark)];
            if (part === 'widgets')
              return [' ', token(<WidgetDeck />, `m${partIndex}`, styles.mark)];
            if (part === 'bubble')
              return [' ', token(<BubbleMark />, `m${partIndex}`, styles.mark)];
            return words(part, `w${partIndex}`);
          })}
        </p>
      </div>
    </section>
  );
}

// Hover in with a mouse, or tap on touch. Each mark plays forward once, holds,
// then settles back on its own a moment after the pointer leaves.
function useMarkSequence<State extends string>(
  idle: State,
  steps: [State, number][],
  holdMs: number,
) {
  const [state, setState] = useState<State>(idle);
  const playing = useRef<ReturnType<typeof setTimeout>[]>([]);
  const revert = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRevert = () => {
    if (revert.current) clearTimeout(revert.current);
    revert.current = null;
  };
  useEffect(
    () => () => {
      playing.current.forEach(clearTimeout);
      clearRevert();
    },
    [],
  );
  const play = () => {
    clearRevert();
    if (state !== idle) return;
    playing.current.forEach(clearTimeout);
    playing.current = steps.map(([next, at]) => setTimeout(() => setState(next), at));
  };
  const settle = () => {
    clearRevert();
    const last = steps.at(-1)?.[1] ?? 0;
    revert.current = setTimeout(
      () => {
        playing.current.forEach(clearTimeout);
        setState(idle);
      },
      holdMs + (state === idle ? last : 0),
    );
  };
  return {
    state,
    handlers: {
      onPointerEnter: (event: ReactPointerEvent) => event.pointerType === 'mouse' && play(),
      onPointerLeave: (event: ReactPointerEvent) => event.pointerType === 'mouse' && settle(),
      onPointerUp: (event: ReactPointerEvent) => {
        if (event.pointerType === 'mouse') return;
        play();
        settle();
      },
    },
  };
}

// The compact island: artwork in the leading ear, the live waveform in the
// trailing one. Hovering expands it the way the real notch does.
const WAVE = [0.45, 0.85, 0.6, 1, 0.5];
function IslandMark() {
  const { state, handlers } = useMarkSequence<'idle' | 'open'>('idle', [['open', 0]], 900);
  return (
    <span className={styles.island} data-state={state} aria-hidden="true" {...handlers}>
      <span className={styles.islandBody}>
        <span className={styles.artwork}>
          <svg viewBox="0 0 24 24">
            <path
              d="M10 17.2V7.6l7-1.8v9.4"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="17.2" r="2.4" fill="#fff" />
            <circle cx="15" cy="15.4" r="2.4" fill="#fff" />
          </svg>
        </span>
        <span className={styles.wave}>
          {WAVE.map((height, i) => (
            <span key={i} style={{ '--h': height, '--bar': i } as CSSProperties} />
          ))}
        </span>
      </span>
    </span>
  );
}

// The Home widget icons from the app, fanned like a hand of cards. Hovering
// opens the fan and deals the next widget in from the right.
const WIDGETS = [
  'calendar',
  'music',
  'weather',
  'timer',
  'photo',
  'voice-memo',
  'color-picker',
  'battery',
  'time',
] as const;
function WidgetDeck() {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const loop = useRef<ReturnType<typeof setInterval> | null>(null);
  const deal = () => setOffset((value) => value + 1);
  const stop = () => {
    if (loop.current) clearInterval(loop.current);
    loop.current = null;
  };
  useEffect(() => stop, []);
  return (
    <span
      className={styles.deck}
      data-open={open || undefined}
      aria-hidden="true"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        setOpen(true);
        stop();
        deal();
        loop.current = setInterval(deal, 760);
      }}
      onPointerLeave={() => {
        setOpen(false);
        stop();
      }}
      onPointerUp={(event) => event.pointerType !== 'mouse' && deal()}
    >
      {WIDGETS.map((file, i) => {
        // 0 left, 1 front, 2 right; everything else waits face-down behind.
        const slot = (((i - offset) % WIDGETS.length) + WIDGETS.length) % WIDGETS.length;
        return (
          <span key={file} className={styles.card} data-slot={slot < 3 ? slot : 'held'}>
            <Image src={`/media/widgets/${file}.png`} alt="" width={80} height={80} />
          </span>
        );
      })}
    </span>
  );
}

// A Mini Bubble, the way the island keeps an activity close. Hovering lets the
// running timer finish, then swipes to the next activity: a file transfer that
// completes with a check.
function BubbleMark() {
  const { state, handlers } = useMarkSequence<'idle' | 'ending' | 'transfer' | 'sent'>(
    'idle',
    [
      ['ending', 0],
      ['transfer', 620],
      ['sent', 1500],
    ],
    1400,
  );
  return (
    <span className={styles.bubble} data-state={state} aria-hidden="true" {...handlers}>
      <span className={styles.face} data-face="timer">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="#9a4d17" strokeOpacity=".75" strokeWidth="2.4" />
          <circle
            className={styles.timerArc}
            cx="12"
            cy="12"
            r="8"
            stroke="#ff922e"
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength="100"
          />
          <path
            className={styles.timerHand}
            d="M12 12V7.4"
            stroke="#ff922e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={styles.face} data-face="transfer">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="#33d973" strokeOpacity=".22" strokeWidth="2.4" />
          <circle
            className={styles.transferArc}
            cx="12"
            cy="12"
            r="8"
            stroke="#33d973"
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength="100"
          />
          <path
            className={styles.up}
            d="M12 15.4V8.8M9.1 11.6 12 8.6l2.9 3"
            stroke="#33d973"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className={styles.done}
            d="m8.6 12.2 2.4 2.4 4.5-4.9"
            stroke="#33d973"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
          />
        </svg>
      </span>
    </span>
  );
}

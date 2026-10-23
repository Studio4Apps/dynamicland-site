'use client';

import Image from 'next/image';
import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { SplitHeading } from './SplitHeading';
import styles from './Home.module.css';

const widgets = [
  { file: 'calendar', name: 'Calendar', line: 'Your next meeting.', tint: '#fde8e6' },
  { file: 'weather', name: 'Weather', line: 'The sky outside.', tint: '#dcebff' },
  { file: 'music', name: 'Music', line: 'The song on repeat.', tint: '#ffe1ec' },
  { file: 'timer', name: 'Timer', line: 'Counting down.', tint: '#ffe9d6' },
  { file: 'photo', name: 'Photos', line: 'A favorite moment.', tint: '#e7f6e4' },
  { file: 'voice-memo', name: 'Voice Memos', line: 'An idea, kept.', tint: '#ffe0e0' },
  { file: 'color-picker', name: 'Color Picker', line: 'Any color on screen.', tint: '#efe4ff' },
  { file: 'battery', name: 'Battery', line: 'Charge at a glance.', tint: '#e2f7ea' },
  { file: 'time', name: 'Time', line: 'Every time zone.', tint: '#e9e9ef' },
] as const;

// Drift speed in CSS px per second, and how long the row waits after the
// visitor's last movement before it drifts again.
const SPEED = 64;
const REST = 3000;

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (change: () => void) => {
  const query = matchMedia(REDUCED);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};
const canLoop = () => !matchMedia(REDUCED).matches;

// The row drifts sideways in an endless loop. A mouse over it slows it to a
// stop until the pointer rests or leaves; a touch or a swipe hands it to the
// visitor until they let it be. Without motion (or script) it is an ordinary
// swipeable row.
export function WidgetRail() {
  const rail = useRef<HTMLDivElement>(null);
  const looping = useSyncExternalStore(subscribeMotion, canLoop, () => false);
  useEffect(() => {
    const viewport = rail.current;
    const track = viewport?.firstElementChild as HTMLElement | null;
    if (!looping || !viewport || !track) return;
    // Four copies of the set. The drift is the row's own scroll position, kept
    // within the second copy and stepped back one copy (an identical picture)
    // as it reaches the third, so there are tiles on both sides and no start.
    // A visitor's hand moves that same scroll position: the drift only stops
    // writing it, and later carries on from wherever the hand left it.
    let period = 0;
    let position = 0;
    let written = 0;
    let speed = 0;
    let frame = 0;
    let last = 0;
    let held = false;
    let hovering = false;
    let visible = false;
    let rest = 0;
    let still = 0;

    const goal = () => (!held && !hovering && visible && !document.hidden ? SPEED : 0);
    // Browsers keep scroll positions in whole pixels; the remainder moves the
    // track, so the drift glides instead of ticking a pixel at a time.
    const place = (next: number) => {
      position = next;
      viewport.scrollLeft = next;
      written = viewport.scrollLeft;
      track.style.transform = `translateX(${(written - next).toFixed(3)}px)`;
    };
    // Into the second copy, from wherever the row is now: where the drift left
    // it, or wherever a hand moved it since, with the track's remainder kept so
    // that the picture does not shift by a fraction of a pixel.
    const settle = () => {
      let next = viewport.scrollLeft + position - written;
      while (next < period) next += period;
      while (next >= period * 2) next -= period;
      place(next);
    };
    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = goal();
      // Speeds up over about a second, slows to a stop in about half that.
      speed += (target - speed) * (1 - Math.exp(-dt * (target > speed ? 3 : 6)));
      if (held || (!target && speed < 1)) {
        speed = 0;
        return;
      }
      let next = position + speed * dt;
      if (next >= period * 2) next -= period;
      place(next);
      frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (frame || held || !goal() || !period) return;
      if (!speed) settle();
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const build = () => {
      const first = track.children[0]?.getBoundingClientRect().left;
      const copy = track.children[widgets.length]?.getBoundingClientRect().left;
      // Tiles are fractional widths: a rounded period would shift every wrap.
      const next = first !== undefined && copy !== undefined ? copy - first : 0;
      if (!next || Math.abs(next - period) < 0.01) return;
      const fraction = period ? (position - period) / period : 0;
      period = next;
      place(period + fraction * period);
      wake();
    };

    // The visitor takes the row: stop at once, and give it back after a rest.
    const hold = () => {
      held = true;
      cancelAnimationFrame(frame);
      frame = 0;
      speed = 0;
      clearTimeout(rest);
      rest = window.setTimeout(() => {
        held = false;
        wake();
      }, REST);
    };
    // A scroll the drift did not write is the visitor's (a swipe, its momentum,
    // a wheel), and so is any scroll while they hold it.
    const scroll = () => {
      if (held || Math.abs(viewport.scrollLeft - written) > 2) hold();
    };
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) hold();
    };
    // A mouse over the row slows it to a stop; at rest for a while, it lets it go.
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      hovering = true;
      clearTimeout(still);
      still = window.setTimeout(() => {
        hovering = false;
        wake();
      }, REST);
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(still);
      hovering = false;
      wake();
    };
    const visibility = () => wake();
    const sight = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      wake();
    });
    const size = new ResizeObserver(build);

    build();
    sight.observe(viewport);
    size.observe(track);
    viewport.addEventListener('touchstart', hold, { passive: true });
    viewport.addEventListener('wheel', wheel, { passive: true });
    viewport.addEventListener('scroll', scroll, { passive: true });
    viewport.addEventListener('pointerenter', hover);
    viewport.addEventListener('pointermove', hover);
    viewport.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      sight.disconnect();
      size.disconnect();
      viewport.removeEventListener('touchstart', hold);
      viewport.removeEventListener('wheel', wheel);
      viewport.removeEventListener('scroll', scroll);
      viewport.removeEventListener('pointerenter', hover);
      viewport.removeEventListener('pointermove', hover);
      viewport.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      cancelAnimationFrame(frame);
      clearTimeout(rest);
      clearTimeout(still);
      track.style.transform = '';
      viewport.scrollLeft = 0;
    };
  }, [looping]);
  return (
    <section className={styles.rail} aria-labelledby="rail-title">
      <div className="container">
        <SplitHeading id="rail-title" title="A Home built from your favorite things.">
          Pick what belongs, choose a size and a style, and give everything its place. Your Home
          grows with you, one widget at a time.
        </SplitHeading>
      </div>
      <div ref={rail} className={styles.railViewport} data-loop={looping || undefined}>
        <ul className={styles.railTrack}>
          {(looping ? [0, 1, 2, 3] : [0]).flatMap((copy) =>
            widgets.map((widget) => (
              // The copies only continue the loop: hidden from assistive tech and focus.
              <li
                key={copy ? `${copy}-${widget.file}` : widget.file}
                style={{ '--tint': widget.tint } as CSSProperties}
                aria-hidden={copy ? true : undefined}
                inert={copy ? true : undefined}
              >
                <div className={styles.railTile}>
                  <span>{widget.name}</span>
                  <Image
                    src={`/media/widgets/${widget.file}.png`}
                    alt=""
                    width={160}
                    height={160}
                  />
                </div>
                <p>
                  <strong>{widget.name}.</strong> {widget.line}
                </p>
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  );
}

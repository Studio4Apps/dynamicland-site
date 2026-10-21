'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';
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

// The rail drifts sideways as the page scrolls past it. On narrow screens,
// or without motion, it is an ordinary swipeable row.
export function WidgetRail() {
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = rail.current;
    if (!element || typeof ResizeObserver !== 'function') return;
    const measure = () => {
      const track = element.firstElementChild as HTMLElement | null;
      if (!track) return;
      element.style.setProperty(
        '--travel',
        `${Math.max(0, track.scrollWidth - element.clientWidth)}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section className={styles.rail} aria-labelledby="rail-title">
      <div className="container">
        <SplitHeading id="rail-title" title="A Home built from your favorite things.">
          Pick what belongs, choose a size and a style, and give everything its place. Your Home
          grows with you, one widget at a time.
        </SplitHeading>
      </div>
      <div
        ref={rail}
        className={styles.railViewport}
        data-scroll
        data-scroll-start="1"
        data-scroll-end="-0.2"
      >
        <ul className={styles.railTrack}>
          {widgets.map((widget) => (
            <li key={widget.file} style={{ '--tint': widget.tint } as CSSProperties}>
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
          ))}
        </ul>
      </div>
    </section>
  );
}

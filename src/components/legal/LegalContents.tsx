'use client';
import { useEffect, useRef, useState } from 'react';
import { LegalIcon } from './LegalIcon';
import styles from './Legal.module.css';

type Entry = { id: string; number: number; title: string };

/** The document's contents: a rail beside the text on wide screens, and a bar that
 *  stays under the header on narrow ones. Both follow the section being read. */
export function LegalContents({ sections }: { sections: Entry[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const rail = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));
    const article = targets[0]?.closest('article');
    if (!article) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // A section is being read once its top passes where anchors land: the clearance kept
      // under the header, plus the contents bar on narrow screens.
      const line =
        (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) +
        (parseFloat(getComputedStyle(targets[0]).scrollMarginTop) || 0) +
        16;
      const box = article.getBoundingClientRect();
      let current = targets[0];
      for (const target of targets) {
        if (target.getBoundingClientRect().top > line) break;
        current = target;
      }
      // Once the end of the text is on screen, the last section is the one being read.
      if (box.bottom <= innerHeight) current = targets[targets.length - 1];
      setActive(current.id);
      const progress = Math.min(
        Math.max((line - box.top) / (box.height - innerHeight + line), 0),
        1,
      );
      meter.current?.style.setProperty('--p', String(progress));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
    };
  }, [sections]);

  // Jumps made on the page glide; opening the page at a section lands there at once.
  useEffect(() => {
    const root = document.documentElement;
    const start = () => root.classList.add(styles.smoothScroll);
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
    return () => {
      removeEventListener('load', start);
      root.classList.remove(styles.smoothScroll);
    };
  }, []);

  // Keep the current entry in view when the rail is taller than the window.
  useEffect(() => {
    const box = rail.current;
    const link = box?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!box || !link || box.scrollHeight <= box.clientHeight) return;
    // The scroll box is positioned, so offsetTop is measured from its top.
    const top = link.offsetTop;
    if (
      top >= box.scrollTop + 48 &&
      top + link.offsetHeight <= box.scrollTop + box.clientHeight - 48
    )
      return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({
      top: top - box.clientHeight / 2 + link.offsetHeight / 2,
      behavior: still ? 'auto' : 'smooth',
    });
  }, [active]);

  const current = sections.find((section) => section.id === active) ?? sections[0];
  const list = (closes = false) => (
    <ol className={styles.tocList}>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={section.id === active ? 'true' : undefined}
            onClick={
              closes
                ? (event) => event.currentTarget.closest('details')?.removeAttribute('open')
                : undefined
            }
          >
            <span className={styles.tocNumber}>{section.number}</span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <div className="scrollMeter" ref={meter} aria-hidden="true" />
      <aside className={styles.rail}>
        <nav aria-label="On this page" className={styles.railNav}>
          <p className={styles.tocTitle}>On this page</p>
          <div className={styles.railScroll} ref={rail}>
            {list()}
          </div>
          <div className={styles.railActions}>
            <a className={styles.quiet} href="#main">
              <LegalIcon name="up" size={17} />
              Back to top
            </a>
          </div>
        </nav>
      </aside>
      <details className={styles.jump}>
        <summary>
          <span className={styles.jumpLabel}>On this page</span>
          <span className={styles.jumpCurrent}>
            <span className={styles.tocNumber}>{current.number}</span>
            <span>{current.title}</span>
          </span>
          <LegalIcon name="chevron" size={18} />
        </summary>
        <nav aria-label="On this page" className={styles.jumpPanel}>
          {list(true)}
        </nav>
      </details>
    </>
  );
}

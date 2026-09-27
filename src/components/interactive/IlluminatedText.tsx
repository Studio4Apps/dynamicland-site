'use client';
import { Fragment, useEffect, useRef } from 'react';
import { createMotionScope } from '@/lib/motion';
import styles from './IlluminatedText.module.css';

// Editorial copy borrows Lyrics' travelling illumination. The real text is
// always present and readable; only a second, aria-hidden light layer sweeps.
export function IlluminatedText({
  lines,
  tone = 'light',
}: {
  lines: string[];
  tone?: 'light' | 'purple';
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver !== 'function') return;
    const scope = createMotionScope(() => {
      delete root.dataset.illuminating;
    });
    const words = Array.from(root.querySelectorAll<HTMLElement>('[data-word-light]'));
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (scope.reduced.matches || document.hidden || typeof root.animate !== 'function') return;
        root.dataset.illuminating = 'true';
        words.forEach((word, i) =>
          scope.animate(
            word,
            [{ clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)' }],
            {
              duration: 240,
              delay: 120 + i * 105,
              easing: 'cubic-bezier(.3, 0, .2, 1)',
              fill: 'backwards',
            },
            i === words.length - 1
              ? () => {
                  delete root.dataset.illuminating;
                }
              : undefined,
          ),
        );
      },
      { threshold: 0.75 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      scope.destroy();
    };
  }, []);
  return (
    <span ref={ref} className={styles.illuminated} data-tone={tone}>
      {lines.map((line, index) => (
        <Fragment key={line}>
          {index > 0 && <br />}
          {line.split(' ').map((word, i) => (
            <Fragment key={`${i}-${word}`}>
              {i > 0 && ' '}
              <span className={styles.word}>
                {word}
                <span className={styles.light} data-word-light aria-hidden="true">
                  {word}
                </span>
              </span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </span>
  );
}

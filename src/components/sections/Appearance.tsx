'use client';

import { useState } from 'react';
import { MediaFrame } from '@/components/media/MediaFrame';
import { customizations } from '@/content/product';
import { SplitHeading } from './SplitHeading';
import { Glyph, type GlyphName } from './Glyph';
import styles from './Home.module.css';

const looks: Record<(typeof customizations)[number]['id'], { glyph: GlyphName; tone: string }> = {
  notch: { glyph: 'notch', tone: 'midnight' },
  pill: { glyph: 'pill', tone: 'violet' },
  glass: { glyph: 'glass', tone: 'ocean' },
};

export function Appearance() {
  const [active, setActive] = useState<string>(customizations[0].id);
  const current = customizations.find((item) => item.id === active) ?? customizations[0];
  return (
    <section id="customization" className={styles.appearance} aria-labelledby="custom-title">
      <div className="container">
        <SplitHeading id="custom-title" title="Your island. Your way.">
          The shape. The finish. The little details. Choose the island that feels at home on your
          Mac, and change it whenever you like.
        </SplitHeading>
        <div className={styles.stageFrame} data-reveal>
          {customizations.map((item) => (
            <div
              key={item.id}
              className={styles.stageLayer}
              data-active={item.id === active || undefined}
              aria-hidden={item.id !== active}
            >
              <MediaFrame id={item.slot} />
            </div>
          ))}
          <span className={styles.chip} aria-live="polite">
            <Glyph name={looks[current.id].glyph} size={14} /> {current.title}
          </span>
        </div>
        <div className={styles.lookGrid} role="radiogroup" aria-label="Island style" data-reveal-group="110">
          {customizations.map((item) => (
            <div key={item.id} className={styles.look}>
              <button
                type="button"
                role="radio"
                aria-checked={item.id === active}
                className={styles.lookTile}
                data-tone={looks[item.id].tone}
                onClick={() => setActive(item.id)}
              >
                <span className={styles.lookGlyph} data-draw>
                  <Glyph name={looks[item.id].glyph} size={26} />
                </span>
                <span className={styles.lookName}>{item.title}</span>
              </button>
              <p className={styles.caption}>{item.description}</p>
              <span className={styles.tag}>{item.pro ? 'Pro' : 'Free'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

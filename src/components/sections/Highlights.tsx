import { highlights } from '@/content/copy';
import { highlightsCopy } from '@/content/copy';
import { Arrow } from '@/components/ui/Arrow';
import { FeatureIcon } from '@/components/ui/FeatureIcon';

export function Highlights() {
  return (
    <section className="highlights content-width" id="explore" aria-labelledby="explore-heading">
      <div className="chapter-intro">
        <h2 id="explore-heading">
          {highlightsCopy.getToKnow} <br />
          <span className="serif">{highlightsCopy.dynamicland}</span>
        </h2>
        <p>
          {highlightsCopy.moreThanAChangeOf}
          <br />
          {highlightsCopy.aUsefulNewPlaceFor}
        </p>
      </div>
      <nav className="highlight-rail" aria-label="Product highlights">
        {highlights.map((item, index) => (
          <a key={item.href} href={item.href}>
            <FeatureIcon name={(['home', 'layers', 'music', 'sliders'] as const)[index]} />
            <span className="highlight-title">
              {item.title}
              <Arrow />
            </span>
            <span className="highlight-detail">{item.detail}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}

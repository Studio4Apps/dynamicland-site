import { utilities } from '@/content/copy';
import { everydayChapterCopy } from '@/content/copy';
import { FeatureIcon } from '@/components/ui/FeatureIcon';

export function EverydayChapter() {
  return (
    <section className="everyday content-width" aria-labelledby="everyday-heading">
      <div>
        <h2 id="everyday-heading">
          {everydayChapterCopy.theLittleThings}
          <br />
          <span className="serif">{everydayChapterCopy.closerToHand}</span>
        </h2>
        <p>
          {everydayChapterCopy.everydayToolsInTheSpace}
          <br className="desktop-break" />
          {everydayChapterCopy.youAlreadyHave}
        </p>
      </div>
      <dl className="utility-list">
        {utilities.map((item, index) => (
          <div key={item.name}>
            <dt>
              <FeatureIcon name={(['files', 'timer', 'calendar'] as const)[index]} />
              {item.name}
            </dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

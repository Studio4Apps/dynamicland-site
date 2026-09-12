import { contextualChapterCopy } from '@/content/copy';
import { MediaFrame } from '@/components/media/MediaFrame';
export function ContextualChapter() {
  return (
    <section className="contextual content-width" aria-labelledby="contextual-heading">
      <MediaFrame slot="contextual" />
      <div className="contextual-copy">
        <p className="chapter-label">{contextualChapterCopy.aiAndContext}</p>
        <h2 id="contextual-heading">
          {contextualChapterCopy.aiActivities}
          <br />
          {contextualChapterCopy.inDynamicLand}
        </h2>
        <p>{contextualChapterCopy.aiActivitiesHaveAPlace}</p>
      </div>
    </section>
  );
}

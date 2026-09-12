import { site } from '@/content/site';
export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const content = site.legal[kind];
  return (
    <main id="main" className="reading-page">
      <a href="/" className="text-link back-link">
        ← Back to DynamicLand
      </a>
      <h1>{kind === 'privacy' ? 'Privacy' : 'Terms of use'}</h1>
      {content ? (
        content.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))
      ) : (
        <>
          <p className="reading-lead">
            {kind === 'privacy' ? 'Privacy information' : 'Terms of use'} will be available here.
          </p>
          <section>
            <h2>Information pending</h2>
            <p>
              The {kind === 'privacy' ? 'approved privacy policy' : 'approved terms of use'} has not
              been supplied for this preview.
            </p>
            <p>
              {kind === 'privacy'
                ? 'This page does not yet describe the app’s data collection, permissions, or third-party integrations.'
                : 'Licensing, payment, and usage conditions have not been published here yet.'}
            </p>
            <a href="/support/" className="text-link">
              Visit support →
            </a>
          </section>
        </>
      )}
    </main>
  );
}

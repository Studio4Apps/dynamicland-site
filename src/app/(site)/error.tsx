'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="container section">
      <span className="eyebrow">Something went wrong</span>
      <h1>Let’s try that again.</h1>
      <p>The page couldn’t load. Try again or return to the homepage.</p>
      <button className="button buttonPrimary" onClick={reset}>
        Try again
      </button>{' '}
      <a className="button buttonSecondary" href="/">
        Go home
      </a>
    </main>
  );
}

import { footerCopy } from '@/content/copy';
export function Footer() {
  return (
    <footer className="footer content-width">
      <a className="wordmark" href="/">
        {footerCopy.dynamicland}
      </a>
      <p>{footerCopy.aLittleMoreMac}</p>
      <nav aria-label="Footer navigation">
        <a href="/support/">{footerCopy.support}</a>
        <a href="/privacy/">{footerCopy.privacy}</a>
        <a href="/terms/">{footerCopy.terms}</a>
      </nav>
      <span className="copyright">
        {footerCopy.text}
        {new Date().getFullYear()}
        {footerCopy.dynamicland2}
      </span>
    </footer>
  );
}

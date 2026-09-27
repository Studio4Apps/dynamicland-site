import Image from 'next/image';
import { DownloadButton } from '@/components/DownloadButton';
import { product } from '@/content/product';
import styles from './Layout.module.css';
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerArtwork} aria-hidden="true">
        <picture>
          <source media="(max-width: 760px)" srcSet="/media/footer-840.webp" />
          <Image
            src="/media/footer-1448.webp"
            alt=""
            width={1448}
            height={1086}
            loading="lazy"
            unoptimized
          />
        </picture>
      </div>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerIntro}>
            <a href="/" className={styles.brand}>
              <Image src={product.logo} alt="" width={44} height={44} unoptimized />
              DynamicLand
            </a>
            <p>A little more connected to your Mac.</p>
            <DownloadButton />
          </div>
          <div className={styles.footerLinks}>
            <div>
              <strong>Explore</strong>
              <a href="/#overview">Overview</a>
              <a href="/#features">Features</a>
              <a href="/#pricing">Pricing</a>
              <a href={product.downloadUrl}>Download</a>
            </div>
            <div>
              <strong>Here to help</strong>
              <a href="/support">Support</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 {product.publisher}. DynamicLand.</span>
          <span>Made for macOS.</span>
        </div>
      </div>
    </footer>
  );
}

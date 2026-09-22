import Image from 'next/image';
import { product } from '@/content/product';
import styles from './Layout.module.css';
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerIntro}>
            <a href="/" className={styles.brand}>
              <Image src={product.logo} alt="" width={32} height={32} unoptimized />
              DynamicLand
            </a>
            <p>A little more connected to your Mac.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <strong>Explore</strong>
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

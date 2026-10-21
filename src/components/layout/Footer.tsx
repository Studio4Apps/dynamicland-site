import Image from 'next/image';
import { product } from '@/content/product';
import styles from './Footer.module.css';

const columns = [
  {
    title: 'Explore',
    links: [
      { href: '/#overview', label: 'Overview' },
      { href: '/#features', label: 'Features' },
      { href: '/#customization', label: 'Customization' },
      { href: '/#pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Inside the island',
    links: [
      { href: '/#home', label: 'Home widgets' },
      { href: '/#music', label: 'Now Playing' },
      { href: '/#everyday', label: 'Everyday tools' },
      { href: '/#updates', label: 'What’s new' },
    ],
  },
  {
    title: 'Here to help',
    links: [
      { href: '/support', label: 'Support' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: product.downloadUrl, label: 'Mac App Store' },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.intro}>
            <a href="/" className={styles.brand}>
              <Image src={product.logo} alt="" width={32} height={32} unoptimized />
              DynamicLand
            </a>
            <p>
              Widgets, music, and everyday essentials around your notch. A little more connected
              to your Mac.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className={styles.column}>
              <strong>{column.title}</strong>
              {column.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className={styles.bottom}>
          <span>© 2026 {product.publisher}. DynamicLand.</span>
          <span>Made for macOS · {product.platform}</span>
        </div>
      </div>
    </footer>
  );
}

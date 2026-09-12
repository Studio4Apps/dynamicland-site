import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { site } from '@/content/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';
const editorial = localFont({
  src: '../assets/fonts/newsreader-latin.woff2',
  variable: '--font-editorial',
  display: 'swap',
  weight: '400 500',
  fallback: ['Georgia'],
  adjustFontFallback: 'Times New Roman',
});
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'DynamicLand — Your Mac’s notch, now part of your day',
    template: '%s — DynamicLand',
  },
  description: site.description,
  icons: { icon: '/icon.svg' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: site.name,
    title: 'DynamicLand',
    description: site.description,
    url: '/',
    images: [
      {
        url: '/og.png',
        width: 1536,
        height: 1024,
        alt: 'DynamicLand — A new home for your Mac’s notch.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
    title: 'DynamicLand',
    description: site.description,
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f8f7f4',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={editorial.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

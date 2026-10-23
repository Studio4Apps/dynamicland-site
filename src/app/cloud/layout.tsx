import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  referrer: 'no-referrer',
  formatDetection: { telephone: false, email: false, address: false },
};
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
};
export default function CloudLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

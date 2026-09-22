import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | DynamicLand',
    default: 'DynamicLand — Your Mac, a little more connected',
  },
  applicationName: 'DynamicLand',
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Request-time rendering is intentional: nonce-bearing HTML is never shared-cached.
  await headers();
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

import { headers } from 'next/headers';
import { Hero } from '@/components/sections/Hero';
import { HomeChapter } from '@/components/sections/HomeChapter';
import { Highlights } from '@/components/sections/Highlights';
import {
  MusicChapter,
  ActivityChapter,
  EverydayChapter,
  CustomizationChapter,
} from '@/components/sections/ProductChapters';
import { Pricing, FAQ, Closing } from '@/components/sections/ClosingChapters';
import { Motion } from '@/components/interactive/Motion';
import { pageMetadata, serializeJsonLd, structuredData } from '@/lib/seo';
import { product } from '@/content/product';

export const metadata = pageMetadata(
  'DynamicLand — Your Mac, a little more connected',
  product.description,
);
export default async function Page() {
  const nonce = (await headers()).get('x-nonce') || undefined;
  return (
    <main id="main">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData()) }}
      />
      <Hero />
      <Highlights />
      <HomeChapter />
      <MusicChapter />
      <ActivityChapter />
      <EverydayChapter />
      <CustomizationChapter />
      <Pricing />
      <FAQ />
      <Closing />
      <Motion />
    </main>
  );
}

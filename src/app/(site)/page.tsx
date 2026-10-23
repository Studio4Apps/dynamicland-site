import { headers } from 'next/headers';
import { Hero } from '@/components/sections/Hero';
import { MacShowcase } from '@/components/sections/MacShowcase';
import { Manifesto } from '@/components/sections/Manifesto';
import { Highlights } from '@/components/sections/Highlights';
import {
  Capabilities,
  MusicStory,
  HomeSpotlight,
  Journey,
  Plans,
  Questions,
  Invitation,
} from '@/components/sections/Chapters';
import { WidgetRail } from '@/components/sections/WidgetRail';
import { Appearance } from '@/components/sections/Appearance';
import { Updates } from '@/components/sections/Updates';
import { Motion } from '@/components/interactive/Motion';
import { Choreography } from '@/components/interactive/Choreography';
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
      <MacShowcase />
      <Manifesto />
      <Highlights />
      <Capabilities />
      <MusicStory />
      <WidgetRail />
      <HomeSpotlight />
      <Journey />
      <Appearance />
      <Plans />
      <Updates />
      <Questions />
      <Invitation />
      <Motion />
      <Choreography />
    </main>
  );
}

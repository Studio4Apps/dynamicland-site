import { SceneMotion } from '@/components/motion/SceneMotion';
import '@/styles/motion.css';
import { Hero } from '@/components/sections/Hero';
import { Highlights } from '@/components/sections/Highlights';
import { HomeChapter } from '@/components/sections/HomeChapter';
import { MiniLandsChapter } from '@/components/sections/MiniLandsChapter';
import { MusicChapter } from '@/components/sections/MusicChapter';
import { EverydayChapter } from '@/components/sections/EverydayChapter';
import { ContextualChapter } from '@/components/sections/ContextualChapter';
import { CustomizationChapter } from '@/components/sections/CustomizationChapter';
import { NativeChapter, Pricing, FAQ, FinalCTA } from '@/components/sections/ClosingChapters';
import { productStructuredData } from '@/lib/seo';
export default function Home() {
  return (
    <main id="main">
      <SceneMotion />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Hero />
      <Highlights />
      <HomeChapter />
      <MiniLandsChapter />
      <MusicChapter />
      <EverydayChapter />
      <ContextualChapter />
      <CustomizationChapter />
      <NativeChapter />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

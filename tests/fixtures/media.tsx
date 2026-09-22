import { createRoot } from 'react-dom/client';
import { MediaFrame } from '../../src/components/media/MediaFrame';
import { media, type MediaSlot } from '../../src/content/media';
import '../../src/styles/globals.css';
const base = { ...media.home, width: 800, height: 600, alt: 'Synthetic local media test fixture' };
const slots: MediaSlot[] = [
  { ...media.hero, id: 'empty-fixture' },
  { ...base, id: 'landscape-fixture', src: '/media/fixture-landscape.png' },
  { ...base, id: 'portrait-fixture', src: '/media/fixture-portrait.png', width: 300, height: 900 },
  { ...base, id: 'missing-fixture', src: '/media/missing-image.png' },
  { ...base, id: 'video-fixture', type: 'video', src: '/media/missing-video.mp4' },
];
createRoot(document.getElementById('root')!).render(
  <main className="container section">
    <h1>Local test fixtures</h1>
    {slots.map((slot) => (
      <section key={slot.id} style={{ width: 320, marginBlock: 24 }}>
        <h2>{slot.id}</h2>
        <MediaFrame id="home" configuration={slot} />
      </section>
    ))}
  </main>,
);

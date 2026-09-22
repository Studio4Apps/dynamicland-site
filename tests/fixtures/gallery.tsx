import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Gallery } from '../../src/components/interactive/Gallery';
import '../../src/styles/globals.css';
const count = Number(new URLSearchParams(location.search).get('count') || 5);
const items = Array.from({ length: count }, (_, index) => ({
  id: String(index),
  label: `Slide ${index + 1}`,
  content: (
    <>
      <div style={{ height: 260, borderRadius: 22, background: '#f5f5f7' }} />
      <h2>Slide {index + 1}</h2>
    </>
  ),
}));
function Fixture() {
  const [mounted, setMounted] = useState(true);
  return (
    <StrictMode>
      <main>
        <h1>Carousel test fixture</h1>
        <button type="button" onClick={() => setMounted((value) => !value)}>
          Toggle gallery
        </button>
        {mounted && <Gallery items={items} />}
      </main>
    </StrictMode>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);

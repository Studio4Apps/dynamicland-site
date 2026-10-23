'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './Cloud.module.css';

/** Pages Quick View will lay out; longer documents are for downloading. */
const maxPages = 200;

/**
 * Renders a PDF onto canvases inside the page with pdf.js, so it looks the same in every browser
 * and works under CloudLand's cross-origin isolation, where the browser's own viewer can't load.
 * Pages are drawn only as they scroll into view. WebAssembly decoders stay off, so the CSP needs
 * no `wasm-unsafe-eval`.
 */
export function PdfView({
  url,
  title,
  onFail,
}: {
  url: string;
  title: string;
  onFail: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const root = scroller.current;
    const box = pages.current;
    if (!root || !box) return;
    let live = true;
    let observer: IntersectionObserver | undefined;
    let destroy: (() => Promise<void>) | undefined;

    (async () => {
      const pdfjs = await import('pdfjs-dist');
      // A plain asset URL: pdf.js starts the worker itself, same-origin, which `worker-src 'self'` allows.
      pdfjs.GlobalWorkerOptions.workerSrc ||= new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href;
      const data = await (await fetch(url)).arrayBuffer();
      const task = pdfjs.getDocument({ data, useWasm: false });
      destroy = () => task.destroy();
      const doc = await task.promise;
      if (!live) return;
      const first = (await doc.getPage(1)).getViewport({ scale: 1 });

      const draw = async (slot: HTMLElement) => {
        const page = await doc.getPage(Number(slot.dataset.page));
        const base = page.getViewport({ scale: 1 });
        const ratio = Math.min(devicePixelRatio, 2);
        const viewport = page.getViewport({ scale: (slot.clientWidth / base.width) * ratio });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        slot.style.aspectRatio = `${base.width} / ${base.height}`;
        await page.render({ canvas, viewport }).promise;
        if (live) slot.replaceChildren(canvas);
      };
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer?.unobserve(entry.target);
            // A page cancelled by closing Quick View has nothing left to show.
            draw(entry.target as HTMLElement).catch(() => {});
          }
        },
        { root, rootMargin: '100% 0px' },
      );
      for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
        const slot = document.createElement('div');
        slot.className = styles.pdfPage;
        slot.dataset.page = String(n);
        slot.setAttribute('role', 'img');
        slot.setAttribute('aria-label', `Page ${n}`);
        slot.style.aspectRatio = `${first.width} / ${first.height}`;
        box.append(slot);
        observer.observe(slot);
      }
      setTotal(doc.numPages);
    })().catch(() => live && onFail());

    return () => {
      live = false;
      observer?.disconnect();
      destroy?.().catch(() => {});
      box.replaceChildren();
    };
  }, [url, onFail]);

  return (
    <div
      ref={scroller}
      className={styles.pdfView}
      role="document"
      aria-label={title}
      aria-busy={!total}
    >
      <div ref={pages} className={styles.pdfPages} />
      {total > maxPages && (
        <p className={styles.muted}>
          Showing the first {maxPages} of {total} pages. Download to see the rest.
        </p>
      )}
    </div>
  );
}

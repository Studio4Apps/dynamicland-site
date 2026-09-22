import { chromium } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const browser = await chromium.launch();
const runs = [];
for (let run = 0; run < 3; run++) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const cd = await context.newCDPSession(page);
  await cd.send('Network.enable');
  await cd.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cd.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200000,
    uploadThroughput: 93750,
  });
  await cd.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0, events: [] };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__metrics.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__metrics.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    if (PerformanceObserver.supportedEntryTypes.includes('event'))
      new PerformanceObserver((l) => {
        for (const e of l.getEntries())
          if (e.interactionId) window.__metrics.events.push(e.duration);
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  });
  const assets = new Map();
  const responseJobs = [];
  page.on('response', (r) => {
    if (r.ok() && r.url().startsWith(base))
      responseJobs.push(
        (async () => {
          try {
            const b = await r.body();
            assets.set(r.url(), {
              url: new URL(r.url()).pathname,
              type: r.request().resourceType(),
              gzipBytes: gzipSync(b).length,
              rawBytes: b.length,
            });
          } catch {}
        })(),
      );
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Next highlight' }).click();
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await page.waitForTimeout(400);
  await Promise.all(responseJobs);
  const metrics = await page.evaluate(() => ({
    ...window.__metrics,
    navigation: performance.getEntriesByType('navigation')[0].toJSON(),
  }));
  runs.push({
    run: run + 1,
    metrics,
    assets: [...assets.values()],
    totals: {
      javascriptGzip: [...assets.values()]
        .filter((a) => a.type === 'script')
        .reduce((s, a) => s + a.gzipBytes, 0),
      cssGzip: [...assets.values()]
        .filter((a) => a.type === 'stylesheet')
        .reduce((s, a) => s + a.gzipBytes, 0),
      firstLoadGzip: [...assets.values()].reduce((s, a) => s + a.gzipBytes, 0),
    },
  });
  await context.close();
}
await writeFile(
  'artifacts/performance.json',
  JSON.stringify(
    {
      browser: browser.version(),
      condition:
        '3 fresh Chromium contexts, local production origin, 390×844 CSS viewport, 4× CPU throttle, 1.6Mbps down/750kbps up, 150ms latency, cache disabled. Sizes are locally computed gzip, not CDN transfer. Scripted event samples are not field INP.',
      runs,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    runs.map(({ run, metrics, totals }) => ({
      run,
      lcp: metrics.lcp,
      cls: metrics.cls,
      eventDurations: metrics.events,
      totals,
    })),
    null,
    2,
  ),
);
await browser.close();

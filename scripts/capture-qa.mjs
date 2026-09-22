// Local website QA only. Outputs stay in ignored artifacts/, never in public/.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts/recordings', { recursive: true });
await mkdir('artifacts/screenshots', { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const browser = await chromium.launch();
const screenshots = await browser.newContext({
  reducedMotion: 'reduce',
  viewport: { width: 1440, height: 1000 },
});
const page = await screenshots.newPage();
await page.goto(base);
for (const id of ['overview', 'features', 'home', 'music', 'customization', 'pricing', 'faq']) {
  await page.locator(`#${id}`).screenshot({ path: `artifacts/screenshots/desktop-${id}.png` });
}
for (const [name, width, height] of [
  ['mobile', 390, 844],
  ['tablet', 834, 1112],
  ['landscape', 844, 390],
  ['square', 720, 720],
  ['ultrawide', 2560, 1080],
]) {
  await page.setViewportSize({ width, height });
  await page.goto(base);
  await page.screenshot({ path: `artifacts/screenshots/${name}-viewport.png` });
  if (name === 'mobile' || name === 'tablet')
    await page
      .locator('#customization')
      .screenshot({ path: `artifacts/screenshots/${name}-customization.png` });
}
for (const route of ['support', 'privacy', 'terms']) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/${route}`);
  await page.screenshot({ path: `artifacts/screenshots/${route}.png`, fullPage: true });
}
await screenshots.close();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: 'artifacts/recordings', size: { width: 1440, height: 900 } },
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
const motion = await context.newPage();
await motion.addInitScript(() => {
  window.__qaFrames = [];
  window.__qaLongTasks = [];
  if (PerformanceObserver.supportedEntryTypes.includes('longtask'))
    new PerformanceObserver((list) =>
      window.__qaLongTasks.push(
        ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
      ),
    ).observe({ type: 'longtask', buffered: true });
});
await motion.goto(base);
await motion.locator('#features').scrollIntoViewIfNeeded();
await motion.waitForTimeout(500);
const sample = async () =>
  motion.evaluate(
    () =>
      new Promise((resolve) => {
        const frames = [];
        const start = performance.now();
        let last = start;
        const tick = (now) => {
          frames.push(now - last);
          last = now;
          if (now - start < 1200) requestAnimationFrame(tick);
          else resolve(frames);
        };
        requestAnimationFrame(tick);
      }),
  );
const sampling = sample();
await motion.getByRole('button', { name: 'Next highlight' }).click();
const frames = await sampling;
await motion.getByRole('button', { name: 'Show Make it yours' }).click();
await motion.waitForTimeout(900);
await motion.getByRole('button', { name: 'Previous highlight' }).click();
await motion.getByRole('button', { name: 'Previous highlight' }).click();
await motion.waitForTimeout(900);
await motion.locator('#customization').scrollIntoViewIfNeeded();
await motion.waitForTimeout(400);
await motion.getByRole('radio', { name: /Dynamic Pill/ }).check();
await motion.waitForTimeout(650);
await motion.getByRole('radio', { name: /Liquid Glass/ }).check();
await motion.waitForTimeout(650);
await motion.getByRole('radio', { name: /Dynamic Notch/ }).check();
await motion.waitForTimeout(650);
await motion.reload();
await motion.locator('#home').scrollIntoViewIfNeeded();
await motion.waitForTimeout(1000);
await motion.locator('#music').scrollIntoViewIfNeeded();
await motion.waitForTimeout(1000);
const sorted = [...frames].sort((a, b) => a - b);
await writeFile(
  'artifacts/motion-profile.json',
  JSON.stringify(
    {
      browser: browser.version(),
      condition: 'Chromium local production, no CPU/network throttle; 1200ms gallery frame sample',
      frames: frames.length,
      medianFrameMs: sorted[Math.floor(sorted.length * 0.5)],
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
      maxFrameMs: Math.max(...frames),
      longTasks: await motion.evaluate(() => window.__qaLongTasks),
    },
    null,
    2,
  ),
);
await context.tracing.stop({ path: 'artifacts/recordings/interactions.trace.zip' });
const video = motion.video();
await context.close();
await video.saveAs('artifacts/recordings/interactions.webm');
await browser.close();
console.log(
  'Saved responsive/section captures, gallery-selector-blur recording, trace and frame sample.',
);

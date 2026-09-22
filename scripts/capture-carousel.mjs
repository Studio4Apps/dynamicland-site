// Production-only local visual QA; no fixture or media content is injected into the site.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const directory = 'artifacts/carousel-fix';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: directory, size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();
const errors = [],
  events = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const root = page.getByRole('region', { name: 'DynamicLand highlights' });
const playback = page.locator('[data-rotation]');
const started = performance.now();
const log = async (name) =>
  events.push({
    name,
    seconds: (performance.now() - started) / 1000,
    state: await root.evaluate((e) => ({
      label: e.querySelector('[data-rotation]').getAttribute('aria-label'),
      selected: e.querySelector('[aria-current]')?.getAttribute('aria-label'),
      fill: Array.from(e.querySelectorAll('[data-dwell-fill]')).map((f) => f.style.width),
    })),
  });
await page.goto(process.env.BASE_URL || 'http://127.0.0.1:3001');
await root.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.mouse.move(0, 0);
await page.waitForTimeout(1100);
await log('early fill');
await page.screenshot({ path: `${directory}/desktop-early.png` });
await page.waitForTimeout(1300);
await playback.click();
await page.mouse.move(0, 0);
await log('pause around 40 percent');
await page.screenshot({ path: `${directory}/desktop-paused.png` });
await page.waitForTimeout(6700);
await log('pause held longer than a dwell');
await playback.click();
await page.mouse.move(0, 0);
await log('resume remaining dwell');
await page.waitForTimeout(5100);
await log('next slide settled and filling');
await page.getByRole('button', { name: 'Show Live activities' }).click();
await page.mouse.move(0, 0);
await page.waitForTimeout(1100);
await log('manual navigation pauses');
await playback.click();
await page.mouse.move(0, 0);
await page.waitForTimeout(7200);
await log('automatic transition after manual restart');
await playback.click();
await page.mouse.move(0, 0);
await page.waitForTimeout(500);
await log('finished paused');
await writeFile(
  `${directory}/recording-events.json`,
  JSON.stringify({ browser: browser.version(), errors, events }, null, 2),
);
const video = page.video();
await context.close();
await video.saveAs(`${directory}/carousel-demo.webm`);
const responsive = await browser.newContext({ reducedMotion: 'reduce' });
const still = await responsive.newPage();
for (const width of [320, 390, 768, 1024, 1440]) {
  await still.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
  await still.goto(process.env.BASE_URL || 'http://127.0.0.1:3001');
  const gallery = still.getByRole('region', { name: 'DynamicLand highlights' });
  await gallery.locator('[data-rotation]').waitFor({ state: 'visible' });
  await gallery.scrollIntoViewIfNeeded();
  await still.waitForTimeout(150);
  await still.screenshot({ path: `${directory}/gallery-${width}.png` });
}
await responsive.close();
await browser.close();
console.log(JSON.stringify({ errors, events, video: `${directory}/carousel-demo.webm` }, null, 2));

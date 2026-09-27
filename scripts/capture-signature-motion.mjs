// Production-only visual QA, kept outside public output.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const dir = 'artifacts/signature-motion';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const reports = [];
for (const [name, width, height, throttle] of [
  ['desktop', 1440, 1000, 1],
  ['mobile', 390, 844, 4],
]) {
  console.log(`Recording ${name}`);
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: { dir, size: { width, height } },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForTimeout(1300);
  if (name === 'desktop') {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const name of ['Features', 'Support', 'Pricing', 'Overview']) {
      await nav.getByRole('link', { name }).hover();
      await page.waitForTimeout(250);
    }
  }
  const summary = page.locator('[data-feature-explorer] summary');
  await summary.click();
  await page.waitForTimeout(850);
  await page.screenshot({ path: `${dir}/${name}-explorer.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await summary.click();
  await page.waitForTimeout(130);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  await summary.evaluate((element) => element.click());
  await page.waitForTimeout(800);
  await page
    .getByRole('navigation', { name: 'Explore DynamicLand' })
    .getByRole('link', { name: /Your music/ })
    .click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${dir}/${name}-music.png` });
  const video = page.video();
  await context.close();
  await video.saveAs(`${dir}/${name}-walkthrough.webm`);

  console.log(`Profiling ${name}`);
  const profile = await browser.newContext({ viewport: { width, height } });
  const probe = await profile.newPage();
  const cdp = await profile.newCDPSession(probe);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await probe.goto(base);
  await probe.waitForTimeout(1400);
  await probe.evaluate(() => {
    window.__longTasks = [];
    new PerformanceObserver((list) =>
      window.__longTasks.push(
        ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
      ),
    ).observe({ type: 'longtask' });
    window.__sample = () => {
      window.__frames = [];
      window.__start = performance.now();
      let last;
      const tick = (now) => {
        if (last) window.__frames.push(now - last);
        last = now;
        if (now - window.__start < 1000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
  });
  const samples = [];
  for (const action of ['open', 'close', 'reversal']) {
    await probe.evaluate(() => window.__sample());
    if (action === 'close') await probe.keyboard.press('Escape');
    else await probe.locator('[data-feature-explorer] summary').click();
    if (action === 'reversal') {
      await probe.waitForTimeout(100);
      await probe.keyboard.press('Escape');
      await probe.waitForTimeout(70);
      await probe.locator('[data-feature-explorer] summary').evaluate((el) => el.click());
    }
    await probe.waitForTimeout(1100);
    samples.push(
      await probe.evaluate((action) => {
        const frames = window.__frames.sort((a, b) => a - b);
        return {
          action,
          frames: frames.length,
          p95: frames[Math.floor(frames.length * 0.95)],
          max: frames.at(-1),
          longTasks: window.__longTasks.filter((e) => e.start >= window.__start),
        };
      }, action),
    );
  }
  await probe.emulateMedia({ reducedMotion: 'reduce' });
  await probe.keyboard.press('Escape');
  await probe.locator('[data-feature-explorer] summary').click();
  const reduced = await probe.evaluate(() => ({
    animations: document.querySelector('[data-feature-explorer]').getAnimations({ subtree: true })
      .length,
    overflow: document.documentElement.scrollWidth - innerWidth,
    emptySlots: [...document.querySelectorAll('[data-media-slot]')].every(
      (el) => el.dataset.empty === 'true',
    ),
  }));
  reports.push({ name, width, height, throttle, errors, samples, reduced });
  await profile.close();
}
await writeFile(`${dir}/performance.json`, JSON.stringify(reports, null, 2));
await browser.close();
console.log(JSON.stringify(reports, null, 2));

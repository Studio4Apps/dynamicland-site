// Local production QA; outputs are ignored and never shipped.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const dir = 'artifacts/native-motion';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const reports = [];

for (const [name, width, height, cpu] of [
  ['desktop', 1440, 1000, 1],
  ['mobile', 390, 844, 4],
]) {
  // Record without throttling. Profile separately, without video overhead.
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: { dir, size: { width, height } },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForTimeout(700);
  if (name === 'mobile') {
    await page.getByLabel('Open navigation menu').click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
  }
  for (const id of ['home', 'music', 'customization', 'pricing', 'faq']) {
    await page
      .locator(`#${id}`)
      .evaluate((el) =>
        window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 96, behavior: 'smooth' }),
      );
    await page.waitForTimeout(1300);
    if (id === 'customization') {
      await page.getByRole('radio', { name: /Dynamic Pill/ }).check();
      await page.waitForTimeout(550);
      await page.getByRole('radio', { name: /Liquid Glass/ }).check();
      await page.waitForTimeout(70);
      await page.locator('input[value="notch"]').evaluate((el) => el.click());
      await page.waitForTimeout(650);
    }
    if (id === 'faq') {
      const summary = page.locator('[data-disclosure] summary').first();
      await summary.click();
      await page.waitForTimeout(650);
      await summary.click();
      await page.waitForTimeout(70);
      await summary.evaluate((el) => el.click());
      await page.waitForTimeout(650);
    }
    if (['customization', 'pricing', 'faq'].includes(id)) {
      await page.screenshot({ path: `${dir}/${name}-${id}.png` });
    }
  }
  const video = page.video();
  await context.close();
  await video.saveAs(`${dir}/${name}-walkthrough.webm`);

  const profile = await browser.newContext({ viewport: { width, height } });
  const probe = await profile.newPage();
  const cdp = await profile.newCDPSession(probe);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await probe.goto(base);
  await probe.waitForTimeout(700);
  await probe.evaluate(() => {
    window.__motionLongTasks = [];
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      new PerformanceObserver((list) => {
        window.__motionLongTasks.push(
          ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
        );
      }).observe({ type: 'longtask' });
    }
    window.__startMotionSample = () => {
      window.__motionFrames = [];
      window.__motionAt = performance.now();
      let last = performance.now();
      const tick = (now) => {
        window.__motionFrames.push(now - last);
        last = now;
        if (now - window.__motionAt < 900) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
  });
  const samples = [];
  for (const action of ['optical', 'selector', 'disclosure']) {
    if (action !== 'optical') {
      await probe
        .locator(action === 'selector' ? '#customization' : '#faq')
        .scrollIntoViewIfNeeded();
      await probe.waitForTimeout(700);
    }
    await probe.evaluate(() => window.__startMotionSample());
    if (action === 'optical') await probe.locator('#home').scrollIntoViewIfNeeded();
    if (action === 'selector') await probe.getByRole('radio', { name: /Liquid Glass/ }).check();
    if (action === 'disclosure') await probe.locator('[data-disclosure] summary').first().click();
    await probe.waitForTimeout(1000);
    samples.push(
      await probe.evaluate((action) => {
        const frames = window.__motionFrames.slice(1).sort((a, b) => a - b);
        return {
          action,
          frames: frames.length,
          medianMs: frames[Math.floor(frames.length / 2)],
          p95Ms: frames[Math.floor(frames.length * 0.95)],
          maxMs: frames.at(-1),
          longTasks: window.__motionLongTasks.filter((e) => e.start >= window.__motionAt),
        };
      }, action),
    );
  }
  await probe.emulateMedia({ reducedMotion: 'reduce' });
  await probe.getByRole('radio', { name: /Dynamic Pill/ }).check();
  await probe.locator('[data-disclosure] summary').first().click();
  await probe.waitForTimeout(100);
  const reduced = await probe.evaluate(() => ({
    running: document.getAnimations().filter((a) => a.playState === 'running').length,
    overflow: document.documentElement.scrollWidth - innerWidth,
    heroVisible: getComputedStyle(document.querySelector('#hero-title')).opacity === '1',
  }));
  reports.push({
    name,
    width,
    height,
    cpuThrottle: cpu,
    browser: browser.version(),
    errors,
    samples,
    reduced,
  });
  await profile.close();
}
await writeFile(`${dir}/performance.json`, JSON.stringify(reports, null, 2));
await browser.close();
console.log(JSON.stringify(reports, null, 2));

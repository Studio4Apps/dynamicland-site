import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('artifacts/gallery-entrance');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
for (const [name, viewport] of [
  ['desktop', { width: 1200, height: 850 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: output, size: viewport },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/');
  const root = page.getByRole('region', { name: 'DynamicLand highlights' });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-controls-intro]')?.getAttribute('data-controls-intro') ===
      'waiting',
  );
  await page.waitForTimeout(250);
  const samples = await page.locator('[data-gallery-controls]').evaluate(async (anchor) => {
    const group = anchor.querySelector('[data-playback-group]');
    const shell = anchor.querySelector('[data-gallery-capsule]');
    const button = anchor.querySelector('[data-rotation]');
    const start = performance.now();
    scrollTo({
      top: scrollY + anchor.getBoundingClientRect().top - innerHeight * 0.72,
      behavior: 'instant',
    });
    const samples = [];
    await new Promise((resolve) => {
      const sample = () => {
        const time = performance.now() - start;
        const rect = shell.getBoundingClientRect();
        samples.push({
          time,
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
          groupY: group.getBoundingClientRect().y,
          buttonOpacity: getComputedStyle(button).opacity,
          state: anchor.closest('[data-controls-intro]').dataset.controlsIntro,
        });
        if (time < 2250) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return samples;
  });
  await page.screenshot({ path: resolve(output, `${name}-settled.png`) });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(250);
  await page.locator('[data-gallery-controls]').evaluate((anchor) =>
    scrollTo({
      top: scrollY + anchor.getBoundingClientRect().top - innerHeight * 0.72,
      behavior: 'instant',
    }),
  );
  await page.waitForTimeout(500);
  if ((await root.getAttribute('data-controls-intro')) !== 'settled')
    throw new Error('Entrance replayed');
  await writeFile(resolve(output, `${name}-samples.json`), JSON.stringify(samples, null, 2));
  const video = page.video();
  await context.close();
  await video.saveAs(resolve(output, `${name}.webm`));
}
await browser.close();
console.log(output);

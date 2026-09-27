import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('artifacts/menu-morph');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
for (const width of [390, 320, 760]) {
  const viewport = { width, height: 844 };
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: output, size: viewport },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:3001/');
  await page.locator('[data-menu-enhanced]').waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(output, `closed-${width}.png`) });
  const samples = [];
  for (const action of ['open', 'close']) {
    const recording = page.locator('[data-mobile-menu]').evaluate(async (root, action) => {
      const surface = root.querySelector('[data-menu-glass]');
      const content = root.querySelector('nav');
      const frames = [];
      await new Promise((resolve) => {
        const target =
          action === 'open'
            ? root.querySelector('summary')
            : document.querySelector('#overview .fineprint');
        target.addEventListener(
          'click',
          () => {
            const start = performance.now();
            const sample = () => {
              const time = performance.now() - start;
              const rect = surface.getBoundingClientRect();
              frames.push({
                time,
                state: root.dataset.menuState,
                rect: rect.toJSON(),
                opacity: getComputedStyle(content).opacity,
              });
              if (time < 800) requestAnimationFrame(sample);
              else resolve();
            };
            requestAnimationFrame(sample);
          },
          { once: true },
        );
      });
      return frames;
    }, action);
    await page
      .locator(action === 'open' ? '[data-mobile-menu] summary' : '#overview .fineprint')
      .click();
    const sequence = await recording;
    samples.push({ action, sequence });
    await page.screenshot({ path: resolve(output, `${action}-${width}.png`) });
    await page.waitForTimeout(450);
  }
  await page.evaluate(() => scrollTo({ top: 1000, behavior: 'instant' }));
  await page.locator('[data-mobile-menu] summary').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(output, `page-open-${width}.png`) });
  await writeFile(
    resolve(output, `samples-${width}.json`),
    JSON.stringify({ samples, errors }, null, 2),
  );
  const video = page.video();
  await context.close();
  await video.saveAs(resolve(output, `menu-${width}.webm`));
}
await browser.close();
console.log(output);

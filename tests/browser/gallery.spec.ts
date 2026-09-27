import { test, expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = (page: Page) => page.getByRole('region', { name: 'DynamicLand highlights' });
const track = (page: Page) => page.locator('[data-gallery-track]');
const rotation = (page: Page) => page.locator('[data-rotation]');
const selected = (page: Page) => page.locator('[data-gallery-dot][aria-current]');
const progress = (page: Page, index = 0) =>
  page
    .locator('[data-dwell-fill]')
    .nth(index)
    .evaluate((e) => parseFloat((e as HTMLElement).style.width));
const advance = async (page: Page, ms: number) => {
  await page.clock.runFor(ms);
};
async function frozenPage(page: Page) {
  const time = new Date();
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('/');
  await expect(root(page)).toHaveAttribute('data-enhanced', 'true');
}
async function enter(page: Page) {
  await root(page).evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await advance(page, 100);
}

test('real dwell: visible progress, pause beyond a dwell, resume remaining time exactly once', async ({
  page,
}, info) => {
  await page.goto('/');
  await root(page).scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => progress(page)).toBeGreaterThan(12);
  const early = await progress(page);
  await root(page).screenshot({ path: info.outputPath('early-fill.png') });
  await expect.poll(() => progress(page), { intervals: [100] }).toBeGreaterThan(39);
  await rotation(page).click();
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  const paused = await progress(page);
  expect(paused).toBeGreaterThan(early + 10);
  expect(paused).toBeLessThan(55);
  await root(page).screenshot({ path: info.outputPath('paused-fill.png') });
  await page.waitForTimeout(6500);
  expect(await progress(page)).toBeCloseTo(paused, 3);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '0');
  // Active-dot navigation preserves the elapsed time and existing paused intent.
  await selected(page).click();
  expect(await progress(page)).toBeCloseTo(paused, 3);
  await rotation(page).click();
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  const focusBeforeAdvance = await page.evaluateHandle(() => document.activeElement);
  const remaining = 6150 * (1 - paused / 100);
  await page.waitForTimeout(Math.max(0, remaining - 450));
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '0');
  await expect
    .poll(() => selected(page).getAttribute('data-gallery-dot'), { timeout: 2200 })
    .toBe('1');
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  expect(await progress(page, 1)).toBeLessThan(20);
  await page.waitForTimeout(800);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  // Safari does not focus buttons on pointer click; preserve its native focus too.
  expect(
    await page.evaluate((element) => document.activeElement === element, focusBeforeAdvance),
  ).toBe(true);
  await focusBeforeAdvance.dispose();
});

test('one clock, settled dwell, position-driven morph and stationary controls', async ({
  page,
}) => {
  await frozenPage(page);
  await advance(page, 12000);
  expect(await progress(page)).toBe(0);
  await enter(page);
  await advance(page, 2000);
  const initial = await progress(page);
  expect(initial).toBeGreaterThan(30);
  expect(initial).toBeLessThan(38);
  // The entry morph uses native animations, independent of the mocked dwell clock.
  await expect(root(page)).toHaveAttribute('data-controls-intro', 'settled');
  const bounds = async () =>
    page.locator('[data-rotation]').evaluate((button) => {
      const group = button.parentElement!,
        capsule = group.querySelector('[aria-label="Choose a highlight"]')!;
      return {
        x: button.getBoundingClientRect().x,
        center: group.getBoundingClientRect().x + group.getBoundingClientRect().width / 2,
        capsuleWidth: capsule.getBoundingClientRect().width,
        widths: Array.from(capsule.querySelectorAll('[data-indicator]')).map(
          (e) => e.getBoundingClientRect().width,
        ),
      };
    });
  const before = await bounds();
  expect(before.widths).toEqual([48, 8, 8, 8, 8]);
  expect(before.center).toBeCloseTo(720, 0);
  // Jump to just beyond the end of the dwell, then inspect an in-flight morph.
  await advance(page, 6150 * (1 - initial / 100) + 350);
  await expect(track(page)).toHaveAttribute('data-moving', 'true');
  const mid = await bounds();
  expect(mid.widths[0]).toBeGreaterThan(8);
  expect(mid.widths[0]).toBeLessThan(48);
  expect(mid.widths[1]).toBeGreaterThan(8);
  expect(mid.widths.reduce((a, b) => a + b)).toBeCloseTo(80, 0);
  expect(mid.x).toBeCloseTo(before.x, 1);
  expect(mid.center).toBeCloseTo(before.center, 1);
  expect(mid.capsuleWidth).toBeCloseTo(before.capsuleWidth, 1);
  expect(await progress(page, 1)).toBe(0);
  // Pause in flight finishes this move, but schedules no next dwell.
  await rotation(page).dispatchEvent('click');
  await advance(page, 15000);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  expect(await progress(page, 1)).toBe(0);
});

test('hover and focus keep playing; explicit keyboard pause and visibility preserve intent', async ({
  page,
}) => {
  await frozenPage(page);
  await enter(page);
  await advance(page, 1500);
  await track(page).hover();
  const hovered = await progress(page);
  await advance(page, 500);
  expect(await progress(page)).toBeGreaterThan(hovered);
  await page.mouse.move(0, 0);
  await advance(page, 200);
  expect(await progress(page)).toBeGreaterThan(hovered);
  await rotation(page).focus();
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  await rotation(page).press('Space');
  await advance(page, 300);
  await expect(root(page)).toHaveAttribute('data-playing', 'false');
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  await page.getByRole('button', { name: 'Show Music within reach' }).focus();
  await page.locator('h1').click();
  await enter(page);
  const focused = await progress(page);
  await advance(page, 9000);
  expect(await progress(page)).toBeCloseTo(focused, 3);
  await rotation(page).click();
  await advance(page, 200);
  // Moving offscreen freezes, returning resumes only the existing intent.
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await advance(page, 32);
  await expect(root(page)).toHaveAttribute('data-playing', 'false');
  const offscreen = await progress(page);
  await advance(page, 19000);
  expect(await progress(page)).toBeCloseTo(offscreen, 3);
  await enter(page);
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  expect(await progress(page)).toBeLessThan(offscreen + 3);
  // Browser-independent lifecycle event injection; actual OS tab switching is a separate smoke check.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await progress(page);
  await advance(page, 20000);
  expect(await progress(page)).toBeCloseTo(hidden, 3);
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await advance(page, 300);
  expect(await progress(page)).toBeGreaterThan(hidden);
  await rotation(page).click();
  await page.setViewportSize({ width: 768, height: 900 });
  await advance(page, 32);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await advance(page, 5000);
  await enter(page);
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
});

test('resize preserves dwell; drag and horizontal wheel resume after settling', async ({
  page,
}) => {
  // Real browser time here: native resize/scroll/snap events are not virtual-clock tasks.
  await page.goto('/');
  await root(page).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Show Music within reach' }).click();
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  await page.mouse.move(0, 0);
  await expect.poll(() => progress(page, 1)).toBeGreaterThan(15);
  const before = await progress(page, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  expect(await progress(page, 1)).toBeGreaterThanOrEqual(before);
  expect(await progress(page, 1)).toBeLessThan(before + 10);
  await root(page).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Show Make it yours' }).click();
  await expect(track(page)).toHaveAttribute('data-moving', 'true');
  const box = await track(page).boundingBox();
  if (!box) throw new Error('Missing gallery bounds');
  await page.mouse.move(330, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(70, box.y + 100, { steps: 12 });
  await page.mouse.up();
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  const index = await selected(page).getAttribute('data-gallery-dot');
  await expect
    .poll(() =>
      track(page).evaluate((e) => {
        const cards = e.querySelectorAll<HTMLElement>('[data-gallery-card]');
        const offsets = Array.from(cards, (card) =>
          Math.min(e.scrollWidth - e.clientWidth, card.offsetLeft - cards[0].offsetLeft),
        );
        return Math.min(...offsets.map((offset) => Math.abs(e.scrollLeft - offset)));
      }),
    )
    .toBeLessThan(1);
  await page.waitForTimeout(1200);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', index!);
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  expect(await progress(page, Number(index))).toBeGreaterThan(0);
  await track(page).hover();
  await page.mouse.wheel(-700, 0);
  await expect(selected(page)).not.toHaveAttribute('data-gallery-dot', index!);
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
});

test('last slide loops repeatedly, pause persists and live reduced motion stops rotation', async ({
  page,
}) => {
  await frozenPage(page);
  await enter(page);
  await page.getByRole('button', { name: 'Show Make it yours' }).dispatchEvent('click');
  await advance(page, 1000);
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  await advance(page, 7100);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '0');
  await expect(rotation(page)).toHaveAccessibleName('Pause slideshow');
  await expect(page.getByRole('button', { name: /Replay|Restart/ })).toHaveCount(0);
  expect(await progress(page)).toBeLessThan(3);
  // Another complete pass must return to the first slide without user input.
  for (const index of ['1', '2', '3', '4', '0']) {
    await advance(page, 7100);
    await expect(selected(page)).toHaveAttribute('data-gallery-dot', index);
    await expect(root(page)).toHaveAttribute('data-playing', 'true');
  }
  await rotation(page).dispatchEvent('click');
  await rotation(page).dispatchEvent('click');
  await rotation(page).dispatchEvent('click');
  const paused = await progress(page);
  await advance(page, 20000);
  expect(await progress(page)).toBe(paused);
  await rotation(page).dispatchEvent('click');
  await advance(page, 6300);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await advance(page, 32);
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await advance(page, 10000);
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
});

test('dot and keyboard selection preserve playback; only the rotation button changes intent', async ({
  page,
}) => {
  await frozenPage(page);
  await enter(page);
  const music = page.getByRole('button', { name: 'Show Music within reach' });
  await music.click();
  await advance(page, 1100);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  expect(await progress(page, 1)).toBeLessThan(5);
  await advance(page, 7000);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '2');

  await track(page).focus();
  await track(page).press('ArrowRight');
  await advance(page, 1100);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '3');
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  await rotation(page).click();
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  await music.click();
  await advance(page, 1100);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await expect(root(page)).toHaveAttribute('data-playing', 'false');
  await advance(page, 14000);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await track(page).focus();
  await track(page).press('ArrowRight');
  await advance(page, 1100);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '2');
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  await rotation(page).click();
  await advance(page, 7100);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '3');
});

test('vertical page scrolling over the gallery resumes on return and preserves manual pause', async ({
  page,
}) => {
  await page.goto('/');
  await root(page).scrollIntoViewIfNeeded();
  await track(page).hover();
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => progress(page)).toBeGreaterThan(5);
  await page.mouse.wheel(0, 1800);
  await expect(root(page)).toHaveAttribute('data-playing', 'false');
  const frozen = await progress(page);
  await page.waitForTimeout(300);
  expect(await progress(page)).toBeCloseTo(frozen, 3);
  await root(page).scrollIntoViewIfNeeded();
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => progress(page)).toBeGreaterThan(frozen);
  await rotation(page).click();
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  await track(page).hover();
  await page.mouse.wheel(0, 1800);
  await expect(root(page)).not.toBeInViewport();
  await root(page).scrollIntoViewIfNeeded();
  await expect(root(page)).toHaveAttribute('data-playing', 'false');
});

test.describe('fractional slide positions on Retina displays', () => {
  test.use({ viewport: { width: 868, height: 923 }, deviceScaleFactor: 2 });

  test('Photo 03 runs at normal dwell speed without repeated native snap corrections', async ({
    page,
  }) => {
    for (const width of [851, 868]) {
      await page.setViewportSize({ width, height: 923 });
      await page.goto('/');
      // Reproduce a 15px scrollbar gutter and fractional vw-based card widths.
      // 868px matches the owner's viewport; 851px also exposes integer rounding.
      await root(page).evaluate((element, trackWidth) => {
        element.style.width = `${trackWidth}px`;
      }, width - 15);
      await page.getByRole('button', { name: 'Show Music within reach' }).click();
      await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
      await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
      const before = await progress(page, 1);
      await page.waitForTimeout(2000);
      const gained = (await progress(page, 1)) - before;
      expect(gained, `Photo 03 dwell at ${width}px`).toBeGreaterThan(28);
      expect(gained).toBeLessThan(38);
      await expect(selected(page)).toHaveAttribute('data-gallery-dot', '2', { timeout: 6000 });
      await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
      const third = await progress(page, 2);
      await page.waitForTimeout(2000);
      expect((await progress(page, 2)) - third).toBeGreaterThan(28);
    }
  });
});

test('one, five, seven slides; target sizes, responsive geometry, reduced motion and clean remount', async ({
  page,
}, info) => {
  const localRequire = createRequire(resolve('package.json'));
  const esbuild = localRequire(
    localRequire.resolve('esbuild', { paths: [localRequire.resolve('tsx/package.json')] }),
  );
  const outdir = info.outputPath('gallery-fixture');
  await esbuild.build({
    entryPoints: ['tests/fixtures/gallery.tsx'],
    bundle: true,
    outdir,
    format: 'iife',
    minify: true,
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  await page.route('**/__gallery/**', (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1);
    if (file === 'gallery.js' || file === 'gallery.css')
      return route.fulfill({
        contentType: file.endsWith('.js') ? 'application/javascript' : 'text/css',
        body: readFileSync(`${outdir}/${file}`),
      });
    return route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>Gallery fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/__gallery/gallery.css"></head><body><div id="root"></div><script src="/__gallery/gallery.js"></script></body></html>',
    });
  });
  for (const motion of ['reduce', 'no-preference'] as const) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const count of [1, 5, 7]) {
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/__gallery/?count=${count}`);
        await expect(root(page)).toHaveAttribute('data-enhanced', 'true');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (count === 1) {
          await expect(rotation(page)).toHaveCount(0);
          continue;
        }
        await expect(rotation(page)).toHaveAccessibleName(
          motion === 'reduce' ? 'Play slideshow' : 'Pause slideshow',
        );
        await expect(root(page)).toHaveAttribute('data-controls-intro', 'settled');
        const geometry = await root(page).evaluate((e) => {
          const button = e.querySelector('[data-rotation]')!,
            group = button.parentElement!;
          const buttons = Array.from(e.querySelectorAll('[data-gallery-dot]')).map((b) =>
            b.getBoundingClientRect(),
          );
          const r = button.getBoundingClientRect(),
            g = group.getBoundingClientRect();
          return {
            width: r.width,
            height: r.height,
            center: g.x + g.width / 2,
            targets: buttons.map((b) => ({ width: b.width, height: b.height })),
            overlaps: buttons.some((b, i) => i > 0 && b.x < buttons[i - 1].right - 0.1),
            first: e.querySelector('button')?.hasAttribute('data-rotation'),
            mark: e.querySelector('[data-indicator]')!.getBoundingClientRect().width,
          };
        });
        expect(geometry.width).toBe(56);
        expect(geometry.height).toBe(56);
        expect(geometry.mark).toBe(width <= 734 ? 32 : 48);
        expect(geometry.center).toBeCloseTo(width / 2, 0);
        expect(geometry.first).toBe(true);
        expect(geometry.overlaps).toBe(false);
        geometry.targets.forEach((b) => {
          expect(b.width).toBeGreaterThanOrEqual(24);
          expect(b.height).toBeGreaterThanOrEqual(44);
        });
        if (count === 7 && width === 320 && motion === 'reduce') {
          mkdirSync('artifacts/carousel-fix', { recursive: true });
          await page.screenshot({
            path: `artifacts/carousel-fix/seven-320-${info.project.name}.png`,
          });
        }
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/__gallery/?count=5');
  await rotation(page).click();
  await expect(root(page)).toHaveAttribute('data-playing', 'true');
  await page.clock.install();
  await page.clock.runFor(7000);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
  await expect(track(page)).not.toHaveAttribute('data-moving', 'true');
  await page.getByRole('button', { name: 'Toggle gallery' }).click();
  await advance(page, 20000);
  await expect(root(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle gallery' }).click();
  await expect(rotation(page)).toHaveAccessibleName('Play slideshow');
  expect(await progress(page)).toBe(0);
  await rotation(page).click();
  await advance(page, 7000);
  await expect(selected(page)).toHaveAttribute('data-gallery-dot', '1');
});

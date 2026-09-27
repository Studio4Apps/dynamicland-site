import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const localRequire = createRequire(resolve('package.json'));

test('vertical touch scrolling and horizontal swipe preserve gallery autoplay', async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'CDP synthesizes native touch in Chromium; not a physical device test.',
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/');
  await page.getByLabel('Open navigation menu').tap();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.locator('#overview .fineprint').tap();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
  const region = page.locator('[data-gallery-track]');
  await region.scrollIntoViewIfNeeded();
  const gallery = page.getByRole('region', { name: 'DynamicLand highlights' });
  await expect(gallery).toHaveAttribute('data-playing', 'true');
  let box = await region.boundingBox();
  if (!box) throw new Error('Missing touch target');
  const client = await context.newCDPSession(page);
  const beforeScroll = await page.evaluate(() => scrollY);
  const startY = Math.min(box.y + 200, 700);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 195, y: startY }],
  });
  for (let offset = 20; offset <= 180; offset += 20)
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: startY - offset }],
    });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll);
  // End native momentum before re-entering, as a user returning to the section does.
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 195, y: 90 }],
  });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await region.scrollIntoViewIfNeeded();
  await expect(gallery).toHaveAttribute('data-playing', 'true');
  box = await region.boundingBox();
  if (!box) throw new Error('Missing touch target');
  const y = Math.min(box.y + 100, 700);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 330, y }],
  });
  for (let x = 310; x >= 60; x -= 25)
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => region.evaluate((e) => e.scrollLeft)).toBeGreaterThan(100);
  await expect(
    page.locator('[aria-label="Choose a highlight"] [aria-current]'),
  ).not.toHaveAttribute('aria-label', 'Show A home for your day');
  await expect(page.locator('[data-rotation]')).toHaveAccessibleName('Pause slideshow');
  await expect(gallery).toHaveAttribute('data-playing', 'true');
  await context.close();
});

test('missing animation APIs preserve controls and readable content', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { value: undefined });
    Object.defineProperty(window, 'ResizeObserver', { value: undefined });
    Object.defineProperty(Element.prototype, 'animate', { value: undefined });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Your Mac. A little more connected.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show Make it yours' }).click();
  await expect(page.locator('[aria-label="Choose a highlight"] [aria-current]')).toHaveAttribute(
    'aria-label',
    'Show Make it yours',
  );
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await expect(page.locator('#preview-glass')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 700 });
  await expect(page.getByRole('button', { name: /^(Previous|Next) highlight$/ })).toHaveCount(0);
});

test('variable card widths and vertical scrolling do not break gallery bounds', async ({
  page,
}) => {
  await page.goto('/');
  const region = page.locator('[data-gallery-track]');
  await region.evaluate((element) => {
    const cards = element.querySelectorAll<HTMLElement>('[data-gallery-card]');
    cards[1].style.flexBasis = '640px';
    cards[2].style.flexBasis = '900px';
  });
  await page.getByRole('button', { name: 'Show Live activities' }).click();
  await expect(page.locator('[aria-label="Choose a highlight"] [aria-current]')).toHaveAttribute(
    'aria-label',
    'Show Live activities',
  );
  await page.getByRole('button', { name: 'Show Make it yours' }).click();
  await expect(page.locator('[aria-label="Choose a highlight"] [aria-current]')).toHaveAttribute(
    'aria-label',
    'Show Make it yours',
  );
  await region.hover();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});

test('enforced CSP blocks injected script and untrusted incoming nonce', async ({
  page,
  request,
}) => {
  const response = await request.get('/', { headers: { 'x-nonce': 'attacker-fixed-nonce' } });
  expect(response.headers()['content-security-policy']).not.toContain('attacker-fixed-nonce');
  // Inject into the actual HTTP markup, preserving the enforced server CSP.
  // DevTools evaluate runs in a privileged world and is not an XSS simulation.
  await page.route('http://127.0.0.1:3001/', async (route) => {
    const original = await route.fetch();
    const body = (await original.text()).replace(
      '</head>',
      '<script>window.__cspInjectionExecuted = true</script></head>',
    );
    await route.fulfill({ response: original, body });
  });
  await page.goto('/');
  expect(await page.evaluate(() => '__cspInjectionExecuted' in window)).toBe(false);
});

test('future media reserves geometry, contains tall assets, and fails back quietly', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Isolated fixture branch coverage in Chromium.');
  const esbuild = localRequire(
    localRequire.resolve('esbuild', { paths: [localRequire.resolve('tsx/package.json')] }),
  );
  await esbuild.build({
    entryPoints: ['tests/fixtures/media.tsx'],
    bundle: true,
    outdir: 'artifacts/media-fixture',
    format: 'iife',
    minify: true,
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const sharp = localRequire(
    localRequire.resolve('sharp', { paths: [localRequire.resolve('next')] }),
  );
  const landscape = await sharp({
    create: { width: 800, height: 600, channels: 3, background: '#799bb9' },
  })
    .png()
    .toBuffer();
  const portrait = await sharp({
    create: { width: 300, height: 900, channels: 3, background: '#9b79b9' },
  })
    .png()
    .toBuffer();
  await page.route('**/__fixture/**', (route) => {
    const file = new URL(route.request().url()).pathname.split('/').at(-1);
    if (file === 'media.js' || file === 'media.css')
      return route.fulfill({
        contentType: file.endsWith('.js') ? 'application/javascript' : 'text/css',
        body: readFileSync(`artifacts/media-fixture/${file}`),
      });
    return route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><head><title>Media fixtures</title><link rel="stylesheet" href="/__fixture/media.css"></head><body><div id="root"></div><script src="/__fixture/media.js"></script></body></html>',
    });
  });
  await page.route('**/media/**', (route) => {
    const url = route.request().url();
    if (url.endsWith('fixture-landscape.png'))
      return route.fulfill({ contentType: 'image/png', body: landscape });
    if (url.endsWith('fixture-portrait.png'))
      return route.fulfill({ contentType: 'image/png', body: portrait });
    return route.fulfill({ status: 404, body: 'Test asset intentionally missing' });
  });
  await page.goto('/__fixture/index');
  await expect(page.locator('[data-media-slot="empty-fixture"] img')).toHaveCount(0);
  const normal = page.locator('[data-media-slot="landscape-fixture"]'),
    tall = page.locator('[data-media-slot="portrait-fixture"]');
  await expect(normal.locator('img')).toBeVisible();
  await expect(tall.locator('img')).toBeVisible();
  expect((await normal.boundingBox())?.height).toBeCloseTo((await tall.boundingBox())!.height, 0);
  await expect(tall.locator('img')).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('[data-media-slot="missing-fixture"] img')).toHaveCount(0);
  const video = page.locator('video');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveAttribute('playsinline', '');
  const videoBounds = await page.locator('[data-media-slot="video-fixture"]').boundingBox();
  await video.evaluate((v) => (v as HTMLVideoElement).load());
  await expect(video).toHaveCount(0);
  expect(
    (await page.locator('[data-media-slot="video-fixture"]').boundingBox())?.height,
  ).toBeCloseTo(videoBounds!.height, 0);
});

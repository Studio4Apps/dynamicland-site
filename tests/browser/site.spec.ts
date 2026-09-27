import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const selected = (page: Page) =>
  page.locator('[aria-label="Choose a highlight"] [aria-current="true"]');

async function measureChapterSpacing(page: Page) {
  await page.locator('#features [data-rotation]').waitFor({ state: 'visible' });
  return page.evaluate(() => {
    const rect = (element: Element) => element.getBoundingClientRect();
    const visible = (element: Element) => {
      const bounds = rect(element);
      const style = getComputedStyle(element);
      return (
        bounds.width > 0 &&
        bounds.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    };
    const visualTop = (section: Element) =>
      Math.min(
        ...Array.from(section.querySelectorAll('[data-media-slot], .eyebrow, h2'))
          .filter(visible)
          .map((element) => rect(element).top),
      );
    const visualBottom = (section: Element) =>
      Math.max(
        ...Array.from(section.querySelectorAll('article, [data-media-slot], h2, h3, p'))
          .filter(visible)
          .map((element) => rect(element).bottom),
      );

    const features = document.querySelector('#features');
    const rotation = features?.querySelector('[data-rotation]');
    const controls = rotation?.closest('.container');
    const overview = document.querySelector('#overview');
    const home = document.querySelector('#home');
    const everyday = document.querySelector('section[aria-labelledby="everyday-title"]');
    const customization = document.querySelector('#customization');
    const pricing = document.querySelector('#pricing');
    const faq = document.querySelector('#faq');
    if (
      !overview ||
      !features ||
      !controls ||
      !home ||
      !everyday ||
      !customization ||
      !pricing ||
      !faq
    )
      throw new Error('Homepage chapter boundary is incomplete');

    const overviewBottom = rect(overview).bottom;
    const featuresTop = visualTop(features);
    const controlsBottom = rect(controls).bottom;
    const homeTop = visualTop(home);
    const everydayBottom = visualBottom(everyday);
    const customizationTop = visualTop(customization);
    const pricingBottom = visualBottom(pricing);
    const faqTop = visualTop(faq);
    return {
      overviewToHighlights: featuresTop - overviewBottom,
      overviewOwner: rect(overview).bottom - overviewBottom,
      highlightsTopOwner: featuresTop - rect(features).top,
      highlightsToHome: homeTop - controlsBottom,
      highlightsOwner: rect(features).bottom - controlsBottom,
      homeOwner: homeTop - rect(home).top,
      everydayToCustomization: customizationTop - everydayBottom,
      everydayOwner: rect(everyday).bottom - everydayBottom,
      customizationOwner: customizationTop - rect(customization).top,
      pricingToFaq: faqTop - pricingBottom,
      pricingOwner: rect(pricing).bottom - pricingBottom,
      faqOwner: faqTop - rect(faq).top,
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
}

test('routes, real destinations, hero image, empty product media and CSP', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  const mediaRequests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('request', (r) => {
    if (r.url().includes('/media/') || r.resourceType() === 'media') mediaRequests.push(r.url());
  });
  for (const path of ['/', '/support', '/privacy', '/terms']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const csp = response?.headers()['content-security-policy'] || '';
    const scriptPolicy = csp.split(';').find((s) => s.trim().startsWith('script-src')) || '';
    expect(scriptPolicy).toContain("'nonce-");
    expect(scriptPolicy).not.toContain('unsafe-inline');
    expect(scriptPolicy).not.toContain('unsafe-eval');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    expect(response?.headers()['cache-control']).toContain('no-store');
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  }
  await page.goto('/');
  for (const anchor of await page
    .locator('a')
    .evaluateAll((elements) =>
      elements.map((e) => e.getAttribute('href')).filter((s): s is string => !!s),
    )) {
    expect(anchor).not.toMatch(/^(javascript|data):/i);
    if (anchor.startsWith('/#') || anchor.startsWith('#'))
      await expect(page.locator(`[id="${anchor.split('#')[1]}"]`)).toHaveCount(1);
  }
  const heroImage = page.locator('[data-hero-artwork] img');
  await expect(heroImage).toBeVisible();
  await expect(page.locator('[data-media-slot="hero"]')).toHaveCount(0);
  await expect
    .poll(() => heroImage.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(page.locator('[data-media-slot] img, [data-media-slot] video')).toHaveCount(0);
  expect(
    await page
      .locator('button')
      .filter({ hasText: /^(Play|Watch|Zoom)$/ })
      .count(),
  ).toBe(0);
  expect(mediaRequests.length).toBeGreaterThan(0);
  expect(
    mediaRequests.every((url) =>
      /\/media\/(landing-page-(840|1672)|footer-(840|1448)|pro-card)\.webp$/.test(url),
    ),
  ).toBe(true);
  const one = await request.get('/'),
    two = await request.get('/');
  expect(one.headers()['content-security-policy']).not.toBe(
    two.headers()['content-security-policy'],
  );
  const html = await one.text();
  expect(html).toContain('Clipboard');
  expect(html).toContain('macOS 26.0');
  expect(html).toContain('Monthly or yearly');
  expect(html).not.toMatch(/rel="canonical"[^>]*localhost/);
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const graph = JSON.parse(json || '{}')['@graph'];
  expect(graph.find((x: { '@type': string }) => x['@type'] === 'SoftwareApplication').name).toBe(
    'DynamicLand',
  );
  expect(errors).toEqual([]);
  expect((await request.get('/this-page-does-not-exist')).status()).toBe(404);
  for (const path of [
    '/docs/product-facts.md',
    '/.env',
    '/.git/config',
    '/reference-inputs/',
    '/artifacts/appstore-lookup.json',
    '/scripts/security-scan.mjs',
  ])
    expect((await request.get(path)).status()).toBe(404);
});

test('gallery navigation, rapid reversal, native input, resize and live reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  const region = page.locator('[data-gallery-track]');
  await region.scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: /^(Previous|Next) highlight$/ })).toHaveCount(0);
  await region.focus();
  await region.press('ArrowRight');
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Music within reach');
  await page.getByRole('button', { name: 'Show Make it yours' }).click();
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Make it yours');
  await region.focus();
  await region.press('ArrowLeft');
  await region.press('ArrowLeft');
  await region.press('ArrowRight');
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Clipboard and files');
  await region.focus();
  await region.press('Home');
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show A home for your day');
  await region.press('End');
  await page.setViewportSize({ width: 600, height: 700 });
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Make it yours');
  await region.focus();
  await region.press('ArrowLeft');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Clipboard and files');
  await region.focus();
  await region.press('Home');
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show A home for your day');
  await region.evaluate((e) => {
    e.scrollLeft = e.scrollWidth;
  });
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Make it yours');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Show A home for your day' }).click();
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show A home for your day');
  // Native wheel interrupts scripted movement; vertical wheel remains page scrolling.
  await region.focus();
  await region.press('ArrowRight');
  await region.hover();
  await page.mouse.wheel(-500, 0);
  await expect(region).not.toHaveAttribute('data-moving', 'true');
  await region.focus();
  await region.press('End');
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show Make it yours');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await region.focus();
  await region.press('Home');
  await expect(selected(page)).toHaveAttribute('aria-label', 'Show A home for your day');
  const box = await region.boundingBox();
  if (!box) throw new Error('Missing gallery bounds');
  await page.mouse.move(box.x + 700, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 100, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => region.evaluate((e) => e.scrollLeft)).toBeGreaterThan(200);
});

test('mobile menu focus, escape, outside interaction and responsive cleanup', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByLabel('Open navigation menu', { exact: true });
  await menu.focus();
  await menu.press('Enter');
  const close = page.getByLabel('Close navigation menu', { exact: true });
  await expect(close).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  // macOS WebKit follows the system keyboard preference: Option-Tab includes
  // links/buttons when full keyboard navigation is disabled. Do not trap Tab.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Overview' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await expect(close).toBeVisible();
  await page.locator('#overview .fineprint').click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
  await menu.click();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Features' })
    .click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
  await menu.click();
  await expect(close).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
});

test('native selector, keyboard, rapid changes, FAQ and reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Dynamic Pill/ }).check();
  await expect(page.locator('#preview-pill')).toBeVisible();
  await expect(page.locator('#description-pill')).toBeVisible();
  await expect(page.locator('#description-notch')).not.toBeVisible();
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await page.getByRole('radio', { name: /Dynamic Notch/ }).check();
  await expect(page.locator('#preview-notch')).toBeVisible();
  await page.getByRole('radio', { name: /Dynamic Notch/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /Dynamic Pill/ })).toBeChecked();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await expect(page.locator('#preview-glass')).toBeVisible();
  const faq = page.locator('summary').filter({ hasText: 'Is DynamicLand free?' });
  await faq.focus();
  await faq.press('Enter');
  await expect(faq.locator('..')).toHaveAttribute('open', '');
  await faq.press('Space');
  await expect(faq.locator('..')).not.toHaveAttribute('open', '');
});

test('no JavaScript and failed enhancement keep content and native controls usable', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/');
  await expect(page.locator('[data-rotation]')).toBeHidden();
  await expect(page.locator('[data-gallery-card]')).toHaveCount(5);
  await expect(
    page.getByRole('heading', { name: 'Your Mac. A little more connected.' }),
  ).toBeVisible();
  await page.getByLabel('Open navigation menu').click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await expect(page.locator('#preview-glass')).toBeVisible();
  const faq = page.locator('summary').filter({ hasText: 'Is DynamicLand free?' });
  await faq.click();
  await expect(faq.locator('..')).toHaveAttribute('open', '');
  await context.close();
});

test('accessibility across routes, menu and selected states', async ({ page }) => {
  for (const path of ['/', '/support', '/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('header')).toHaveAttribute('data-scrolled', 'false');
    // Check settled colors after hydration applies the homepage header theme.
    await page.locator('header').evaluate(async (header) => {
      await Promise.allSettled(
        header.getAnimations({ subtree: true }).map((animation) => animation.finished),
      );
    });
    // DevTools test injection; the shipped site CSP remains enforced and unchanged.
    await page.evaluate(axe);
    const results = await page.evaluate(async () => {
      const engine = (
        window as unknown as {
          axe: {
            run: (
              context: Document,
              options: unknown,
            ) => Promise<{
              violations: { id: string; impact: string; nodes: { html: string }[] }[];
            }>;
          };
        }
      ).axe;
      return (
        await engine.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
        })
      ).violations;
    });
    expect(results, JSON.stringify(results, null, 2)).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Open navigation menu').click();
  await page.evaluate(axe);
  expect(
    await page.evaluate(
      async () =>
        (
          await (
            window as unknown as {
              axe: { run: (options: unknown) => Promise<{ violations: unknown[] }> };
            }
          ).axe.run({
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
          })
        ).violations,
    ),
  ).toEqual([]);
});

test('homepage rhythm preserves independent and related chapter hierarchy', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Detailed layout measurements run in Chromium; responsive interactions run in all engines.',
  );
  await page.goto('/');
  const viewports = [
    { name: 'mobile 320', width: 320, height: 844, min: 96, max: 120 },
    { name: 'mobile 390', width: 390, height: 844, min: 96, max: 120 },
    { name: 'intermediate 600', width: 600, height: 900, min: 128, max: 176 },
    { name: 'tablet 768', width: 768, height: 1024, min: 128, max: 176 },
    { name: 'desktop 1024', width: 1024, height: 900, min: 200, max: 240 },
    { name: 'desktop 1440', width: 1440, height: 1000, min: 200, max: 240 },
    { name: 'short landscape', width: 844, height: 390, min: 120, max: 140 },
    { name: 'ultrawide', width: 2560, height: 1080, min: 200, max: 240 },
  ];

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion });
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.evaluate(() => document.fonts.ready);
      const spacing = await measureChapterSpacing(page);
      for (const [boundary, gap] of [
        ['Overview to Highlights', spacing.overviewToHighlights],
        ['Highlights to Home', spacing.highlightsToHome],
        ['Everyday to Customization', spacing.everydayToCustomization],
      ] as const) {
        expect(gap, `${boundary} at ${viewport.name} with ${reducedMotion}`).toBeGreaterThanOrEqual(
          viewport.min - 0.25,
        );
        expect(gap, `${boundary} at ${viewport.name} with ${reducedMotion}`).toBeLessThanOrEqual(
          viewport.max + 0.25,
        );
      }
      expect(spacing.overviewOwner).toBeCloseTo(0, 1);
      expect(spacing.highlightsTopOwner).toBeCloseTo(spacing.overviewToHighlights, 1);
      expect(spacing.highlightsOwner).toBeCloseTo(spacing.highlightsToHome, 1);
      expect(spacing.homeOwner).toBeCloseTo(0, 1);
      expect(spacing.everydayOwner).toBeCloseTo(spacing.everydayToCustomization, 1);
      expect(spacing.customizationOwner).toBeCloseTo(0, 1);
      expect(spacing.pricingOwner).toBeCloseTo(spacing.faqOwner, 1);
      expect(spacing.pricingOwner + spacing.faqOwner).toBeCloseTo(spacing.pricingToFaq, 1);
      expect(spacing.pricingToFaq).toBeLessThan(spacing.overviewToHighlights);
      expect(spacing.horizontalOverflow).toBeLessThanOrEqual(0);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#home');
  await expect
    .poll(() => page.locator('#home').evaluate((element) => element.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(87);
  await expect
    .poll(() => page.locator('#home').evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThanOrEqual(90);
});

test('all requested viewport widths and synthetic landscape/reflow remain bounded', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Full width sweep in Chromium; core responsive interactions run in all engines.',
  );
  mkdirSync('artifacts/screenshots', { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const widths = [320, 375, 390, 430, 600, 768, 834, 1024, 1280, 1440, 1728, 1920, 2560];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `overflow at ${width}`,
    ).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }
  for (const [label, width, height] of [
    ['mobile', 390, 844],
    ['tablet', 834, 1112],
    ['desktop', 1440, 1000],
    ['landscape', 844, 390],
    ['square', 720, 720],
    ['ultrawide', 2560, 1080],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `artifacts/screenshots/${label}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  // Synthetic text enlargement and 320px reflow equivalent to a 1280px window at 400%.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('discovery policy, bot responses and no private outputs', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-Agent: *');
  expect(robots).toContain('Allow: /');
  expect(robots).toContain('User-Agent: GPTBot');
  expect(robots).toContain('Disallow: /');
  expect(robots).not.toContain('Sitemap:');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('<loc>');
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('DynamicLand');
  expect(llms).toContain('macOS 26.0');
  expect(llms).not.toMatch(/localhost|\/Users\/|experimental|rank first/);
  for (const userAgent of [
    'Googlebot',
    'bingbot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Applebot',
  ]) {
    const response = await request.get('/', { headers: { 'User-Agent': userAgent } });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('DynamicLand');
  }
});

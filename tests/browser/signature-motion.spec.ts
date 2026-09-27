import { test, expect } from '@playwright/test';
import AxeBuilder from 'axe-core';

test('explorer morph reverses from the rendered shell and restores focus', async ({ page }) => {
  await page.goto('/');
  const root = page.locator('[data-feature-explorer]');
  const summary = root.locator('summary');
  const panel = root.locator('[data-explorer-panel]');
  await summary.focus();
  await summary.press('Enter');
  await page.waitForTimeout(90);
  const continuity = await root.evaluate((root) => {
    const panel = root.querySelector('[data-explorer-panel]')!;
    const before = getComputedStyle(panel).clipPath;
    root.querySelector<HTMLButtonElement>('button')!.click();
    const after = getComputedStyle(panel).clipPath;
    root.querySelector('summary')!.click();
    return { before, after };
  });
  expect(continuity.before).not.toBe('none');
  expect(continuity.after).toBe(continuity.before);
  await expect(root).toHaveAttribute('data-expanded', 'true');
  await expect.poll(() => panel.evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(page.getByRole('button', { name: 'Close feature explorer' })).toBeFocused();
  const final = await root
    .locator('[data-destination-icon]')
    .evaluateAll((icons) => icons.map((el) => getComputedStyle(el).transform));
  expect(final.every((value) => value === 'none')).toBe(true);
  await page.keyboard.press('Escape');
  await expect(root).not.toHaveAttribute('open', '');
  await expect(summary).toBeFocused();
  await summary.click();
  await expect.poll(() => panel.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page
    .getByRole('navigation', { name: 'Explore DynamicLand' })
    .getByRole('link', { name: /Your music/ })
    .click();
  await expect(page).toHaveURL(/#music$/);
  await expect(root).not.toHaveAttribute('open', '');
});

test('explorer stays inside compact and short viewports, and reduced motion settles in place', async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const summary = page.locator('[data-feature-explorer] summary');
    await summary.click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const panel = page.locator('[data-explorer-panel]');
    await expect.poll(() => panel.evaluate((el) => el.getAnimations().length)).toBe(0);
    const rect = await panel.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(19);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width - 19);
    expect(rect!.y).toBeGreaterThanOrEqual(63);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
    await expect(summary).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test('explorer remains native without JavaScript and open navigation is accessible', async ({
  page,
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const fallback = await context.newPage();
  await fallback.goto('/');
  const summary = fallback.locator('[data-feature-explorer] summary');
  await summary.click();
  await expect(fallback.getByRole('navigation', { name: 'Explore DynamicLand' })).toBeVisible();
  await summary.click();
  await expect(fallback.getByRole('navigation', { name: 'Explore DynamicLand' })).not.toBeVisible();
  await context.close();
  await page.goto('/');
  await page.locator('[data-feature-explorer] summary').click();
  await expect
    .poll(() => page.locator('[data-explorer-panel]').evaluate((el) => el.getAnimations().length))
    .toBe(0);
  // DevTools injection for QA only; the production CSP is unchanged.
  await page.evaluate(AxeBuilder.source);
  const violations = await page.evaluate(
    async () =>
      (
        await (window as unknown as { axe: typeof AxeBuilder }).axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
        })
      ).violations,
  );
  expect(violations).toEqual([]);
});

test('navigation marker follows the section and retargets without resetting its geometry', async ({
  page,
}) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await nav.getByRole('link', { name: 'Support' }).hover();
  await page.waitForTimeout(70);
  const state = await nav.evaluate((nav) => {
    const marker = nav.querySelector('[data-nav-indicator]')!;
    // Freeze this one clock for a deterministic same-state measurement:
    // WebKit may otherwise advance its compositor between the two DOM reads.
    marker.getAnimations().forEach((animation) => animation.pause());
    const before = marker.getBoundingClientRect();
    nav.querySelectorAll('a')[1].dispatchEvent(new PointerEvent('pointerenter'));
    const after = marker.getBoundingClientRect();
    return { before: before.x, after: after.x };
  });
  expect(Math.abs(state.before - state.after)).toBeLessThan(1);
  await page.mouse.move(5, 500);
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  await expect(nav.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await nav.getByRole('link', { name: 'Features' }).hover();
  expect(
    await nav.locator('[data-nav-indicator]').evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await expect(page.locator('#hero-title')).toBeVisible();
});

test('top navigation scrolls smoothly and reduced motion moves immediately', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      window.__topNavigationScroll = options;
      return original.call(this, options);
    };
  });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Pricing' }).click();
  await expect(page).toHaveURL(/#pricing$/);
  await expect
    .poll(() =>
      page.evaluate(() =>
        typeof window.__topNavigationScroll === 'object'
          ? window.__topNavigationScroll.behavior
          : undefined,
      ),
    )
    .toBe('smooth');
  await expect
    .poll(() =>
      page.locator('#pricing').evaluate((el) => Math.abs(el.getBoundingClientRect().top - 96) < 8),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await nav.getByRole('link', { name: 'Overview' }).click();
  await expect(page).toHaveURL(/#overview$/);
  expect(
    await page.evaluate(() =>
      typeof window.__topNavigationScroll === 'object'
        ? window.__topNavigationScroll.behavior
        : undefined,
    ),
  ).toBe('auto');
  await expect(page.locator('#overview')).toBeInViewport();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByLabel('Open navigation menu').click();
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'Features' })
    .click();
  await expect(page).toHaveURL(/#features$/);
  await expect
    .poll(() =>
      page.evaluate(() =>
        typeof window.__topNavigationScroll === 'object'
          ? window.__topNavigationScroll.behavior
          : undefined,
      ),
    )
    .toBe('smooth');
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
});

declare global {
  interface Window {
    __topNavigationScroll?: boolean | ScrollIntoViewOptions;
  }
}

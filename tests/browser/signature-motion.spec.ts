import { test, expect } from '@playwright/test';
import AxeBuilder from 'axe-core';

test('mobile navigation works without JavaScript and the homepage remains accessible', async ({
  page,
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const fallback = await context.newPage();
  await fallback.goto('/');
  const menu = fallback.getByLabel('Open navigation menu');
  await menu.click();
  await expect(fallback.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  await menu.click();
  await expect(fallback.getByRole('navigation', { name: 'Mobile navigation' })).not.toBeVisible();
  await context.close();

  await page.goto('/');
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

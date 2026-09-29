import { test, expect } from '@playwright/test';

test('optics belong to the menu surface and release on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const root = page.locator('[data-mobile-menu]');
  await expect(root).toHaveAttribute('data-liquid-glass', 'ready');
  await page.getByLabel('Open navigation menu', { exact: true }).click();
  await expect(root).toHaveAttribute('data-menu-state', 'open');
  await expect
    .poll(() =>
      page.locator('[data-menu-glass]').evaluate((e) => getComputedStyle(e).backdropFilter),
    )
    .not.toBe('none');
  expect(await page.locator('#overview').evaluate((e) => getComputedStyle(e).filter)).toBe('none');
  expect(await page.locator('#features').evaluate((e) => getComputedStyle(e).filter)).toBe('none');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-menu-state', 'closed');
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('svg > defs > filter')).toHaveCount(0);
});

test('unavailable lens primitives keep the disclosure and its original animation usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'ResizeObserver', { value: undefined });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Open navigation menu', { exact: true }).click();
  await expect(page.locator('[data-mobile-menu]')).toHaveAttribute('data-menu-state', 'open');
  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link'),
  ).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Open navigation menu', { exact: true })).toBeFocused();
});

test('the graphite material stays identical after scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const root = page.locator('[data-mobile-menu]');
  await expect(root).toHaveAttribute('data-liquid-glass', 'ready');
  const material = () =>
    root.evaluate((e) =>
      ['[data-menu-trigger-glass]', '[data-menu-glass]'].map((selector) => {
        const css = getComputedStyle(e.querySelector(selector)!);
        return {
          background: css.background,
          border: css.borderColor,
          ink: getComputedStyle(e).color,
        };
      }),
    );
  const initial = await material();
  await page.evaluate(() => window.scrollTo({ top: 450, behavior: 'instant' }));
  await expect(page.locator('header')).toHaveAttribute('data-scrolled', 'true');
  expect(await material()).toEqual(initial);
});

test('open menu optics stay attached while scrolling vertically over Photo 04–06', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#features');
  const root = page.locator('[data-mobile-menu]');
  const gallery = page.getByRole('region', { name: 'DynamicLand highlights' });
  await gallery.getByRole('button', { name: 'Pause slideshow' }).click();
  const track = gallery.locator('[data-gallery-track]');
  for (const index of [2, 3, 4]) {
    await gallery.locator(`[data-gallery-dot="${index}"]`).click();
    await expect(track).not.toHaveAttribute('data-moving', 'true');
    await track.evaluate((e) =>
      window.scrollTo({
        top: window.scrollY + e.getBoundingClientRect().top - 100,
        behavior: 'instant',
      }),
    );
    const button = (await root.locator('summary').boundingBox())!;
    await page.mouse.click(button.x + 22, button.y + 22);
    await expect(root).toHaveAttribute('data-menu-state', 'open');
    for (const delta of [100, 180, -140, -140]) {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(180);
      const bounds = await page.locator('[data-menu-glass]').boundingBox();
      const panel = await page.locator('[data-menu-panel]').boundingBox();
      expect(bounds).toEqual(panel);
      expect(await page.locator('#features').evaluate((e) => getComputedStyle(e).filter)).toBe(
        'none',
      );
      await expect(page.locator('[data-menu-refraction]')).toHaveCount(0);
      await expect
        .poll(() =>
          page.locator('[data-menu-glass]').evaluate((e) => getComputedStyle(e).backdropFilter),
        )
        .not.toBe('none');
    }
    await page.screenshot({
      path: `artifacts/menu-attached/${test.info().project.name}-photo-${index + 2}.png`,
    });
    await page.keyboard.press('Escape');
    await expect(root).toHaveAttribute('data-menu-state', 'closed');
  }
});

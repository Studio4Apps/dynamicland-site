import { test, expect, type Page } from '@playwright/test';

const menu = (page: Page) => page.locator('[data-mobile-menu]');
const trigger = (page: Page) => menu(page).locator('summary');
const nav = (page: Page) => page.getByRole('navigation', { name: 'Mobile navigation' });
async function sample(page: Page, time: number) {
  return menu(page).evaluate((root, time) => {
    root.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = time;
    });
    const surface = root.querySelector<HTMLElement>('[data-menu-glass]')!;
    const content = root.querySelector('nav')!;
    const bounds = surface.getBoundingClientRect();
    const target = root.querySelector('[data-menu-panel]')!.getBoundingClientRect();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      targetWidth: target.width,
      targetHeight: target.height,
      radius: parseFloat(getComputedStyle(surface).borderTopLeftRadius),
      opacity: Number(getComputedStyle(content).opacity),
      blur: getComputedStyle(content).filter,
    };
  }, time);
}
async function finish(page: Page) {
  await menu(page).evaluate((root) =>
    root.getAnimations({ subtree: true }).forEach((a) => a.finish()),
  );
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(menu(page)).toHaveAttribute('data-menu-enhanced', 'true');
  await expect(menu(page)).toHaveAttribute('data-liquid-glass', 'ready');
});

test('glass circle becomes a rounded liquid surface and contracts back into the trigger', async ({
  page,
}) => {
  const circle = await trigger(page).boundingBox();
  expect(circle!.width).toBe(44);
  expect(circle!.height).toBe(44);
  const material = await menu(page)
    .locator('[data-menu-trigger-glass]')
    .evaluate((e) => {
      const css = getComputedStyle(e);
      return { blur: css.backdropFilter, radius: css.borderRadius, border: css.borderTopWidth };
    });
  // Refraction/frost belongs to the control, never to page sections.
  expect(material.blur).not.toBe('none');
  expect(material.radius).toBe('50%');
  expect(material.border).toBe('1px');
  await trigger(page).click();
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'opening');
  const start = await sample(page, 0);
  expect(start.x).toBeCloseTo(circle!.x, 1);
  expect(start.y).toBeCloseTo(circle!.y, 1);
  expect(start.width).toBeCloseTo(circle!.width, 1);
  expect(start.height).toBeCloseTo(circle!.height, 1);
  expect(start.opacity).toBe(0);
  const bloom = await sample(page, 150);
  expect(bloom.width).toBeGreaterThan(start.width * 5);
  expect(bloom.width).toBeLessThan(bloom.targetWidth);
  expect(bloom.radius).toBeGreaterThan(70);
  expect(bloom.opacity).toBeGreaterThan(0);
  expect(bloom.opacity).toBeLessThan(1);
  expect(bloom.blur).not.toBe('blur(0px)');
  const overshoot = await sample(page, 290);
  expect(overshoot.width).toBeGreaterThan(overshoot.targetWidth);
  await finish(page);
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'open');
  expect(
    await menu(page)
      .locator('[data-menu-glass]')
      .evaluate((e) => getComputedStyle(e).borderTopLeftRadius),
  ).toBe('19px');
  const panel = await menu(page).locator('[data-menu-panel]').boundingBox();
  expect(panel!.y).toBeCloseTo(circle!.y, 1);
  expect(panel!.x + panel!.width).toBeCloseTo(circle!.x + circle!.width, 1);
  await expect(trigger(page)).toHaveAttribute('aria-hidden', 'true');
  expect(
    await menu(page)
      .locator('[data-menu-trigger-glass]')
      .evaluate((e) => getComputedStyle(e).opacity),
  ).toBe('0');
  expect(
    await menu(page)
      .locator('[data-menu-icon]')
      .evaluate((e) => getComputedStyle(e).opacity),
  ).toBe('0');
  // No cross or detached trigger remains when the circle becomes the menu.
  expect(
    await menu(page)
      .locator('[data-menu-icon]')
      .evaluate((e) => getComputedStyle(e, '::before').transform),
  ).toBe('none');
  await expect(nav(page).getByRole('link')).toHaveCount(4);
  expect(await nav(page).evaluate((e) => getComputedStyle(e).filter)).toBe('none');
  await page.locator('#overview .fineprint').click();
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'closing');
  const returning = await sample(page, 240);
  expect(returning.width).toBeLessThan(returning.targetWidth * 0.5);
  expect(returning.width).toBeGreaterThan(circle!.width);
  expect(returning.x).toBeGreaterThan(overshoot.x);
  expect(returning.opacity).toBe(0);
  // Resume the real animation after its text fade. Slow WebKit paints may
  // already finish the shell before the next observation; either way its text
  // must stay hidden rather than flash back as the fade's effect is removed.
  await menu(page).evaluate((root) =>
    root.getAnimations({ subtree: true }).forEach((a) => a.play()),
  );
  await page.waitForTimeout(60);
  expect(
    await menu(page).evaluate(
      (root) =>
        !root.hasAttribute('open') ||
        Number(getComputedStyle(root.querySelector('nav')!).opacity) === 0,
    ),
  ).toBe(true);
  await finish(page);
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'closed');
  await expect(nav(page)).not.toBeVisible();
  expect(await menu(page).evaluate((e) => e.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(trigger(page)).toHaveAccessibleName('Open navigation menu');
});

test('outside dismissal preserves the presented shape and keyboard focus follows the surface', async ({
  page,
}) => {
  await trigger(page).click();
  const before = await sample(page, 150);
  // The header is outside the panel too; it must not be an exempt dismiss area.
  await page.mouse.click(5, 32);
  const reversed = await sample(page, 0);
  for (const key of ['x', 'y', 'width', 'height'] as const)
    expect(reversed[key]).toBeCloseTo(before[key], 1);
  await finish(page);
  await trigger(page).focus();
  await trigger(page).press('Enter');
  await expect(nav(page).getByRole('link', { name: 'Overview' })).toBeFocused();
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'open');
  await page.keyboard.press('Escape');
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  await finish(page);
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'closed');
});

test('resize, short screens and motion fallbacks keep the menu bounded and usable', async ({
  page,
}) => {
  await trigger(page).click();
  await sample(page, 160);
  await page.setViewportSize({ width: 320, height: 280 });
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'open');
  const bounds = await nav(page).boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(280);
  await nav(page).getByRole('link', { name: 'Support' }).focus();
  await expect(nav(page).getByRole('link', { name: 'Support' })).toBeInViewport();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'closed');
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger(page).click();
  await sample(page, 160);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'open');
  await page.mouse.click(5, 32);
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'closed');
  await trigger(page).click();
  expect(await menu(page).evaluate((e) => e.getAnimations({ subtree: true }).length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    Element.prototype.animate = () => {
      throw new Error('Unavailable animation API');
    };
  });
  await page.reload();
  await trigger(page).click();
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'open');
  await page.mouse.click(5, 32);
  await expect(menu(page)).toHaveAttribute('data-menu-state', 'closed');
});

import { test, expect } from '@playwright/test';

test('disclosures reverse from their current height and settle on resize or reduced motion', async ({
  page,
}) => {
  await page.goto('/#faq');
  const item = page.locator('[data-disclosure]').first();
  const summary = item.locator('summary');
  const body = item.locator('[data-disclosure-content]');
  await summary.focus();
  await summary.press('Enter');
  await page.waitForTimeout(75);
  const reversal = await item.evaluate((details) => {
    const content = details.querySelector('[data-disclosure-content]')!;
    const before = content.getBoundingClientRect().height;
    details.querySelector('summary')!.click();
    return { before, after: content.getBoundingClientRect().height };
  });
  expect(reversal.before).toBeGreaterThan(1);
  expect(Math.abs(reversal.after - reversal.before)).toBeLessThan(1);
  await expect(item).not.toHaveAttribute('open', '');
  await summary.press('Space');
  await page.waitForTimeout(55);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(item).toHaveAttribute('open', '');
  await expect.poll(() => body.evaluate((el) => el.getAnimations().length)).toBe(0);
  expect(await body.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(30);
  expect(await item.evaluate((el) => getComputedStyle(el).overflow)).toBe('visible');
  await summary.press('Enter');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(item).not.toHaveAttribute('open', '');
  await summary.press('Enter');
  await expect(item).toHaveAttribute('open', '');
  expect(await body.evaluate((el) => el.getAnimations().length)).toBe(0);
  expect(
    await body.evaluate((el) => ({
      inert: (el as HTMLElement).inert,
      overflow: el.style.overflow,
    })),
  ).toEqual({
    inert: false,
    overflow: '',
  });
});

test('preview reversal preserves opacity and the last selection owns the settled stage', async ({
  page,
}) => {
  await page.goto('/#customization');
  await page.locator('#customization').scrollIntoViewIfNeeded();
  await page.getByRole('radio', { name: /Dynamic Pill/ }).check();
  await page.waitForTimeout(50);
  const reversal = await page.locator('#preview-notch').evaluate((el) => {
    const before = Number(getComputedStyle(el).opacity);
    document.querySelector<HTMLInputElement>('input[value="notch"]')!.click();
    return { before, after: Number(getComputedStyle(el).opacity) };
  });
  expect(Math.abs(reversal.before - reversal.after)).toBeLessThan(0.03);
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#preview-glass')).toBeVisible();
  await expect(page.locator('#preview-notch')).not.toBeVisible();
  const state = await page.locator('[data-preview]').evaluateAll((items) =>
    items.map((el) => ({
      id: el.id,
      opacity: getComputedStyle(el).opacity,
      transform: getComputedStyle(el).transform,
      animations: el.getAnimations().length,
    })),
  );
  expect(state.every((item) => item.animations === 0 && item.transform === 'none')).toBe(true);
  expect(state.filter((item) => item.opacity === '1').map((item) => item.id)).toEqual([
    'preview-glass',
  ]);
  await expect(page.locator('#description-glass')).toBeVisible();
  await expect(page.locator('#description-pill')).not.toBeVisible();
});

test('section entrances settle exactly and do not replay when scrolling back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hero-title')).toHaveCSS('opacity', '1');
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  const cards = page.locator('#pricing article');
  await page.waitForTimeout(60);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS('transform', 'none');
    await expect(card).toHaveCSS('opacity', '1');
    await expect(card).toHaveCSS('filter', 'none');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  expect(await cards.evaluateAll((items) => items.flatMap((el) => el.getAnimations()).length)).toBe(
    0,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('throwing animation APIs leave disclosure and selector usable', async ({ page }) => {
  await page.addInitScript(() => {
    Element.prototype.animate = () => {
      throw new Error('Simulated unsupported animation');
    };
  });
  await page.goto('/');
  const summary = page.locator('[data-disclosure] summary').first();
  await summary.click();
  await expect(summary.locator('..')).toHaveAttribute('open', '');
  await summary.click();
  await expect(summary.locator('..')).not.toHaveAttribute('open', '');
  await page.getByRole('radio', { name: /Liquid Glass/ }).check();
  await expect(page.locator('#preview-glass')).toBeVisible();
});

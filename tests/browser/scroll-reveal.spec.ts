import { test, expect } from '@playwright/test';

test('visible pricing cards enter in order and never replay', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pricing').evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 80, behavior: 'instant' });
  });
  const cards = page.locator('#pricing article');
  await expect(cards.first()).toHaveAttribute('data-motion-state', 'running');
  const delays = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAnimations()[0]?.effect?.getTiming().delay),
  );
  expect(delays).toEqual([0, 135]);
  for (const card of await cards.all()) {
    await expect(card).toHaveAttribute('data-motion-state', 'done');
    await expect(card).toHaveCSS('opacity', '1');
    await expect(card).toHaveCSS('translate', 'none');
  }
  await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  expect(await cards.evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length)).toBe(0);
});

test('focus reveals hidden content and reduced motion settles every pending entrance', async ({
  page,
}) => {
  await page.goto('/');
  const card = page.locator('#updates [data-release]').first();
  await expect(card).toHaveAttribute('data-motion-state', 'waiting');
  await card.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
  await expect(card).toHaveCSS('opacity', '1');
  await expect(card).toHaveAttribute('data-motion-state', 'done');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(
    page.locator('[data-motion-state="waiting"], [data-motion-state="running"]'),
  ).toHaveCount(0);
});

test('all content is readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/');
  await expect(page.locator('#pricing article').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('#updates [data-release]').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('#hero-title')).toBeVisible();
  await context.close();
});

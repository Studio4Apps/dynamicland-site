import { test, expect, type Page } from '@playwright/test';

const gallery = (page: Page) => page.getByRole('region', { name: 'DynamicLand highlights' });
const controls = (page: Page) => page.locator('[data-gallery-controls]');
async function reachControls(page: Page) {
  await controls(page).evaluate((element) => {
    scrollTo({
      top: scrollY + element.getBoundingClientRect().top - innerHeight * 0.68,
      behavior: 'instant',
    });
  });
}
async function sample(page: Page, time: number) {
  return controls(page).evaluate((element, time) => {
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = time;
    });
    const capsule = element.querySelector<HTMLElement>('[data-gallery-capsule]')!;
    const button = element.querySelector<HTMLElement>('[data-rotation]')!;
    const dots = element.querySelector<HTMLElement>('[data-gallery-dot]')!;
    const group = element.querySelector<HTMLElement>('[data-playback-group]')!;
    return {
      width: capsule.getBoundingClientRect().width,
      height: capsule.getBoundingClientRect().height,
      targetWidth: capsule.parentElement!.getBoundingClientRect().width,
      targetHeight: button.offsetHeight,
      buttonOpacity: Number(getComputedStyle(button).opacity),
      buttonTravel: new DOMMatrix(getComputedStyle(button).transform).m41,
      dotOpacity: Number(getComputedStyle(dots).opacity),
      travel: new DOMMatrix(getComputedStyle(group).transform).m42,
      bottom: group.getBoundingClientRect().bottom,
      viewport: innerHeight,
    };
  }, time);
}

test('reference entrance rises as a circle, expands, releases playback and never replays', async ({
  page,
}) => {
  await page.goto('/');
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'waiting');
  const reservedHeight = await controls(page).evaluate((e) => e.getBoundingClientRect().height);
  await reachControls(page);
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'entering');
  const start = await sample(page, 0);
  expect(start.bottom).toBeGreaterThan(start.viewport);
  expect(start.width).toBeLessThan(start.targetHeight);
  expect(start.buttonOpacity).toBe(0);
  expect(start.dotOpacity).toBe(0);
  const circle = await sample(page, 205);
  expect(circle.width).toBeLessThan(circle.targetHeight);
  expect(circle.travel).toBeGreaterThan(start.travel * 0.08);
  expect(circle.travel).toBeLessThan(start.travel * 0.65);
  expect(circle.dotOpacity).toBe(0);
  const crest = await sample(page, 482);
  expect(crest.travel).toBeCloseTo(-6, 1);
  const stretch = await sample(page, 567);
  expect(stretch.width).toBeGreaterThan(stretch.targetWidth * 0.8);
  expect(stretch.height).toBeLessThan(stretch.targetHeight * 0.85);
  expect(stretch.dotOpacity).toBeGreaterThan(0);
  expect(stretch.buttonOpacity).toBe(0);
  const rebound = await sample(page, 643);
  expect(rebound.travel).toBeCloseTo(2, 1);
  const emerging = await sample(page, 741);
  expect(emerging.buttonOpacity).toBeGreaterThan(0.2);
  expect(emerging.buttonOpacity).toBeLessThan(0.7);
  const release = await sample(page, 906);
  expect(release.width).toBeGreaterThan(release.targetWidth);
  expect(release.buttonOpacity).toBeGreaterThan(0.9);
  expect(release.dotOpacity).toBeGreaterThan(0.9);
  const bubbleBounce = await sample(page, 1073);
  expect(bubbleBounce.buttonTravel).toBeGreaterThan(2);
  expect(bubbleBounce.buttonTravel).toBeLessThanOrEqual(2.5);
  await controls(page).evaluate((element) =>
    element.getAnimations({ subtree: true }).forEach((a) => a.finish()),
  );
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'settled');
  expect(await controls(page).evaluate((e) => e.getBoundingClientRect().height)).toBe(
    reservedHeight,
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await reachControls(page);
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'settled');
  expect(await controls(page).evaluate((e) => e.getAnimations({ subtree: true }).length)).toBe(0);
  const final = await sample(page, 1300);
  expect(final.width).toBeCloseTo(final.targetWidth, 1);
  expect(final.travel).toBe(0);
});

test('compact entrance, resize and direct pause always settle to usable controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await reachControls(page);
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'entering');
  await sample(page, 380);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'settled');
  const bounds = await controls(page).evaluate((e) => {
    const group = e.querySelector('[data-playback-group]')!.getBoundingClientRect();
    return { left: group.left, right: group.right, width: document.documentElement.clientWidth };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width);

  await page.goto('/');
  await reachControls(page);
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'entering');
  await page.locator('[data-rotation]').focus();
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'settled');
  await page.locator('[data-rotation]').press('Space');
  await expect(page.locator('[data-rotation]')).toHaveAccessibleName('Play slideshow');
  await page.getByRole('button', { name: 'Show Music within reach' }).click();
  await expect(page.locator('[data-gallery-dot][aria-current]')).toHaveAttribute(
    'data-gallery-dot',
    '1',
  );
  await expect(gallery(page)).toHaveAttribute('data-playing', 'false');
});

test('reduced motion skips the entrance and a live change safely ends it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'settled');
  await reachControls(page);
  expect(await controls(page).evaluate((e) => e.getAnimations({ subtree: true }).length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await reachControls(page);
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'entering');
  await sample(page, 380);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(gallery(page)).toHaveAttribute('data-controls-intro', 'settled');
  const final = await sample(page, 0);
  expect(final.width).toBeCloseTo(final.targetWidth, 1);
  expect(final.buttonOpacity).toBe(1);
  expect(final.dotOpacity).toBe(1);
});

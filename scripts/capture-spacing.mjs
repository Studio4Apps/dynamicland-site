// Local production visual QA for homepage chapter spacing. Outputs stay in ignored artifacts/.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const label = process.argv[2] || 'current';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const directory = 'artifacts/spacing';
const viewports = [
  { name: 'mobile-320', width: 320, height: 844 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'intermediate-600', width: 600, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'short-landscape', width: 844, height: 390 },
  { name: 'ultrawide', width: 2560, height: 1080 },
];

await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#features [data-rotation]').waitFor({ state: 'visible' });

  const measurement = await page.evaluate(() => {
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return {
        top: value.top + scrollY,
        right: value.right,
        bottom: value.bottom + scrollY,
        left: value.left,
        width: value.width,
        height: value.height,
      };
    };
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        bounds.width > 0 &&
        bounds.height > 0
      );
    };
    const visualRange = (section) => {
      const elements = Array.from(
        section.querySelectorAll(
          'h1,h2,h3,p,a,button,summary,[data-media-slot],[data-gallery-card],article,.eyebrow',
        ),
      ).filter(isVisible);
      return {
        top: Math.min(...elements.map((element) => rect(element).top)),
        bottom: Math.max(...elements.map((element) => rect(element).bottom)),
      };
    };

    const sections = Array.from(document.querySelectorAll('main > section'));
    const boundaries = sections.slice(0, -1).map((section, index) => {
      const next = sections[index + 1];
      const currentVisual = visualRange(section);
      const nextVisual = visualRange(next);
      return {
        from: section.id || section.getAttribute('aria-labelledby') || `section-${index + 1}`,
        to: next.id || next.getAttribute('aria-labelledby') || `section-${index + 2}`,
        visibleGap: nextVisual.top - currentVisual.bottom,
        fromBottomPadding: rect(section).bottom - currentVisual.bottom,
        toTopPadding: nextVisual.top - rect(next).top,
      };
    });

    const rotation = document.querySelector('#features [data-rotation]');
    const controls = rotation?.closest('.container');
    const homeCandidates = Array.from(
      document.querySelectorAll('#home [data-media-slot], #home .eyebrow, #home h2'),
    ).filter(isVisible);
    if (!controls || !homeCandidates.length) throw new Error('Could not resolve chapter boundary');
    const controlsRect = rect(controls);
    const homeTop = Math.min(...homeCandidates.map((element) => rect(element).top));
    const features = document.querySelector('#features');
    const home = document.querySelector('#home');

    return {
      highlightsToHome: {
        controlsTop: controlsRect.top,
        controlsBottom: controlsRect.bottom,
        homeFirstVisibleTop: homeTop,
        visibleGap: homeTop - controlsRect.bottom,
        featuresBottomContribution: rect(features).bottom - controlsRect.bottom,
        homeTopContribution: homeTop - rect(home).top,
      },
      boundaries,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
    };
  });

  await page.evaluate(
    (top) => scrollTo({ top, behavior: 'auto' }),
    Math.max(0, measurement.highlightsToHome.controlsTop - 150),
  );
  await page.screenshot({ path: `${directory}/${label}-${viewport.name}.png` });
  results.push({ viewport, ...measurement, errors });
  await context.close();
}

await browser.close();
await writeFile(`${directory}/${label}-measurements.json`, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.map(({ viewport, highlightsToHome, horizontalOverflow, errors }) => ({
      viewport: viewport.name,
      gap: highlightsToHome.visibleGap,
      featuresContribution: highlightsToHome.featuresBottomContribution,
      homeContribution: highlightsToHome.homeTopContribution,
      horizontalOverflow,
      errors,
    })),
    null,
    2,
  ),
);

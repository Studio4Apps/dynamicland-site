// Local production QA for whole-homepage vertical rhythm. Outputs stay in ignored artifacts/.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const label = process.argv[2] || 'current';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const directory = 'artifacts/rhythm';
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
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
  await page.evaluate(() => document.fonts.ready);

  const measurement = await page.evaluate(() => {
    const absoluteRect = (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top + scrollY,
        bottom: bounds.bottom + scrollY,
        height: bounds.height,
      };
    };
    const visible = (element) => {
      if (element.closest('details:not([open])') && element.tagName !== 'SUMMARY') return false;
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        bounds.width > 0 &&
        bounds.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    };
    const contentElements = (section) =>
      Array.from(
        section.querySelectorAll(
          [
            'h1',
            'h2',
            'h3',
            'p',
            'a',
            'button',
            'summary',
            'img',
            'article',
            '.eyebrow',
            '[data-media-slot]',
            '[data-gallery-card]',
            '[data-hero-artwork]',
            '[class*="faqList"]',
            '[class*="compatibility"]',
            '[class*="priceGrid"]',
            '[class*="closingInner"]',
          ].join(','),
        ),
      ).filter(visible);
    const visualRange = (section) => {
      const elements = contentElements(section);
      return {
        top: Math.min(...elements.map((element) => absoluteRect(element).top)),
        bottom: Math.max(...elements.map((element) => absoluteRect(element).bottom)),
      };
    };
    const sectionName = (section, index) => {
      const labelledBy = section.getAttribute('aria-labelledby');
      const heading = labelledBy
        ? document.getElementById(labelledBy)
        : section.querySelector('h2');
      return {
        key: section.id || labelledBy || `section-${index + 1}`,
        title: heading?.textContent?.replace(/\s+/g, ' ').trim() || `Section ${index + 1}`,
      };
    };

    const sections = Array.from(document.querySelectorAll('main > section'));
    const sectionData = sections.map((section, index) => {
      const bounds = absoluteRect(section);
      const visual = visualRange(section);
      const style = getComputedStyle(section);
      return {
        ...sectionName(section, index),
        sectionTop: bounds.top,
        sectionBottom: bounds.bottom,
        visualTop: visual.top,
        visualBottom: visual.bottom,
        paddingTop: parseFloat(style.paddingTop),
        paddingBottom: parseFloat(style.paddingBottom),
        backgroundColor: style.backgroundColor,
      };
    });
    const boundaries = sectionData.slice(0, -1).map((section, index) => {
      const next = sectionData[index + 1];
      return {
        index: index + 1,
        from: section.key,
        fromTitle: section.title,
        to: next.key,
        toTitle: next.title,
        visibleGap: next.visualTop - section.visualBottom,
        fromEndInset: section.sectionBottom - section.visualBottom,
        toStartInset: next.visualTop - next.sectionTop,
        boundaryY: section.sectionBottom,
        previousVisualBottom: section.visualBottom,
        nextVisualTop: next.visualTop,
        fromBackground: section.backgroundColor,
        toBackground: next.backgroundColor,
      };
    });
    return {
      sections: sectionData,
      boundaries,
      pageHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
    };
  });

  await page.screenshot({
    path: `${directory}/${label}-${viewport.name}-full.png`,
    fullPage: true,
  });
  for (const boundary of measurement.boundaries) {
    await page.evaluate(
      ({ bottom, height }) =>
        scrollTo({ top: Math.max(0, bottom - height * 0.35), behavior: 'auto' }),
      { bottom: boundary.previousVisualBottom, height: viewport.height },
    );
    const fileName = `${String(boundary.index).padStart(2, '0')}-${boundary.from}-${boundary.to}`;
    await page.screenshot({ path: `${directory}/${label}-${viewport.name}-${fileName}.png` });
  }

  results.push({ viewport, ...measurement, errors });
  await context.close();
}

await browser.close();
await writeFile(`${directory}/${label}-measurements.json`, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.map(({ viewport, boundaries, pageHeight, horizontalOverflow, errors }) => ({
      viewport: viewport.name,
      pageHeight,
      horizontalOverflow,
      errors,
      boundaries: boundaries.map(({ from, to, visibleGap, fromEndInset, toStartInset }) => ({
        from,
        to,
        visibleGap,
        fromEndInset,
        toStartInset,
      })),
    })),
    null,
    2,
  ),
);

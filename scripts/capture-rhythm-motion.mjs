// Local normal/reduced-motion scrolling QA. Outputs stay in ignored artifacts/.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const directory = 'artifacts/rhythm';
const recordingDirectory = `${directory}/recordings`;
await mkdir(recordingDirectory, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'no-preference',
  recordVideo: { dir: recordingDirectory, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const scrollProfile = await page.evaluate(
  ({ forwardDuration, reverseDuration }) =>
    new Promise((resolve) => {
      const samples = [];
      const maximum = document.documentElement.scrollHeight - innerHeight;
      const record = (phase, progress) => {
        const active = Array.from(document.querySelectorAll('[data-reveal]'))
          .map((element) => {
            const animations = element
              .getAnimations()
              .filter((animation) => animation.playState === 'running');
            if (!animations.length) return null;
            const style = getComputedStyle(element);
            const matrix = style.transform === 'none' ? null : new DOMMatrix(style.transform);
            return {
              reveal: element.getAttribute('data-reveal'),
              translateY: matrix?.m42 || 0,
              opacity: Number(style.opacity),
              filter: style.filter,
            };
          })
          .filter(Boolean);
        samples.push({ phase, progress, scrollY, active });
      };
      const animate = (phase, from, to, duration, done) => {
        const start = performance.now();
        let previousSample = -Infinity;
        const frame = (now) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = progress * progress * (3 - 2 * progress);
          scrollTo(0, from + (to - from) * eased);
          if (now - previousSample >= 100 || progress === 1) {
            previousSample = now;
            record(phase, progress);
          }
          if (progress < 1) requestAnimationFrame(frame);
          else done();
        };
        requestAnimationFrame(frame);
      };
      animate('forward', 0, maximum, forwardDuration, () => {
        setTimeout(
          () =>
            animate('reverse', maximum, 0, reverseDuration, () => resolve({ maximum, samples })),
          400,
        );
      });
    }),
  { forwardDuration: 12000, reverseDuration: 1200 },
);
await page.waitForTimeout(1000);
const normalSettled = await page.evaluate(() => ({
  scrollY,
  runningRevealAnimations: Array.from(document.querySelectorAll('[data-reveal]')).reduce(
    (count, element) =>
      count +
      element.getAnimations().filter((animation) => animation.playState === 'running').length,
    0,
  ),
  horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
}));
const video = page.video();
await context.close();
await video.saveAs(`${recordingDirectory}/homepage-rhythm-scroll.webm`);

const reducedContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const reducedPage = await reducedContext.newPage();
const reducedErrors = [];
reducedPage.on('pageerror', (error) => reducedErrors.push(error.message));
reducedPage.on('console', (message) => {
  if (message.type() === 'error') reducedErrors.push(message.text());
});
await reducedPage.goto(base, { waitUntil: 'networkidle' });
await reducedPage.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
await reducedPage.evaluate(() => scrollTo(0, 0));
await reducedPage.locator('#home').evaluate((element) => element.scrollIntoView());
const reducedState = await reducedPage.evaluate(() => ({
  homeAnchorTop: document.querySelector('#home').getBoundingClientRect().top,
  runningRevealAnimations: Array.from(document.querySelectorAll('[data-reveal]')).reduce(
    (count, element) =>
      count +
      element.getAnimations().filter((animation) => animation.playState === 'running').length,
    0,
  ),
  horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
}));
await reducedContext.close();
await browser.close();

const activeSamples = scrollProfile.samples.flatMap((sample) => sample.active);
const report = {
  condition: 'Local production Chromium; 1440x900 normal-motion continuous scroll and reverse',
  maximumScroll: scrollProfile.maximum,
  samples: scrollProfile.samples.length,
  samplesWithRevealMotion: scrollProfile.samples.filter((sample) => sample.active.length).length,
  maximumRevealTranslateY: Math.max(0, ...activeSamples.map((sample) => sample.translateY)),
  minimumRevealOpacity: Math.min(1, ...activeSamples.map((sample) => sample.opacity)),
  normalSettled,
  normalErrors: errors,
  reducedState,
  reducedErrors,
};
await writeFile(`${directory}/motion-scroll-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (
  errors.length ||
  reducedErrors.length ||
  normalSettled.runningRevealAnimations ||
  reducedState.runningRevealAnimations ||
  normalSettled.horizontalOverflow > 0 ||
  reducedState.horizontalOverflow > 0 ||
  reducedState.homeAnchorTop < 87 ||
  reducedState.homeAnchorTop > 90
)
  process.exitCode = 1;

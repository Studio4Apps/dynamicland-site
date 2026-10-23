// Renders the voyage and island stills (scripts/scenes/stills.ts) to pictures.
// Each frame is drawn at twice its size in headless Chromium, then reduced and
// encoded as WebP. Raw PNGs stay in ignored artifacts/scenes for inspection.
//
//   node scripts/render-scenes.mjs            # all
//   node scripts/render-scenes.mjs voyage     # only frames whose name matches
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Both come with the toolchain already installed (tsx and next), so borrow
// them rather than adding dependencies for a one-off render.
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx'))('esbuild');
const sharp = createRequire(require.resolve('next'))('sharp');

const frames = [
  { name: 'pro-voyage', kind: 'voyage', layout: 'portrait', width: 1086, height: 1448 },
  { name: 'invite-island-1600', kind: 'island', layout: 'wide', width: 1600, height: 900 },
  { name: 'invite-island-840', kind: 'island', layout: 'portrait', width: 840, height: 1120 },
].filter((frame) => !process.argv[2] || frame.name.includes(process.argv[2]));

const bundle = await build({
  entryPoints: ['scripts/scenes/stills.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'scenes',
  write: false,
  minify: true,
});
const code = bundle.outputFiles[0].text;

await mkdir('artifacts/scenes', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage();
page.on('console', (message) => console.log(`[page] ${message.text()}`));
page.on('pageerror', (error) => console.error(`[page] ${error.message}`));
await page.setContent('<!doctype html><body style="margin:0;background:#000"></body>');
await page.addScriptTag({ content: code });

for (const frame of frames) {
  const scale = 2;
  const started = Date.now();
  const data = await page.evaluate(
    async ({ kind, layout, width, height }) => {
      document.body.replaceChildren();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      document.body.append(canvas);
      await window.scenes.renderStill(canvas, { kind, layout, width, height });
      return canvas.toDataURL('image/png');
    },
    { ...frame, width: frame.width * scale, height: frame.height * scale },
  );
  const png = Buffer.from(data.split(',')[1], 'base64');
  await writeFile(`artifacts/scenes/${frame.name}.png`, png);
  const info = await sharp(png)
    .resize(frame.width, frame.height, { kernel: 'lanczos3' })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(`public/media/${frame.name}.webp`);
  console.log(
    `${frame.name}: ${info.width}×${info.height}, ${(info.size / 1024).toFixed(1)}KB in ${Date.now() - started}ms`,
  );
}
await browser.close();

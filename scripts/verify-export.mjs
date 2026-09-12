import assert from 'node:assert/strict';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { contentPolicy } from './security.mjs';

const origin = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://dynamicland-official.paul-vento2.chatgpt.site'
).replace(/\/$/, '');
const routes = ['/', '/support/', '/privacy/', '/terms/'];
const pages = new Map();
for (const route of routes) {
  const html = await readFile(join('out', route, 'index.html'), 'utf8');
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${route}: one h1`);
  assert.match(html, /<main id="main"/);
  assert.match(html, /<link rel="canonical" href="https:\/\//);
  assert(html.includes(`rel="canonical" href="${origin}${route}"`), `${route}: canonical origin`);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="description"/);
  const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
  assert.equal(policy, contentPolicy(html).replace(/; frame-ancestors 'none'/, ''));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: unique IDs`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(match[1]);
  }
  pages.set(route, html);
}
for (const [route, html] of pages) {
  for (const [, href] of html.matchAll(/<(?:a|link|script)\b[^>]*\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(href.replaceAll('&amp;', '&'), origin + route);
    if (url.origin !== origin) continue;
    if (pages.has(url.pathname)) {
      if (url.hash) assert(pages.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), href);
    } else {
      assert((await stat(join('out', decodeURIComponent(url.pathname)))).isFile(), href);
    }
  }
}
const home = pages.get('/');
const js = [...new Set([...home.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]))];
const css = [...new Set([...home.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]))];
async function measure(paths) {
  const files = await Promise.all(paths.map((p) => readFile(join('out', p))));
  return {
    raw: files.reduce((s, f) => s + f.length, 0),
    gzip: files.reduce((s, f) => s + gzipSync(f).length, 0),
  };
}
const jsSize = await measure(js),
  cssSize = await measure(css);
const fontPath = home.match(/href="([^"]+\.woff2)"/)?.[1];
const measurements = {
  homepage_html_bytes: Buffer.byteLength(home),
  homepage_gzip_bytes: gzipSync(home).length,
  initial_js_raw: jsSize.raw,
  initial_js_gzip: jsSize.gzip,
  initial_css_raw: cssSize.raw,
  initial_css_gzip: cssSize.gzip,
  js_files: js.length,
  css_files: css.length,
  font_bytes: fontPath ? (await stat(join('out', fontPath))).size : 0,
};
await writeFile('docs/bundle-measurements.json', JSON.stringify(measurements, null, 2) + '\n');
console.log(
  'Four routes: semantic structure, internal links, assets, JSON-LD, and exact CSP hashes passed.',
);
console.log(JSON.stringify(measurements, null, 2));

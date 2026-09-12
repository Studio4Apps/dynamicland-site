import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { contentPolicy, baselineHeaders } from './security.mjs';
const root = join(process.cwd(), 'out');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const lists = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return lists.flat();
}
const files = await walk(root);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
let headers =
  '/*\n' +
  Object.entries(baselineHeaders)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n') +
  '\n';
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const csp = contentPolicy(html);
  const metaCsp = csp.replace(/; frame-ancestors 'none'/, '');
  html = html.replace(
    '<head>',
    `<head><meta http-equiv="Content-Security-Policy" content="${metaCsp}">`,
  );
  await writeFile(file, html);
  const path = '/' + relative(root, file);
  const route = path.replace(/index\.html$/, '');
  headers += `\n${route}\n  Content-Security-Policy: ${csp}\n`;
  if (route !== '/' && route.endsWith('/'))
    headers += `\n${route.slice(0, -1)}\n  Content-Security-Policy: ${csp}\n`;
}
headers += '\n/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable\n';
await writeFile(join(root, '_headers'), headers);
console.log(`Added hash-based CSP to ${htmlFiles.length} pages and wrote static hosting headers.`);

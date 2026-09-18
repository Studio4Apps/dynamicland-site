// Local-only production preview. Not part of the deployed static output.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { baselineHeaders, contentPolicy } from './security.mjs';
const root = resolve('out');
const port = Number(process.env.PORT || 3001);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.json': 'application/json',
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__qa/axe.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end(await readFile('node_modules/axe-core/axe.min.js'));
      return;
    }
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    } catch {
      file = resolve(root, '404.html');
      res.statusCode = 404;
    }
    let body = await readFile(file);
    for (const [k, v] of Object.entries(baselineHeaders)) res.setHeader(k, v);
    if (extname(file) === '.css' && url.searchParams.get('qa-motion') === 'reduce') {
      body = Buffer.from(
        body
          .toString()
          .replaceAll('(prefers-reduced-motion:reduce)', '(min-width:0px)')
          .replaceAll('(prefers-reduced-motion: reduce)', '(min-width:0px)')
          .replaceAll('(prefers-reduced-motion:no-preference)', '(max-width:0px)')
          .replaceAll('(prefers-reduced-motion: no-preference)', '(max-width:0px)'),
      );
    }
    if (extname(file) === '.html') {
      // This server binds HTTP loopback only; production keeps HTTPS upgrading.
      let html = body.toString().replaceAll('; upgrade-insecure-requests', '');
      if (url.searchParams.get('motion') === 'reduce') {
        html = html.replaceAll(
          /\/_next\/static\/chunks\/[a-zA-Z0-9_.-]+\.css/g,
          '$&?qa-motion=reduce',
        );
        html = html.replace(
          '<head>',
          `<head><script>const nativeMatchMedia=window.matchMedia.bind(window);window.matchMedia=(query)=>query.includes('prefers-reduced-motion')?{matches:query.includes('reduce')&&!query.includes('no-preference'),media:query,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},dispatchEvent(){return true},onchange:null}:nativeMatchMedia(query);document.documentElement.dataset.auditReduced='true';</script>`,
        );
      }
      if (url.searchParams.has('audit')) {
        const script = await readFile('scripts/audit-browser.js', 'utf8');
        html = html.replace(
          '</body>',
          `${url.searchParams.get('audit') === 'a11y' ? '<script src="/__qa/axe.js"></script>' : ''}<script>${script}</script></body>`,
        );
        html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
      }
      body = Buffer.from(html);
      res.setHeader(
        'Content-Security-Policy',
        contentPolicy(html).replace('; upgrade-insecure-requests', ''),
      );
    }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('Preview error');
  }
}).listen(port, '127.0.0.1', () => console.log(`Production preview: http://127.0.0.1:${port}`));

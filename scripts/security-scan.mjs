import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
const walk = async (dir) => {
  try {
    return (
      await Promise.all(
        (await readdir(dir, { withFileTypes: true })).map((e) =>
          e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
        ),
      )
    ).flat();
  } catch {
    return [];
  }
};
const findings = [];
const source = await walk('src');
for (const path of source.filter((p) => /\.(tsx?|css)$/.test(p))) {
  const code = await readFile(path, 'utf8');
  if (/\beval\s*\(|new\s+Function\s*\(|javascript\s*:/i.test(code))
    findings.push(`${path}: unsafe authored execution pattern`);
  if (code.includes('dangerouslySetInnerHTML') && !path.endsWith('app/page.tsx'))
    findings.push(`${path}: unexpected raw HTML sink`);
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{32,}/.test(
      code,
    )
  )
    findings.push(`${path}: possible sensitive token (value suppressed)`);
}
for (const path of [...(await walk('public')), ...(await walk('.next/static'))]) {
  if (/\.(zip|swift|pem|key|storekit|map|md)$|\.env|reference-analysis|appstore-lookup/i.test(path))
    findings.push(`${path}: prohibited public artifact`);
  if (/\.(js|css|html|txt|json|svg)$/.test(path)) {
    const text = await readFile(path, 'utf8');
    if (/\/Users\/amro|\/Desktop\/TMLab|-----BEGIN .*PRIVATE KEY-----/.test(text))
      findings.push(`${path}: private local reference in served output`);
    if (
      path.endsWith('.svg') &&
      /<script|onload\s*=|<foreignObject|xlink:href\s*=\s*['"]https?:/i.test(text)
    )
      findings.push(`${path}: executable or remote SVG content`);
  }
}
console.log(
  `Scanned ${source.length} authored files and public/browser build outputs. ${findings.length} finding(s).`,
);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
}

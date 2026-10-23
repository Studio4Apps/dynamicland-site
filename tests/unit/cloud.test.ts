import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  planUpload,
  sanitizeName,
  uniqueName,
  isExecutable,
  expiryLabels,
  quickViewKind,
} from '../../src/lib/cloud/files';
import { formatBytes, plan, storageLevel } from '../../src/lib/cloud/limits';
import { cloudDemoEnabled, isCloudPath } from '../../src/lib/cloud/policy';
import { liveItems } from '../../src/lib/cloud/library';
import { demoLibrary } from '../../src/lib/cloud/demo';

const char = (code: number) => String.fromCharCode(code);

test('file names lose hidden, spoofing and path characters', () => {
  assert.deepEqual(sanitizeName(`invoice${char(0x202e)}fdp.exe`), {
    ok: true,
    name: 'invoicefdp.exe',
  });
  assert.deepEqual(sanitizeName(`a${char(0)}b${char(0x200b)}c`), { ok: true, name: 'abc' });
  assert.deepEqual(sanitizeName('../../etc/passwd'), { ok: true, name: '..-..-etc-passwd' });
  for (const bad of ['', '   ', '..', 'CON', 'lpt1.txt', 'x'.repeat(256)])
    assert.equal(sanitizeName(bad).ok, false);
});
test('name clashes resolve the way Finder does', () => {
  assert.equal(uniqueName('Report.pdf', ['report.pdf', 'Report 2.pdf']), 'Report 3.pdf');
  assert.equal(uniqueName('Notes', ['Other']), 'Notes');
});
test('uploads respect quota, per-file size and batch limits', () => {
  const plan = planUpload(
    [
      { name: 'a.pdf', size: 10 },
      { name: 'huge.mov', size: 200 },
      { name: 'b.pdf', size: 95 },
      { name: 'a.pdf', size: 1 },
    ],
    { used: 0, quota: 100, maxFileSize: 150, maxFiles: 10, taken: [] },
  );
  assert.deepEqual(
    plan.accepted.map((a) => a.name),
    ['a.pdf', 'a 2.pdf'],
  );
  assert.deepEqual(
    plan.rejected.map((r) => r.name),
    ['huge.mov', 'b.pdf'],
  );
});
test('sharing accepts only well-formed addresses and blocks public executables', () => {
  assert.equal(normalizeEmail(' Lina@Example.com '), 'lina@example.com');
  for (const bad of ['lina', 'a@b', 'a b@c.com', '<script>@x.com', `${'a'.repeat(250)}@x.com`])
    assert.equal(normalizeEmail(bad), null);
  for (const name of ['setup.exe', 'run.sh', 'page.html', 'icon.svg'])
    assert.equal(isExecutable(name), true);
  assert.equal(isExecutable('photo.jpg'), false);
});
test('storage thresholds and units', () => {
  assert.equal(plan.quota, 5_000_000_000);
  assert.equal(storageLevel(4_000_000_000, plan.quota), 'warning');
  assert.equal(storageLevel(4_800_000_000, plan.quota), 'critical');
  assert.equal(storageLevel(5_000_000_000, plan.quota), 'full');
  assert.equal(formatBytes(301_700_000), '302 MB');
  assert.equal(formatBytes(4_210_000_000), '4.2 GB');
});
test('CloudLand sample data never reaches preview or production builds', () => {
  assert.equal(cloudDemoEnabled({}), true);
  assert.equal(cloudDemoEnabled({ CLOUDLAND_DEMO: 'false' }), false);
  assert.equal(cloudDemoEnabled({ SITE_ENV: 'preview' }), false);
  assert.equal(isCloudPath('/cloud'), true);
  assert.equal(isCloudPath('/cloud/sign-in'), true);
  assert.equal(isCloudPath('/cloudy'), false);
});
test('share links are view-only and always expire within 14 days', () => {
  assert.deepEqual(Object.keys(expiryLabels), ['1d', '7d', '14d']);
  const { items } = demoLibrary('2026-10-21T12:00:00.000Z');
  for (const item of items) assert.ok(item.share.expiry in expiryLabels);
});
test('the sample library fits the plan', () => {
  const { items } = demoLibrary('2026-10-21T12:00:00.000Z');
  for (const item of items) assert.ok(item.size <= plan.maxFileSize, item.name);
  assert.equal(
    storageLevel(
      items.reduce((sum, item) => sum + item.size, 0),
      plan.quota,
    ),
    'warning',
  );
});
test('Quick View shows only what the browser renders itself', () => {
  assert.equal(quickViewKind('Report.PDF'), 'pdf');
  assert.equal(quickViewKind('Cabin.jpg'), 'image');
  assert.equal(quickViewKind('Lake.mov'), 'video');
  assert.equal(quickViewKind('Notes.md'), 'text');
  // Markup is read as text, never rendered.
  assert.equal(quickViewKind('page.html'), 'text');
  for (const name of ['Budget.numbers', 'Deck.pptx', 'Contract.docx', 'backup.zip'])
    assert.equal(quickViewKind(name), null);
});
test('items inside a deleted folder are hidden from live views', () => {
  const { items } = demoLibrary('2026-10-21T12:00:00.000Z');
  const documents = items.find((item) => item.name === 'Documents')!;
  const trashed = items.map((item) =>
    item.id === documents.id ? { ...item, deletedAt: '2026-10-21T12:00:00.000Z' } : item,
  );
  assert.equal(
    liveItems(trashed).some((item) => item.parentId === documents.id),
    false,
  );
});

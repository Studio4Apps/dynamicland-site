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
import { clipLand, formatBytes, plan, storageLevel } from '../../src/lib/cloud/limits';
import { cloudDemoEnabled, isCloudPath } from '../../src/lib/cloud/policy';
import { liveItems } from '../../src/lib/cloud/library';
import { demoClips, demoLibrary } from '../../src/lib/cloud/demo';
import {
  clipAge,
  clipDetail,
  clipTone,
  keepRecent,
  visibleClips,
  webLink,
  type Clip,
} from '../../src/lib/cloud/clips';

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

const nowIso = '2026-10-24T12:00:00.000Z';
test('ClipLand keeps the most recent clips and every pinned one', () => {
  const clips = demoClips(nowIso);
  const kept = keepRecent(clips, 5);
  assert.equal(kept.filter((clip) => !clip.pinned).length, 5);
  assert.equal(kept.filter((clip) => clip.pinned).length, 2);
  // Newest first, and the trimmed ones are the oldest unpinned clips.
  assert.deepEqual(
    kept.map((clip) => clip.copiedAt),
    [...kept.map((clip) => clip.copiedAt)].sort().reverse(),
  );
  assert.equal(
    kept.some((clip) => clip.text === 'node scripts/render-scenes.mjs'),
    false,
  );
  assert.ok(Math.max(...clipLand.keepChoices) === clipLand.defaultKeep);
});
test('ClipLand filters and search match the Mac shelf', () => {
  const clips = demoClips(nowIso);
  assert.equal(visibleClips(clips, 'links', '').length, 2);
  assert.equal(visibleClips(clips, 'pinned', '').length, 2);
  assert.ok(visibleClips(clips, 'all', 'XCODE').every((clip) => clip.source?.name === 'Xcode'));
  assert.equal(visibleClips(clips, 'colors', 'cabin').length, 0);
});
test('clip headers stay readable and only web links open', () => {
  const clip = (color: string): Clip => ({
    id: 'c',
    kind: 'text',
    text: 'hi',
    pinned: false,
    copiedAt: nowIso,
    source: { name: 'App', bundleId: 'a', color },
  });
  // White is dimmed like on the Mac and gets dark text; a deep blue keeps white text.
  assert.deepEqual(clipTone(clip('#ffffff')), { color: '#b8b8b8', ink: 'dark' });
  assert.deepEqual(clipTone(clip('#1e7cf2')), { color: '#1e7cf2', ink: 'light' });
  // A malformed colour falls back to the kind's own.
  assert.equal(clipTone(clip('url(https://x)')).color, '#2e85f5');
  assert.equal(webLink('javascript:alert(1)'), null);
  assert.equal(webLink('file:///etc/passwd'), null);
  assert.equal(webLink('https://example.com/a')?.hostname, 'example.com');
  assert.equal(clipAge('2026-10-24T11:59:30.000Z', Date.parse(nowIso)), 'now');
  assert.equal(clipAge('2026-10-24T11:00:00.000Z', Date.parse(nowIso)), '1 hour ago');
  assert.equal(
    clipDetail({ ...clip('#000000'), kind: 'color', text: '#7811DE' }),
    'RGB 120 17 222',
  );
});

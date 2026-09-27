import test from 'node:test';
import assert from 'node:assert/strict';
import { getSiteConfig, httpsUrl } from '../../src/lib/config';
import { serializeJsonLd } from '../../src/lib/serialize';
import { validateMedia, approvedMediaPath } from '../../src/lib/media-validation';
import { media } from '../../src/content/media';
import { product } from '../../src/content/product';

test('closing-script and Unicode separators cannot break JSON-LD script context', () => {
  const payload = { name: '</script><script>alert("x")</script>', note: '\u2028\u2029' };
  const serialized = serializeJsonLd(payload);
  assert.equal(serialized.includes('<'), false);
  assert.equal(serialized.includes('\u2028'), false);
  assert.deepEqual(JSON.parse(serialized), payload);
});
test('public configuration rejects dangerous protocols, private origins and invalid deployment states', () => {
  for (const origin of [
    'http://example.com',
    'https://localhost',
    'https://127.0.0.1',
    'https://172.16.0.1',
    'https://[::1]',
    'https://user:pass@example.com',
    'https://example.com/preview',
    'https://example.com/?foo=1',
  ])
    assert.throws(() => getSiteConfig({ SITE_ORIGIN: origin }));
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd'])
    assert.throws(() => httpsUrl(url, 'test'));
  assert.throws(() => getSiteConfig({ SITE_ENV: 'invalid' }));
  assert.throws(() =>
    getSiteConfig({
      SITE_ENV: 'production',
      SITE_ORIGIN: 'https://example.com',
      LEGAL_APPROVED: 'true',
    }),
  );
  const preview = getSiteConfig({ SITE_ENV: 'preview', SITE_ORIGIN: 'https://example.com' });
  assert.equal(preview.origin, 'https://example.com');
  assert.equal(preview.indexable, false);
  assert.equal(getSiteConfig({}).origin, undefined);
});
test('all public product destinations use permitted protocols', () => {
  for (const url of [product.downloadUrl, product.privacyUrl, product.termsUrl])
    assert.ok(httpsUrl(url, 'public URL'));
});
test('approved hero media and empty product slots have valid stage geometry', () => {
  assert.equal(new Set(Object.values(media).map((s) => s.id)).size, Object.keys(media).length);
  for (const slot of Object.values(media)) {
    if (slot.id === 'hero') assert.ok(slot.src);
    else assert.equal(slot.src, null);
    assert.equal(slot.fit, 'contain');
    assert.doesNotThrow(() => validateMedia(slot));
  }
});
test('future local media validates dimensions, actual alt and responsive source safety', () => {
  const fixture = {
    ...media.home,
    src: '/media/test-image.png',
    width: 800,
    height: 600,
    alt: 'Synthetic test fixture',
    responsive: [
      { srcSet: '/media/test-image.png 800w, /media/test-image-large.webp 1600w', sizes: '100vw' },
    ],
  };
  assert.doesNotThrow(() => validateMedia(fixture));
  assert.doesNotThrow(() =>
    validateMedia({
      ...fixture,
      type: 'video',
      src: '/media/test-video.mp4',
      poster: '/media/test-image.png',
    }),
  );
  assert.throws(() => validateMedia({ ...fixture, alt: '' }));
  assert.throws(() => validateMedia({ ...fixture, width: 0 }));
  assert.throws(() => validateMedia({ ...fixture, ratio: '0 / 5' }));
  assert.throws(() =>
    validateMedia({
      ...fixture,
      responsive: [{ srcSet: 'https://evil.test/asset.png 1x', sizes: '100vw' }],
    }),
  );
  for (const path of [
    '//evil.test/a.png',
    '/media/../secret.png',
    '/media/%2e%2e/x.png',
    'https://evil.test/image.png',
    '/media/icon.svg',
  ])
    assert.equal(approvedMediaPath(path), false);
});

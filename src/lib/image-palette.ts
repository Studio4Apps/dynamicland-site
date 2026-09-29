type Swatch = { hue: number; saturation: number; lightness: number };
const cache = new Map<string, Swatch[]>();

/** Find prominent chromatic hues, ignoring transparency, black, white and gray. */
export function extractPalette(pixels: ArrayLike<number>): Swatch[] {
  const bins = new Map<number, { weight: number; r: number; g: number; b: number }>();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255,
      g = pixels[i + 1] / 255,
      b = pixels[i + 2] / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      delta = max - min;
    if (pixels[i + 3] < 200 || max < 0.12 || delta / max < 0.28 || min > 0.85) continue;
    const hue =
      ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 +
        360) %
      360;
    const key = Math.floor(hue / 15);
    const weight = (delta / max) * Math.sqrt(max);
    const bin = bins.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    bin.weight += weight;
    bin.r += r * weight;
    bin.g += g * weight;
    bin.b += b * weight;
    bins.set(key, bin);
  }
  const candidates: (Swatch & { weight: number })[] = [];
  const total = [...bins.values()].reduce((sum, bin) => sum + bin.weight, 0);
  for (const bin of bins.values()) {
    if (bin.weight < total * 0.018) continue;
    const r = bin.r / bin.weight,
      g = bin.g / bin.weight,
      b = bin.b / bin.weight;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      delta = max - min;
    const hue =
      ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 +
        360) %
      360;
    const lightness = (max + min) / 2;
    candidates.push({
      hue: Math.round(hue),
      saturation: Math.round((100 * delta) / (1 - Math.abs(2 * lightness - 1))),
      lightness: Math.round(lightness * 100),
      weight: bin.weight,
    });
  }
  const distance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  // Preserve a real multicolor spectrum even when one hue occupies less area.
  const spectrum = [
    [20, 85],
    [160, 205],
    [205, 255],
    [255, 290],
    [290, 345],
  ].map(
    ([start, end]) =>
      candidates
        .filter((s) => s.hue >= start && s.hue < end)
        .sort((a, b) => b.weight - a.weight)[0],
  );
  if (spectrum.every(Boolean))
    return [spectrum[0], spectrum[1], spectrum[4], spectrum[3], spectrum[2]];
  const chosen: Swatch[] = [];
  while (candidates.length && chosen.length < 5) {
    candidates.sort((a, b) => {
      const score = (s: typeof a) =>
        Math.sqrt(s.weight) *
        (chosen.length ? Math.min(...chosen.map((c) => distance(c.hue, s.hue))) : 1);
      return score(b) - score(a);
    });
    const next = candidates.shift()!;
    if (chosen.some((s) => distance(s.hue, next.hue) < 27)) continue;
    chosen.push(next);
  }
  // Arrange the sampled colors into a spectrum rather than arbitrary frequency order.
  chosen.sort((a, b) => a.hue - b.hue);
  if (chosen.length >= 1 && chosen[chosen.length - 1].hue - chosen[0].hue < 85) {
    const hue = (chosen[0].hue + chosen[chosen.length - 1].hue) / 2;
    const saturation = Math.round(chosen.reduce((sum, s) => sum + s.saturation, 0) / chosen.length);
    return [
      { hue: Math.round(hue - 9), saturation, lightness: 30 },
      { hue: Math.round(hue), saturation, lightness: 63 },
      { hue: Math.round(hue + 9), saturation, lightness: 43 },
    ];
  }
  return chosen;
}

/** Uses the already loaded image: one small canvas read, cached by image URL. */
export function applyImagePalette(image: HTMLImageElement, target: HTMLElement, tone?: 'cool') {
  try {
    const key = image.currentSrc || image.src;
    let palette = cache.get(key);
    if (!palette) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = Math.max(1, Math.round((128 * image.naturalHeight) / image.naturalWidth));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      // The central artwork communicates the release identity; surrounding bento
      // tiles contain unrelated product/UI colors. Fall back to the whole image
      // for artwork whose center has no chromatic pixels.
      context.drawImage(
        image,
        image.naturalWidth * 0.23,
        image.naturalHeight * 0.26,
        image.naturalWidth * 0.54,
        image.naturalHeight * 0.47,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      palette = extractPalette(context.getImageData(0, 0, canvas.width, canvas.height).data);
      if (!palette.length) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        palette = extractPalette(context.getImageData(0, 0, canvas.width, canvas.height).data);
      }
      cache.set(key, palette);
    }
    if (!palette.length) return; // Neutral-only artwork keeps the accessible brand fallback.
    // Optional editorial constraint; colors are still sampled from the artwork.
    const colors = tone === 'cool' ? palette.filter((s) => s.hue >= 160 && s.hue <= 325) : palette;
    if (!colors.length) return;
    const text = colors.map(
      (s) =>
        `hsl(${s.hue} ${Math.max(65, s.saturation)}% ${Math.min(66, Math.max(28, s.lightness))}%)`,
    );
    const glass = colors.map(
      (s) => `hsl(${s.hue} ${s.saturation}% ${Math.max(45, s.lightness)}% / .22)`,
    );
    target.style.setProperty('--release-colors', `linear-gradient(90deg, ${text.join(', ')})`);
    target.style.setProperty('--release-glass', `linear-gradient(135deg, ${glass.join(', ')})`);
    target.dataset.palette = 'image';
  } catch {
    // Cross-origin/undecodable images retain the fallback and remain interactive.
  }
}

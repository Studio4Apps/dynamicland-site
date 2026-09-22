import type { MediaSlot } from '@/content/media';
export function approvedMediaPath(value: string) {
  return /^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp|avif|mp4|webm)$/.test(
    value,
  );
}
export function validateMedia(slot: MediaSlot) {
  if (
    !/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(slot.ratio) ||
    slot.ratio.split('/').some((n) => Number(n) <= 0)
  )
    throw new Error('Media stage ratio must be positive width / height');
  if (!slot.src) return;
  if (!approvedMediaPath(slot.src))
    throw new Error('Product media must use an approved local /media/ path');
  if (!slot.alt?.trim()) throw new Error('Real media needs an asset-specific description');
  if (!slot.width || !slot.height || slot.width < 1 || slot.height < 1)
    throw new Error('Real media needs positive intrinsic dimensions');
  if (slot.poster && !approvedMediaPath(slot.poster)) throw new Error('Invalid media poster');
  for (const source of slot.responsive || []) {
    if (
      !source.srcSet.split(',').every((candidate) => {
        const [path, descriptor, extra] = candidate.trim().split(/\s+/);
        return (
          approvedMediaPath(path) &&
          !extra &&
          (!descriptor || /^\d+(?:\.\d+)?[wx]$/.test(descriptor))
        );
      })
    )
      throw new Error('Invalid responsive media source');
  }
}

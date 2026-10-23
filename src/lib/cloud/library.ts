import { retentionDays } from './limits';
import type { CloudItem, FileCategory, Section } from './types';

export type SortKey = 'name' | 'modified' | 'size' | 'kind';
export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

const byId = (items: CloudItem[]) => new Map(items.map((item) => [item.id, item]));

/** An item is live when neither it nor any folder above it is in Recently Deleted. */
export function liveItems(items: CloudItem[]): CloudItem[] {
  const map = byId(items);
  const live = (item: CloudItem): boolean => {
    for (
      let at: CloudItem | undefined = item;
      at;
      at = at.parentId ? map.get(at.parentId) : undefined
    )
      if (at.deletedAt) return false;
    return true;
  };
  return items.filter(live);
}
export function descendants(items: CloudItem[], ids: Iterable<string>): Set<string> {
  const found = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const item of items)
      if (item.parentId && found.has(item.parentId) && !found.has(item.id)) {
        found.add(item.id);
        grew = true;
      }
  }
  return found;
}
export function folderSize(items: CloudItem[], id: string): number {
  const inside = descendants(items, [id]);
  return items.filter((item) => inside.has(item.id)).reduce((sum, item) => sum + item.size, 0);
}
export function pathTo(items: CloudItem[], id: string | null): CloudItem[] {
  const map = byId(items);
  const trail: CloudItem[] = [];
  for (
    let at = id ? map.get(id) : undefined;
    at;
    at = at.parentId ? map.get(at.parentId) : undefined
  )
    trail.unshift(at);
  return trail;
}
export const isShared = (item: CloudItem) => item.share.link;

export function itemsFor(
  items: CloudItem[],
  section: Section,
  folderId: string | null,
  query: string,
): CloudItem[] {
  const live = liveItems(items);
  const q = query.trim().toLocaleLowerCase();
  if (q) return live.filter((item) => item.name.toLocaleLowerCase().includes(q));
  if (folderId) return live.filter((item) => item.parentId === folderId);
  switch (section) {
    case 'recents':
      return live.filter((item) => item.category !== 'folder');
    case 'browse':
      return live.filter((item) => item.parentId === null);
    case 'shared': {
      const shared = new Set(live.filter(isShared).map((item) => item.id));
      // Show the top of each shared tree, not every file inside a shared folder.
      return live.filter(
        (item) => shared.has(item.id) && !(item.parentId && shared.has(item.parentId)),
      );
    }
    case 'starred':
      return live.filter((item) => item.starred);
    case 'deleted':
      return items.filter((item) => item.deletedAt);
  }
}

export function sortItems(items: CloudItem[], sort: Sort, kind: (c: FileCategory) => string) {
  const factor = sort.dir === 'asc' ? 1 : -1;
  const compare: Record<SortKey, (a: CloudItem, b: CloudItem) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    modified: (a, b) => Date.parse(a.modified) - Date.parse(b.modified),
    size: (a, b) => a.size - b.size,
    kind: (a, b) => kind(a.category).localeCompare(kind(b.category)),
  };
  return [...items].sort((a, b) => {
    // Folders stay first in name order, as in Finder.
    if (sort.key === 'name' && (a.category === 'folder') !== (b.category === 'folder'))
      return a.category === 'folder' ? -1 : 1;
    return compare[sort.key](a, b) * factor || compare.name(a, b);
  });
}

export function groupByDate(items: CloudItem[], now: number) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const day = 86_400_000;
  const buckets = [
    { label: 'Today', from: startOfToday.getTime() },
    { label: 'Previous 7 Days', from: startOfToday.getTime() - 7 * day },
    { label: 'Previous 30 Days', from: startOfToday.getTime() - 30 * day },
    { label: 'Earlier', from: -Infinity },
  ];
  return buckets
    .map((bucket, i) => ({
      label: bucket.label,
      items: items.filter((item) => {
        const at = Date.parse(item.modified);
        return at >= bucket.from && (i === 0 || at < buckets[i - 1].from);
      }),
    }))
    .filter((group) => group.items.length);
}

export function daysLeft(deletedAt: string, now: number): number {
  return Math.max(0, retentionDays - Math.floor((now - Date.parse(deletedAt)) / 86_400_000));
}

export function usageByCategory(items: CloudItem[]) {
  const groups = { photos: 0, videos: 0, documents: 0, other: 0 };
  for (const item of items) {
    if (item.category === 'image') groups.photos += item.size;
    else if (item.category === 'video' || item.category === 'audio') groups.videos += item.size;
    else if (['pdf', 'document', 'spreadsheet', 'presentation'].includes(item.category))
      groups.documents += item.size;
    else groups.other += item.size;
  }
  return groups;
}

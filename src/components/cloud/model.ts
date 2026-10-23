import { expiryLabels } from '@/lib/cloud/files';
import type { Sort } from '@/lib/cloud/library';
import type { LinkExpiry, NoticeKind, NoticeTone } from '@/lib/cloud/types';

export interface Preferences {
  theme: 'system' | 'light' | 'dark';
  view: 'grid' | 'list';
  sort: Sort;
  groupByDate: boolean;
  showExtensions: boolean;
  confirmPermanentDelete: boolean;
  hidePreviews: boolean;
  autoLock: 5 | 15 | 30 | 60;
  lockWhenHidden: boolean;
  toasts: Record<NoticeKind, boolean>;
  desktopAlerts: boolean;
  defaultExpiry: LinkExpiry;
}
export const defaultPreferences: Preferences = {
  theme: 'system',
  view: 'grid',
  sort: { key: 'name', dir: 'asc' },
  groupByDate: true,
  showExtensions: true,
  confirmPermanentDelete: true,
  hidePreviews: false,
  autoLock: 15,
  lockWhenHidden: false,
  toasts: { upload: true, share: true, storage: true, security: true, system: true },
  desktopAlerts: false,
  defaultExpiry: '7d',
};

const key = 'cloudland:preferences';
/** Only display preferences are kept in the browser — never file names, people or tokens. */
export function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}') as Partial<Preferences>;
    return {
      ...defaultPreferences,
      ...saved,
      // Expiry choices change over time; a saved one that's no longer offered falls back.
      defaultExpiry:
        saved.defaultExpiry && saved.defaultExpiry in expiryLabels
          ? saved.defaultExpiry
          : defaultPreferences.defaultExpiry,
      toasts: { ...defaultPreferences.toasts, ...saved.toasts },
    };
  } catch {
    return defaultPreferences;
  }
}
export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch {
    // Private windows may refuse storage; preferences then last for the tab only.
  }
}

export interface Toast {
  id: string;
  tone: NoticeTone;
  title: string;
  body?: string;
  action?: { label: string; run: () => void };
}
export interface Upload {
  id: string;
  name: string;
  size: number;
  sent: number;
  status: 'queued' | 'uploading' | 'done' | 'canceled';
}
export interface Activity {
  id: string;
  at: string;
  text: string;
}
export interface Session {
  id: string;
  device: string;
  detail: string;
  current?: boolean;
  phone?: boolean;
}

/**
 * A random UUID v4. `crypto.randomUUID` exists only on HTTPS or localhost, so opening a dev build
 * by its network address would break uploads; `getRandomValues` works everywhere.
 */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/** 144 random bits, URL-safe. The storage service will issue the real link token. */
export function linkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

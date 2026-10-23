const GB = 1_000_000_000;

/**
 * CloudLand's only plan, bought in the DynamicLand Mac app (monthly or yearly) and not upgradable.
 * Enforced again by the storage service; the browser copy only guides the UI.
 */
export const plan = {
  name: 'DynamicLand Pro',
  quota: 5 * GB,
  maxFileSize: 1 * GB,
  /** A share link stops working after this many downloads; the owner can make a new one. */
  maxLinkDownloads: 25,
} as const;
export type Plan = typeof plan;

export const storageThresholds = { warning: 0.8, critical: 0.95 } as const;
/** Days an item stays in Recently Deleted before it is removed for good. */
export const retentionDays = 7;
export const maxBatchFiles = 50;
/** Most recent entries kept in the activity log and in Notifications. */
export const activityLimit = 50;
export const noticeLimit = 50;
export const autoLockChoices = [5, 15, 30, 60] as const;

export function storageLevel(used: number, quota: number): 'ok' | 'warning' | 'critical' | 'full' {
  const ratio = quota > 0 ? used / quota : 1;
  if (ratio >= 1) return 'full';
  if (ratio >= storageThresholds.critical) return 'critical';
  if (ratio >= storageThresholds.warning) return 'warning';
  return 'ok';
}

/** Decimal units, matching how Apple reports storage. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Zero KB';
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  if (i === 0) return `${bytes} bytes`;
  const value = bytes / 1000 ** i;
  return `${value >= 100 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')} ${units[i]}`;
}

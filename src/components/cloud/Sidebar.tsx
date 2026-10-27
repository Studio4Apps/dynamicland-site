'use client';
import { useState } from 'react';
import { formatBytes } from '@/lib/cloud/limits';
import { liveItems } from '@/lib/cloud/library';
import type { CloudItem, Section } from '@/lib/cloud/types';
import { Icon, type IconName } from './Icons';
import styles from './Cloud.module.css';

const sections: { id: Section; label: string; icon: IconName }[] = [
  { id: 'recents', label: 'Recents', icon: 'clock' },
  { id: 'browse', label: 'Browse', icon: 'folder' },
  { id: 'shared', label: 'Shared', icon: 'people' },
  { id: 'starred', label: 'Starred', icon: 'star' },
  { id: 'deleted', label: 'Recently Deleted', icon: 'trash' },
];

export function Sidebar({
  open,
  onClose,
  section,
  onNavigate,
  items,
  onOpenFolder,
  used,
  quota,
  level,
  onStorage,
  onDropFiles,
  clipCount,
}: {
  open: boolean;
  onClose: () => void;
  section: Section;
  onNavigate: (section: Section) => void;
  items: CloudItem[];
  onOpenFolder: (id: string) => void;
  used: number;
  quota: number;
  level: 'ok' | 'warning' | 'critical' | 'full';
  onStorage: () => void;
  onDropFiles: (folderId: string, files: File[]) => void;
  clipCount: number;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const favorites = liveItems(items).filter((item) => item.category === 'folder' && item.starred);
  const deleted = items.filter((item) => item.deletedAt).length;
  const ratio = Math.min(1, used / quota);
  return (
    <>
      {open && (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Hide sidebar"
          onClick={onClose}
        />
      )}
      <nav className={styles.sidebar} data-open={open} aria-label="CloudLand">
        <ul className={styles.navList}>
          {sections.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                aria-current={section === entry.id ? 'page' : undefined}
                onClick={() => onNavigate(entry.id)}
              >
                <Icon name={entry.icon} size={19} />
                <span>{entry.label}</span>
                {entry.id === 'deleted' && deleted > 0 && (
                  <span className={styles.count}>{deleted}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <h2 className={styles.navHeading}>DynamicLand</h2>
        <ul className={styles.navList}>
          <li>
            <button
              type="button"
              aria-current={section === 'clipland' ? 'page' : undefined}
              onClick={() => onNavigate('clipland')}
            >
              <Icon name="clipboard" size={19} />
              <span>ClipLand</span>
              {clipCount > 0 && <span className={styles.count}>{clipCount}</span>}
            </button>
          </li>
        </ul>
        <h2 className={styles.navHeading}>Favorites</h2>
        <ul className={styles.navList}>
          {favorites.length ? (
            favorites.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  data-drop={target === folder.id || undefined}
                  onClick={() => onOpenFolder(folder.id)}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes('Files')) return;
                    event.preventDefault();
                    setTarget(folder.id);
                  }}
                  onDragLeave={() => setTarget(null)}
                  onDrop={(event) => {
                    if (!event.dataTransfer.files.length) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setTarget(null);
                    onDropFiles(folder.id, Array.from(event.dataTransfer.files));
                  }}
                >
                  <Icon name="folder" size={19} />
                  <span>{folder.name}</span>
                </button>
              </li>
            ))
          ) : (
            <li className={styles.navHint}>Star a folder to keep it here.</li>
          )}
        </ul>
        <button type="button" className={styles.storageCard} data-level={level} onClick={onStorage}>
          <span className={styles.storageTop}>
            <Icon name="storage" size={18} />
            <strong>Storage</strong>
            <span>{Math.round(ratio * 100)}%</span>
          </span>
          <span
            className={styles.meter}
            role="meter"
            aria-label="Storage used"
            aria-valuemin={0}
            aria-valuemax={quota}
            aria-valuenow={used}
            aria-valuetext={`${formatBytes(used)} of ${formatBytes(quota)} used`}
          >
            <span style={{ width: `${ratio * 100}%` }} />
          </span>
          <span className={styles.storageText}>
            {formatBytes(used)} of {formatBytes(quota)} used
          </span>
        </button>
        <p className={styles.sidebarFoot}>
          <Icon name="lock" size={13} /> Private by default · Sign in with Apple
        </p>
      </nav>
    </>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { formatBytes } from '@/lib/cloud/limits';
import { folderSize, isShared, pathTo } from '@/lib/cloud/library';
import { expiryLabels, isExecutable } from '@/lib/cloud/files';
import type { CloudItem, Notice, NoticeKind } from '@/lib/cloud/types';
import { FileGlyph, kindLabel } from './FileGlyph';
import { Icon, type IconName } from './Icons';
import { formatDate, type BrowserActions } from './Browser';
import type { Toast, Upload } from './model';
import styles from './Cloud.module.css';

export function relativeTime(iso: string, now: number) {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export function Details({
  items,
  selected,
  folder,
  now,
  onClose,
  actions,
}: {
  items: CloudItem[];
  selected: CloudItem[];
  folder?: CloudItem;
  now: number;
  onClose: () => void;
  actions: BrowserActions;
}) {
  const item = selected.length === 1 ? selected[0] : selected.length === 0 ? folder : undefined;
  const size = item?.category === 'folder' ? folderSize(items, item.id) : item?.size;
  const location = item
    ? pathTo(items, item.parentId)
        .map((p) => p.name)
        .join(' › ') || 'CloudLand'
    : '';
  return (
    <aside className={styles.details} aria-label="Info">
      <header>
        <h2>Info</h2>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label="Close info"
        >
          <Icon name="x" size={18} />
        </button>
      </header>
      {!item ? (
        <div className={styles.detailsEmpty}>
          {selected.length > 1 ? (
            <>
              <strong>{selected.length} items selected</strong>
              <p>
                {formatBytes(
                  selected.reduce(
                    (sum, s) => sum + (s.category === 'folder' ? folderSize(items, s.id) : s.size),
                    0,
                  ),
                )}{' '}
                in total
              </p>
            </>
          ) : (
            <p>Select a file or folder to see its details.</p>
          )}
        </div>
      ) : (
        <>
          <div className={styles.detailsArt}>
            <FileGlyph item={item} />
          </div>
          <h3 className={styles.detailsName}>{item.name}</h3>
          <dl className={styles.facts}>
            <dt>Kind</dt>
            <dd>{kindLabel[item.category]}</dd>
            <dt>Size</dt>
            <dd>{formatBytes(size ?? 0)}</dd>
            <dt>Where</dt>
            <dd>{location}</dd>
            <dt>Modified</dt>
            <dd>{formatDate(item.modified)}</dd>
            {item.deletedAt && (
              <>
                <dt>Deleted</dt>
                <dd>{relativeTime(item.deletedAt, now)}</dd>
              </>
            )}
          </dl>
          <section className={styles.detailsSection}>
            <h4>Sharing</h4>
            <p className={styles.linkState}>
              <Icon name={item.share.link ? 'link' : 'lock'} size={15} />
              {item.share.link
                ? `View-only link · expires after ${expiryLabels[item.share.expiry]}`
                : 'Only you can see this'}
            </p>
            {isExecutable(item.name) && (
              <p className={styles.linkState}>
                <Icon name="shield" size={15} /> Apps and scripts can’t be shared by link.
              </p>
            )}
            {!item.deletedAt && (
              <button
                type="button"
                className={styles.buttonQuiet}
                onClick={() => actions.share(item)}
              >
                <Icon name="share" size={17} /> {isShared(item) ? 'Manage sharing' : 'Share'}
              </button>
            )}
          </section>
        </>
      )}
    </aside>
  );
}

const noticeIcons: Record<NoticeKind, IconName> = {
  upload: 'upload',
  share: 'people',
  storage: 'storage',
  security: 'shield',
  system: 'info',
};
export function NotificationPanel({
  notices,
  now,
  onClose,
  onRead,
  onClear,
  onSettings,
}: {
  notices: Notice[];
  now: number;
  onClose: () => void;
  onRead: (id: string | 'all') => void;
  onClear: () => void;
  onSettings: () => void;
}) {
  const [filter, setFilter] = useState<'all' | NoticeKind>('all');
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
    const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    const down = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!panel.current?.contains(target) && !target.closest('[aria-label^="Notifications"]'))
        onClose();
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', down);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', down);
    };
  }, [onClose]);
  const shown = notices.filter((notice) => filter === 'all' || notice.kind === filter);
  return (
    <div
      ref={panel}
      className={styles.notices}
      role="dialog"
      aria-label="Notifications"
      tabIndex={-1}
    >
      <header>
        <h2>Notifications</h2>
        <button type="button" className={styles.linkButton} onClick={() => onRead('all')}>
          Mark all read
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Notification settings"
          onClick={onSettings}
        >
          <Icon name="gear" size={18} />
        </button>
      </header>
      <div className={styles.chips} role="group" aria-label="Filter notifications">
        {(['all', 'upload', 'share', 'storage', 'security'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={filter === kind}
            onClick={() => setFilter(kind)}
          >
            {kind === 'all' ? 'All' : kind[0].toUpperCase() + kind.slice(1)}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ul className={styles.noticeList}>
          {shown.map((notice) => (
            <li key={notice.id} data-unread={!notice.read || undefined} data-tone={notice.tone}>
              <button type="button" onClick={() => onRead(notice.id)}>
                <span className={styles.noticeIcon}>
                  <Icon name={noticeIcons[notice.kind]} size={17} />
                </span>
                <span>
                  <strong>{notice.title}</strong>
                  {notice.body && <span>{notice.body}</span>}
                  <time dateTime={notice.at}>{relativeTime(notice.at, now)}</time>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noticeEmpty}>You’re all caught up.</p>
      )}
      {notices.length > 0 && (
        <footer>
          <button type="button" className={styles.linkButton} onClick={onClear}>
            Clear all
          </button>
        </footer>
      )}
    </div>
  );
}

export function UploadTray({
  uploads,
  online,
  onCancel,
  onCancelAll,
  onDismiss,
}: {
  uploads: Upload[];
  online: boolean;
  onCancel: (id: string) => void;
  onCancelAll: () => void;
  onDismiss: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const live = uploads.filter((u) => u.status !== 'canceled');
  if (!live.length) return null;
  const total = live.reduce((sum, u) => sum + u.size, 0);
  const sent = live.reduce((sum, u) => sum + u.sent, 0);
  const pending = live.filter((u) => u.status === 'uploading' || u.status === 'queued').length;
  const percent = total ? Math.round((sent / total) * 100) : 100;
  return (
    <section className={styles.tray} aria-label="Uploads">
      <header>
        <span
          className={styles.trayRing}
          style={{ '--p': percent / 100 } as React.CSSProperties}
          aria-hidden="true"
        />
        <div aria-live="polite">
          <strong>
            {pending
              ? online
                ? `Uploading ${pending} item${pending === 1 ? '' : 's'}`
                : 'Waiting for a connection'
              : 'Uploads complete'}
          </strong>
          <span>
            {formatBytes(sent)} of {formatBytes(total)} · {percent}%
          </span>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand uploads' : 'Collapse uploads'}
          onClick={() => setCollapsed((v) => !v)}
        >
          <Icon name="chevronDown" size={18} className={collapsed ? styles.flip : undefined} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={pending ? 'Cancel all uploads' : 'Close'}
          onClick={pending ? onCancelAll : onDismiss}
        >
          <Icon name="x" size={18} />
        </button>
      </header>
      {!collapsed && (
        <ul>
          {live.map((upload) => (
            <li key={upload.id}>
              <span className={styles.trayName}>{upload.name}</span>
              <span className={styles.trayBar}>
                <span
                  style={{ width: `${upload.size ? (upload.sent / upload.size) * 100 : 100}%` }}
                  data-done={upload.status === 'done' || undefined}
                />
              </span>
              {upload.status === 'done' ? (
                <Icon name="check" size={16} className={styles.trayDone} />
              ) : (
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Cancel ${upload.name}`}
                  onClick={() => onCancel(upload.id)}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <ol className={styles.toasts} aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </ol>
  );
}
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss.current(), toast.action ? 7000 : 4500);
    return () => clearTimeout(timer);
  }, [paused, toast.action]);
  const icon: IconName =
    toast.tone === 'success' ? 'check' : toast.tone === 'info' ? 'info' : 'alert';
  return (
    <li
      className={styles.toast}
      data-tone={toast.tone}
      role={toast.tone === 'critical' ? 'alert' : 'status'}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={icon} size={18} />
      <div>
        <strong>{toast.title}</strong>
        {toast.body && <span>{toast.body}</span>}
      </div>
      {toast.action && (
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => {
            toast.action?.run();
            onDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className={styles.iconButton} aria-label="Dismiss" onClick={onDismiss}>
        <Icon name="x" size={14} />
      </button>
    </li>
  );
}

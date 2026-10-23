'use client';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from 'react';
import { product } from '@/content/product';
import {
  activityLimit,
  formatBytes,
  maxBatchFiles,
  noticeLimit,
  plan,
  retentionDays,
  storageLevel,
} from '@/lib/cloud/limits';
import {
  categorize,
  isExecutable,
  planUpload,
  quickViewKind,
  quickViewTextLimit,
  sanitizeName,
  uniqueName,
} from '@/lib/cloud/files';
import { descendants, itemsFor, liveItems } from '@/lib/cloud/library';
import type {
  CloudItem,
  Notice,
  NoticeKind,
  NoticeTone,
  Section,
  ShareSettings,
} from '@/lib/cloud/types';
import { AppleLogo, Icon } from './Icons';
import { FileGlyph } from './FileGlyph';
import { MenuButton, Dialog } from './Overlay';
import { Sidebar } from './Sidebar';
import { Browser } from './Browser';
import { Details, NotificationPanel, Toasts, UploadTray } from './Panels';
import { PdfView } from './PdfView';
import { ShareDialog } from './ShareDialog';
import { SettingsDialog, type SettingsTab } from './SettingsDialog';
import {
  defaultPreferences,
  loadPreferences,
  newId,
  savePreferences,
  linkToken,
  type Activity,
  type Preferences,
  type Session,
  type Toast,
  type Upload,
} from './model';
import styles from './Cloud.module.css';

const subscribeNever = () => () => {};
const bandwidth = 6_000_000; // bytes per 100 ms tick of the preview uploader

export interface CloudAppProps {
  user: { name: string; email: string };
  demo: boolean;
  now: string;
  initialItems: CloudItem[];
  initialNotices: Notice[];
}

export function CloudApp({ user, demo, now, initialItems, initialNotices }: CloudAppProps) {
  // Dates and preferences depend on the viewer's clock, zone and browser, so the library renders after hydration.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [preferences, setPreferences] = useState<Preferences>(() =>
    typeof window === 'undefined' ? defaultPreferences : loadPreferences(),
  );
  const [items, setItems] = useState(initialItems);
  const [notices, setNotices] = useState(initialNotices);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [activity, setActivity] = useState<Activity[]>(() => [
    { id: 'a0', at: now, text: 'Signed in with Apple on this browser' },
  ]);
  const [sessions, setSessions] = useState<Session[]>([
    { id: 's1', device: 'This browser', detail: 'Active now', current: true },
    { id: 's2', device: 'MacBook Pro · DynamicLand', detail: 'Last active 3 hours ago' },
    { id: 's3', device: 'iPhone', detail: 'Last active yesterday', phone: true },
  ]);
  const [section, setSection] = useState<Section>('recents');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: string;
    run: () => void;
  } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [locked, setLocked] = useState(false);
  const [online, setOnline] = useState(true);
  const [clock, setClock] = useState(() => Date.parse(now));

  const files = useRef(new Map<string, { file: File; parent: string | null }>());
  const uploadsRef = useRef<Upload[]>([]);
  const itemsRef = useRef(items);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const lastActive = useRef(0);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    itemsRef.current = items;
    preferencesRef.current = preferences;
  });
  useEffect(() => savePreferences(preferences), [preferences]);
  useEffect(() => {
    const tick = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, []);
  // Object URLs only live as long as this tab; release them when it closes.
  useEffect(
    () => () =>
      itemsRef.current.forEach((item) => item.localUrl && URL.revokeObjectURL(item.localUrl)),
    [],
  );

  const used = useMemo(() => items.reduce((sum, item) => sum + item.size, 0), [items]);
  const level = storageLevel(used, plan.quota);

  const toast = useCallback((next: Omit<Toast, 'id'>) => {
    setToasts((list) => [...list.slice(-3), { ...next, id: newId() }]);
  }, []);
  const notify = useCallback(
    (
      kind: NoticeKind,
      tone: NoticeTone,
      title: string,
      body?: string,
      action?: Toast['action'],
    ) => {
      setNotices((list) =>
        [
          { id: newId(), kind, tone, title, body, at: new Date().toISOString(), read: false },
          ...list,
        ].slice(0, noticeLimit),
      );
      const prefs = preferencesRef.current;
      if (prefs.toasts[kind] || tone === 'critical') toast({ tone, title, body, action });
      if (
        prefs.desktopAlerts &&
        document.hidden &&
        'Notification' in window &&
        Notification.permission === 'granted'
      )
        new Notification(title, { body, icon: product.logo, tag: kind });
    },
    [toast],
  );
  const log = useCallback((text: string) => {
    setActivity((list) =>
      [{ id: newId(), at: new Date().toISOString(), text }, ...list].slice(0, activityLimit),
    );
  }, []);

  const storageCheck = useCallback(
    (before: number, after: number) => {
      const was = storageLevel(before, plan.quota);
      const is = storageLevel(after, plan.quota);
      const rank = { ok: 0, warning: 1, critical: 2, full: 3 };
      if (rank[is] <= rank[was]) return;
      if (is === 'full')
        notify(
          'storage',
          'critical',
          'CloudLand storage is full',
          'New files can’t be uploaded until you free up space.',
        );
      else if (is === 'critical')
        notify(
          'storage',
          'critical',
          'Only a little storage left',
          `${formatBytes(plan.quota - after)} remaining.`,
        );
      else
        notify(
          'storage',
          'warning',
          'CloudLand storage is almost full',
          'Free up space so new files keep syncing.',
        );
    },
    [notify],
  );

  // ——— Auto-lock ———
  useEffect(() => {
    const mark = () => (lastActive.current = Date.now());
    mark();
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((name) => window.addEventListener(name, mark, { passive: true }));
    const check = setInterval(() => {
      if (Date.now() - lastActive.current > preferencesRef.current.autoLock * 60_000)
        setLocked(true);
    }, 15_000);
    const hidden = () => {
      if (document.hidden && preferencesRef.current.lockWhenHidden) setLocked(true);
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      events.forEach((name) => window.removeEventListener(name, mark));
      clearInterval(check);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  // ——— Connectivity ———
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine)
        notify(
          'system',
          'warning',
          'You’re offline',
          'Uploads are paused and will resume when you reconnect.',
        );
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [notify]);

  // ——— Uploads (simulated transfer; files never leave this tab in the preview) ———
  const setUploadList = useCallback((next: Upload[]) => {
    uploadsRef.current = next;
    setUploads(next);
  }, []);
  const active = uploads.some(
    (upload) => upload.status === 'uploading' || upload.status === 'queued',
  );
  useEffect(() => {
    if (!active || !online) return;
    const timer = setInterval(() => {
      let budget = bandwidth;
      const finished: Upload[] = [];
      const next = uploadsRef.current.map((upload) => {
        if (budget <= 0 || (upload.status !== 'uploading' && upload.status !== 'queued'))
          return upload;
        const step = Math.min(budget, upload.size - upload.sent);
        budget -= Math.max(step, bandwidth / 8);
        const sent = upload.sent + step;
        const done = sent >= upload.size;
        const updated: Upload = { ...upload, sent, status: done ? 'done' : 'uploading' };
        if (done) finished.push(updated);
        return updated;
      });
      setUploadList(next);
      if (!finished.length) return;
      const additions = finished.flatMap((upload) => {
        const entry = files.current.get(upload.id);
        files.current.delete(upload.id);
        if (!entry) return [];
        const category = categorize(upload.name);
        return [
          {
            id: upload.id,
            name: upload.name,
            category,
            size: upload.size,
            modified: new Date().toISOString(),
            parentId: entry.parent,
            starred: false,
            share: {
              link: false,
              expiry: preferencesRef.current.defaultExpiry,
              allowDownload: true,
            },
            localUrl: previewUrl(entry.file, upload.name),
          } satisfies CloudItem,
        ];
      });
      setItems((list) => [...list, ...additions]);
      const remaining = next.filter(
        (upload) => upload.status === 'uploading' || upload.status === 'queued',
      ).length;
      if (!remaining) {
        const count = next.filter((upload) => upload.status === 'done').length;
        notify(
          'upload',
          'success',
          count === 1
            ? `“${next.find((u) => u.status === 'done')?.name}” uploaded`
            : `${count} items uploaded`,
        );
        log(`Uploaded ${count} item${count === 1 ? '' : 's'}`);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [active, online, notify, log, setUploadList]);

  const startUpload = useCallback(
    (picked: File[], parentOverride?: string | null) => {
      if (!picked.length) return;
      const current = itemsRef.current;
      const parent = parentOverride !== undefined ? parentOverride : folderId;
      const pending = uploadsRef.current
        .filter((upload) => upload.status === 'uploading' || upload.status === 'queued')
        .reduce((sum, upload) => sum + upload.size, 0);
      const usedNow = current.reduce((sum, item) => sum + item.size, 0);
      const siblings = liveItems(current)
        .filter((item) => item.parentId === parent)
        .map((item) => item.name);
      const result = planUpload(picked, {
        used: usedNow + pending,
        quota: plan.quota,
        maxFileSize: plan.maxFileSize,
        maxFiles: maxBatchFiles,
        taken: [
          ...siblings,
          ...uploadsRef.current.filter((u) => u.status !== 'canceled').map((u) => u.name),
        ],
      });
      if (result.rejected.length) {
        const first = result.rejected[0];
        notify(
          'upload',
          'warning',
          result.rejected.length === 1
            ? `“${first.name}” wasn’t uploaded`
            : `${result.rejected.length} items weren’t uploaded`,
          first.reason === 'Not enough storage.'
            ? `Not enough storage. ${formatBytes(Math.max(0, plan.quota - usedNow))} available.`
            : first.reason,
          first.reason === 'Not enough storage.'
            ? { label: 'Manage', run: () => setSettingsTab('storage') }
            : undefined,
        );
      }
      const risky = result.accepted.filter(({ name }) => isExecutable(name));
      if (risky.length)
        notify(
          'security',
          'info',
          'Apps and scripts stay private',
          `${risky.length} file${risky.length === 1 ? '' : 's'} can be stored here but never shared by link.`,
        );
      const queued = result.accepted.map(({ file, name }) => {
        const id = newId();
        files.current.set(id, { file, parent });
        return { id, name, size: file.size, sent: 0, status: 'queued' } satisfies Upload;
      });
      if (queued.length) {
        setUploadList([
          ...uploadsRef.current.filter((u) => u.status !== 'done' && u.status !== 'canceled'),
          ...queued,
        ]);
        storageCheck(
          usedNow + pending,
          usedNow + pending + queued.reduce((sum, u) => sum + u.size, 0),
        );
      }
    },
    [folderId, notify, setUploadList, storageCheck],
  );
  const uploadFolder = useCallback(
    (picked: File[]) => {
      if (!picked.length) return;
      const top =
        (picked[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split('/')[0] ||
        'Folder';
      const clean = sanitizeName(top);
      const siblings = liveItems(itemsRef.current)
        .filter((item) => item.parentId === folderId)
        .map((item) => item.name);
      const folder: CloudItem = {
        ...blankFolder(uniqueName(clean.ok ? clean.name : 'Folder', siblings), folderId),
        share: blankShare(preferencesRef.current),
      };
      setItems((list) => [...list, folder]);
      startUpload(picked, folder.id);
    },
    [folderId, startUpload],
  );
  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '');
  }, [mounted]);

  // ——— Library actions ———
  const visible = useMemo(
    () => itemsFor(items, section, folderId, query),
    [items, section, folderId, query],
  );
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const selected = selection
    .map((id) => byId.get(id))
    .filter((item): item is CloudItem => Boolean(item));

  const navigate = (next: Section) => {
    setSection(next);
    setFolderId(null);
    setQuery('');
    setSelection([]);
    setSidebarOpen(false);
  };
  const openFolder = (id: string | null) => {
    setFolderId(id);
    setQuery('');
    setSelection([]);
    if (id && section !== 'browse' && section !== 'shared') setSection('browse');
  };
  const open = (item: CloudItem) => {
    if (item.deletedAt) return;
    if (item.category === 'folder') openFolder(item.id);
    else setPreviewId(item.id);
  };
  const trash = (ids: string[]) => {
    if (!ids.length) return;
    const at = new Date().toISOString();
    setItems((list) =>
      list.map((item) => (ids.includes(item.id) ? { ...item, deletedAt: at } : item)),
    );
    setSelection([]);
    const label = ids.length === 1 ? `“${byId.get(ids[0])?.name}”` : `${ids.length} items`;
    log(`Moved ${label} to Recently Deleted`);
    toast({
      tone: 'info',
      title: `${label} moved to Recently Deleted`,
      body: `Items stay for ${retentionDays} days before they’re removed.`,
      action: { label: 'Undo', run: () => restore(ids, true) },
    });
  };
  const restore = (ids: string[], quiet = false) => {
    setItems((list) =>
      list.map((item) => {
        if (!ids.includes(item.id)) return item;
        const rest = { ...item };
        delete rest.deletedAt;
        return rest;
      }),
    );
    setSelection([]);
    if (!quiet) {
      toast({
        tone: 'success',
        title: ids.length === 1 ? 'Item restored' : `${ids.length} items restored`,
      });
      log(`Restored ${ids.length} item${ids.length === 1 ? '' : 's'}`);
    }
  };
  const purgeNow = (ids: string[]) => {
    const gone = descendants(itemsRef.current, ids);
    itemsRef.current.forEach(
      (item) => gone.has(item.id) && item.localUrl && URL.revokeObjectURL(item.localUrl),
    );
    setItems((list) => list.filter((item) => !gone.has(item.id)));
    setSelection([]);
    toast({
      tone: 'success',
      title: `${ids.length === 1 ? 'Item' : `${ids.length} items`} permanently deleted`,
    });
    log(`Permanently deleted ${gone.size} item${gone.size === 1 ? '' : 's'}`);
  };
  const purge = (ids: string[]) => {
    if (!ids.length) return;
    if (!preferences.confirmPermanentDelete) return purgeNow(ids);
    setConfirm({
      title:
        ids.length === 1
          ? `Delete “${byId.get(ids[0])?.name}” permanently?`
          : `Delete ${ids.length} items permanently?`,
      body: 'This can’t be undone. Anyone you shared with will lose access too.',
      action: 'Delete',
      run: () => purgeNow(ids),
    });
  };
  const emptyTrash = () => {
    const ids = items.filter((item) => item.deletedAt).map((item) => item.id);
    if (!ids.length) return;
    setConfirm({
      title: 'Empty Recently Deleted?',
      body: `${ids.length} item${ids.length === 1 ? '' : 's'} will be permanently deleted. This can’t be undone.`,
      action: 'Empty',
      run: () => purgeNow(ids),
    });
  };
  const toggleStar = (ids: string[]) => {
    const star = ids.some((id) => !byId.get(id)?.starred);
    setItems((list) =>
      list.map((item) => (ids.includes(item.id) ? { ...item, starred: star } : item)),
    );
  };
  const rename = (id: string, raw: string): string | null => {
    const item = byId.get(id);
    if (!item) return null;
    const clean = sanitizeName(raw);
    if (!clean.ok) return clean.reason;
    const siblings = liveItems(items)
      .filter((other) => other.parentId === item.parentId && other.id !== id)
      .map((other) => other.name);
    const name = uniqueName(clean.name, siblings);
    setItems((list) =>
      list.map((other) =>
        other.id === id ? { ...other, name, modified: new Date().toISOString() } : other,
      ),
    );
    log(`Renamed “${item.name}” to “${name}”`);
    return null;
  };
  const createFolder = (raw: string): string | null => {
    const clean = sanitizeName(raw);
    if (!clean.ok) return clean.reason;
    const siblings = liveItems(items)
      .filter((item) => item.parentId === folderId)
      .map((item) => item.name);
    const folder = {
      ...blankFolder(uniqueName(clean.name, siblings), folderId),
      share: blankShare(preferences),
    };
    setItems((list) => [...list, folder]);
    if (section !== 'browse' && !folderId) setSection('browse');
    setSelection([folder.id]);
    log(`Created folder “${folder.name}”`);
    return null;
  };
  const saveShare = (id: string, share: ShareSettings) => {
    const item = byId.get(id);
    if (!item) return;
    const token = share.link ? (item.share.token ?? linkToken()) : undefined;
    setItems((list) =>
      list.map((other) => (other.id === id ? { ...other, share: { ...share, token } } : other)),
    );
    if (share.link && !item.share.link)
      notify(
        'share',
        'success',
        `Link to “${item.name}” is ready`,
        'Copy it and send it to anyone.',
      );
    if (item.share.link !== share.link)
      log(`${share.link ? 'Made a link to' : 'Turned off the link to'} “${item.name}”`);
  };
  const copyLink = async (item: CloudItem) => {
    if (!item.share.link || !item.share.token) return setShareId(item.id);
    try {
      await navigator.clipboard.writeText(`${location.origin}/cloud/s/${item.share.token}`);
      toast({
        tone: 'success',
        title: 'Link copied',
        body: 'Anyone with the link can view it until it expires.',
      });
    } catch {
      toast({
        tone: 'warning',
        title: 'Couldn’t copy the link',
        body: 'Your browser blocked clipboard access.',
      });
    }
  };
  const download = (list: CloudItem[]) => {
    const local = list.filter((item) => item.localUrl);
    for (const item of local) {
      const anchor = document.createElement('a');
      anchor.href = item.localUrl!;
      anchor.download = item.name;
      anchor.rel = 'noopener';
      anchor.click();
    }
    if (local.length < list.length)
      toast({
        tone: 'info',
        title: 'Download isn’t available in the preview',
        body: 'Sample files have no content. Files you upload here can be downloaded.',
      });
  };
  const signOut = () => location.assign('/cloud/sign-in');
  const lockNow = () => setLocked(true);

  // ——— Keyboard ———
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.closest('input, textarea, select, [contenteditable="true"]');
      const modal = document.querySelector('dialog[open]');
      const command = event.metaKey || event.ctrlKey;
      if (locked) return;
      if (
        (command && event.key.toLowerCase() === 'k') ||
        (!typing && !modal && event.key === '/')
      ) {
        event.preventDefault();
        searchInput.current?.focus();
        return;
      }
      if (typing || modal || target.closest('[role="menu"]')) return;
      if (command && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setSelection(visible.map((item) => item.id));
      } else if (event.key === 'Escape') setSelection([]);
      else if ((event.key === 'Backspace' && command) || event.key === 'Delete') {
        event.preventDefault();
        if (section === 'deleted') purge(selection);
        else trash(selection);
      } else if (event.key === 'Enter' && selected.length === 1) open(selected[0]);
      else if (event.key === ' ' && selected.length === 1 && selected[0].category !== 'folder') {
        event.preventDefault();
        setPreviewId(selected[0].id);
      } else if (command && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setDetailsOpen((value) => !value);
      } else if (event.altKey && command && event.code === 'KeyN') {
        event.preventDefault();
        setNewFolderOpen(true);
      } else if (event.altKey && command && event.code === 'KeyU') {
        event.preventDefault();
        fileInput.current?.click();
      }
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  });

  // ——— Drag and drop from the desktop ———
  const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files');
  const dropHandlers = {
    onDragEnter: (event: DragEvent) => {
      if (!hasFiles(event) || locked || section === 'deleted') return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = section === 'deleted' || locked ? 'none' : 'copy';
    },
    onDragLeave: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (section === 'deleted' || locked) return;
      startUpload(Array.from(event.dataTransfer.files));
    },
  };

  const unread = notices.filter((notice) => !notice.read).length;
  const shareItem = shareId ? byId.get(shareId) : undefined;
  const previewItem = previewId ? byId.get(previewId) : undefined;
  const renameItem = renameId ? byId.get(renameId) : undefined;
  const folder = folderId ? byId.get(folderId) : undefined;
  const actions = {
    open,
    openFolder,
    trash,
    restore,
    purge,
    emptyTrash,
    toggleStar,
    share: (item: CloudItem) => setShareId(item.id),
    copyLink,
    download,
    rename: (item: CloudItem) => setRenameId(item.id),
    info: (item: CloudItem) => {
      setSelection([item.id]);
      setDetailsOpen(true);
    },
    upload: () => fileInput.current?.click(),
    uploadFolder: () => folderInput.current?.click(),
    newFolder: () => setNewFolderOpen(true),
    showStorage: () => setSettingsTab('storage'),
  };
  const theme = mounted ? preferences.theme : 'system';

  return (
    <div className={styles.app} data-theme={theme} data-cloudland {...dropHandlers}>
      <header className={styles.topbar} inert={locked}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileOnly}`}
          aria-label="Show sidebar"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((value) => !value)}
        >
          <Icon name="sidebar" />
        </button>
        <a href="/cloud" className={styles.brand} aria-label="CloudLand home">
          <Image src={product.logo} alt="" width={26} height={26} priority unoptimized />
          <span>
            Cloud<span className={styles.brandAccent}>Land</span>
          </span>
        </a>
        {demo && <span className={styles.previewPill}>Preview</span>}
        <div className={styles.topActions}>
          {level !== 'ok' && (
            <button
              type="button"
              className={styles.alertDot}
              data-level={level}
              aria-label="Storage almost full"
              title="Storage almost full"
              onClick={() => setSettingsTab('storage')}
            >
              !
            </button>
          )}
          <MenuButton
            label="New"
            align="end"
            items={[
              { label: 'Upload files…', icon: 'upload', onSelect: actions.upload, shortcut: '⌥⌘U' },
              { label: 'Upload folder…', icon: 'folder', onSelect: actions.uploadFolder },
              'separator',
              {
                label: 'New folder',
                icon: 'folderPlus',
                onSelect: actions.newFolder,
                shortcut: '⌥⌘N',
              },
            ]}
          >
            <Icon name="plusCircle" size={22} />
          </MenuButton>
          <div className={styles.menuAnchor} data-align="end">
            <button
              type="button"
              className={styles.iconButton}
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              title="Notifications"
              aria-expanded={noticesOpen}
              onClick={() => setNoticesOpen((value) => !value)}
            >
              <Icon name="bell" size={21} />
              {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
            </button>
          </div>
          <MenuButton
            label="Account"
            align="end"
            className={styles.avatarButton}
            items={[
              { heading: user.email },
              { label: 'Settings', icon: 'gear', onSelect: () => setSettingsTab('general') },
              { label: 'Storage', icon: 'storage', onSelect: () => setSettingsTab('storage') },
              {
                label: 'Security & sessions',
                icon: 'shield',
                onSelect: () => setSettingsTab('security'),
              },
              'separator',
              { label: 'Lock CloudLand', icon: 'lock', onSelect: lockNow },
              { label: 'Sign out', icon: 'signOut', onSelect: signOut, danger: true },
            ]}
          >
            <span aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
          </MenuButton>
        </div>
      </header>

      <div className={styles.body} inert={locked}>
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          section={folderId && section !== 'shared' ? 'browse' : section}
          onNavigate={navigate}
          items={items}
          onOpenFolder={(id) => {
            openFolder(id);
            setSidebarOpen(false);
          }}
          used={used}
          quota={plan.quota}
          level={level}
          onStorage={actions.showStorage}
          onDropFiles={(id, picked) => startUpload(picked, id)}
        />
        <main id="main" className={styles.main} aria-busy={!mounted}>
          {mounted ? (
            <Browser
              items={items}
              visible={visible}
              section={section}
              folder={folder}
              query={query}
              onQuery={setQuery}
              searchRef={searchInput}
              selection={selection}
              onSelection={setSelection}
              preferences={preferences}
              onPreferences={setPreferences}
              now={clock}
              used={used}
              quota={plan.quota}
              level={level}
              demo={demo}
              actions={actions}
              onToggleDetails={() => setDetailsOpen((value) => !value)}
              detailsOpen={detailsOpen}
            />
          ) : (
            <div className={styles.loading} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              <span>Opening CloudLand…</span>
            </div>
          )}
        </main>
        {detailsOpen && mounted && (
          <Details
            items={items}
            selected={selected}
            folder={folder}
            now={clock}
            onClose={() => setDetailsOpen(false)}
            actions={actions}
          />
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        onChange={(event) => {
          startUpload(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <input
        ref={folderInput}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        onChange={(event) => {
          uploadFolder(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      {dragging && (
        <div className={styles.dropOverlay} aria-hidden="true">
          <div>
            <Icon name="upload" size={44} />
            <strong>
              Drop to upload to {folder?.name ?? (section === 'browse' ? 'CloudLand' : 'CloudLand')}
            </strong>
            <span>
              {formatBytes(Math.max(0, plan.quota - used))} available · up to{' '}
              {formatBytes(plan.maxFileSize)} per file
            </span>
          </div>
        </div>
      )}

      {noticesOpen && (
        <NotificationPanel
          notices={notices}
          now={clock}
          onClose={() => setNoticesOpen(false)}
          onRead={(id) =>
            setNotices((list) =>
              list.map((n) => (id === 'all' || n.id === id ? { ...n, read: true } : n)),
            )
          }
          onClear={() => setNotices([])}
          onSettings={() => {
            setNoticesOpen(false);
            setSettingsTab('notifications');
          }}
        />
      )}
      <div className={styles.dock}>
        <Toasts
          toasts={toasts}
          onDismiss={(id) => setToasts((list) => list.filter((t) => t.id !== id))}
        />
        <UploadTray
          uploads={uploads}
          online={online}
          onCancel={(id) => {
            files.current.delete(id);
            setUploadList(
              uploadsRef.current.map((u) =>
                u.id === id && u.status !== 'done' ? { ...u, status: 'canceled' } : u,
              ),
            );
          }}
          onCancelAll={() => {
            files.current.clear();
            setUploadList(
              uploadsRef.current.map((u) =>
                u.status === 'done' ? u : { ...u, status: 'canceled' },
              ),
            );
          }}
          onDismiss={() => setUploadList([])}
        />
      </div>
      {shareItem && (
        <ShareDialog
          item={shareItem}
          maxDownloads={plan.maxLinkDownloads}
          onClose={() => setShareId(null)}
          onSave={(share) => saveShare(shareItem.id, share)}
          onCopy={() => copyLink(byId.get(shareItem.id) ?? shareItem)}
        />
      )}
      {settingsTab && (
        <SettingsDialog
          tab={settingsTab}
          onTab={setSettingsTab}
          onClose={() => setSettingsTab(null)}
          preferences={preferences}
          onPreferences={setPreferences}
          items={items}
          used={used}
          plan={plan}
          activity={activity}
          sessions={sessions}
          user={user}
          now={clock}
          onEndSession={(id) => {
            setSessions((list) => list.filter((s) => s.id !== id));
            notify('security', 'success', 'Session signed out');
            log('Signed out a session');
          }}
          onEndOthers={() => {
            setSessions((list) => list.filter((s) => s.current));
            notify('security', 'success', 'Signed out of all other sessions');
            log('Signed out of all other sessions');
          }}
          onEmptyTrash={emptyTrash}
          onTrash={trash}
          onDesktopAlerts={async (on) => {
            if (!on) return setPreferences((p) => ({ ...p, desktopAlerts: false }));
            if (!('Notification' in window))
              return toast({
                tone: 'warning',
                title: 'This browser doesn’t support notifications',
              });
            const permission = await Notification.requestPermission();
            setPreferences((p) => ({ ...p, desktopAlerts: permission === 'granted' }));
            if (permission !== 'granted')
              toast({
                tone: 'warning',
                title: 'Notifications are blocked',
                body: 'Allow them for this site in your browser settings.',
              });
          }}
        />
      )}
      <NameDialog
        open={newFolderOpen}
        title="New folder"
        action="Create"
        initial="untitled folder"
        onClose={() => setNewFolderOpen(false)}
        onSubmit={createFolder}
      />
      <NameDialog
        open={Boolean(renameItem)}
        title="Rename"
        action="Rename"
        initial={renameItem?.name ?? ''}
        onClose={() => setRenameId(null)}
        onSubmit={(name) => (renameItem ? rename(renameItem.id, name) : null)}
      />
      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        description={confirm?.body}
      >
        <div className={styles.dialogActions}>
          <button type="button" className={styles.buttonQuiet} onClick={() => setConfirm(null)}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.buttonDanger}
            onClick={() => {
              confirm?.run();
              setConfirm(null);
            }}
          >
            {confirm?.action}
          </button>
        </div>
      </Dialog>
      <Dialog
        open={Boolean(previewItem)}
        onClose={() => setPreviewId(null)}
        title={previewItem?.name ?? ''}
        description={previewItem ? formatBytes(previewItem.size) : undefined}
        wide
      >
        {previewItem && (
          <QuickLook
            key={previewItem.id}
            item={previewItem}
            hidePreview={preferences.hidePreviews}
            actions={actions}
            onDone={() => setPreviewId(null)}
          />
        )}
      </Dialog>

      {locked && <LockScreen user={user} onUnlock={() => setLocked(false)} onSignOut={signOut} />}
    </div>
  );
}

function blankShare(preferences: Preferences): ShareSettings {
  return {
    link: false,
    expiry: preferences.defaultExpiry,
    allowDownload: true,
  };
}
function blankFolder(name: string, parentId: string | null): CloudItem {
  return {
    id: newId(),
    name,
    category: 'folder',
    size: 0,
    modified: new Date().toISOString(),
    parentId,
    starred: false,
    share: { link: false, expiry: '7d', allowDownload: true },
  };
}

function NameDialog({
  open,
  title,
  action,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  action: string;
  initial: string;
  onClose: () => void;
  onSubmit: (name: string) => string | null;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      {open && (
        <NameForm
          key={initial}
          action={action}
          initial={initial}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Dialog>
  );
}
function NameForm({
  action,
  initial,
  onClose,
  onSubmit,
}: {
  action: string;
  initial: string;
  onClose: () => void;
  onSubmit: (name: string) => string | null;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const field = input.current;
    if (!field) return;
    field.focus();
    const dot = initial.lastIndexOf('.');
    field.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const problem = onSubmit(value);
        if (problem) setError(problem);
        else onClose();
      }}
    >
      <label className={styles.field}>
        <span className="srOnly">Name</span>
        <input
          ref={input}
          value={value}
          maxLength={255}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'name-error' : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
      </label>
      {error && (
        <p id="name-error" className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.dialogActions}>
        <button type="button" className={styles.buttonQuiet} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={styles.buttonPrimary}>
          {action}
        </button>
      </div>
    </form>
  );
}

/**
 * Object URL for a file added in this tab. PDFs and text are re-typed so the browser can never
 * treat them as a page that runs script, even if the URL is opened directly.
 */
function previewUrl(file: File, name: string): string {
  const kind = quickViewKind(name);
  const type = kind === 'pdf' ? 'application/pdf' : kind === 'text' ? 'text/plain' : file.type;
  return URL.createObjectURL(type === file.type ? file : new Blob([file], { type }));
}

function QuickLook({
  item,
  hidePreview,
  actions,
  onDone,
}: {
  item: CloudItem;
  hidePreview: boolean;
  actions: { share: (item: CloudItem) => void; download: (items: CloudItem[]) => void };
  onDone: () => void;
}) {
  const url = item.localUrl;
  const kind = url ? quickViewKind(item.name) : null;
  const [failed, setFailed] = useState(false);
  const [text, setText] = useState<{ body: string; cut: boolean } | null>(null);
  useEffect(() => {
    if (kind !== 'text' || !url) return;
    let live = true;
    // Only the start of the file is read; the storage service will answer with a byte range.
    fetch(url)
      .then((response) => response.blob())
      .then(async (blob) => {
        const body = await blob.slice(0, quickViewTextLimit).text();
        if (live) setText({ body, cut: blob.size > quickViewTextLimit });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [kind, url]);
  const fail = useCallback(() => setFailed(true), []);
  const shown = url && kind && !failed;

  return (
    <div className={styles.quickLook}>
      <div
        className={styles.quickLookStage}
        data-kind={shown ? kind : undefined}
        data-private={hidePreview || undefined}
      >
        {shown && kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Preview of ${item.name}`} onError={fail} />
        ) : shown && kind === 'video' ? (
          <video src={url} controls playsInline preload="metadata" onError={fail} />
        ) : shown && kind === 'audio' ? (
          <audio src={url} controls preload="metadata" onError={fail} />
        ) : shown && kind === 'pdf' ? (
          <PdfView url={url} title={`Preview of ${item.name}`} onFail={fail} />
        ) : shown && kind === 'text' ? (
          <pre dir="auto" aria-busy={!text}>
            {text?.body}
            {text?.cut && <span className={styles.muted}>{'\n'}… Download to see the rest.</span>}
          </pre>
        ) : (
          <div className={styles.quickLookEmpty}>
            <PreviewGlyph item={item} />
            <p>
              {!url
                ? 'No preview available for sample files.'
                : failed
                  ? 'This browser can’t show this file. Download it to open it.'
                  : 'No preview available for this kind of file.'}
            </p>
          </div>
        )}
      </div>
      <div className={styles.dialogActions}>
        <button
          type="button"
          className={styles.buttonQuiet}
          onClick={() => actions.download([item])}
        >
          <Icon name="download" size={18} /> Download
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => {
            onDone();
            actions.share(item);
          }}
        >
          <Icon name="share" size={18} /> Share
        </button>
      </div>
    </div>
  );
}
function PreviewGlyph({ item }: { item: CloudItem }) {
  return (
    <div className={styles.quickLookGlyph}>
      <FileGlyph item={item} />
    </div>
  );
}

function LockScreen({
  user,
  onUnlock,
  onSignOut,
}: {
  user: { name: string; email: string };
  onUnlock: () => void;
  onSignOut: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <div className={styles.lock} role="dialog" aria-modal="true" aria-labelledby="lock-title">
      <div className={styles.lockCard}>
        <span className={styles.lockIcon}>
          <Icon name="lock" size={30} />
        </span>
        <h2 id="lock-title">CloudLand is locked</h2>
        <p>Your files stay hidden until you confirm it’s you ({user.email}).</p>
        <button ref={button} type="button" className={styles.appleButton} onClick={onUnlock}>
          <AppleLogo size={18} /> Unlock with Apple
        </button>
        <button type="button" className={styles.buttonQuiet} onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}

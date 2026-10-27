'use client';
import { useRef, useState, type MouseEvent, type RefObject } from 'react';
import { formatBytes, retentionDays } from '@/lib/cloud/limits';
import {
  daysLeft,
  folderSize,
  groupByDate,
  isShared,
  pathTo,
  sortItems,
  type SortKey,
} from '@/lib/cloud/library';
import { extensionOf } from '@/lib/cloud/files';
import type { CloudItem, FileSection } from '@/lib/cloud/types';
import { FileGlyph, kindLabel } from './FileGlyph';
import { Icon, type IconName } from './Icons';
import { ContextMenu, MenuButton, type MenuItems } from './Overlay';
import type { Preferences } from './model';
import styles from './Cloud.module.css';

export interface BrowserActions {
  open: (item: CloudItem) => void;
  openFolder: (id: string | null) => void;
  trash: (ids: string[]) => void;
  restore: (ids: string[]) => void;
  purge: (ids: string[]) => void;
  emptyTrash: () => void;
  toggleStar: (ids: string[]) => void;
  share: (item: CloudItem) => void;
  copyLink: (item: CloudItem) => void;
  download: (items: CloudItem[]) => void;
  rename: (item: CloudItem) => void;
  info: (item: CloudItem) => void;
  upload: () => void;
  uploadFolder: () => void;
  newFolder: () => void;
  showStorage: () => void;
}

const titles: Record<FileSection, { label: string; icon: IconName }> = {
  recents: { label: 'Recents', icon: 'clock' },
  browse: { label: 'Browse', icon: 'folder' },
  shared: { label: 'Shared', icon: 'people' },
  starred: { label: 'Starred', icon: 'star' },
  deleted: { label: 'Recently Deleted', icon: 'trash' },
};
const sortLabels: Record<SortKey, string> = {
  name: 'Name',
  kind: 'Kind',
  modified: 'Date',
  size: 'Size',
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export function Browser({
  items,
  visible,
  section,
  folder,
  query,
  onQuery,
  searchRef,
  selection,
  onSelection,
  preferences,
  onPreferences,
  now,
  used,
  quota,
  level,
  demo,
  actions,
  onToggleDetails,
  detailsOpen,
}: {
  items: CloudItem[];
  visible: CloudItem[];
  section: FileSection;
  folder?: CloudItem;
  query: string;
  onQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  selection: string[];
  onSelection: (ids: string[]) => void;
  preferences: Preferences;
  onPreferences: (update: (p: Preferences) => Preferences) => void;
  now: number;
  used: number;
  quota: number;
  level: 'ok' | 'warning' | 'critical' | 'full';
  demo: boolean;
  actions: BrowserActions;
  onToggleDetails: () => void;
  detailsOpen: boolean;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItems } | null>(null);
  const [bannerHidden, setBannerHidden] = useState(false);
  const anchor = useRef<string | null>(null);
  const trash = section === 'deleted';
  const recents = section === 'recents' && !query && !folder;
  const sort = recents ? ({ key: 'modified', dir: 'desc' } as const) : preferences.sort;
  const ordered = sortItems(visible, sort, (c) => kindLabel[c]);
  const groups =
    recents && preferences.groupByDate
      ? groupByDate(ordered, now)
      : [{ label: '', items: ordered }];
  const flat = groups.flatMap((group) => group.items);
  const selected = flat.filter((item) => selection.includes(item.id));
  const single = selected.length === 1 ? selected[0] : undefined;
  const display = (item: CloudItem) => {
    if (preferences.showExtensions || item.category === 'folder') return item.name;
    const ext = extensionOf(item.name);
    return ext ? item.name.slice(0, -(ext.length + 1)) : item.name;
  };

  const select = (item: CloudItem, event: MouseEvent) => {
    if (event.shiftKey && anchor.current) {
      const from = flat.findIndex((other) => other.id === anchor.current);
      const to = flat.findIndex((other) => other.id === item.id);
      const range = flat.slice(Math.min(from, to), Math.max(from, to) + 1).map((other) => other.id);
      onSelection(Array.from(new Set([...selection, ...range])));
      return;
    }
    anchor.current = item.id;
    if (event.metaKey || event.ctrlKey)
      onSelection(
        selection.includes(item.id)
          ? selection.filter((id) => id !== item.id)
          : [...selection, item.id],
      );
    else onSelection([item.id]);
  };

  const itemMenu = (item: CloudItem): MenuItems => {
    const ids = selection.includes(item.id) ? selection : [item.id];
    const many = ids.length > 1;
    const targets = flat.filter((other) => ids.includes(other.id));
    if (item.deletedAt)
      return [
        {
          label: many ? `Restore ${ids.length} items` : 'Restore',
          icon: 'restore',
          onSelect: () => actions.restore(ids),
        },
        'separator',
        {
          label: 'Delete permanently…',
          icon: 'trash',
          danger: true,
          onSelect: () => actions.purge(ids),
        },
      ];
    return [
      ...(!many
        ? [
            {
              label: 'Open',
              icon: item.category === 'folder' ? 'folder' : 'eye',
              onSelect: () => actions.open(item),
            } as const,
          ]
        : []),
      { label: 'Get info', icon: 'info', onSelect: () => actions.info(item), shortcut: '⌘I' },
      'separator',
      ...(!many
        ? ([
            { label: 'Share…', icon: 'share', onSelect: () => actions.share(item) },
            { label: 'Copy link', icon: 'link', onSelect: () => actions.copyLink(item) },
            'separator',
          ] as MenuItems)
        : []),
      {
        label: 'Download',
        icon: 'download',
        onSelect: () => actions.download(targets.filter((t) => t.category !== 'folder')),
        disabled: targets.every((t) => t.category === 'folder'),
      },
      ...(!many
        ? [{ label: 'Rename…', icon: 'pencil', onSelect: () => actions.rename(item) } as const]
        : []),
      {
        label: targets.every((t) => t.starred) ? 'Remove from Starred' : 'Add to Starred',
        icon: 'star',
        onSelect: () => actions.toggleStar(ids),
      },
      'separator',
      {
        label: 'Move to Recently Deleted',
        icon: 'trash',
        danger: true,
        onSelect: () => actions.trash(ids),
        shortcut: '⌘⌫',
      },
    ];
  };
  const openMenu = (event: MouseEvent, item?: CloudItem) => {
    event.preventDefault();
    event.stopPropagation();
    if (item && !selection.includes(item.id)) onSelection([item.id]);
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: item
        ? itemMenu(item)
        : trash
          ? [
              {
                label: 'Empty Recently Deleted…',
                icon: 'trash',
                danger: true,
                onSelect: actions.emptyTrash,
              },
            ]
          : [
              { label: 'Upload files…', icon: 'upload', onSelect: actions.upload },
              { label: 'New folder', icon: 'folderPlus', onSelect: actions.newFolder },
            ],
    });
  };

  const title = query
    ? { label: 'Search results', icon: 'search' as IconName }
    : folder
      ? { label: folder.name, icon: 'folder' as IconName }
      : titles[section];
  const trail = folder ? pathTo(items, folder.id) : [];
  const viewMenu: MenuItems = [
    { heading: 'View as' },
    {
      label: 'Grid',
      icon: 'grid',
      checked: preferences.view === 'grid',
      onSelect: () => onPreferences((p) => ({ ...p, view: 'grid' })),
    },
    {
      label: 'List',
      icon: 'list',
      checked: preferences.view === 'list',
      onSelect: () => onPreferences((p) => ({ ...p, view: 'list' })),
    },
    'separator',
    { heading: recents ? 'Recents are sorted by date' : 'Sort by' },
    ...(recents
      ? ([
          {
            label: 'Group by date',
            checked: preferences.groupByDate,
            onSelect: () => onPreferences((p) => ({ ...p, groupByDate: !p.groupByDate })),
          },
        ] as MenuItems)
      : (Object.keys(sortLabels) as SortKey[]).map((key) => ({
          label: sortLabels[key],
          checked: preferences.sort.key === key,
          onSelect: () =>
            onPreferences((p) => ({
              ...p,
              sort: {
                key,
                dir:
                  p.sort.key === key
                    ? p.sort.dir === 'asc'
                      ? 'desc'
                      : 'asc'
                    : key === 'name' || key === 'kind'
                      ? 'asc'
                      : 'desc',
              },
            })),
        }))),
  ];

  return (
    <>
      <div className={styles.toolbar} role="toolbar" aria-label="File actions">
        <MenuButton label="View options" items={viewMenu} className={styles.toolButtonWide}>
          <Icon name={preferences.view === 'grid' ? 'grid' : 'list'} size={19} />
          <Icon name="updown" size={14} />
        </MenuButton>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.toolUpload}`}
          onClick={actions.upload}
          title="Upload files (⌥⌘U)"
          aria-label="Upload files"
          disabled={trash}
        >
          <Icon name="upload" size={22} />
        </button>
        <div className={styles.toolGroup}>
          {trash ? (
            <>
              <ToolButton
                icon="restore"
                label="Restore"
                disabled={!selected.length}
                onClick={() => actions.restore(selection)}
              />
              <ToolButton
                icon="trash"
                label="Delete permanently"
                disabled={!selected.length}
                onClick={() => actions.purge(selection)}
              />
            </>
          ) : (
            <>
              <ToolButton
                icon="download"
                label="Download"
                disabled={!selected.some((s) => s.category !== 'folder')}
                onClick={() => actions.download(selected.filter((s) => s.category !== 'folder'))}
              />
              <ToolButton
                icon="share"
                label="Share"
                disabled={!single}
                onClick={() => single && actions.share(single)}
              />
              <ToolButton
                icon="link"
                label="Copy link"
                disabled={!single}
                onClick={() => single && actions.copyLink(single)}
              />
              <ToolButton
                icon="trash"
                label="Move to Recently Deleted"
                disabled={!selected.length}
                onClick={() => actions.trash(selection)}
              />
            </>
          )}
          <MenuButton
            label="More actions"
            align="end"
            items={
              trash
                ? [
                    {
                      label: 'Restore all',
                      icon: 'restore',
                      onSelect: () => actions.restore(visible.map((v) => v.id)),
                      disabled: !visible.length,
                    },
                    {
                      label: 'Empty Recently Deleted…',
                      icon: 'trash',
                      danger: true,
                      onSelect: actions.emptyTrash,
                      disabled: !visible.length,
                    },
                  ]
                : [
                    {
                      label: 'New folder',
                      icon: 'folderPlus',
                      onSelect: actions.newFolder,
                      shortcut: '⌥⌘N',
                    },
                    { label: 'Upload folder…', icon: 'folder', onSelect: actions.uploadFolder },
                    'separator',
                    {
                      label: 'Rename…',
                      icon: 'pencil',
                      disabled: !single,
                      onSelect: () => single && actions.rename(single),
                    },
                    {
                      label:
                        selected.length && selected.every((s) => s.starred)
                          ? 'Remove from Starred'
                          : 'Add to Starred',
                      icon: 'star',
                      disabled: !selected.length,
                      onSelect: () => actions.toggleStar(selection),
                    },
                    {
                      label: 'Select all',
                      icon: 'check',
                      onSelect: () => onSelection(flat.map((f) => f.id)),
                      shortcut: '⌘A',
                    },
                  ]
            }
          >
            <Icon name="more" size={21} />
          </MenuButton>
          <button
            type="button"
            className={styles.iconButton}
            aria-pressed={detailsOpen}
            aria-label="Show info"
            title="Show info (⌘I)"
            onClick={onToggleDetails}
          >
            <Icon name="info" size={21} />
          </button>
        </div>
        <label className={styles.search}>
          <Icon name="search" size={17} />
          <span className="srOnly">Search CloudLand</span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search CloudLand"
            value={query}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onQuery('');
                event.currentTarget.blur();
              }
            }}
          />
          {!query && <kbd aria-hidden="true">⌘K</kbd>}
        </label>
      </div>

      <div
        className={styles.scroller}
        onClick={(event) => {
          if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.blank)
            onSelection([]);
        }}
        onContextMenu={(event) => openMenu(event)}
      >
        {demo && !bannerHidden && (
          <div className={styles.previewBanner} role="note">
            <Icon name="info" size={18} />
            <p>
              <strong>Preview mode.</strong> Sample files are shown and anything you add stays in
              this tab — nothing is uploaded until CloudLand storage is connected.
            </p>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Dismiss"
              onClick={() => setBannerHidden(true)}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        <div className={styles.titleRow} data-blank>
          {trail.length > 0 && (
            <nav className={styles.breadcrumbs} aria-label="Folder path">
              <button type="button" onClick={() => actions.openFolder(null)}>
                {titles[section === 'shared' ? 'shared' : 'browse'].label}
              </button>
              {trail.map((crumb) => (
                <span key={crumb.id}>
                  <Icon name="chevron" size={14} />
                  {crumb.id === folder?.id ? (
                    <span aria-current="page">{crumb.name}</span>
                  ) : (
                    <button type="button" onClick={() => actions.openFolder(crumb.id)}>
                      {crumb.name}
                    </button>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className={styles.title}>
            <Icon name={title.icon} size={28} />
            {title.label}
          </h1>
          <p className={styles.subtitle}>
            {flat.length} item{flat.length === 1 ? '' : 's'}
            {trash
              ? ` · Items are deleted for good after ${retentionDays} days`
              : `, ${formatBytes(Math.max(0, quota - used))} available`}
          </p>
        </div>

        {level !== 'ok' && !trash && (
          <div className={styles.storageBanner} data-level={level} role="status">
            <Icon name="alert" size={30} />
            <div>
              <strong>
                {level === 'full'
                  ? 'CloudLand storage is full'
                  : 'CloudLand storage is almost full'}
              </strong>
              <p>
                {level === 'full'
                  ? 'New files and edits won’t sync until you free up space.'
                  : 'If you run out of storage, new files and edits won’t be synced to CloudLand.'}
              </p>
              <span className={styles.bannerLinks}>
                <button type="button" onClick={actions.showStorage}>
                  Manage storage
                </button>
              </span>
            </div>
          </div>
        )}

        {flat.length === 0 ? (
          <Empty section={section} query={query} inFolder={Boolean(folder)} actions={actions} />
        ) : preferences.view === 'grid' ? (
          groups.map((group) => (
            <section
              key={group.label || 'all'}
              className={styles.group}
              aria-label={group.label || title.label}
            >
              {group.label && (
                <h2 className={styles.groupTitle}>
                  {group.label}{' '}
                  <span>
                    {group.items.length} item{group.items.length === 1 ? '' : 's'}
                  </span>
                </h2>
              )}
              <ul className={styles.grid} data-blank>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={styles.tile}
                      aria-pressed={selection.includes(item.id)}
                      aria-label={`${item.name}, ${kindLabel[item.category]}`}
                      onClick={(event) => select(item, event)}
                      onDoubleClick={() => actions.open(item)}
                      onContextMenu={(event) => openMenu(event, item)}
                    >
                      <span
                        className={styles.tileArt}
                        data-private={preferences.hidePreviews || undefined}
                      >
                        <FileGlyph item={item} />
                        <Badges item={item} />
                      </span>
                      <span className={styles.tileName}>{display(item)}</span>
                      <span className={styles.tileMeta}>
                        {trash && item.deletedAt
                          ? `${daysLeft(item.deletedAt, now)} days left`
                          : item.category === 'folder'
                            ? folderMeta(items, item)
                            : formatDate(item.modified)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {(['name', 'kind', 'size', 'modified'] as SortKey[]).map((key) => (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={
                      !recents && preferences.sort.key === key
                        ? preferences.sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      disabled={recents}
                      onClick={() =>
                        onPreferences((p) => ({
                          ...p,
                          sort: {
                            key,
                            dir: p.sort.key === key && p.sort.dir === 'asc' ? 'desc' : 'asc',
                          },
                        }))
                      }
                    >
                      {key === 'modified' ? (trash ? 'Deleted' : 'Date modified') : sortLabels[key]}
                      {!recents && preferences.sort.key === key && (
                        <Icon
                          name="chevronDown"
                          size={13}
                          className={preferences.sort.dir === 'asc' ? styles.flip : undefined}
                        />
                      )}
                    </button>
                  </th>
                ))}
                <th scope="col">{trash ? 'Days left' : 'Sharing'}</th>
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.label || 'all'}>
                {group.label && (
                  <tr className={styles.tableGroup}>
                    <th colSpan={5} scope="rowgroup">
                      {group.label}
                    </th>
                  </tr>
                )}
                {group.items.map((item) => (
                  <tr
                    key={item.id}
                    aria-selected={selection.includes(item.id)}
                    onClick={(event) => select(item, event)}
                    onDoubleClick={() => actions.open(item)}
                    onContextMenu={(event) => openMenu(event, item)}
                  >
                    <td>
                      <button
                        type="button"
                        className={styles.rowName}
                        onClick={(event) => {
                          event.stopPropagation();
                          select(item, event);
                        }}
                        onKeyDown={(event) => event.key === 'Enter' && actions.open(item)}
                        aria-pressed={selection.includes(item.id)}
                      >
                        <span data-private={preferences.hidePreviews || undefined}>
                          <FileGlyph item={item} size="small" />
                        </span>
                        {display(item)}
                        {item.starred && <Icon name="star" size={13} className={styles.starMark} />}
                      </button>
                    </td>
                    <td>{kindLabel[item.category]}</td>
                    <td>
                      {item.category === 'folder'
                        ? formatBytes(folderSize(items, item.id))
                        : formatBytes(item.size)}
                    </td>
                    <td>{formatDate(trash && item.deletedAt ? item.deletedAt : item.modified)}</td>
                    <td>
                      {trash && item.deletedAt ? (
                        `${daysLeft(item.deletedAt, now)} days`
                      ) : (
                        <ShareSummary item={item} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        )}
      </div>
      {menu && <ContextMenu at={menu} items={menu.items} onClose={() => setMenu(null)} />}
    </>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={21} />
    </button>
  );
}

function folderMeta(items: CloudItem[], folder: CloudItem) {
  const count = items.filter((item) => item.parentId === folder.id && !item.deletedAt).length;
  return `${count} item${count === 1 ? '' : 's'}`;
}

function Badges({ item }: { item: CloudItem }) {
  const shared = isShared(item);
  if (!shared && !item.starred) return null;
  return (
    <span className={styles.badges}>
      {item.starred && (
        <span title="Starred">
          <Icon name="star" size={12} />
        </span>
      )}
      {shared && (
        <span title="Shared by link">
          <Icon name="link" size={12} />
        </span>
      )}
    </span>
  );
}

function ShareSummary({ item }: { item: CloudItem }) {
  if (item.share.link) return <span className={styles.muted}>Link</span>;
  return <span className={styles.muted}>Only you</span>;
}

function Empty({
  section,
  query,
  inFolder,
  actions,
}: {
  section: FileSection;
  query: string;
  inFolder: boolean;
  actions: BrowserActions;
}) {
  const copy = query
    ? { icon: 'search' as IconName, title: 'No results', body: `Nothing matches “${query}”.` }
    : inFolder
      ? {
          icon: 'folder' as IconName,
          title: 'This folder is empty',
          body: 'Drop files here or upload to add them.',
        }
      : {
          recents: {
            icon: 'clock' as IconName,
            title: 'No recent files',
            body: 'Files you add or open appear here.',
          },
          browse: {
            icon: 'folder' as IconName,
            title: 'Nothing here yet',
            body: 'Drag files anywhere in this window to upload them.',
          },
          shared: {
            icon: 'people' as IconName,
            title: 'Nothing shared',
            body: 'Files you share by link appear here.',
          },
          starred: {
            icon: 'star' as IconName,
            title: 'No starred items',
            body: 'Star files and folders to find them quickly.',
          },
          deleted: {
            icon: 'trash' as IconName,
            title: 'Recently Deleted is empty',
            body: `Deleted items stay here for ${retentionDays} days.`,
          },
        }[section];
  return (
    <div className={styles.empty} data-blank>
      <span className={styles.emptyIcon}>
        <Icon name={copy.icon} size={34} />
      </span>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      {!query && section !== 'deleted' && section !== 'shared' && section !== 'starred' && (
        <button type="button" className={styles.buttonPrimary} onClick={actions.upload}>
          <Icon name="upload" size={18} /> Upload files
        </button>
      )}
    </div>
  );
}

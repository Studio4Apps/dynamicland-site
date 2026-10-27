'use client';
import {
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react';
import {
  canPin,
  clipAge,
  clipDetail,
  clipFilters,
  clipKinds,
  clipTone,
  colorChannels,
  keepRecent,
  sortClips,
  visibleClips,
  webLink,
  type Clip,
  type ClipFilter,
  type ClipKind,
} from '@/lib/cloud/clips';
import { categorize } from '@/lib/cloud/files';
import { clipLand, formatBytes } from '@/lib/cloud/limits';
import { FileGlyph } from './FileGlyph';
import { Icon, type IconName } from './Icons';
import { ContextMenu, Dialog, MenuButton, type MenuItems } from './Overlay';
import type { Toast } from './model';
import styles from './Cloud.module.css';
import css from './ClipLand.module.css';

const kindIcons: Record<ClipKind, IconName> = {
  text: 'text',
  richText: 'textFormat',
  url: 'link',
  image: 'photo',
  file: 'doc',
  color: 'eyedropper',
  code: 'code',
};
const filterIcons: Record<ClipFilter, IconName> = {
  all: 'history',
  pinned: 'pin',
  links: 'link',
  pictures: 'photo',
  code: 'code',
  colors: 'eyedropper',
};

/** PNG is the one picture type every browser's clipboard accepts. */
function pngOf(src: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Pictures will come from R2 presigned URLs; asking for CORS keeps the canvas readable.
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/png');
    };
    image.onerror = () => reject(new Error('load'));
    image.src = src;
  });
}
/** Safari only allows clipboard writes started inside the click, so the PNG is passed as a promise. */
async function writeClip(clip: Clip) {
  if (clip.image) {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write)
      throw new Error('unsupported');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngOf(clip.image.src) })]);
  } else await navigator.clipboard.writeText(clip.text);
}
const sourceName = (clip: Clip) => clip.source?.name ?? 'Clipboard';
const fileLabel = (clip: Clip) => {
  const first = clip.files?.[0]?.name ?? clip.title ?? clip.text;
  const more = (clip.files?.length ?? 1) - 1;
  return more > 0 ? `${first} and ${more} more` : first;
};

export function ClipLand({
  clips,
  onClips,
  keep,
  onKeep,
  now,
  demo,
  hidePreviews,
  searchRef,
  onToast,
}: {
  clips: Clip[];
  onClips: (update: (list: Clip[]) => Clip[]) => void;
  keep: number;
  onKeep: (keep: number) => void;
  now: number;
  demo: boolean;
  hidePreviews: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onToast: (toast: Omit<Toast, 'id'>) => void;
}) {
  const [filter, setFilter] = useState<ClipFilter>('all');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItems } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [bannerHidden, setBannerHidden] = useState(false);
  const shown = visibleClips(clips, filter, query);
  const preview = previewId ? clips.find((clip) => clip.id === previewId) : undefined;
  const pinned = clips.filter((clip) => clip.pinned).length;

  const copy = async (clip: Clip) => {
    try {
      await writeClip(clip);
      onToast({ tone: 'success', title: `${clipKinds[clip.kind].title} copied` });
    } catch {
      onToast({
        tone: 'warning',
        title: 'Couldn’t copy',
        body: clip.image
          ? 'This browser can’t put pictures on the clipboard.'
          : 'Your browser blocked clipboard access.',
      });
    }
  };
  const togglePin = (clip: Clip) => {
    if (!clip.pinned && !canPin(clips))
      return onToast({
        tone: 'info',
        title: `You can pin up to ${clipLand.maxPinned} clips`,
        body: 'Unpin one to make room.',
      });
    onClips((list) => list.map((c) => (c.id === clip.id ? { ...c, pinned: !c.pinned } : c)));
  };
  const restore = (removed: Clip[]) =>
    onClips((list) =>
      sortClips([...list, ...removed.filter((r) => !list.some((c) => c.id === r.id))]),
    );
  const remove = (clip: Clip) => {
    onClips((list) => list.filter((c) => c.id !== clip.id));
    if (previewId === clip.id) setPreviewId(null);
    onToast({
      tone: 'info',
      title: 'Removed from ClipLand',
      body: 'Your Mac keeps its own clipboard history.',
      action: { label: 'Undo', run: () => restore([clip]) },
    });
  };
  const clearUnpinned = () => {
    const removed = clips.filter((clip) => !clip.pinned);
    onClips((list) => list.filter((clip) => clip.pinned));
    onToast({
      tone: 'info',
      title: `Cleared ${removed.length} clip${removed.length === 1 ? '' : 's'}`,
      body: 'Pinned clips stay.',
      action: { label: 'Undo', run: () => restore(removed) },
    });
  };
  const changeKeep = (next: number) => {
    const removed = clips.length - keepRecent(clips, next).length;
    onKeep(next);
    onClips((list) => keepRecent(list, next));
    if (removed > 0)
      onToast({
        tone: 'info',
        title: `Keeping your last ${next} clips`,
        body: `${removed} older clip${removed === 1 ? '' : 's'} removed.`,
      });
  };

  const itemMenu = (clip: Clip): MenuItems => {
    const link = clip.kind === 'url' ? webLink(clip.text) : null;
    return [
      { label: 'Copy', icon: 'copy', onSelect: () => copy(clip), shortcut: '↩' },
      ...(link
        ? [
            {
              label: 'Open link',
              icon: 'globe' as IconName,
              onSelect: () => window.open(link.href, '_blank', 'noopener,noreferrer'),
            },
          ]
        : []),
      { label: 'Preview', icon: 'eye', onSelect: () => setPreviewId(clip.id), shortcut: 'Space' },
      { label: clip.pinned ? 'Unpin' : 'Pin', icon: 'pin', onSelect: () => togglePin(clip) },
      'separator',
      {
        label: 'Remove from ClipLand',
        icon: 'trash',
        danger: true,
        onSelect: () => remove(clip),
        shortcut: '⌫',
      },
    ];
  };

  return (
    <>
      <div className={styles.toolbar} role="toolbar" aria-label="ClipLand">
        <div className={css.filters} role="group" aria-label="Show">
          {clipFilters.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={css.filter}
              style={{ '--filter': entry.color } as CSSProperties}
              aria-pressed={filter === entry.id}
              onClick={() => setFilter(entry.id)}
            >
              <Icon name={filterIcons[entry.id]} size={15} />
              {entry.label}
            </button>
          ))}
        </div>
        <label className={styles.search}>
          <Icon name="search" size={17} />
          <span className="srOnly">Search ClipLand</span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search ClipLand"
            value={query}
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setQuery('');
                event.currentTarget.blur();
              }
            }}
          />
          {!query && <kbd aria-hidden="true">⌘K</kbd>}
        </label>
        <MenuButton
          label="ClipLand options"
          align="end"
          items={[
            { heading: 'Keep the last' },
            ...clipLand.keepChoices.map((n) => ({
              label: `${n} clips`,
              checked: keep === n,
              onSelect: () => changeKeep(n),
            })),
            'separator',
            {
              label: 'Clear unpinned clips',
              icon: 'trash',
              danger: true,
              disabled: pinned === clips.length,
              onSelect: clearUnpinned,
            },
          ]}
        >
          <Icon name="more" size={21} />
        </MenuButton>
      </div>

      <div className={styles.scroller}>
        {demo && !bannerHidden && (
          <div className={styles.previewBanner} role="note">
            <Icon name="info" size={18} />
            <p>
              <strong>Preview mode.</strong> These are sample clips. Once ClipLand is connected,
              what you copy on your Mac with DynamicLand appears here.
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
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <Icon name="clipboard" size={28} />
            ClipLand
          </h1>
          <p className={styles.subtitle}>
            {clips.length} clip{clips.length === 1 ? '' : 's'} · Your last {keep} copies from
            DynamicLand{pinned ? `, plus ${pinned} pinned` : ''}
          </p>
        </div>

        {shown.length ? (
          <ul className={css.grid}>
            {shown.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                now={now}
                veiled={hidePreviews}
                menu={itemMenu(clip)}
                onCopy={() => copy(clip)}
                onPreview={() => setPreviewId(clip.id)}
                onPin={() => togglePin(clip)}
                onRemove={() => remove(clip)}
                onMenu={(event) => {
                  event.preventDefault();
                  setMenu({ x: event.clientX, y: event.clientY, items: itemMenu(clip) });
                }}
              />
            ))}
          </ul>
        ) : (
          <Empty clips={clips.length} filter={filter} query={query} keep={keep} />
        )}
      </div>

      {menu && <ContextMenu at={menu} items={menu.items} onClose={() => setMenu(null)} />}
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreviewId(null)}
        title={preview ? `${clipKinds[preview.kind].title} from ${sourceName(preview)}` : ''}
        description={
          preview
            ? [clipAge(preview.copiedAt, now), clipDetail(preview)].filter(Boolean).join(' · ')
            : undefined
        }
        wide
      >
        {preview && (
          <ClipPreview
            key={preview.id}
            clip={preview}
            veiled={hidePreviews}
            onCopy={() => copy(preview)}
            onPin={() => togglePin(preview)}
            onRemove={() => remove(preview)}
          />
        )}
      </Dialog>
    </>
  );
}

function ClipCard({
  clip,
  now,
  veiled,
  menu,
  onCopy,
  onPreview,
  onPin,
  onRemove,
  onMenu,
}: {
  clip: Clip;
  now: number;
  veiled: boolean;
  menu: MenuItems;
  onCopy: () => void;
  onPreview: () => void;
  onPin: () => void;
  onRemove: () => void;
  onMenu: (event: MouseEvent) => void;
}) {
  const bodyId = useId();
  const tone = clipTone(clip);
  const kind = clipKinds[clip.kind];
  const age = clipAge(clip.copiedAt, now);
  const keys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ') {
      event.preventDefault();
      onPreview();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      // Keep the keyboard in the grid: focus moves to the neighbouring card.
      const slot = event.currentTarget.closest('li');
      const next = (slot?.nextElementSibling ?? slot?.previousElementSibling)?.querySelector(
        'button',
      );
      onRemove();
      requestAnimationFrame(() => next?.focus());
    }
  };
  return (
    <li>
      <article
        className={css.card}
        style={{ '--clip-accent': tone.color } as CSSProperties}
        data-ink={tone.ink}
        data-pinned={clip.pinned || undefined}
        data-veiled={veiled || undefined}
        onContextMenu={onMenu}
      >
        <button
          type="button"
          className={css.cardMain}
          aria-label={`Copy ${kind.title.toLowerCase()} from ${sourceName(clip)}, ${age}`}
          aria-describedby={bodyId}
          onClick={onCopy}
          onKeyDown={keys}
          onKeyUp={(event) => event.key === ' ' && event.preventDefault()}
        >
          <span className={css.header}>
            <span className={css.kind}>{kind.title}</span>
            <span className={css.age}>{age}</span>
          </span>
          <span className={css.body} id={bodyId}>
            <ClipBody clip={clip} />
          </span>
          <span className={css.footer}>
            <span className={css.source}>{sourceName(clip)}</span>
            <span>{clipDetail(clip)}</span>
          </span>
        </button>
        <span className={css.badge} aria-hidden="true">
          {clip.source?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clip.source.icon} alt="" draggable={false} />
          ) : (
            <span className={css.symbol}>
              <Icon name={kindIcons[clip.kind]} size={21} />
            </span>
          )}
        </span>
        <div className={css.actions}>
          <MenuButton label="Clip actions" items={menu} align="end" className={css.moreButton}>
            <Icon name="dots" size={16} />
          </MenuButton>
          <button
            type="button"
            className={css.pinButton}
            aria-pressed={clip.pinned}
            aria-label={clip.pinned ? 'Unpin' : 'Pin'}
            title={clip.pinned ? 'Unpin' : 'Pin'}
            onClick={onPin}
          >
            <Icon name="pin" size={14} />
          </button>
        </div>
      </article>
    </li>
  );
}

function ClipBody({ clip }: { clip: Clip }) {
  switch (clip.kind) {
    case 'image':
      return (
        <span className={css.picture}>
          {clip.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clip.image.src} alt="" loading="lazy" decoding="async" draggable={false} />
          )}
        </span>
      );
    case 'color': {
      const valid = colorChannels(clip.text) !== null;
      return (
        <span
          className={css.swatch}
          style={valid ? ({ '--swatch': clip.text } as CSSProperties) : undefined}
        >
          <span>{clip.text.toUpperCase()}</span>
        </span>
      );
    }
    case 'file': {
      const name = clip.files?.[0]?.name ?? clip.title ?? clip.text;
      return (
        <span className={css.file}>
          <FileGlyph item={{ name, category: categorize(name) }} />
          <span dir="auto">{fileLabel(clip)}</span>
        </span>
      );
    }
    case 'url': {
      const link = webLink(clip.text);
      const host = link?.hostname.replace(/^www\./, '');
      return (
        <span className={css.link}>
          <span className={css.monogram} aria-hidden="true">
            {(host ?? clip.text).slice(0, 1).toUpperCase()}
          </span>
          <span className={css.linkTitle} dir="auto">
            {clip.title ?? clip.text}
          </span>
          <span className={css.linkHost}>
            {link ? `${host}${link.pathname === '/' ? '' : link.pathname}` : clip.text}
          </span>
        </span>
      );
    }
    case 'code':
      return <span className={css.code}>{clip.text}</span>;
    default:
      return (
        <span className={css.text} dir="auto">
          {clip.text}
        </span>
      );
  }
}

function ClipPreview({
  clip,
  veiled,
  onCopy,
  onPin,
  onRemove,
}: {
  clip: Clip;
  veiled: boolean;
  onCopy: () => void;
  onPin: () => void;
  onRemove: () => void;
}) {
  const link = clip.kind === 'url' ? webLink(clip.text) : null;
  const channels = clip.kind === 'color' ? colorChannels(clip.text) : null;
  const tone = clipTone(clip);
  return (
    <div className={styles.quickLook}>
      <div
        className={`${styles.quickLookStage} ${css.stage}`}
        data-kind={clip.kind}
        data-veiled={veiled || undefined}
        style={{ '--clip-accent': tone.color } as CSSProperties}
      >
        {clip.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.image.src} alt="Copied picture" />
        ) : clip.kind === 'color' ? (
          <span
            className={css.stageSwatch}
            style={channels ? ({ '--swatch': clip.text } as CSSProperties) : undefined}
          >
            <span>{clip.text.toUpperCase()}</span>
            {channels && <small>RGB {channels}</small>}
          </span>
        ) : clip.kind === 'url' ? (
          <div className={css.stageLink}>
            <span className={css.monogram} aria-hidden="true">
              {(link?.hostname.replace(/^www\./, '') ?? clip.text).slice(0, 1).toUpperCase()}
            </span>
            <strong dir="auto">{clip.title ?? clip.text}</strong>
            {link ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.href}
              </a>
            ) : (
              <span>{clip.text}</span>
            )}
          </div>
        ) : clip.kind === 'file' ? (
          <div className={css.stageFiles}>
            <ul>
              {(clip.files ?? [{ name: clip.text }]).map((file, i) => (
                <li key={i}>
                  <FileGlyph
                    item={{ name: file.name, category: categorize(file.name) }}
                    size="small"
                  />
                  <span dir="auto">{file.name}</span>
                  {file.size ? (
                    <span className={styles.muted}>{formatBytes(file.size)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p>Files stay on your Mac. Copy puts the file name on the clipboard.</p>
          </div>
        ) : (
          <pre dir="auto" data-code={clip.kind === 'code' || undefined}>
            {clip.text}
          </pre>
        )}
      </div>
      <div className={styles.dialogActions}>
        <button
          type="button"
          className={`${styles.buttonQuiet} ${css.removeButton}`}
          onClick={onRemove}
        >
          <Icon name="trash" size={18} /> Remove
        </button>
        <button type="button" className={styles.buttonQuiet} onClick={onPin}>
          <Icon name="pin" size={18} /> {clip.pinned ? 'Unpin' : 'Pin'}
        </button>
        {link && (
          <a
            className={styles.buttonQuiet}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="globe" size={18} /> Open link
          </a>
        )}
        <button type="button" className={styles.buttonPrimary} onClick={onCopy}>
          <Icon name="copy" size={18} /> Copy
        </button>
      </div>
    </div>
  );
}

function Empty({
  clips,
  filter,
  query,
  keep,
}: {
  clips: number;
  filter: ClipFilter;
  query: string;
  keep: number;
}) {
  const label = clipFilters.find((entry) => entry.id === filter)!.label.toLowerCase();
  const copy = query
    ? {
        icon: 'search' as IconName,
        title: 'No results',
        body: `Nothing in ClipLand matches “${query}”.`,
      }
    : !clips
      ? {
          icon: 'clipboard' as IconName,
          title: 'Nothing copied yet',
          body: 'Turn on ClipLand in DynamicLand on your Mac, under Settings › Clipboard. What you copy there appears here.',
        }
      : filter === 'pinned'
        ? {
            icon: 'pin' as IconName,
            title: 'No pinned clips',
            body: `Pin a clip to keep it past your last ${keep}.`,
          }
        : {
            icon: filterIcons[filter],
            title: `No ${label} yet`,
            body: `${label[0].toUpperCase()}${label.slice(1)} you copy on your Mac appear here.`,
          };
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <Icon name={copy.icon} size={34} />
      </span>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
    </div>
  );
}

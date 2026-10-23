'use client';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from './Icons';
import styles from './Cloud.module.css';

/** Native modal dialog: the browser supplies the focus trap, inert background and Escape. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.dialogWide : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className={styles.dialogBody}>
          <header className={styles.dialogHeader}>
            <div>
              <h2 id={titleId}>{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}

export interface MenuEntry {
  label: string;
  icon?: IconName;
  onSelect: () => void;
  checked?: boolean;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
}
export type MenuItems = (MenuEntry | 'separator' | { heading: string })[];

function MenuList({
  items,
  onDone,
  label,
}: {
  items: MenuItems;
  onDone: () => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)')?.focus();
  }, []);
  const keys = (event: KeyboardEvent) => {
    const entries = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)') ?? [],
    );
    const at = entries.indexOf(document.activeElement as HTMLButtonElement);
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (move) {
      event.preventDefault();
      entries[(at + move + entries.length) % entries.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      entries[event.key === 'Home' ? 0 : entries.length - 1]?.focus();
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      onDone();
    }
  };
  return (
    <div ref={ref} role="menu" aria-label={label} className={styles.menu} onKeyDown={keys}>
      {items.map((entry, i) =>
        entry === 'separator' ? (
          <hr key={i} />
        ) : 'heading' in entry ? (
          <span key={i} className={styles.menuHeading}>
            {entry.heading}
          </span>
        ) : (
          <button
            key={i}
            type="button"
            role={entry.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
            aria-checked={entry.checked}
            disabled={entry.disabled}
            className={entry.danger ? styles.menuDanger : undefined}
            onClick={() => {
              onDone();
              entry.onSelect();
            }}
          >
            {entry.icon ? (
              <Icon name={entry.icon} size={18} />
            ) : (
              <span className={styles.menuGap} />
            )}
            <span>{entry.label}</span>
            {entry.checked && <Icon name="check" size={16} className={styles.menuCheck} />}
            {entry.shortcut && <kbd>{entry.shortcut}</kbd>}
          </button>
        ),
      )}
    </div>
  );
}

function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const down = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const key = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && close();
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
      window.removeEventListener('blur', close);
    };
  }, [open, close, root]);
}

/** A button that opens a menu below it. */
export function MenuButton({
  label,
  items,
  children,
  className,
  align = 'start',
  disabled,
}: {
  label: string;
  items: MenuItems;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root);
  return (
    <div ref={root} className={styles.menuAnchor} data-align={align}>
      <button
        type="button"
        className={className ?? styles.iconButton}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        {children}
      </button>
      {open && (
        <MenuList
          items={items}
          label={label}
          onDone={() => {
            setOpen(false);
            root.current?.querySelector('button')?.focus();
          }}
        />
      )}
    </div>
  );
}

/** A menu opened at the pointer, kept inside the viewport. */
export function ContextMenu({
  at,
  items,
  onClose,
}: {
  at: { x: number; y: number };
  items: MenuItems;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useDismiss(true, onClose, root);
  useLayoutEffect(() => {
    const menu = root.current;
    if (!menu) return;
    const box = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(at.x, innerWidth - box.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(at.y, innerHeight - box.height - 8))}px`;
  }, [at]);
  return (
    <div
      ref={root}
      className={styles.contextMenu}
      style={{ left: at.x, top: at.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuList items={items} onDone={onClose} label="Item actions" />
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

'use client';
import { autoLockChoices, formatBytes, retentionDays, type Plan } from '@/lib/cloud/limits';
import { expiryLabels } from '@/lib/cloud/files';
import { usageByCategory } from '@/lib/cloud/library';
import type { CloudItem, LinkExpiry, NoticeKind } from '@/lib/cloud/types';
import { FileGlyph } from './FileGlyph';
import { Icon, AppleLogo, type IconName } from './Icons';
import { Dialog, Segmented, Switch } from './Overlay';
import { relativeTime } from './Panels';
import type { Activity, Preferences, Session } from './model';
import styles from './Cloud.module.css';

export type SettingsTab =
  'general' | 'storage' | 'sharing' | 'notifications' | 'security' | 'shortcuts';
const tabs: { id: SettingsTab; label: string; icon: IconName }[] = [
  { id: 'general', label: 'General', icon: 'gear' },
  { id: 'storage', label: 'Storage', icon: 'storage' },
  { id: 'sharing', label: 'Sharing', icon: 'people' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'shortcuts', label: 'Shortcuts', icon: 'sparkle' },
];
const usageColors = {
  photos: '#ff9f0a',
  videos: '#ff375f',
  documents: '#0a84ff',
  other: '#a970ff',
};
const usageLabels = {
  photos: 'Photos',
  videos: 'Movies & audio',
  documents: 'Documents',
  other: 'Other',
};
const noticeLabels: Record<NoticeKind, [string, string]> = {
  upload: ['Uploads', 'When uploads finish or can’t be completed'],
  share: ['Sharing', 'When a link you made is about to expire'],
  storage: ['Storage', 'When you reach 80%, 95% and 100% of your storage'],
  security: ['Security', 'New sign-ins and session changes'],
  system: ['Connection', 'When you go offline or come back'],
};

export function SettingsDialog({
  tab,
  onTab,
  onClose,
  preferences,
  onPreferences,
  items,
  used,
  plan,
  activity,
  sessions,
  user,
  now,
  onEndSession,
  onEndOthers,
  onEmptyTrash,
  onTrash,
  onDesktopAlerts,
}: {
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  onClose: () => void;
  preferences: Preferences;
  onPreferences: (update: (p: Preferences) => Preferences) => void;
  items: CloudItem[];
  used: number;
  plan: Plan;
  activity: Activity[];
  sessions: Session[];
  user: { name: string; email: string };
  now: number;
  onEndSession: (id: string) => void;
  onEndOthers: () => void;
  onEmptyTrash: () => void;
  onTrash: (ids: string[]) => void;
  onDesktopAlerts: (on: boolean) => void;
}) {
  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    onPreferences((p) => ({ ...p, [key]: value }));
  const usage = usageByCategory(items);
  const deleted = items.filter((item) => item.deletedAt);
  const deletedSize = deleted.reduce((sum, item) => sum + item.size, 0);
  const largest = items
    .filter((item) => item.category !== 'folder' && !item.deletedAt)
    .sort((a, b) => b.size - a.size)
    .slice(0, 4);

  return (
    <Dialog open onClose={onClose} title="Settings" wide>
      <div className={styles.settings}>
        <nav className={styles.settingsNav} aria-label="Settings sections">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={tab === entry.id ? 'page' : undefined}
              onClick={() => onTab(entry.id)}
            >
              <Icon name={entry.icon} size={18} />
              {entry.label}
            </button>
          ))}
        </nav>
        <div className={styles.settingsPane}>
          {tab === 'general' && (
            <>
              <Group title="Appearance">
                <Row label="Theme">
                  <Segmented
                    label="Theme"
                    value={preferences.theme}
                    onChange={(theme) => set('theme', theme)}
                    options={[
                      { value: 'system', label: 'Auto' },
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                    ]}
                  />
                </Row>
                <Row label="Default view">
                  <Segmented
                    label="Default view"
                    value={preferences.view}
                    onChange={(view) => set('view', view)}
                    options={[
                      { value: 'grid', label: 'Grid' },
                      { value: 'list', label: 'List' },
                    ]}
                  />
                </Row>
              </Group>
              <Group title="Files">
                <Toggle
                  label="Show file extensions"
                  checked={preferences.showExtensions}
                  onChange={(v) => set('showExtensions', v)}
                />
                <Toggle
                  label="Group Recents by date"
                  checked={preferences.groupByDate}
                  onChange={(v) => set('groupByDate', v)}
                />
                <Toggle
                  label="Ask before deleting permanently"
                  detail={`Items in Recently Deleted are removed automatically after ${retentionDays} days.`}
                  checked={preferences.confirmPermanentDelete}
                  onChange={(v) => set('confirmPermanentDelete', v)}
                />
              </Group>
            </>
          )}

          {tab === 'storage' && (
            <>
              <Group title={`${plan.name} · ${formatBytes(plan.quota)}`}>
                <div className={styles.usage}>
                  <p className={styles.usageHeadline}>
                    <strong>{formatBytes(used)}</strong> of {formatBytes(plan.quota)} used
                  </p>
                  <div
                    className={styles.usageBar}
                    role="img"
                    aria-label={`${formatBytes(used)} of ${formatBytes(plan.quota)} used`}
                  >
                    {(Object.keys(usage) as (keyof typeof usage)[]).map((key) => (
                      <span
                        key={key}
                        style={{
                          width: `${(usage[key] / plan.quota) * 100}%`,
                          background: usageColors[key],
                        }}
                      />
                    ))}
                  </div>
                  <ul className={styles.legend}>
                    {(Object.keys(usage) as (keyof typeof usage)[]).map((key) => (
                      <li key={key}>
                        <span style={{ background: usageColors[key] }} />
                        {usageLabels[key]} <em>{formatBytes(usage[key])}</em>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.hint}>
                    Up to {formatBytes(plan.maxFileSize)} per file. Files in Recently Deleted count
                    towards your storage until they’re removed. Your subscription is managed in
                    DynamicLand on your Mac.
                  </p>
                </div>
              </Group>
              <Group title="Largest files">
                {largest.map((item) => (
                  <div key={item.id} className={styles.fileRow}>
                    <FileGlyph item={item} size="small" />
                    <span>
                      {item.name}
                      <small>{formatBytes(item.size)}</small>
                    </span>
                    <button
                      type="button"
                      className={styles.buttonQuiet}
                      onClick={() => onTrash([item.id])}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </Group>
              <Group title="Recently Deleted">
                <Row
                  label={`${deleted.length} item${deleted.length === 1 ? '' : 's'} · ${formatBytes(deletedSize)}`}
                >
                  <button
                    type="button"
                    className={styles.buttonQuiet}
                    disabled={!deleted.length}
                    onClick={onEmptyTrash}
                  >
                    Empty now
                  </button>
                </Row>
              </Group>
            </>
          )}

          {tab === 'sharing' && (
            <Group title="Defaults for new shares">
              <Row label="Links expire after">
                <select
                  className={styles.select}
                  value={preferences.defaultExpiry}
                  onChange={(e) => set('defaultExpiry', e.target.value as LinkExpiry)}
                >
                  {(Object.keys(expiryLabels) as LinkExpiry[]).map((key) => (
                    <option key={key} value={key}>
                      {expiryLabels[key]}
                    </option>
                  ))}
                </select>
              </Row>
              <p className={styles.hint}>
                Links are view-only, last {expiryLabels['14d']} at most and stop working after{' '}
                {plan.maxLinkDownloads} downloads. People who have the link don’t need an account.
              </p>
            </Group>
          )}

          {tab === 'notifications' && (
            <>
              <Group title="Show alerts in CloudLand">
                {(Object.keys(noticeLabels) as NoticeKind[]).map((kind) => (
                  <Toggle
                    key={kind}
                    label={noticeLabels[kind][0]}
                    detail={noticeLabels[kind][1]}
                    checked={preferences.toasts[kind]}
                    onChange={(v) =>
                      onPreferences((p) => ({ ...p, toasts: { ...p.toasts, [kind]: v } }))
                    }
                  />
                ))}
                <p className={styles.hint}>
                  Critical alerts, like running out of storage, always appear. Everything is kept in
                  Notifications.
                </p>
              </Group>
              <Group title="Desktop">
                <Toggle
                  label="Desktop notifications"
                  detail="Alerts from CloudLand when this tab is in the background."
                  checked={preferences.desktopAlerts}
                  onChange={onDesktopAlerts}
                />
              </Group>
            </>
          )}

          {tab === 'security' && (
            <>
              <Group title="Account">
                <div className={styles.fileRow}>
                  <span className={styles.appleMark}>
                    <AppleLogo size={18} />
                  </span>
                  <span>
                    Signed in with Apple
                    <small>{user.email} · Hide My Email is supported</small>
                  </span>
                </div>
              </Group>
              <Group title="Lock">
                <Row label="Lock after inactivity">
                  <select
                    className={styles.select}
                    value={preferences.autoLock}
                    onChange={(e) =>
                      set('autoLock', Number(e.target.value) as Preferences['autoLock'])
                    }
                  >
                    {autoLockChoices.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes < 60 ? `${minutes} minutes` : '1 hour'}
                      </option>
                    ))}
                  </select>
                </Row>
                <Toggle
                  label="Lock when this tab is hidden"
                  checked={preferences.lockWhenHidden}
                  onChange={(v) => set('lockWhenHidden', v)}
                />
                <Toggle
                  label="Blur previews"
                  detail="Hide thumbnails until a file is opened, for screen sharing and public places."
                  checked={preferences.hidePreviews}
                  onChange={(v) => set('hidePreviews', v)}
                />
              </Group>
              <Group title="Where you’re signed in">
                {sessions.map((session) => (
                  <div key={session.id} className={styles.fileRow}>
                    <span className={styles.appleMark}>
                      <Icon name={session.phone ? 'phone' : 'device'} size={18} />
                    </span>
                    <span>
                      {session.device}
                      <small>{session.current ? 'This session' : session.detail}</small>
                    </span>
                    {!session.current && (
                      <button
                        type="button"
                        className={styles.buttonQuiet}
                        onClick={() => onEndSession(session.id)}
                      >
                        Sign out
                      </button>
                    )}
                  </div>
                ))}
                <Row label="Sign out everywhere else">
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    disabled={sessions.length < 2}
                    onClick={onEndOthers}
                  >
                    Sign out others
                  </button>
                </Row>
              </Group>
              <Group title="Protection">
                <ul className={styles.protections}>
                  <li>
                    <Icon name="check" size={15} /> Strict Content Security Policy with per-request
                    nonces
                  </li>
                  <li>
                    <Icon name="check" size={15} /> Isolated from other sites (COOP, COEP, CORP)
                  </li>
                  <li>
                    <Icon name="check" size={15} /> Never cached, never indexed, can’t be framed
                  </li>
                  <li>
                    <Icon name="check" size={15} /> Cross-site requests are rejected
                  </li>
                  <li>
                    <Icon name="check" size={15} /> File names are cleaned of hidden and spoofing
                    characters
                  </li>
                  <li>
                    <Icon name="check" size={15} /> Links can’t carry apps or scripts
                  </li>
                </ul>
              </Group>
              <Group title="Recent activity">
                <ul className={styles.activity}>
                  {activity.slice(0, 12).map((entry) => (
                    <li key={entry.id}>
                      <span>{entry.text}</span>
                      <time dateTime={entry.at}>{relativeTime(entry.at, now)}</time>
                    </li>
                  ))}
                </ul>
              </Group>
            </>
          )}

          {tab === 'shortcuts' && (
            <Group title="Keyboard shortcuts">
              <dl className={styles.shortcuts}>
                {[
                  ['⌘K or /', 'Search'],
                  ['⌥⌘U', 'Upload files'],
                  ['⌥⌘N', 'New folder'],
                  ['⌘A', 'Select all'],
                  ['⇧ Click', 'Select a range'],
                  ['⌘ Click', 'Add to selection'],
                  ['Space', 'Quick Look'],
                  ['Return', 'Open'],
                  ['⌘I', 'Show info'],
                  ['⌘⌫', 'Move to Recently Deleted'],
                  ['Esc', 'Clear selection'],
                ].map(([keys, label]) => (
                  <div key={keys}>
                    <dt>{label}</dt>
                    <dd>
                      <kbd>{keys}</kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </Group>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.settingsGroup}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.optionRow}>
      <span>{label}</span>
      {children}
    </div>
  );
}
function Toggle({
  label,
  detail,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.optionRow}>
      <span>
        {label}
        {detail && <small>{detail}</small>}
      </span>
      <Switch label={label} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

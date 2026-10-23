import type { FileCategory, LinkExpiry } from './types';

const extensions: Record<Exclude<FileCategory, 'folder' | 'other'>, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'avif', 'svg', 'tiff', 'bmp'],
  video: ['mov', 'mp4', 'm4v', 'webm', 'mkv', 'avi'],
  audio: ['mp3', 'm4a', 'aac', 'wav', 'flac', 'aiff', 'ogg'],
  pdf: ['pdf'],
  document: ['doc', 'docx', 'pages', 'txt', 'rtf', 'md', 'odt'],
  spreadsheet: ['xls', 'xlsx', 'numbers', 'csv', 'ods'],
  presentation: ['ppt', 'pptx', 'key', 'odp'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'],
  code: ['js', 'ts', 'tsx', 'json', 'swift', 'py', 'html', 'css', 'xml', 'yml', 'yaml', 'sh'],
};
/** Types that can run code when opened. They can be stored, but never shared by public link. */
const executable = new Set([
  'app',
  'apk',
  'bat',
  'cmd',
  'com',
  'dmg',
  'exe',
  'jar',
  'js',
  'msi',
  'pkg',
  'ps1',
  'scr',
  'sh',
  'vbs',
  'command',
  'workflow',
  'html',
  'htm',
  'svg',
]);

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}
export function categorize(name: string): FileCategory {
  const ext = extensionOf(name);
  for (const [category, list] of Object.entries(extensions))
    if (list.includes(ext)) return category as FileCategory;
  return 'other';
}
export function isExecutable(name: string): boolean {
  return executable.has(extensionOf(name));
}

/** Files the browser shows as plain text in Quick View. Markup is never rendered, only read. */
const textExtensions = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'tsv',
  'log',
  'json',
  'xml',
  'yml',
  'yaml',
  'js',
  'jsx',
  'ts',
  'tsx',
  'swift',
  'py',
  'html',
  'htm',
  'css',
  'sh',
]);
export type QuickViewKind = 'image' | 'video' | 'audio' | 'pdf' | 'text';
/** How Quick View shows a file, using only what the browser renders natively; null means download only. */
export function quickViewKind(name: string): QuickViewKind | null {
  const category = categorize(name);
  if (category === 'image' || category === 'video' || category === 'audio' || category === 'pdf')
    return category;
  return textExtensions.has(extensionOf(name)) ? 'text' : null;
}
/** Quick View reads at most this much of a text file. */
export const quickViewTextLimit = 512_000;

// Bidirectional overrides (U+202E) make "invoice<RLO>fdp.exe" read as "invoiceexe.pdf"; control characters hide text.
const hiddenRanges = [
  [0x0000, 0x001f],
  [0x007f, 0x009f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2069],
  [0x061c, 0x061c],
  [0xfeff, 0xfeff],
];
const codeUnit = (n: number) => `\\u${n.toString(16).padStart(4, '0')}`;
const hidden = new RegExp(
  `[${hiddenRanges.map(([a, b]) => `${codeUnit(a)}-${codeUnit(b)}`).join('')}]`,
  'g',
);
const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

export type NameResult = { ok: true; name: string } | { ok: false; reason: string };
export function sanitizeName(raw: string): NameResult {
  const name = raw
    .normalize('NFC')
    .replace(hidden, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name || /^\.+$/.test(name)) return { ok: false, reason: 'Enter a name.' };
  if (new TextEncoder().encode(name).length > 255)
    return { ok: false, reason: 'That name is too long.' };
  if (reserved.test(name)) return { ok: false, reason: 'That name is reserved by the system.' };
  return { ok: true, name };
}

/** “Report.pdf” → “Report 2.pdf”, the way Finder and iCloud resolve a clash. */
export function uniqueName(name: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (n) => n.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  const ext = extensionOf(name);
  const stem = ext ? name.slice(0, -(ext.length + 1)) : name;
  for (let i = 2; ; i++) {
    const candidate = `${stem} ${i}${ext ? `.${ext}` : ''}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

export interface UploadCandidate {
  name: string;
  size: number;
}
export interface UploadPlan<T extends UploadCandidate> {
  accepted: { file: T; name: string }[];
  rejected: { name: string; reason: string }[];
}
export function planUpload<T extends UploadCandidate>(
  files: T[],
  options: { used: number; quota: number; maxFileSize: number; maxFiles: number; taken: string[] },
): UploadPlan<T> {
  const plan: UploadPlan<T> = { accepted: [], rejected: [] };
  const taken = [...options.taken];
  let used = options.used;
  for (const [index, file] of files.entries()) {
    const clean = sanitizeName(file.name);
    if (!clean.ok) plan.rejected.push({ name: file.name || 'Untitled', reason: clean.reason });
    else if (index >= options.maxFiles)
      plan.rejected.push({
        name: clean.name,
        reason: `Up to ${options.maxFiles} files at a time.`,
      });
    else if (file.size > options.maxFileSize)
      plan.rejected.push({ name: clean.name, reason: 'Larger than the per-file limit.' });
    else if (used + file.size > options.quota)
      plan.rejected.push({ name: clean.name, reason: 'Not enough storage.' });
    else {
      const name = uniqueName(clean.name, taken);
      taken.push(name);
      used += file.size;
      plan.accepted.push({ file, name });
    }
  }
  return plan;
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
    email,
  )
    ? email
    : null;
}

export const expiryLabels: Record<LinkExpiry, string> = {
  '1d': '1 day',
  '7d': '7 days',
  '14d': '14 days',
};

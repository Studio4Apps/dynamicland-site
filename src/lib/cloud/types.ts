export type FileCategory =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'other';

/** Links always expire; 14 days is the longest a file stays reachable from outside. */
export type LinkExpiry = '1d' | '7d' | '14d';

/** Sharing is a view-only link the owner copies and sends; recipients don't sign in. */
export interface ShareSettings {
  link: boolean;
  expiry: LinkExpiry;
  allowDownload: boolean;
  token?: string;
}
export interface CloudItem {
  id: string;
  name: string;
  category: FileCategory;
  size: number;
  modified: string;
  parentId: string | null;
  starred: boolean;
  deletedAt?: string;
  share: ShareSettings;
  /** Object URL for a file added in this tab. Never persisted or sent anywhere. */
  localUrl?: string;
}

export type NoticeKind = 'upload' | 'share' | 'storage' | 'security' | 'system';
export type NoticeTone = 'info' | 'success' | 'warning' | 'critical';
export interface Notice {
  id: string;
  kind: NoticeKind;
  tone: NoticeTone;
  title: string;
  body?: string;
  at: string;
  read: boolean;
}
export type Section = 'recents' | 'browse' | 'shared' | 'starred' | 'deleted';

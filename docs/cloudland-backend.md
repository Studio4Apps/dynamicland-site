# CloudLand backend decisions (Supabase + Cloudflare)

Owner decisions from 2026-10-23 for the backend that is not built yet. The guiding rule is the lowest running cost on Supabase and Cloudflare that still gives an excellent experience. Section numbers match the review list, so they can be referenced as "1.3", "2.2", etc. The browser copy of each limit lives in `src/lib/cloud/limits.ts`; the server must enforce the same numbers.

Proposed architecture: Supabase for Sign in with Apple, Postgres metadata and RLS; Cloudflare R2 for file bytes (no egress fees), reached through short-lived presigned URLs so bytes never pass through a Worker or Supabase. Re-check R2 and Supabase pricing and limits before building.

## 1. Plan and storage

- **1.1 One plan:** DynamicLand Pro: 5 GB, 1 GB per file. Bought in the DynamicLand Mac app (App Store: $0.99 monthly or $3.99 yearly). There is no free tier and no upgrade.
- **1.2** The web app never says "free" and never shows an upgrade or pricing link. Subscription state comes from App Store Server Notifications V2.
- **1.3 1 GB per file:** storage cost depends on the 5 GB quota, not on file size. Upload with a single presigned `PUT` straight to R2 (one request per file, under R2's single-upload limit and clear of the Worker body limit). No multipart.
- **1.4** Up to 50 files per upload batch.
- **1.5** Sizes are decimal bytes, like Apple. See Later.
- **1.6** Files in Recently Deleted count towards the quota.
- **1.7** A file counts only towards its owner's quota. If a CloudLand user saves a copy of someone's shared file, the copy is theirs and counts towards their quota (server-side R2 copy, no re-upload).
- **1.8** Storage alerts at 80%, 95% and 100%.

## 2. Retention

- **2.1** Share links always expire: 1, 7 or 14 days. There is no "Never".
- **2.2** Recently Deleted keeps items for 7 days. A daily job deletes the R2 objects and then the rows.
- **2.3 Lifecycle (approved):**
  - Subscription ends (`EXPIRED`): the account becomes read-only (view and download only: no uploads, links switched off) for 30 days, with in-app reminders. After 30 days, delete every R2 object and file row; keep the account row. Resubscribing within 30 days restores everything. Apple's own billing grace period runs before this and changes nothing.
  - Account deletion from settings (required by App Store rules): delete files and rows immediately and revoke the Sign in with Apple token.
  - Inactive accounts that are still subscribed are left alone, because they are paying. The deadline is set by the subscription, never by sign-ins: someone who pays for one month, uploads, and returns two years later finds their files already deleted 30 days after the month ended. See Later.
  - Expired or download-exhausted link rows are deleted by the daily job.
  - Uploads that never complete: delete pending rows and R2 objects after 24 hours.
- **2.4** Keep the last 50 activity entries and the last 50 notifications per user (the browser already caps at 50). On the server, also drop anything older than 30 days.

## 3. Sharing

- **3.1 / 3.2** Sharing is view-only. No editors and no invitations by email.
- **3.3 / 3.5 / 3.6** A share is a link the owner copies and sends however they like. Recipients don't sign in. No email is ever sent.
- **3.4** Each link stops after 25 downloads (`plan.maxLinkDownloads`). Count a download when the presigned GET is issued, not per byte range.
- **3.8** "Allow downloads" is on by default. When it is off, the link shows Quick View only.
- **3.9** Apps, scripts, HTML and SVG can be stored but not shared by link: from our domain they could carry phishing or malware, put the whole domain on Safe Browsing lists, or run script when opened. A possible later fix: serve shared files from a separate sandbox domain, always with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`, and show a warning on the download page.

## 4. Files

- **4.1 Quick View (built in the browser):** `quickViewKind()` in `src/lib/cloud/files.ts` decides what is shown; `src/components/cloud/PdfView.tsx` renders PDFs.
  - PDFs render with pdf.js (`pdfjs-dist`, loaded only when a PDF is opened) on canvases inside the page, drawing each page as it scrolls into view. The browser's own viewer can't be used: it stays blank under CloudLand's cross-origin isolation, and on iPhone it shows only the first page.
  - Images, video and audio use the browser's own players. When a format isn't supported (HEIC outside Safari, HEVC in some browsers), Quick View says so and offers Download.
  - Text, Markdown, CSV and code show as plain text, reading at most the first 512 KB. HTML and other markup are shown as text and never rendered.
  - Office, Pages, Keynote, Numbers and archives are download-only.
  - Cost: each view is one R2 read; R2 has no egress fees. Files open through presigned GET URLs that last about 10 minutes.
- **4.2** No folder download as zip for now. It could be added later at no server cost by zipping in the browser.
- **4.3** No resumable uploads. An interrupted upload restarts when the connection returns.
- **4.4** Search stays in the browser: the library's metadata loads in one query and is cached, then refreshed with "changed since" queries. No server work per keystroke.
- **4.5** Starred is a column on the file row. No separate table is needed, because sharing is link-only and only the owner can star a file.
- **4.6 / 4.7** Names are cleaned, and clashes are resolved case-insensitively per folder. No versioning and no deduplication.

## 5. Accounts and security

- **5.1** Sign in with Apple only.
- **5.2** Sessions live in Supabase Auth plus a small `devices` table: negligible cost. At most 5 signed-in sessions in total, counting Macs and web browsers together (for example 3 Macs + 2 browsers). See Later.
- **5.3** Auto-lock, preferences and desktop alerts stay in the browser.
- **5.4** Session cookie `__Host-cloudland-session`. Every real request fails closed until session checking is connected.
- **5.5 Admin (decided 2026-10-26):** there is no admin route, page or code in this site. Administration happens in a separate local-only panel (its own repo, `~/Desktop/DynamicLand Admin`). It runs at `127.0.0.1` on the owner's Mac and is never deployed. It connects as the `admin_panel` Postgres role, whose password is kept in the Keychain. That role can only execute `admin.*` functions, which run as `admin_owner`. `admin_owner` has column grants that never include private data (file names, clip content, Apple identity). Admins get full control of accounts but no impersonation and no access to content. The backend applies that repo's `sql/admin-*.sql`, and `admin.privacy_violations()` must return no rows in CI.

## 6. ClipLand (proposed 2026-10-24, awaiting owner approval)

ClipLand shows what DynamicLand copies on the Mac. The web view is built (`src/components/cloud/ClipLand.tsx`, with sample clips in preview); nothing syncs yet. The browser copy of these numbers is `clipLand` in `src/lib/cloud/limits.ts`.

- **6.1 Opt-in:** the Mac syncs only after the person turns on “Sync to ClipLand” (off by default). It never sends what the Mac clipboard already skips: concealed and auto-generated pasteboard types and password managers (`containsSensitiveType` / `isSensitiveSource` in `ClipboardStore.swift`). File clips send names and sizes only; the files stay on the Mac.
- **6.2 History:** keep the last 5, 10, 20 or 30 clips (default 30) plus up to 10 pinned, so a user never has more than 40 rows. A Postgres trigger trims after each insert, and the daily job removes unpinned clips older than 7 days. Clips don't count towards the 5 GB quota.
- **6.3 Row:** `clips(id, user_id, kind, text, title, source_name, source_bundle_id, source_color, image_key, width, height, files jsonb, pinned, fingerprint, copied_at)`, owner-only RLS. `fingerprint` (the Mac's SHA-256 of the content) is unique per user, so copying the same thing again updates `copied_at` instead of adding a row.
- **6.4 Text:** up to 32 KB stays in the row. Longer text (up to the Mac's 512 KB) goes to R2, and the row keeps the first 1,000 characters for the card. Rich text syncs as plain text.
- **6.5 Pictures:** two presigned PUTs: a 520 px WebP thumbnail for the card (about 30–60 KB) and the picture itself, up to 5 MB (the Mac scales larger ones down). Removing or trimming a clip deletes both objects.
- **6.6 Source app:** the name, bundle ID and the icon's main colour (the Mac already measures it for the card header) travel with each clip: about 60 bytes, effectively free. App icons are not synced; the card shows the kind's symbol, as the Mac does for an app without an icon. If icons are added later: one 64 px WebP per app per user (about 4 KB), uploaded once under a content hash and cached as immutable. Never a cache shared across users (anyone could replace another app's icon), and never a bundled set of Apple's icons (trademarks).
- **6.7 Live updates:** Supabase Realtime Broadcast on a private per-user channel, joined only while ClipLand is open and the tab is visible, plus a “changed since” refetch when the tab regains focus. No connection is held otherwise.
- **6.8 Cost (prices checked 2026-10-24):** Supabase Pro includes an 8 GB database, 250 GB egress, 500 peak Realtime connections ($10 per extra 1,000) and 5 million Realtime messages ($2.50 per extra million). R2 costs $0.015 per GB-month, $4.50 per million writes and $0.36 per million reads, with 10 GB, 1 million writes and 10 million reads free each month, and no egress fees. A typical user (about 150 copies a day, a few of them pictures) uses about 20 KB of database and 10 MB of R2; the worst case is 40 × 32 KB ≈ 1.3 MB of database and 40 × 5 MB = 200 MB of R2 (about $0.003 a month). A text clip makes no R2 request at all; a picture makes two writes.

## Later (reminders)

- **3.3 Download page** for share links: list the shared file or folder contents with Download buttons, no sign-in. When a link reaches 25 downloads or expires, say so and ask the visitor to request a new link from the owner. (Suggestion: the owner makes a new link rather than re-uploading, which saves storage and the upload.)
- **3.7 Share route** `/cloud/s/{token}`: the server issues the token (at least 128 random bits), stores only its hash, and the page is built with the download page above.
- **1.5 Sizes on the server:** store sizes as `bigint` bytes. The quota is 5,000,000,000 bytes (decimal, matching `formatBytes`), checked before a presigned upload URL is issued and again after the upload lands.
- **2.3 Subscription-driven deletion:** store `subscription_expires_at` from App Store Server Notifications V2 (and re-verify with the App Store Server API). A daily job, not a sign-in, makes the account read-only once it passes and deletes the R2 objects and file rows 30 days later. A renewal before then clears the deadline.
- **4.1 Quick View against R2:** when files move to R2, add the R2 host to `img-src`, `media-src` and `connect-src` in `src/proxy.ts`. The bucket must also allow cross-origin isolation: CORS for the CloudLand origin, plus `Cross-Origin-Resource-Policy: cross-origin` (or `crossorigin` on media). Text previews request only `Range: bytes=0-511999`. Use the same viewer on the download page.
- **4.2 Folder download as zip:** build it in the browser (stream each file from its presigned URL into a zip), so it adds no server cost.
- **5.2 Session limit:** 5 sessions in total across Macs and web browsers. Signing in a sixth time shows the list so the person can sign one out first.

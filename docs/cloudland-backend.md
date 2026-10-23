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

## Later (reminders)

- **3.3 Download page** for share links: list the shared file or folder contents with Download buttons, no sign-in. When a link reaches 25 downloads or expires, say so and ask the visitor to request a new link from the owner. (Suggestion: the owner makes a new link rather than re-uploading, which saves storage and the upload.)
- **3.7 Share route** `/cloud/s/{token}`: the server issues the token (at least 128 random bits), stores only its hash, and the page is built with the download page above.
- **1.5 Sizes on the server:** store sizes as `bigint` bytes. The quota is 5,000,000,000 bytes (decimal, matching `formatBytes`), checked before a presigned upload URL is issued and again after the upload lands.
- **2.3 Subscription-driven deletion:** store `subscription_expires_at` from App Store Server Notifications V2 (and re-verify with the App Store Server API). A daily job, not a sign-in, makes the account read-only once it passes and deletes the R2 objects and file rows 30 days later. A renewal before then clears the deadline.
- **4.1 Quick View against R2:** when files move to R2, add the R2 host to `img-src`, `media-src` and `connect-src` in `src/proxy.ts`. The bucket must also allow cross-origin isolation: CORS for the CloudLand origin, plus `Cross-Origin-Resource-Policy: cross-origin` (or `crossorigin` on media). Text previews request only `Range: bytes=0-511999`. Use the same viewer on the download page.
- **4.2 Folder download as zip:** build it in the browser (stream each file from its presigned URL into a zip), so it adds no server cost.
- **5.2 Session limit:** 5 sessions in total across Macs and web browsers. Signing in a sixth time shows the list so the person can sign one out first.

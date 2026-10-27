# CloudLand backend: cost, limits and pre-build plan

Research of 2026-10-25/26, before any Supabase or R2 project is created. It checks the decisions in [cloudland-backend.md](cloudland-backend.md) and the numbers in `src/lib/cloud/limits.ts` against current prices, works out the worst cases for a $3.99/year subscription, and lists what to change before building. Prices come from the vendors' official pages on those dates (sources at the end); re-check them before buying anything.

**Status:** findings and recommendations. Nothing here is approved yet; the backend doc stays the record of decisions. Items marked **Owner** need a decision.

## 1. Summary

- **Keep Supabase + Cloudflare R2.** It was the best-scoring option. The two cheaper stacks either add a lot of security-critical code (Cloudflare-only) or save money only above about 10,000 users (Backblaze B2). See section 8.
- **Fixed cost: about $30 a month.** That is Supabase Pro at $25, with Micro compute covered by the included credit, plus Cloudflare Workers Paid at $5 for hosting, presigning and cron. Add VAT if it applies to your invoices (section 10). To cover it you need about **94–136 paying Pro users**, or about 108–156 if a 15% invoice tax applies.
- **Typical use is cheap:** about 12% of net revenue at 1,000 users and 2–4% from 10,000 users. A typical CloudLand user costs about $0.016–0.027 a month.
- **Worst cases lose money until they are capped.** If every user maxes out, the current design costs **122–137% of net revenue**; with the fixes in section 6 it costs **64–75%**. The biggest exposures:
  - **Family Sharing:** up to 6 accounts per purchase, each with 5 GB, can't be turned off.
  - **Counts with no limit:** tiny files, ClipLand picture loops, reused share URLs, upload URLs with no size limit.
  - **Library reloads** billed as Supabase egress.
  - **A deletion rule** that can delete files Apple is still collecting payment for.
- **Every fix keeps security and end-to-end-encryption readiness.** Where a cheaper option would weaken either, it is rejected here.

## 2. Revenue per user

Apple keeps 30% in a subscriber's first year and 15% after that. The App Store Small Business Program makes it 15% from day one, but you must enrol, and the rate starts 15 days after the end of the fiscal month in which enrolment is approved. In the EU, UK and Saudi Arabia, VAT is removed from the price before the commission.

|                                           |               Yearly $3.99 |  Monthly $0.99 |
| ----------------------------------------- | -------------------------: | -------------: |
| US, 15%                                   |       $3.39/yr ($0.283/mo) |       $0.84/mo |
| US, 30% (year 1, no SBP)                  |       $2.79/yr ($0.233/mo) |       $0.69/mo |
| Global blend, 15% (VAT haircut, estimate) | about $3.23/yr ($0.269/mo) | about $0.80/mo |
| Global blend, 30% (estimate)              | about $2.66/yr ($0.222/mo) | about $0.66/mo |

- **Model inputs:** base case is 90% yearly + 10% monthly at 15%, giving **$0.32 per paying user per month**. The worst case, used for every worst-case percentage here, is 100% yearly at 30%: **$0.22**.
- **Pro pays for everything:** the Mac features and CloudLand. Many Pro users will never open CloudLand.
- **RevenueCat:** free up to $2,500 of monthly tracked revenue (gross, before Apple's cut). From that month on it charges **1% of all of it**: $25 at exactly $2,500, not 1% of the excess. A month with many yearly renewals crosses the line early. If no card is on file at that point, parts of RevenueCat stop working.

## 3. Price sheet used (checked 2026-10-26)

| Item                       | Price                                                                                                                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Pro               | $25/month. Includes a $10 compute credit (Micro), 8 GB disk, 250 GB egress, 100k MAU, 500 Realtime peak connections, 5M Realtime messages, 2M Edge Function calls, 7 daily backups, 20 GB log ingest.                                  |
| Supabase overage           | Disk $0.125/GB-month (on provisioned size; disks never shrink). Egress $0.09/GB. Realtime $10 per 1,000 connections and $2.50 per million messages. Log ingest $0.50/GB. Small compute +$5, Medium +$50.                               |
| Supabase Free              | $0. 500 MB DB, 5 GB egress, 200 Realtime connections, no backups. Pauses after a week of low activity and returns 402 when over quota: not for production.                                                                             |
| R2 Standard                | $0.015/GB-month. Class A (PUT, Copy, List) $4.50 per million. Class B (GET, HEAD) $0.36 per million. DeleteObject free, egress free. Free each month: 10 GB, 1M Class A, 10M Class B. Storage is billed on the average of daily peaks. |
| R2 Infrequent Access       | Don't use it: 30-day minimum, $0.01/GB retrieval fee, Class A $9 per million, no free tier.                                                                                                                                            |
| Workers Paid               | $5/month. 10M requests and 30M CPU-ms included, then $0.30 per million requests. Static assets are free.                                                                                                                               |
| RevenueCat                 | $0 below $2,500 MTR, then 1% of all MTR.                                                                                                                                                                                               |
| Vercel Pro (fallback host) | $20/month. Hobby is non-commercial only.                                                                                                                                                                                               |

## 4. Cost at scale

From the cost model: monthly figures, `N` is paying Pro purchases, family members excluded.

|                                      |    N = 100 |       1,000 |        10,000 |         50,000 |
| ------------------------------------ | ---------: | ----------: | ------------: | -------------: |
| Net revenue, base mix                |        $32 |        $322 |        $3,223 |        $16,113 |
| **Typical, current design**          | $35 (108%) |   $39 (12%) |     $141 (4%) |      $706 (4%) |
| **Typical, with section 6 fixes**    |        $35 |         $39 |     $116 (4%) |      $480 (3%) |
| Net revenue, worst ($0.22/user)      |        $22 |        $222 |        $2,216 |        $11,079 |
| **Every user maxed, current design** | $43 (195%) | $270 (122%) | $3,030 (137%) | $15,197 (137%) |
| **Every user maxed, with fixes**     | $43 (195%) |  $143 (64%) |  $1,640 (74%) |   $8,271 (75%) |

Assumptions:

- **Typical:** 30% of Pro users use CloudLand, with 0.8 GB each.
- **Maxed:** every user holds 5 GB plus 200 MB of ClipLand with heavy daily use.
- **Included lines:** 15% invoice tax and RevenueCat.

The cheapest analyst model of the same stack (more batching assumed) gives $34 / $66 / $258 for typical use at 1k / 10k / 50k.

What drives the numbers:

- **Typical use:** R2 storage and RevenueCat's 1% are the largest lines.
- **Maxed use, current design:** in order, Supabase egress from reloading full libraries ($4.6k at 50k), R2 storage, Realtime messages, logs, then Class A from ClipLand pictures.
- **Floor no fix can lower:** R2 storage for a full 5 GB user is $0.078 a month, about 35% of worst-case net revenue. That cost comes with the 5 GB promise.

## 5. Worst cases per user, and the fix

Per user per month, assuming free tiers are already used up, against the worst net revenue of $0.222.

| Case                                                                                |       Before |       After the fix | Fix (details in section 6)                                                       |
| ----------------------------------------------------------------------------------- | -----------: | ------------------: | -------------------------------------------------------------------------------- |
| Full 5 GB + heavy use, no abuse                                                     | $0.25 (114%) |         $0.14 (62%) | Compact library RPC, tabs share it, clip batching, gated broadcasts, log hygiene |
| **Family Sharing:** purchaser + 5 members × 5 GB                                    | $0.58 (260%) |          $0.09–0.12 | **Owner** policy (6.2)                                                           |
| 1,000,000 tiny files                                                                |        $6.15 |               $0.12 | 50,000-item cap, upload rate caps                                                |
| Share links used as a CDN (10-min URLs, new link every 25 downloads)                |        $9.34 |               $0.05 | 120 s URLs counted per click, link and issuance budgets                          |
| ClipLand picture loop, 1 per second                                                 |       $36.06 |               $0.04 | Mac debounce and per-app pause, server picture cap                               |
| 50,000 items reloaded in 20 tabs a day                                              |        $0.88 |               $0.12 | Compact paged RPC, tabs share the library in memory                              |
| Unpaid tail: up to 60 days of Apple billing retry + 30 days read-only               |        $0.08 | $0.08, max 3 months | Correct lifecycle (6.1); cost is bounded, not removed                            |
| Upload URL used for more bytes than reserved (one 50-file batch ≈ 268 GB for a day) |        $4.04 |                  $0 | Signed exact Content-Length, reservation, HEAD check (6.3)                       |

## 6. Changes to make before building

### 6.1 Subscription source and lifecycle (must)

- **RevenueCat is the only source of subscription state.**
  - Point App Store Server Notifications V2 at RevenueCat.
  - Receive RevenueCat webhooks: check the Authorization header and HMAC, reject non-production events, de-duplicate by event id.
  - After each webhook, read the customer back from the **REST API v2**, because v1's `GET /subscribers` creates customers that don't exist.
  - Store `active`, `expires_at`, `ownership` and `period_type` on the account row.
  - A daily job re-checks accounts that are inactive or expire within 48 hours, because RevenueCat stops retrying a webhook after about 80 minutes.
  - This replaces the doc's plan to run App Store notifications V2 and the App Store Server API ourselves.
- **Lifecycle table.** RevenueCat sends no event when Apple's 60-day billing retry ends, so the rule must work without one:
  - **Writable:** active, Apple billing grace period, auto-renew off but not yet expired, trial or intro offer (treated as full Pro).
  - **Read-only** from EXPIRATION, or when no subscription has `gives_access`.
  - **Delete after 90 days** when the loss of access came from a billing error (60 days of retry + 30). **Delete after 30 days** for a voluntary lapse, refund, price-increase decline, lost family access or a purchase transferred away.
  - **Pre-delete guard:** a fresh RevenueCat v2 read must succeed and show no subscription that is active, trialing, in grace or in billing retry. Otherwise postpone the deletion.
  - Any webhook that restores access clears the deadline. The UI shows the exact deletion date, with reminders 30, 7 and 1 days before.
  - **Why it matters:** today's rule (2.3 in the backend doc) can delete files on days 31–60 while Apple is still collecting the payment. The longer tail costs at most about $0.16 more per lapsed full account.
- **Linking accounts (Mac app change).**
  - The Mac app uses anonymous RevenueCat IDs today: `Purchases.configure` with no app user ID and no `logIn`. It must call `Purchases.logIn(<Supabase user id>)` after CloudLand sign-in.
  - Set RevenueCat's restore behaviour to **"Transfer if there are no active subscriptions"**, so alternating restores can't keep two accounts alive or strip Pro from a CloudLand account.
  - **Consequence for Mac-only customers:** restoring on a new Mac then needs a Sign in with Apple step when the purchase belongs to a CloudLand account. Design that prompt in the Mac app before switching the setting. Existing anonymous buyers are merged into their account on their first `logIn`.
- **Owner:** turn on Apple's Billing Grace Period (16 days is the usual choice). Confirm whether you are enrolled in the Small Business Program.

### 6.2 Family Sharing policy (Owner, decide before building)

- **Why it needs a decision:** Family Sharing is on for the Pro products and Apple does not allow turning it off. One purchase can unlock 6 Apple Accounts.
- **No shared pool:** Apple gives no family identifier, so a 5 GB pool shared by the family can't be built.
- **What RevenueCat reports:** whether each customer is the purchaser or family-shared (`is_family_share` / `ownership_type`).

| Option                                                              |                  Worst cost per purchase | Trade-off                                                                                                                                |
| ------------------------------------------------------------------- | ---------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A. Every member gets 5 GB, with monitoring (recommended)            | $0.47/month, but only if all 6 fill 5 GB | Simplest and fair. Store ownership from day one, track the share of R2 bytes held by family members, and alert at 20–25% of net revenue. |
| B. CloudLand for the purchaser only (members keep the Mac features) |                                    $0.09 | Check against App Review first: family members are meant to get the subscription's benefits.                                             |
| C. New Pro product IDs without Family Sharing, for new buyers only  |                 as A for existing buyers | Moves buyers between products. Keep it as the fallback if A's alert fires.                                                               |
| D. Smaller quota for members (for example 1 GB)                     |                              about $0.16 | Breaks the "one plan, no tiers" rule.                                                                                                    |

### 6.3 Uploads that can't exceed what was reserved (must)

- **Signed headers:** sign `Content-Length` (the exact size, as a header), an allowlisted `Content-Type`, `Content-Disposition: attachment` and `If-None-Match: *` into every presigned PUT. Each upload gets a fresh opaque key, and the URL lasts 900 s.
- **Reservation before signing:** one atomic `UPDATE` on the user's usage row, checking used + reserved + size ≤ 5,000,000,000, pending uploads ≤ 100, items ≤ 50,000 and an active account.
- **Check after upload:** the server runs `HeadObject` and commits using R2's size, never the client's. A wrong size or type is deleted (free) and the reservation released.
- **Live test first:** R2 documents only `Content-Type` enforcement. Signed `Content-Length` worked in one third-party test. Before building, check on a scratch bucket that a wrong length returns 403, that a second PUT returns 412, and that a 1 GB upload on a slow line finishes on a 15-minute URL.
- **Fallback if enforcement fails:** an R2 event notification to a Queue, plus a Worker that deletes oversized objects within seconds (about $1.20 per million events).

### 6.4 One set of per-user caps (must)

All caps are enforced in Postgres by one `rate_counters` table and one `private.take()` function, inside the same transaction as the action. Over-limit calls get 429 with `Retry-After`. Cloudflare's WAF can't see `r2.cloudflarestorage.com` traffic, and the Workers rate-limit binding is approximate, so neither is used for this.

| Cap                                                | Value                                                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Items (files + folders, Recently Deleted included) | 50,000; folder depth 32; name ≤ 255 bytes                                                                                              |
| Uploads                                            | 2,000 a day and 10,000 per 30 days; ≤ 100 pending; ≤ 60 presign calls a minute; batches of 50                                          |
| Owner downloads and Quick View                     | ≤ 300 GET presigns a minute, ≤ 100 per call; Quick View URLs last 600 s                                                                |
| Share links                                        | 1 active link per item; ≤ 100 active; ≤ 50 new a day; ≤ 5,000 download URLs issued per owner per 30 days; ≤ 10 a minute per (link, IP) |
| ClipLand                                           | ≤ 30 write requests a minute; ≤ 3,000 clips a day; ≤ 200 pictures a day, ≥ 3 s apart                                                   |
| Sessions                                           | 5 active; 15-minute JWT; idle browsers removed after 30 days, Macs after 90                                                            |

Under these caps the most a single account can cost in R2 is about $0.15–0.20 a month, nearly all of it the 5 GB itself.

### 6.5 Share links (must)

- **What counts as a download:** one URL issued for one file through a link, Quick View included. Count per (link, file) with one atomic `UPDATE … WHERE downloads < 25 AND expires_at > now()`.
- **URL lifetime:**
  - Download URLs last **120 s** and force `attachment`.
  - Share-page Quick View URLs last 600 s.
  - A presigned GET can be reused until it expires, so a short life is what bounds hotlinking.
- **Folder links** show the folder's current contents, up to 1,000 files. Loading the page is not a download.
- **Route:** `/cloud/s/{token}` must be exempt from the proxy's sign-in redirect, which today sends every `/cloud` path without the cookie to sign-in.

### 6.6 Loading the library (must)

- **One paged RPC:** returns compact arrays of about 153 bytes per row instead of keyed JSON at about 316 bytes. Keyset paging by `(updated_at, id)` keeps each page under PostgREST's 1,000-row default and the 8 s statement timeout. As written, "one query" would silently cut libraries at 1,000 rows.
- **"Changed since":** uses the same cursor plus a tombstone table of purged ids, kept 30 days.
- **Tabs share the library in memory** over `BroadcastChannel`, so a new tab doesn't reload it and nothing goes into browser storage.
- **Writes** use `Prefer: return=minimal`.
- **Later, if Supabase egress passes about 150 GB a month:** a compressed per-user library snapshot in R2, where egress is free.

### 6.7 ClipLand (must)

- **Write path:**
  - The Mac writes through one `upsert_clips(batch)` RPC, one row per clip, unique on (user, fingerprint). There is no direct INSERT.
  - The fingerprint is stored as opaque bytes. It becomes a keyed HMAC under encryption, so short secrets can't be brute-forced from it.
  - Add a `preview` column with the first 1,000 characters. Lists load only that.
- **Mac behaviour:**
  - Ignore content replaced within 1 s.
  - Send at most one request every 3 s, carrying up to 20 clips, and back off on 429.
  - Pause picture sync from any app that writes more than 20 pictures in 60 s, and tell the user.
  - Refresh the token only when a write is due.
- **Live updates:**
  - The browser renews a "watching" heartbeat every 4 minutes while ClipLand is visible.
  - The insert trigger calls `realtime.send` only while that heartbeat is fresh, and sends ids only.
  - Realtime's "Allow public access" is off, and a `realtime.messages` policy limits each user to their own topic.
  - This cuts messages from about 3,400 to about 230 per typical user-month.
- **Picture thumbnails:** the Mac's ImageIO can't write WebP. Use JPEG (or HEIC/AVIF) for clip thumbnails, ≤ 150 KB.
- **Deleting objects:** the trim trigger can't call R2, so it writes the keys of trimmed pictures to an `r2_deletions` queue for the job.

### 6.8 File-grid thumbnails (new decision)

- **Generation:** the uploading browser makes a 400 px WebP thumbnail, or JPEG in Safari, which can't encode WebP. Sources: images (HEIC only when uploaded from Safari), the first frame of a video, page 1 of a PDF via the pdf.js already in the app. Everything else keeps the drawn glyph. Images of 64 KB or less use the original.
- **Storage:** the thumbnail goes to a derived key (`u/{uid}/{fileId}.t`). It is a few columns on the file row, not a row, and doesn't count toward the 5 GB. The server enforces ≤ 64 KB and an image/webp or image/jpeg type.
- **Loading:** the grid fetches thumbnails in CORS mode with `cache: 'no-store'` and keeps blob URLs in memory per tab.
- **Rejected:**
  - Full originals per tile: hundreds of MB per view, and no HEIC, video or PDF support.
  - Cloudflare Images: $0.50 per 1,000 after 5,000 a month, and impossible under end-to-end encryption.
- **Cost:** about $0.004 per typical user-month.

### 6.9 Sign in with Apple and sessions (must)

- **Mac:** native sign-in, then `signInWithIdToken` with a nonce.
- **Web:**
  - Redirect to Apple with `response_type=code id_token`, **no scope** (so fragment mode is allowed) and a nonce. The callback page calls `signInWithIdToken` in the browser.
  - **Never use `signInWithOAuth`:** Supabase hard-codes the email and name scopes there.
  - This flow needs no Apple client secret in Supabase, so there is no 6-month rotation.
  - Send the SHA-256 hex of the nonce to Apple and the raw nonce to Supabase.
- **One account across Mac and web:**
  - Apple gives the same `sub` to all apps on one developer team, so both sign-ins map to one account.
  - Attach the web Services ID to the Mac App ID.
  - Set Supabase's Apple client IDs to `<ServicesID>,<Mac bundle ID>`.
- **No email:**
  - Turn on "Allow users without an email" (`email_optional`).
  - Show a short account code in both apps, so a user who signs into the web with a different Apple Account notices.
  - Key everything on `auth.users.id`, never on user metadata, which the user can edit.
- **Sessions are held by the browser:**
  - Plain supabase-js with PKCE stores the session in localStorage.
  - A non-secret `__Host-cloudland-session=1` marker cookie serves only the proxy's early redirect.
  - `proxy.ts` never calls Supabase and holds no secret.
  - API endpoints check `Authorization: Bearer` JWTs.
  - The HttpOnly-cookie design in the limits review is dropped. It needs a secret key in the web tier, server-side refresh behind one IP and an experimental `@supabase/ssr` option.
  - Known trade-off: Safari users away for about 7 days sign in again.
- **Five-session cap:**
  - A `devices` table keyed on the JWT's `session_id`.
  - RLS and the RPCs reject sessions that are no longer active, so sign-out takes effect on data immediately.
  - JWTs last 15 minutes.
  - Realtime keeps its permission until the JWT expires, so at most 15 minutes after sign-out.
- **Build ourselves:**
  - Apple token revocation at account deletion. This needs a fresh authorization code and a `client_secret` minted per request from the .p8 key.
  - The Sign in with Apple server-to-server notification endpoint (consent revoked, account deleted).
- **Account deletion:**
  - Delete R2 objects, then rows, then the auth user.
  - Delete the RevenueCat customer.
  - Tell the user that billing continues through Apple and that Pro still unlocks the Mac features.
- **Test first:** a 10-minute check on a Free project that Mac and web sign-ins with the same Apple Account produce one identity with a NULL email.

### 6.10 Database security (must)

- **Grants:** grant tables explicitly, because new Supabase projects no longer expose them automatically. Grant nothing to `anon`.
- **Writes:**
  - No INSERT policy on files, usage or clips.
  - Column-level UPDATE only for name, parent and starred.
  - Everything that changes quota goes through `SECURITY DEFINER` functions in a private schema with `search_path = ''`.
- **Views** use `security_invoker`.
- **CI test:** queries as `anon` and as a second user must see nothing.
- **Keys:**
  - Use the new publishable and secret keys with ES256 JWT signing, and turn off the legacy `anon`/`service_role` keys, which are deprecated at the end of 2026.
  - One secret key per component.
  - No secret ever goes in the Mac app or the browser.
- **Activity and notification rows** store event codes and ids, never file names, so names live in one table (simpler to encrypt later).

### 6.11 R2 bucket and credentials (must)

- **Access:**
  - Private bucket, `r2.dev` off, no custom domain for user data.
  - One Object Read & Write token scoped to this bucket only. Deletes and HEADs use the Worker's R2 binding.
  - Never log presigned URLs.
- **Objects:**
  - Opaque keys (`u/{uid}/{uuid}`), with no names or extensions in keys, metadata or Content-Disposition.
  - Standard class only.
- **Rules:**
  - No bucket locks: they silently override deletions.
  - Jobs never call `ListObjects`, which is Class A; they work from the `r2_deletions` queue.
- **CORS:**
  - Origin: the CloudLand origin only.
  - Methods: GET, PUT and HEAD.
  - Allowed headers: content-type and range.
  - Exposed headers: ETag, Content-Range, Accept-Ranges and Content-Length.

### 6.12 Web platform (must)

- **Upgrade Next to 16.4.1 or later before any deployment.** The October 14, 2026 release fixed two critical unauthenticated remote-code-execution bugs. The repo is on 16.3.5, which predates them and the September fixes. Also upgrade sharp to 0.35.5 or later.
- **Drop `Cross-Origin-Embedder-Policy: require-corp` from `/cloud`.** Keep COOP same-origin, CORP same-origin, Origin-Agent-Cluster and the strict CSP.
  - Nothing planned needs cross-origin isolation (SharedArrayBuffer, WASM threads).
  - R2 presigned URLs can't send a CORP header, and Safari has no `credentialless`.
  - Today COEP already blocks the pdf.js worker, so PDFs are parsed on the main thread. That was tested in Chromium and WebKit.
- **CSP:** add the Supabase host (https and wss) and the R2 S3 host (`connect-src`, plus `media-src` for Quick View).
- **Routes outside `/cloud`:** webhooks (`/api/hooks/*`) and Mac endpoints (`/api/mac/*`), because those calls carry no Origin header.

### 6.13 End-to-end encryption readiness (do now, all free)

- **Keys and names:**
  - Opaque R2 keys.
  - Uniqueness on a client-computed `name_key` instead of an index on `lower(name)`. Use `NULLS NOT DISTINCT` so names at the root stay unique.
- **Quota and copies:**
  - A random `content_id` per file, used in the encryption's authenticated data, so server-side copies stay valid.
  - `stored_size` is the quota basis.
- **What the server stores:**
  - Ids, not names, in activity rows.
  - Opaque clip fingerprints and id-only broadcasts.
  - Share keys go in the URL `#fragment`, which never reaches the server.
- **Later, as nullable columns** (no table rewrite): `enc_version`, `key_id`, `wrapped_key`, `name_ct`, `meta_ct`, `text_ct`, and a `key_envelopes` table.

### 6.14 Operations

- **Supabase:**
  - Launch with the spend cap on.
  - Before about 400 peak Realtime connections or 4M messages, turn it off and set a "max concurrent clients" ceiling instead. With the cap on, Realtime stops at 500.
  - Move Micro → Small (+$5) on sustained CPU over 70%, cache hit ratio under 99% or a depleted IO budget.
- **Budget alerts** at $10, $25 and $50 on both vendors. Cloudflare has no hard cap, and its alerts arrive about a day late.
- **Logs and disk:**
  - Turn off the database copy of Auth audit logs.
  - Clean `cron.job_run_details` and `net._http_response` on a schedule.
  - Never log URLs, names or clip text.
  - Budget for log ingest from launch: $0.50/GB above 20 GB. A new org may not get the grace period.
- **Backups and restore:**
  - Pro's 7 daily backups are enough at launch. PITR costs about $100 a month and needs Small compute.
  - R2 has no versioning, so Recently Deleted is the only undo; say so in Help.
  - After a restore, a reconciliation job compares stored keys with rows.
- **Data location (Owner, permanent):**
  - Choose the Supabase region and the R2 jurisdiction or location hint together, before creating them.
  - Neither vendor has a Middle East region.
  - Saudi PDPL amendments on data localisation are in consultation until 2026-11-05.
- **Staging:**
  - Use a separate Free org for staging. In the Pro org, a second Micro project costs about $10 because the credit covers only one.
  - Use Supabase Free for development and a closed beta.
  - Move to Pro the day CloudLand opens to paying customers, or when any Free meter reaches 50%.

## 7. Edits the backend doc will need (after approval)

| Section               | Change                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro, 1.2, Later 2.3 | Subscription state comes from RevenueCat (REST v2 + webhooks), not App Store notifications V2 / App Store Server API.                                                                                                                                                                             |
| 1.3                   | Signed exact Content-Length, Content-Type, Content-Disposition and If-None-Match; 900 s URLs; HEAD check after upload; atomic reservation.                                                                                                                                                        |
| 2.3                   | The lifecycle table in 6.1: 90 days after a billing failure, 30 days otherwise, with the pre-delete guard. The current note "Apple's own billing grace period runs before this and changes nothing" is wrong, because the 60-day billing retry is what matters. Account deletion steps as in 6.9. |
| 2.4                   | Activity and notification rows store ids, not names.                                                                                                                                                                                                                                              |
| 3.4                   | Count per (link, file); 120 s download URLs.                                                                                                                                                                                                                                                      |
| 4.1, Later 4.1        | Remove the CORP option. The browser's own PDF viewer is ruled out by the CSP (`frame-src`/`object-src 'none'`) and the iOS first-page limit, not by isolation.                                                                                                                                    |
| 4.4                   | Paged compact RPC, tombstones, tab sharing.                                                                                                                                                                                                                                                       |
| 4.6/4.7               | `name_key` uniqueness.                                                                                                                                                                                                                                                                            |
| 5.1, 5.2, 5.4         | ID-token Apple flows and `email_optional`; browser-held session plus a marker cookie; `devices` table and 15-minute JWT.                                                                                                                                                                          |
| 6.3, 6.5, 6.7         | `upsert_clips` RPC, `preview` column, JPEG clip thumbnails, gated id-only broadcasts.                                                                                                                                                                                                             |
| New                   | 4.8 thumbnails, item cap, rate-limit table, Family Sharing policy, R2 credentials, data residency.                                                                                                                                                                                                |
| `limits.ts`           | `maxItems`, upload and share caps, ClipLand rates, `maxThumbnailBytes`.                                                                                                                                                                                                                           |

## 8. Other stacks

| Stack                                                                        |      Fixed |   Typical at 1k / 10k / 50k | Verdict                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------: | --------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase + R2, with the fixes above**                                      |        $30 | $34–39 / $66–116 / $258–480 | **Recommended.** Adds no new vendors and drops the App Store notification pipeline. RLS is a second line of defence behind the RPCs.                                                                                                                                                                                                                     |
| Cloudflare only (Workers + D1 + Durable Objects + R2, our own Apple sign-in) |         $5 |             $9 / $46 / $286 | **No.** Saves about $25 a month only below about 10k users and costs more at 50k. Needs an estimated 1,500–2,500 lines of security-critical auth, session and authorization code with no RLS backstop. D1's 10 GB per database and single writer force a later move to per-user Durable Objects. Also the most lock-in.                                  |
| Supabase + Backblaze B2 for bytes                                            | $25 + host |      about $32 / $47 / $151 | **Not now.** Storage costs about 54% less ($6.95/TB, free API calls), but that is $19 a month at 10k. B2 buckets are always versioned (a delete without a versionId keeps the bytes), there is no If-None-Match, egress above 3× storage is charged, and the rate limit is 500 req/s. Keep the storage module S3-neutral so it is a config switch later. |
| CloudKit for ClipLand                                                        |         $0 |                           — | **No.** Adds a second backend and a second web sign-in, uses the user's iCloud quota, fails for users with Advanced Data Protection, and the server could not enforce Pro, caps or deletion.                                                                                                                                                             |
| Hetzner, Wasabi, IDrive e2, Bunny                                            |          — |                           — | **No.** Minimum storage durations or EU-only and per-bucket limits (Hetzner), deletion rules that conflict with ours (Wasabi, IDrive e2), still in preview (Bunny).                                                                                                                                                                                      |

When to switch later:

- **R2 → B2:** when R2 storage passes about $150 a month for two months, egress stays under 2× storage, and B2's live tests pass.
- **Realtime → a Durable Object hub** (keeping Supabase Auth and RLS): only if Realtime passes about $100 a month.
- **Leave Supabase:** only if it passes about $500 a month after every fix, or its pricing changes materially.

## 9. Hosting

- **First choice: Cloudflare Workers Paid ($5)** running the whole site through `@opennextjs/cloudflare`, in the same account as R2. It also runs presigning, webhooks and the daily cron.
  - Running `proxy.ts` (the CSP nonce) there is experimental (OpenNext PR #1309), and Cloudflare now promotes vinext, which is in beta.
  - Static assets skip `proxy.ts` on Workers, so their headers go in a `_headers` file.
  - Script-injecting zone features (Rocket Loader, Bot Fight Mode JS) must stay off.
- **Do a one-day spike** on Next 16.4.1+ against the existing Playwright CSP, nonce and header tests.
- **If the spike fails:** Vercel Pro ($20) with no code changes. Not Vercel Hobby (non-commercial only) and not a self-managed VPS (patching and TLS).

## 10. Open questions

**Owner decisions:**

1. Family Sharing policy (6.2).
2. Billing Grace Period length, and Small Business Program enrolment.
3. Supabase region and R2 jurisdiction (permanent).
4. Whether to accept browser-held sessions (Safari asks to sign in again after about 7 days away).
5. The Mac "sign in to restore" flow that RevenueCat's restore setting requires.

**Not researched yet:**

- **Legal presence:** GDPR Art. 27 EU representative, UK representative and EU Digital Services Act duties for a file host with public links. Commercial representative services commonly cost hundreds of dollars a year or more each, which could exceed the $30 backend floor.
- **Invoice VAT:** whether VAT on Supabase/Cloudflare invoices applies to you, or is reverse-charged or reclaimable. The model assumed 15%.

**Measure on staging before launch:**

- Whether Supabase egress is metered on compressed or uncompressed bytes.
- Log bytes per request.
- Whether broadcasts with no listener are billed.
- R2 enforcement of signed Content-Length and If-None-Match.
- Whether R2 bills 403 responses.
- `response-content-disposition` on R2.
- How RevenueCat v2 status changes when Apple's billing retry ends (Apple's sandbox can simulate it).
- The Mac + web Apple sign-in identity check (6.9).

## 11. Order of work

1. **Decide and test (no cost):**
   - The owner decisions above.
   - R2 scratch-bucket tests (6.3).
   - Supabase Free identity test (6.9).
   - Next 16.4.1 upgrade and COEP removal.
   - OpenNext spike.
2. **Foundation:**
   - Supabase Free project.
   - Schema with grants, RLS, private RPCs and the encryption-ready columns.
   - `rate_counters`, usage and reservation.
   - R2 bucket, token and CORS.
   - Presign and complete endpoints with the HEAD check.
3. **Accounts:**
   - Apple sign-in on Mac and web.
   - `devices` table and the 5-session cap.
   - RevenueCat webhook, REST v2 re-check and the lifecycle table.
   - Mac `logIn` and the restore prompt.
4. **Files:** compact library RPC with tombstones and tab sharing, thumbnails, Quick View, Recently Deleted and the deletion queue, share links with counting.
5. **ClipLand:** `upsert_clips`, Mac batching and caps, gated broadcasts, picture presigns.
6. **Launch:**
   - Spend cap, budget alerts, log hygiene, backups note and data processing agreements.
   - Move to Supabase Pro on the day paying users arrive.

## Sources (fetched 2026-10-25/26)

- Supabase: [pricing](https://supabase.com/pricing), [compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute), [disk size](https://supabase.com/docs/guides/platform/database-size), [egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress), [backups](https://supabase.com/docs/guides/platform/backups), [free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Realtime broadcast](https://supabase.com/docs/guides/realtime/broadcast), [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits), [sessions](https://supabase.com/docs/guides/auth/sessions), [changelog](https://supabase.com/changelog)
- Cloudflare: [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Images pricing](https://developers.cloudflare.com/images/pricing/), [OpenNext PR #1309](https://github.com/opennextjs/opennextjs-cloudflare/pull/1309)
- Apple: [subscriptions and Family Sharing](https://developer.apple.com/app-store/subscriptions/), [Small Business Program](https://developer.apple.com/app-store/small-business-program/), [server notification types](https://developer.apple.com/documentation/appstoreservernotifications/notificationtype), [billing grace period](https://developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions), [Sign in with Apple id_token](https://developer.apple.com/documentation/signinwithapplejs/authorizationi/id_token)
- RevenueCat: [pricing](https://www.revenuecat.com/pricing/), [webhook events](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields), [event flows](https://www.revenuecat.com/docs/integrations/webhooks/event-flows), [API v2 subscriptions](https://www.revenuecat.com/docs/api-v2/subscription-data-model), [Family Sharing](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-family-sharing)
- Others: [Next.js security update, 2026-10-14](https://nextjs.org/blog/nextjs-security-update-october-14-2026), [Vercel plans](https://vercel.com/pricing), [Backblaze B2 pricing](https://www.backblaze.com/cloud-storage/pricing), [MDN COEP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)

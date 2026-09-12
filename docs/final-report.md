# DynamicLand rebuild report

12 September 2026. Four routes completed: `/`, `/support`, `/privacy`, `/terms`. Eleven empty product-media frames. Commercial and legal fields remain unset as requested; no product UI, pricing, reviews, or download link has been invented.

## Stack and architecture

Next.js 16.3.5, React/React DOM 19.3.0, strict TypeScript 6.0.3, ESLint 10.10.0, pnpm 11.19.0. Built on Node 24.11.0. TypeScript stays at the latest version supported by the chosen typescript-eslint parser rather than using its unsupported newer major. Versions are pinned in the lockfile. Dependency and peer audits passed.

App Router static export, server-rendered chapter components, three client component types for navigation, download information, and motion. Native CSS and Web Animations; no UI framework, animation library, CMS, database, analytics, or third-party runtime requests. Mutable narrative is in `src/content/copy.ts`; facts, links, pricing, legal text, and FAQ are in `src/content/site.ts`.

## Direction and structure

Apple informed pacing and limited sticky movement; Craft informed serif/sans contrast, independent chapter compositions, and mobile spacing; Screen Studio informed concise media-led storytelling; CleanShot and Things informed restraint. Flighty supplied the principle of secondary context supporting a larger focal capture. Raycast's developer-tool styling was rejected. See [research notes](design-direction.md) for browser coverage and limitations.

System sans is paired with local Newsreader variable WOFF2 under SIL OFL 1.1. No Apple or Craft font is redistributed. Warm white, neutral gray, ink, and dark charcoal dominate. The protected #8810F8 → #D986FF gradient is used for primary actions and the closing identity moment. Reading, regular content, and visual stages have separate maximum widths.

Homepage: sticky navigation → hero → open highlights → Home/Widgets → Mini Lands → dark Music → everyday tools → AI/context → customization → native/macOS/privacy link → pricing → FAQ → final CTA → footer. Chapters have distinct proportions and compositions; mobile rearranges overlaps, removes sticky staging, and uses a native horizontal customization gallery.

## Media map

| Label    | Manifest key   | Purpose                         | Reserved ratio |
| -------- | -------------- | ------------------------------- | -------------- |
| PHOTO 01 | heroPrimary    | Wide hero capture               | 2.75:1         |
| PHOTO 02 | homeMain       | Main Home view                  | 1.6:1          |
| PHOTO 03 | homeDetail     | Secondary Home capture          | 1.2:1          |
| PHOTO 04 | miniMain       | Main live-activity scene        | 1.75:1         |
| PHOTO 05 | miniDetail     | Secondary simultaneous activity | 1.4:1          |
| PHOTO 06 | widgets        | Widget composition              | 2.3:1          |
| VIDEO 01 | music          | Music and lyrics demonstration  | 2.1:1          |
| PHOTO 07 | customizationA | Size variation                  | 1.25:1         |
| PHOTO 08 | customizationB | Appearance variation            | 1.25:1         |
| PHOTO 09 | customizationC | Layout variation                | 1.25:1         |
| PHOTO 10 | contextual     | AI/contextual activity          | 1.35:1         |

Every slot has a stable ID, dimensions, ratio, alt, type, and fit. The default `contain` accommodates different source proportions. Empty slots are excluded from the accessibility tree. Approved assets later replace null sources without rewriting chapters. Only the hero image preloads; video is native click-to-play with a poster/caption hook.

## Motion and reference effects

One bounded Mini Lands sticky sequence is available above 1100px and 700px height. CSS view timelines move the Home detail, Mini Lands foreground/background, and outer customization captures. Optical arrivals use 32px → 8px → 0 blur with a mask reveal in Music, plus a final heading arrival. Navigation uses restrained backdrop blur. Native scrolling, no bounce, no perpetual ambient effect.

Reduced motion shows static final states, disables blur/parallax, and removes sticky staging. Unsupported scroll timelines receive the same readable composition. Background documents cancel optical arrivals; Safari background windows otherwise suspend them at the first frame. Observers/listeners are cleaned up.

ThreeUI orbs/shader fields and SV particles, tables, prebuilt marketing blocks, and agentation overlays were rejected. Progressive edge blur and masked continuity were reimplemented in small native CSS/WAAPI code; no library code/assets were copied. The named reference `.mov` was not supplied, so frame-by-frame analysis could not be performed. Screen Studio's live browser connection was unavailable; its page content was reviewed.

## Verification

- Strict TypeScript, lint, production build, full dependency audit, and peer checks pass. Export verification checks one H1 per route, unique IDs, internal links, local assets, metadata, JSON-LD parsing, and exact CSP hashes.
- All requested widths passed the horizontal-overflow check: 320, 375, 390, 430, 768, 834, 1024, 1280, 1440, 1728, 1920, 2560px. Portrait/tablet/desktop/ultrawide views and 844×390 landscape were inspected.
- In-app Chromium-based browser: menu, keyboard/Escape, disclosure FAQ exclusivity, download dialog focus restoration, and horizontal gallery keyboard scrolling verified. Closed mobile links are inert. No console errors were observed on the local production export.
- Native Safari 27: typography, navigation material, chapter layout, masked/blur surfaces, and download dialog were inspected. The background rendering constraint was diagnosed in Web Inspector and handled in the implementation; the final Music heading renders clearly. This is desktop Safari coverage, not physical iOS-device certification.
- axe 4.13.0: zero violations on all four routes (40 passing rules on the homepage; 32 on each supporting route). Gradient contrast required manual review. Keyboard and focus states were spot-checked. No claim of a complete screen-reader certification.
- Reduced motion was exercised through a local response emulation without changing system preferences: no animation/filter on the motion targets, static Mini Lands, and automatic scroll behavior. Core content also exists without JavaScript.

## Performance

Measurements are local, unthrottled, empty-media samples, not Lighthouse scores or field p75 Core Web Vitals.

| Measure                                       | Result                                      |
| --------------------------------------------- | ------------------------------------------- |
| Desktop LCP / CLS                             | 88 ms / 0                                   |
| Desktop maximum observed interaction duration | 32 ms                                       |
| Desktop scroll sampling                       | 714 frames; maximum 21 ms; zero above 25 ms |
| Desktop observed long tasks                   | 0                                           |
| Mobile sample LCP / CLS                       | 84 ms / 0                                   |
| Mobile maximum observed interaction duration  | 24 ms                                       |
| Homepage HTML, raw / estimated gzip           | 47,831 / 8,161 bytes                        |
| Initial JavaScript, raw / estimated gzip      | 586,492 / 181,096 bytes across 7 files      |
| Initial CSS, raw / estimated gzip             | 24,229 / 6,565 bytes across 2 files         |
| Locally hosted font                           | 132,000 bytes                               |

The JS budget includes the Next/React runtime. Gzip figures are reproducible file compression estimates, not measured CDN transfers. Interaction duration is a laboratory event sample, not field INP. The scroll sample is not a GPU/compositor trace or a guarantee of sustained frame rate on other hardware. [Machine-readable bundle measurements](bundle-measurements.json) can be regenerated with `node scripts/verify-export.mjs`.

## SEO, discovery, and security

Unique titles/descriptions, canonical URLs, Open Graph/Twitter card, sitemap, robots, WebSite and SoftwareApplication JSON-LD, semantic exported text, and normal internal anchors are included. Unsupported organization, offer, review, and rating fields are omitted. Legal pages are noindex and absent from sitemap until approved content exists.

Search crawlers are allowed; selected training-only crawlers are separately opted out. `llms.txt` is omitted because factual semantic content and conventional indexing are the foundation. Domain verification, search-engine submission, WAF crawler checks, and real field CWV require the final domain and production access; they have not been performed. Private Sites access prevents external indexing.

Hash-based CSP covers exact inline scripts/JSON-LD, with no arbitrary inline-script or eval permission. Inline styles are allowed for Next/font and media dimensions. Generated header configuration includes nosniff, frame denial, strict referrer policy, restricted device permissions, and HSTS without unverified subdomain/preload scope. **Deployment check:** this private static Sites host does not apply `_headers`. Meta CSP and an explicit referrer meta policy protect the document; HTTP-only frame restrictions, nosniff, Permissions-Policy, HSTS, and cache headers must be applied at the final hosting/CDN layer. No backend was added solely for those headers. All four authenticated deployed routes returned 200. No forms, API endpoints, secrets, or cookie/analytics scripts exist in the site code. Sites supplies owner-only sign-in; the final browser view requires the owner's ChatGPT session.

The host also appends Cloudflare JavaScript Detections, an inline verification script with request-specific parameters. The strict static CSP blocks that injected script; it does not block the application's approved scripts. Cloudflare documents that this combination needs a response-header nonce integration, which cannot be supplied by a static meta policy. This is a hosting integration issue to resolve before public launch, not a reason to permit arbitrary inline scripts. The ten deployed JS/CSS/font files matched the validated export exactly; the host currently returns `max-age=0, must-revalidate` for those assets. See [Cloudflare's CSP guidance](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/).

## Asset and launch handoff

The only generated raster is `public/og.png` (1536×1024), created with the built-in image generation tool and inspected. It is a typography-only social card, never a product screenshot. Generation brief: “Premium DynamicLand social card on warm cream; clean sans wordmark ‘DynamicLand’; large editorial serif ‘A new home for your Mac’s notch.’; small text ‘Music, widgets & live activities on macOS.’; one slim #8810F8 → #D986FF band; generous whitespace; no device, notch, application UI, illustration, or invented logo.”

Remaining owner-supplied inputs are the ten real screenshots, one real demonstration video/poster/captions, verified download and compatibility information, pricing, support contact, approved legal text, and official domain. Recheck copy, alt text, cropping, video decoding, payloads, metadata, and field performance when those arrive. Detailed steps are in the [launch checklist](launch-checklist.md).

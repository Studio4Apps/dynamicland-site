# DynamicLand website

A complete four-route product site: `/`, `/support`, `/privacy`, `/terms`. Original light visual system, timed highlights gallery, coordinated style selector, native FAQ, responsive menu and a limited dark music chapter. All 15 product media slots are intentionally empty.

## Run locally

Use Node **24.21.0** (see `.nvmrc` / `.node-version`) and pnpm **11.25.0**. Dependencies and the lockfile are pinned. With that Node version selected:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Development runs at `http://127.0.0.1:3000`. Production-mode review:

```sh
pnpm build
pnpm start
```

The production server binds to loopback at `http://127.0.0.1:3001`. Both modes are local/non-indexable by default. This task used a separately verified Node 24.21.0 binary because the machine's default Node was older; the system installation was left unchanged. Select the declared runtime before reproducing checks.

## Check

```sh
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm security:scan
pnpm audit
pnpm exec playwright install chromium firefox webkit
pnpm test
node scripts/capture-qa.mjs
node scripts/capture-carousel.mjs
node scripts/performance.mjs
pnpm release:check
```

Browser tests start/reuse the local production server. Capture and performance scripts require it to be running. Use `pnpm test --project=chromium --project=webkit` to reproduce the locally available engines; Firefox failed to start on this machine (details in the verification report). Optional `BASE_URL` points browser QA at another authorized running build. `RELEASE_BASE_URL=http://127.0.0.1:3001 pnpm release:check` also compares served canonicals, indexing headers, robots and sitemap with current configuration. The release check **intentionally exits 1** until the public origin and website legal requirements are resolved.

## Architecture

Next.js **16.3.5**, React **19.3.0**, TypeScript **6.0.3**, CSS Modules and a system sans-serif stack. Server components render factual content in initial HTML; small client components enhance native interactions. No CMS, analytics, external fonts, contact API, account system or motion dependency.

- `src/content/`: shared product facts, editorial copy, typed media manifest.
- `src/components/sections/`: homepage chapters.
- `src/components/interactive/`: gallery and detail selector; native scrolling/radios remain usable without enhancements.
- `src/components/media/`: blank state and future local image/video rendering.
- `src/components/interactive/Motion.tsx`: finite progressive animation, live reduced-motion cleanup.
- `src/lib/`: configuration, media validation, metadata and safe JSON-LD serialization.
- `src/proxy.ts`: fresh per-response nonce and enforced CSP.

Rendering uses the standard **Next Node server**, not static export. Reading request headers makes HTML dynamic. HTML is `private, no-store`; route links use full-document navigation to keep nonce boundaries explicit. The CDN must preserve this behavior. Hashed static assets may be cached. Do not use the removed legacy export scripts or share-cache nonce-bearing HTML.

## Configuration and launch dependencies

`.env.example` documents `SITE_ENV=local|preview|production`, the optional owner-approved HTTPS `SITE_ORIGIN`, `LEGAL_APPROVED`, and independent `TRAINING_CRAWLERS=block|allow`. Never put credentials in public variables.

There is no assumed domain. Without an origin, canonicals and absolute social URLs are omitted rather than set to localhost. Local/preview pages have noindex, an empty sitemap and no robots sitemap directive. Production is deliberately blocked until approved website-specific policy text replaces both pending legal notices, `legalContentReady` is updated in `src/lib/config.ts`, the owner sets the real origin, and `LEGAL_APPROVED=true`. Existing app legal documents are linked from the legal routes; they do not establish website-hosting practices.

No deployment, push, DNS modification, account verification or external submission was performed. Missing product captures are intentional and do not fail the release check. They can be added later using the manifest guide.

## Handoff documents

- [Verified product facts and asset provenance](docs/product-facts.md)
- [Design and motion contract](docs/design-and-motion.md)
- [Timed carousel correction and verification](docs/carousel-correction.md)
- [Homepage vertical rhythm correction](docs/spacing-correction.md)
- [Media slots and replacement procedure](docs/media-guide.md)
- [Security, discovery and launch responsibilities](docs/security-and-discovery.md)
- [Implemented / verified / not verified report](docs/verification.md)

Local screenshots, recordings, traces and raw measurements are in ignored `artifacts/`; Playwright reports are in ignored `playwright-report/` and `test-results/`. These files, the private evidence docs and reference archives are never public assets. Existing staged deletions from the discarded site were preserved; this implementation does not stage or commit on the owner's behalf.

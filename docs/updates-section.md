# Updates section

`src/components/sections/Updates.tsx` follows Good to know on the homepage. Cards scroll horizontally; their artwork area preserves 4096:2160 at every viewport size. Approved V2/V3 bento images from DLandFiles/Bento_DL are encoded as quality-92 WebP in public/images/updates at their original 4096×2160 dimensions. Cards grow to 896px on desktop and fit the viewport gutters on mobile. Images use contain without cropping; the plus control sits in the heading, clear of the artwork.

Darkveil's notes were imported from Apple's public lookup API for app 6785289988 (US store, version 2.0.1, retrieved 2026-09-29). The section identifies the major release as V2 and links to the App Store. The text is retained in full; uppercase section labels are displayed in title case. Solara's notes are deferred at the owner's request.

Cards fade into a frosted overlay on hover or keyboard focus. Touch opens details directly. A native modal dialog traps focus, locks page scrolling, supports Escape and outside-click dismissal, and restores focus. Opening lasts 440ms; closing lasts 260ms, with progressive backdrop blur and subtle translation/scale. Reduced motion disables the travel; reduced transparency uses a solid hover surface.

Manually inspected desktop/mobile captures and tested open/outside-dismiss/Escape in Chromium and WebKit; no page errors. Captures are under ignored artifacts/updates.

## Automatic artwork palette

`src/lib/image-palette.ts` samples the loaded artwork into a 128px-wide canvas, excludes transparent/near-neutral/dark pixels, and ranks hue clusters by saturation-weighted frequency. Up to three distinct dominant hues form the title and glass gradients. Text lightness is constrained for readability. Results are cached by image URL, so new release entries need only an image path, never hand-written color rules. Neutral-only or unreadable images use a brand fallback. Root `scrollbar-gutter: stable` retains scrollbar space while modal scroll locking is active, preventing horizontal page shifts.

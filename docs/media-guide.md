# Media replacement guide

The `hero` entry in `src/content/media.ts` supplies the owner-provided `Landing_Page_Pic.png` illustration as optimized 840px and 1672px WebP files in `public/media/`. It is loaded eagerly and blends into a purple backdrop behind the headline, actions, and navigation. The scene uses its natural landscape proportions, with a minimum width of 1216px on desktop and 704px on compact screens. This reduces desktop magnification and preserves the composition as the viewport narrows.

The scene follows the copy in document flow. A negative margin absorbs its unused sky while reserving a 48–64px desktop / 16px compact gap before the artwork, so tall phones do not create extra empty space. A top gradient matches the purple sky. The lower 24% of the image fades into the rose-gray canvas, with a faint rose tint extending 48–80px below the image. Only this tint is softened with an 8px blur, preserving the image detail. Both edges are feathered so there is no distinct fog band. No extra raster image is fetched. The original remains outside the deployment folder.

The former Photo 01 frame, caption, and separator have been removed. Hero artwork is decorative and excluded from the accessibility tree; the real headline and controls remain accessible HTML.

The shared footer uses the owner-provided `Footer_Web.png` cloud illustration, exported as 840px and 1448px WebP files (21KB / 44KB). A lazy-loaded decorative picture selects the compact source on phones. A rose-gray fade joins the page above, while a purple shade behind the real HTML links maintains legibility. The original remains outside the deployment folder.

Two stills continue the hero's story on the same lake, under the same violet sky, crescent moon, cloud banks, pine shores, mist and grade, with the same boat and lantern: searching (hero), under way (Pro), arrived (invitation). The island stands for the Dynamic Island the app lives in. `scripts/scenes/stills.ts` builds them in three.js and `node scripts/render-scenes.mjs` renders each at twice its size in headless Chromium, then reduces it to WebP (raw PNGs go to ignored `artifacts/scenes/`).

- “Start free. Go further with Pro” uses `public/media/pro-voyage.webp` (1086 × 1448): later the same night, the boat is under way with its lantern lit and oars in the water, a wake opening behind it, heading for the one warm window of the island far off between the shores. There is no Pro badge over the picture; the Pro plan heading and subscription chip remain.
- “Make a little room for a better everyday” uses `invite-island-1600.webp` (1600 × 900) on desktop and `invite-island-840.webp` (840 × 1120) on phones: the same island close by, a log cabin with a lit window between two pines, its light on the water. The boat is tied up at a short jetty with its oars shipped and an empty lantern post; its lantern now hangs by the cabin door. The middle of the frame stays open for the copy, which is centred over a purple shade.

The owner-provided `PRO_Card.png` remains as `pro-card.webp` for the MiniLand gallery card, and the separate site footer keeps the owner's cloud artwork (`footer-*.webp`).

All product screenshot slots currently have `src: null`. Their rendered blanks are intentional: no image/video element, request, loading state, play control or invented alt text. The tiny Photo/Video identifiers are hidden from accessibility and search snippets. Current editorial copy stays outside the frames.

| Stable slot ID          | Current identifier   | Section / intended capture              | Stage ratio      |
| ----------------------- | -------------------- | --------------------------------------- | ---------------- |
| hero                    | Landing illustration | Full-width overview background          | Natural 1672:941 |
| highlight-home          | Photo 02             | Home gallery card                       | 16:9             |
| highlight-music         | Photo 03             | Music gallery card                      | 16:9             |
| highlight-activities    | Photo 04             | MiniLand gallery card                   | 16:9             |
| highlight-clipboard     | Photo 05             | Clipboard gallery card                  | 16:9             |
| highlight-customization | Photo 06             | Customization gallery card              | 16:9             |
| home                    | Photo 07             | Home widgets chapter                    | 6:5              |
| music                   | Video 01             | Now Playing chapter                     | 2:1              |
| activities              | Photo 08             | MiniLand chapter                        | 16:9             |
| clipboard               | Photo 09             | Large everyday card                     | 16:10            |
| tray                    | Photo 10             | File Tray card                          | 1:1              |
| tools                   | Photo 11             | Timer / Voice Memos / Color Picker card | 1:1              |
| custom-notch            | Photo 12             | Notch selector preview                  | 4:3              |
| custom-pill             | Photo 13             | Pill selector preview                   | 4:3              |
| custom-glass            | Photo 14             | Liquid Glass selector preview           | 4:3              |

Utility media equalizes within the desktop grid and adapts on compact layouts. Stage geometry is independent of the actual asset dimensions. Start with `contain` to preserve app-interface legibility; use `cover` only after reviewing the crop at every breakpoint.

## Adding approved assets

1. Obtain owner-approved released-product captures. Keep originals outside `public/` and deployment output. Remove private user content and metadata; obtain rights for artwork visible in captures.
2. Export optimized PNG/WebP/AVIF/JPEG derivatives to `public/media/` (video MP4/WebM). Raster-only local paths are deliberately validated; no remote proxy, arbitrary SVG, path traversal or empty source.
3. Edit only the relevant slot: `src`, actual `width` / `height`, descriptive `alt`, `fit`, `position` and optional `ratio`. The hero's `priority` loads it eagerly; other images load lazily. Example fields for a future approved asset:

```ts
src: '/media/home-1600.webp',
width: 1600,
height: 1200,
alt: 'Describe the actual approved capture and its relevant information.',
fit: 'contain',
position: 'center',
responsive: [{
  srcSet: '/media/home-800.webp 800w, /media/home-1600.webp 1600w',
  sizes: '(max-width: 760px) calc(100vw - 40px), 660px',
}],
```

4. Optional art direction uses `responsive[].media`, with local source sets and truthful dimensions. Add video `poster` when available and a concise actual `alt` label. The video branch uses native controls, inline playback, muted initialization and `preload="none"`; playback is user-initiated, so no scripted `play()` promise exists to reject. It pauses offscreen, when the document hides, on preference changes, and when leaving a selected preview. Add captions/transcript if meaningful speech or sound conveys information. Do not introduce autoplay while media is absent.
5. Re-run validation, affected browser tests, visual crops, motion recording and performance measurements. Update the intentional-empty assertions only for approved slots being filled; preserve validation and empty/failure-state coverage. Check hero LCP when changing its media.

`MediaFrame` reserves geometry. `MediaAsset` handles native pictures/videos and quietly returns to the identifier if a source fails. `tests/fixtures/media.tsx` exercises landscape, very tall, missing-image and missing-video cases through intercepted test routes. Those fixtures and their synthetic colors are not site product media and do not ship.

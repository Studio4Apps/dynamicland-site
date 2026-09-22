# Timed highlights carousel correction

Implemented in the existing website on 2026-09-22. This follows the owner's approval of `DynamicLand-Apple-style-carousel-fix.md`, which replaces the earlier manual-only rule for highlights. Product captures remain empty. The surrounding chapters, content, metadata, security headers, framework and dependencies are unchanged.

## Behavior and accessibility

`GALLERY_TIMING` in `src/components/interactive/gallery-controller.ts` explicitly selects timed **slides**: 6150ms dwell after settlement, 900ms desktop travel, 500ms travel at widths up to 734px. One monotonic requestAnimationFrame controller owns elapsed time, advancement and scroll travel. Indicator expansion is derived from measured scroll position; fill is derived from accumulated dwell. Frame writes update element styles directly; React publishes only changed semantic state. There is no CSS looping timer, setInterval, video event dependency, or new animation package.

The timer starts when at least 35% of the track height (capped at 40% of the viewport height) is visible. Pausing retains elapsed time. A different settled slide resets it; selecting the active dot does not. Manual buttons, keyboard navigation, dragging and wheel input pause rotation until explicit Play. A pause during travel lets that move settle. The final slide completes once and offers Replay; replay returns to the first slide before starting its dwell. Native drag/wheel settlement reconciles to a measured slide target. Resize preserves the settled slide or current requested destination, and distinguishes browser scroll clamping from intentional navigation.

Accessibility policy, informed by the [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) and [rotation-control example](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/):

- Rotation is the first keyboard/reading-order control, visually to the right of pagination. Its action label is Play, Pause or Replay slideshow.
- Focus entering the gallery stops rotation persistently. Moving focus away does not restart it. Automatic movement never moves focus.
- Mouse hover temporarily suspends the clock. Leaving resumes only an existing play intent. The button retains the Pause action for that temporarily suspended play intent.
- Explicit Play overrides the current hover until the pointer leaves or another focus/navigation action stops playback. Pointer intent is captured before focus handling, avoiding a Pause click inadvertently becoming Play.
- Document hiding/offscreen state freezes elapsed time without catch-up. These blockers do not replace user intent.
- Reduced motion starts paused, uses instant scrolling/indicator changes, and still permits explicit timed Play. Enabling reduced motion live stops rotation; disabling it does not restart a paused gallery.
- Manual settlement can announce the slide. Dwell percentages are not announced; the live region is off during automatic rotation and cleared on explicit Play.
- Controls are hidden until enhancement is ready. Server-rendered content and native horizontal scrolling remain available without JavaScript. One-slide galleries suppress pagination, playback, count and arrow controls.

## Geometry and visual review

56px capsule and playback surfaces, 16px gap, 8px dots, 48px desktop / 32px compact track, 24px minimum pagination hit width and 44px height. The capsule's intrinsic width follows the item count. Expansion weights sum to one, preserving capsule width and the playback button's position throughout travel. At 320px, compact side padding allows seven items plus playback to fit within 280px without scaling. Neutral rgba(232,232,237,.72) surfaces, gray tracks and #29292a fill/icons; the existing purple branding remains elsewhere.

Reference evidence inspected: sections 5–6 of `Apple-reference-analysis.md` and the supplied 12.275-second CleanShot recording from 3:37:48 PM. The two UUID-named recordings mentioned in the brief were not found; the actual supplied recording shows the Apple treatment. No archive re-analysis or proprietary code/assets were used.

The result recording is approximately 24 seconds, with real elapsed time: early fill, pause at 41.0249%, an unchanged fill after 6.76 seconds, resume using the remainder, automatic advance, manual selection and resumed advance. Reviewed chronological frames across the whole recording and a 12fps transition strip. A side-by-side crop scales the 2× reference recording to comparable 56px surfaces: the reference has seven items, the production site five. The width transfer is continuous, the button stays fixed, and fill remains rounded. Production viewport captures were inspected at compact/tablet/desktop widths; blank media proportions and existing caption typography are preserved. Element screenshots that clipped control edges were checked against full viewport captures and actual bounds; the live controls are fully visible.

## Verification

Production server with the existing enforced nonce CSP. Node 24.21.0, Next 16.3.5, Playwright 1.63.0. No protection was relaxed.

- TypeScript, ESLint, production build and five existing unit contracts pass.
- Full Chromium 153.0.8010.12 / Playwright WebKit 26.6 regression: 35 passed, 3 intentional Chromium-only skips, no failing tests. This includes the original route, menu, selector, keyboard, accessibility, touch, reflow, media and CSP checks plus 12 carousel cases across the two engines.
- Real-time checks in both engines verify visibly different fill timestamps, a >6150ms pause with unchanged fill/index, continuation of only the remaining dwell, exactly one advancement, and native focus preservation.
- Controlled-clock browser checks cover offscreen entry, mid-travel shape transfer and stationary group geometry, pause in flight, hover, keyboard Play/Pause, persistent focus stop, visibility suspension, Replay, repeated commands, live reduced motion, resize while playing, drag interruption, one/five/seven items, unmount/remount cleanup, and all requested widths in both motion modes.
- Hidden-state automation injects the visibility lifecycle event explicitly. A separate **native Safari 27.2** smoke test verified real background-tab suspension, returning to the same slide, Play/Pause, final Replay and return to slide one. Temporary Safari tabs were closed; this was a focused smoke test, not the full automated suite.
- axe route/menu checks pass; screenshots remain empty; recorded production interactions emitted no page/console errors. The local security scanner reported zero findings.

During QA, repaired a WebKit resize/selection race and reflow clamping that incorrectly paused a playing carousel. Test corrections respect Safari's native mouse-focus behavior and await offscreen suspension before comparing frozen fill. Native resize/scroll/snap tests use real browser time because browser layout events are outside the virtual clock; this case also passed three consecutive runs in each engine. No behavior assertions were removed to hide failures.

Firefox remains unverified because its installed browser failed to launch in the earlier whole-site run. No physical-device or complete VoiceOver/NVDA journey is claimed. No deployment, account or DNS changes were made.

## Files and reproducibility

Production changes: `Gallery.tsx` (semantic controls), `gallery-controller.ts` (one lifecycle/timing owner), `Interactive.module.css` (capsule, indicators and responsive arrangement), all under `src/components/interactive/`.

Verification changes: `tests/browser/gallery.spec.ts`, `tests/fixtures/gallery.tsx`, gallery scroller locators/no-JS checks in `tests/browser/site.spec.ts` and `tests/browser/resilience.spec.ts`, and `scripts/capture-carousel.mjs`. README, motion contract, baseline verification report and implementation checkpoint link this correction.

With the declared Node/pnpm runtime and production server running:

```sh
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test --project=chromium --project=webkit
node scripts/capture-carousel.mjs
```

Evidence is ignored and never shipped: `artifacts/carousel-fix/verification-final.log`, `build.log`, `recording-events.json`, `carousel-demo.webm`, `carousel-demo.mp4`, `control-sequence.jpg`, `morph-sequence.jpg`, `reference-comparison.png`, and responsive captures. The capture script produces the WebM; the MP4 and frame sheets are ffmpeg review derivatives. Tests/fixtures are served only through Playwright interception, not as application routes.

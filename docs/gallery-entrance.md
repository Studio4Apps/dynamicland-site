# Gallery control entrance

The owner's September 27 recording shows a circle rising from below the viewport, compressing into a low capsule, expanding past its resting width, revealing the indicators, and releasing the playback bubble to the right. The playback icon appears after its bubble. The recording also includes page scrolling; that scrolling is not part of the shape animation.

The implementation samples the supplied 60fps recording and normalizes the shape geometry to the website's existing 56px controls. After the owner's visual review, the 1.2-second sequence was extended to 1.65 seconds: the ascent decelerates less abruptly, the capsule and indicators develop more slowly, and the playback bubble emerges later with a gentle rebound. A subsequent small speed adjustment scales every phase equally to 1.3 seconds, preserving that choreography and rebound. It preserves the five slides, rose-gray palette, centered pagination, and independent slide count. No reference source or assets are shipped.

## Engine and timing

After comparing the official [Motion animate documentation](https://motion.dev/docs/animate) with [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), this finite entrance uses `motion/mini` (Motion 13.4.4). Its native Web Animations implementation supports the measured keyframes without introducing a React animation tree, scroll scrubbing, or pinning. A native IntersectionObserver is sufficient for the one-time trigger.

| Stage             | Time       | Behavior                                                                                                                                                                            |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rise              | 0–804ms    | Start beneath the visual viewport; rise 6px past the resting position, rebound 2px below it, then settle. Segment easing slows smoothly at each turning point.                      |
| Circle to capsule | 0–1300ms   | Hold the initial circle briefly; compress height; expand to 109% width; recover full height and settle. Geometry follows the reference with more time between phases.               |
| Indicators        | 465–898ms  | Reveal inside a widening clip, slide into their final positions, and expand their marks.                                                                                            |
| Playback bubble   | 599–1276ms | Emerge from the capsule's right edge; drift 2.5px beyond the resting position, rebound 0.8px, then settle. Opacity fades independently over 331ms; the icon fades in at 788–1119ms. |

The animation starts when the entire reserved control row reaches 32px above the viewport bottom. It runs once per mounted gallery. Re-entering the section does not replay it. Afterward the controls occupy their original place in normal document flow; nothing remains fixed to the screen. The gallery clock, loop, navigation, pause intent and offscreen suspension remain separate from this timeline.

Keyboard focus or pointer interaction immediately resolves the animation to usable controls. Resize, document hiding or a live reduced-motion preference also settles the entrance. Reduced motion and missing animation/observer APIs expose the final controls immediately. Effect cleanup cancels the animations and disconnects observers/listeners. No-JavaScript scrolling remains available.

## Verification

`tests/browser/gallery-entrance.spec.ts` samples actual native animations at reference phases and verifies below-screen entry, circle geometry, expansion, bubble release, no layout shift, no replay, compact bounds, resize, interruption and reduced motion. Existing gallery geometry checks wait for the entrance to settle before measuring permanent control sizes.

`node scripts/capture-gallery-entrance.mjs` records desktop and mobile motion, frame-by-frame dimensions and final screenshots under the ignored `artifacts/gallery-entrance/` directory. Reference extraction and comparison sheets are local QA artifacts and are not deployed.

September 27 verification: production build, TypeScript, ESLint and diff whitespace checks passed. Ten focused entrance/geometry tests and sixteen gallery/accessibility/resilience regressions passed across Chromium and WebKit. Coverage includes the real Photo 03 dwell, repeated looping, explicit pause, no-JavaScript content and missing animation APIs. Motion captures were inspected at 1200×850 and 390×844; the responsive fixture also covers 320, 768, 1024 and 1440px widths. The live in-app preview was inspected after rebuilding.

Firefox's three entrance cases could not execute: its installed browser exited before page creation with the previously documented missing-profile error. Firefox behavior is unverified. Test logs and recordings are retained in `artifacts/gallery-entrance/`.

Timing refinement: production build, scoped ESLint, formatting and whitespace checks passed again, together with eight focused Chromium/WebKit entrance and stationary-control tests. These additionally assert the slower rise, vertical rebound, delayed bubble fade and small horizontal rebound. Updated desktop/mobile motion was recorded and visually inspected; autoplay timing remains unchanged.

Pace adjustment (1.45 seconds): production build and six Chromium/WebKit entrance checks passed; desktop/mobile recordings were refreshed and the motion sequence inspected again. All phase timings scale together; bounce distances and one-shot behavior remain the same.

Latest pace (1.3 seconds): the owner requested another small increase in speed. Only the shared timing scale changed; production build, scoped ESLint and all six Chromium/WebKit entrance checks passed again.

# Mobile glass menu

The reference is the owner's `ScreenRecording_09-27-2026 19-56-27_1.mov` (818×512, approximately 60fps, 8.41 seconds). The supplied screenshots identify the website trigger. The owner’s follow-up CleanShot recording exposed the misplaced detached panel and unwanted X in the first adaptation. Selected frames from the first opening and closing were examined; no reference assets or implementation are shipped.

## Observed motion

The reference does not simply scale a finished rectangle. The button's glass circle becomes the menu surface. Width and height grow at different rates as the center travels left and down. The surface briefly sits below its final position, expands slightly beyond its final width, then settles upward while its large rounded ends resolve into corners. The text initially appears enlarged and blurred inside the changing outline, then resolves independently of the shell. Closing first softens the text and dips the surface, then draws it into an asymmetric droplet traveling back toward the upper-right button.

Approximate first-cycle measurements in source pixels:

| Recording time | Surface x, y | Width × height | Observation                                       |
| -------------- | ------------ | -------------- | ------------------------------------------------- |
| 0.000s         | 655, 27      | 132 × 132      | Resting trigger circle.                           |
| 0.267s         | 425, 75      | 328 × 281      | Rounded body moving down and left.                |
| 0.333s         | 153, 85      | 622 × 414      | Broad rounded body below its final position.      |
| 0.450s         | 21, 36       | 769 × 441      | Width overshoot; corners resolving.               |
| 0.600s         | 36, 25       | 753 × 439      | Near the final 750 × 438 surface at 39, 27.       |
| 1.483s         | 149, 100     | 631 × 412      | Closing dip, before returning toward the trigger. |
| 1.583s         | 480, 47      | 278 × 258      | Returning droplet.                                |
| 1.750s         | 656, 18      | 129 × 130      | Trigger-sized surface settling vertically.        |

## Website implementation

The closed 44px trigger and the panel use the liquidglass.dev optical engine with the owner’s exact refraction, bezel, curvature, chroma, frost and highlight settings. The panel radius is 19px; the resting circular trigger retains its 22px radius. See [Menu Liquid Glass](menu-liquid-glass.md) for the rendering adapter and browser verification.

The path is mapped to the actual trigger and panel dimensions. The panel is positioned at top/right zero inside the trigger’s disclosure, so its final top and right edges match the circle exactly. At a 390px viewport the circle is at (326, 10), 44×44; it becomes a 320×250 menu at (50, 10). At 320px it becomes a 219px-wide menu inside the page gutters. A separate glass surface animates position, width, height and corner shape (now resolving to the requested 19px radius); a matching clip contains the independently animated text. The resting trigger glass is hidden while this surface is present, so only one surface is visible. The hamburger fades out and stays absent while expanded; there is no X or separate open-state button. It returns only during the final part of the collapse.

Opening takes 520ms; closing takes 420ms. Native Web Animations run the sampled geometry through the existing `createMotionScope`, without a per-frame JavaScript layout loop. Both directions use their own measured shape sequence. Reversal snapshots the current presentation and retargets from there. Faded closing text remains hidden for the complete surface collapse, avoiding a flash when its shorter fade ends.

A pointer press anywhere outside the panel, including other parts of the header, closes it. Escape also closes and restores focus after the circle returns. Keyboard opening moves focus to the first link when the expansion settles; the consumed summary is removed from the accessibility tree and tab order until closure. Focus leaving the panel dismisses it without trapping Tab. Responsive changes, live reduced motion, unavailable animation APIs and cleanup settle to a usable state. Link selection closes immediately before native page navigation. Without JavaScript, the native `<details>` fallback places the panel below its summary so the disclosure can still be toggled. Product media areas remain untouched.

## Verification

`tests/browser/menu-morph.spec.ts` checks exact top/right anchoring, consumption of the trigger, absence of X, width overshoot, text clarity, real-time closing visibility, return to the trigger, interrupted outside dismissal, keyboard focus, short screens, resize and reduced/missing animation fallbacks. Existing menu, anchor-scroll, accessibility and no-JavaScript checks are also included in the focused run.

`node scripts/capture-menu-morph.mjs` records real pointer opening/closing, geometry and page errors at 320, 390 and 760px widths. Local screenshots, recordings and the reference extracts live under ignored `artifacts/menu-morph/`.

September 27 corrected implementation: production build, TypeScript and ESLint passed. 15 focused browser cases passed across Chromium/WebKit; one Chromium-only CDP touch case was intentionally skipped in WebKit. The three captured widths emitted no page errors. Real-time opening/closing captures and hero/page materials were visually inspected at 320, 390 and 760px. The final surface consumes the button in its own position, with no detached circle or X. Firefox was not rerun because its installed runner has the previously documented launch failure.

Liquid Glass refinement: the sampled trajectory, 520/420ms durations, overshoot, icon handoff, text transition and outside-dismissal behavior are retained. The optical adapter reads their current presentation rather than running another spring. The menu was moved alongside the header’s paint group so the engine can refract header content without filtering the menu’s own labels.

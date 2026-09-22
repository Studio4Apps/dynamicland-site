# Homepage vertical rhythm correction

Completed and remeasured in local production on **2026-09-22**. This pass inspected every top-level homepage boundary and corrected the hierarchy without changing section content, typography, media geometry, text/media alignment, backgrounds, or interactions.

## Actual homepage chapters

The rendered top-level order is:

1. Overview hero
2. Highlights carousel
3. Home widgets
4. Music
5. MiniLand activity
6. Everyday tools
7. Customization
8. Pricing
9. FAQ
10. Closing download call to action

## Spacing roles

The shared tokens distinguish connected content from subsection and chapter spacing:

```css
--space-group: 1.25rem;
--space-content: 2.5rem;
--space-subsection: 4rem;
--space-related-edge: clamp(2.5rem, 5vw, 4.5rem);
--space-section-inset: clamp(4.5rem, 8vw, 7rem);
--space-chapter-independent: clamp(6rem, min(calc(2rem + 16.5vw), 32vh), 14rem);
```

`--space-chapter-independent` owns uninterrupted white-on-white chapter breaks. Its width term produces the intended mobile/tablet/desktop progression and its height cap limits blank scrolling in short landscape viewports. Full-width background transitions retain balanced internal section insets. Pricing and FAQ use the smaller related edge token on both sides of their intentional color transition; the shared token owns the transition and prevents unrelated section padding from accumulating there.

## Measurement method

Measurements are CSS pixels in Chromium against the production build with reduced motion, after fonts and enhancement controls are ready. Each gap runs from the last painted content edge of the previous chapter to the first painted edge of the next. The measurement includes empty media frames, cards, borders, captions, and the complete carousel control row.

The table reports settled visual layout rather than declared padding. For example, Home → Music measures 165px on mobile although each section declares 72px at the boundary; the remaining 21px belongs to the final Home detail row’s internal bordered padding.

| Boundary                 | Relationship                    | Desktop 1440 before → after | Tablet 768 before → after | Mobile 390 before → after | Spacing owner and judgment                                             |
| ------------------------ | ------------------------------- | --------------------------: | ------------------------: | ------------------------: | ---------------------------------------------------------------------- |
| Overview → Highlights    | Independent                     |                   112 → 224 |               72 → 158.72 |                72 → 96.34 | Highlights top; corrected compressed introduction break                |
| Highlights → Home        | Independent                     |                   192 → 224 |           123.52 → 158.72 |                72 → 96.34 | Highlights bottom after the complete controls; corrected               |
| Home → Music             | Independent, background change  |                   224 → 224 |                 144 → 144 |                 165 → 165 | Shared standard section insets; already clear and preserved            |
| Music → MiniLand         | Independent, background change  |                   224 → 224 |                 144 → 144 |                 165 → 165 | Shared standard section insets; already clear and preserved            |
| MiniLand → Everyday      | Independent, background change  |                   224 → 224 |                 144 → 144 |                 144 → 144 | Shared standard section insets; already clear and preserved            |
| Everyday → Customization | Independent                     |                   192 → 224 |           123.52 → 158.72 |                72 → 96.34 | Everyday bottom; corrected compressed white transition                 |
| Customization → Pricing  | Independent, background change  |                   224 → 224 |                 144 → 144 |                 144 → 144 | Shared standard section insets; already clear and preserved            |
| Pricing → FAQ            | Related                         |                   224 → 144 |                  144 → 80 |                  144 → 80 | Balanced related edge token; tightened to express relationship         |
| FAQ → Closing            | Related conclusion with divider |                   128 → 128 |                   88 → 88 |                   88 → 88 | FAQ trailing inset plus the closing border’s 16px placement; preserved |

Total page height changed from 9545px to 9641px at 1440×1000, 8178px to 8271px at 768×1024, and 10919px to 10928px at 390×844. Mobile therefore gains clearer independent chapter starts with only 9px net additional page length.

## Visual judgment

- Overview, Highlights, Home, and Customization now begin as distinct chapters at all inspected widths.
- The carousel’s captions, counter, timer, playback button, pagination, and arrows remain one group; the larger break starts after the control row.
- Home and Customization retain their existing text/media alignment. High-starting desktop media frames were included in the measurements.
- Dark and tinted background transitions already separated their chapters, so their internal breathing room was not enlarged.
- Pricing and FAQ now read as related purchase/help content rather than two widely separated product chapters.
- The closing call to action retains its existing divider and moderate relationship to FAQ.

Full-page thumbnails were used only for whole-page cadence. Every changed boundary was also inspected at a normal viewport size on desktop, tablet, and mobile.

## Motion and scrolling

The settled values above are layout measurements. Normal-motion entrances temporarily translate participating reveal elements by at most 14px for 600–800ms; the continuous-scroll audit observed that declared maximum, minimum opacity 0.5, and no overlap or horizontal overflow. Reduced motion produced no reveal animation. Both modes settled with zero running reveal animations and no console/page errors after forward and rapid reverse scrolling.

All six homepage anchors remain within 87.58–88.42px on the 390px reduced-motion pass and 95.84–96.36px on desktop. Every enabled carousel control retained a 3px focus outline inside the viewport. Resize and orientation coverage includes 320–2560px widths and 844×390 short landscape.

## Verification and evidence

- TypeScript, ESLint, five unit contracts, production build, and security scan pass on Node 24.21.0.
- Playwright: 36 passed, 4 deliberate Chromium-only skips, 0 failed across Chromium and WebKit.
- The hierarchy regression checks three equivalent independent boundaries, their single owners, the smaller related Pricing/FAQ transition, normal/reduced motion, anchor clearance, and root overflow.
- Matching full-page before/after images, normal-size boundary captures, and raw measurements are in ignored `artifacts/rhythm/`.
- The 16.4-second continuous scroll/reverse recording is `artifacts/rhythm/recordings/homepage-rhythm-scroll.webm`; its sampled motion report is `artifacts/rhythm/motion-scroll-report.json`.
- Focus containment and sticky-anchor measurements are in `artifacts/rhythm/focus-anchor-report.json`.

These results establish the implemented visual hierarchy and test behavior. They do not substitute for the owner’s final visual approval.

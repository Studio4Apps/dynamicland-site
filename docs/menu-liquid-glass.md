# Menu Liquid Glass

The owner requested the engine from [liquidglass.dev](https://liquidglass.dev), using the supplied playground settings, while retaining the accepted circle-to-menu animation. The MIT-licensed v1.0.0 core is self-hosted in `src/lib/vendor/liquid-glass/`; its license, origin, upstream commit and checksum are retained there. No external runtime requests are made.

| Playground control | Engine option | Value                              |
| ------------------ | ------------- | ---------------------------------- |
| Corner radius      | `radius`      | 19px; clamped by the current shape |
| Refraction         | `refraction`  | 40                                 |
| Bezel              | `bezel`       | 0.85                               |
| Curvature          | `curvature`   | 4                                  |
| Chroma             | `chroma`      | 0                                  |
| Frost              | `blur`        | 0.5px                              |
| Highlight          | `specular`    | 0.25                               |

The resting button remains 44×44px with a 22px radius. The menu remains up to 320×250px (219px wide at a 320px viewport), and its height follows the available viewport. Both shapes use identical optical settings.

## Rendering

The optical engine now uses `mode: backdrop` directly on the animated trigger/menu surface. No filters are applied to page sections or carousel tracks. This removes the source-relative scroll coordinates and cached section paint that could leave a detached reflection above the menu during vertical scrolling.

Chromium uses the original SVG refraction settings. WebKit and Firefox use the engine's native `blur(0.5px)` fallback because SVG backdrop filters are unsupported there. This is an explicit compatibility tradeoff: those engines retain the graphite transparency, highlight border, and morph, but not the full refraction.

The original 520ms/420ms morph remains unchanged. The active lens follows its own size via ResizeObserver and samples the existing animated corner radius. The browser owns backdrop positioning and clipping during both vertical and horizontal scrolling. There is no scroll-driven refraction repaint or page-wide filter.

## Verification

The regression opens the menu over Photo 04–06 and scrolls vertically in both directions while it stays open. It verifies surface/panel alignment and absence of page filters, and captures each slide. Morph trajectory, outside dismissal, keyboard focus, reduced motion, resize, and graphite tint checks remain covered.

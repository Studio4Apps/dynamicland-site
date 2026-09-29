# Scroll motion — September 29 reference

Reference: user-supplied CleanShot 2026-09-29 at 7.37.16 PM.mp4.
25 seconds, 3420 × 1870, 120 fps. Contact sheet sampled at 1 fps;
entrances at 10–11.5s and 18–19.5s inspected at 8 fps.

## Observations

At 10s the performance heading is initially faint. The eyebrow and headline
resolve first, the paragraph follows, then the two specifications. At 18s the
shopping section enters: heading first, then the cards resolve left to right.
The image sequence supports an approximately 0.7–1s reveal and a short stagger;
these are visual estimates, not extracted source timing. The recording includes
page scrolling, so screen displacement cannot be treated as animation distance.
No clear bounce, letter-by-letter animation, or strong blur appears in these
entrances. Motion establishes reading order and settles without overshoot.

## Website adaptation

- Whole text blocks: 820ms, 28px rise (18px mobile), 95ms stagger.
- Media and cards: 1000ms, 48px rise (28px mobile), 135ms row stagger.
- Cubic easing (.22, .8, .25, 1); opacity and movement settle together.
- Trigger 7% inside the bottom of the viewport. Each target enters once.
- Cards in a mobile column are observed individually. Horizontal cards wait
  until visible in their scroll container. Delays are capped at 320ms.
- No permanent scroll handler, parallax, layout animation, or blur in entrances.
- Existing slider playback, menu morph, release hover and modal interactions
  retain their dedicated controllers. Entrances use the separate CSS translate
  property and remove their effects on completion.
- Server-rendered content is visible without JavaScript. Reduced motion leaves
  it visible. Keyboard focus immediately reveals the containing target;
  backgrounding settles running effects. Cleanup cancels every effect.

Scope: hero copy, highlights heading/rail, product chapter copy/media/details,
utility cards, customization, pricing, FAQ panel, update cards, closing copy.

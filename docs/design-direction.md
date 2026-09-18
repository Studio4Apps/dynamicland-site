# DynamicLand design direction

The current [18 September visual direction](redesign-review.md) extends this original brief with a photographic landscape opening and revised chapter composition.

An open, warm-neutral product story with a typographic opening, changing media proportions, one near-black music world, and purple used as a meaningful brand signal. The site should still feel intentional while approved media is absent. No simulated product interfaces.

## Reference conclusions (12 September 2026)

- Apple / current iPhone Pro: one dominant subject per moment, contained local navigation, restrained movement, deliberate light/dark handoffs. Desktop scroll inspected; media loading was incomplete in the research browser.
- Craft: inspected desktop and 390px mobile; serif/sans contrast, independent chapter worlds, navigation that floats above rather than crowds content, depth from overlapping captures. Borrow editorial order, not collage, proprietary type, or component proportions.
- Screen Studio: page content inspected; live browser connection refused. Its concise, media-centered feature explanations inform copy, but live motion could not be verified.
- CleanShot: inspected desktop hero and feature scroll. Plain language and generous gaps are sufficient without decorating every feature.
- Flighty: inspected hero and chapter transition; floating context works when it supports one central product view.
- Raycast: inspected dark chapter; keep local depth but reject the developer-tool aesthetic.
- LaunchMe: inspected hero and product rail. Large application captures clarify scope; avoid adopting its long feature catalogue.
- Things / Bear / AirBuddy: inspected entry pages; restrained identity, limited chrome, and platform-specific copy. Some remote assets remained unloaded at capture.
- ThreeUI: browse catalogue inspected. Orbs and fluid/WebGL fields rejected: they would add an unrelated object in the absence of real product media.
- SV Animations / Table / Blocks / Efferd / Matrix / Particles / Agentation: reviewed source pages. Progressive blur and masked continuity are transferable; tables, particles, generated marketing blocks, Svelte dependencies and agentation overlay are inappropriate for this production site.
- Framework-neutral Craft and Things DESIGN.md read as third-party inspiration, not authoritative product requirements. No reference assets copied.
- The named reference recording was not attached; frame-by-frame analysis is unavailable.

## Composition

Hero: a serif/sans typographic opening above a shallow cinematic ivory media surface. Highlights: open horizontal editorial navigation, not equal feature cards. Home: a large warm chapter, with one overlapping smaller capture and a separate widget view. Mini Lands: a bounded desktop sticky depth handoff; natural stacking on mobile. Music: dark cinematic visual and optical text entry. Utilities: two quiet text groups. AI: restrained side composition. Customization: staggered three-frame gallery. Native/privacy and pricing: readable, quiet. Final CTA: one oversized purple wordmark moment.

## Typography and materials

System sans (no redistributed proprietary font) paired with locally hosted Latin Newsreader variable WOFF2, SIL OFL 1.1; license included. No remote fonts at runtime. Cream, neutral white, ink, charcoal. Fixed radius families and contact shadows only on layered captures. Brand is exactly #8810F8 → #D986FF.

## Interaction

Native scroll. CSS view timelines where supported with stable fallbacks. IntersectionObserver + Web Animations for only the major optical arrivals. No global JS scroll loop, GSAP, Lenis, WebGL, bounce or looping ambient effects. All reading content exists in static exported HTML. Reduced-motion removes blur/parallax/sticky sequence.

## Content state

User confirmed real commercial/legal content comes later. Download URL, pricing, legal and support contact remain null. No invented claims, trial, minimum OS, reviews, organization, checkout or app privacy promise. Deploy privately for review; launch checklist gates public release.

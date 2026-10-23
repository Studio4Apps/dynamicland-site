<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Landing page artwork

The landing page tells one story on one lake: the hero's boat searching, then (at the owner's request) “Start free. Go further with Pro” with `/media/pro-voyage.webp` (the boat under way towards a far lit window), then “Make a little room for a better everyday” with `/media/invite-island-1600.webp` and `/media/invite-island-840.webp` on phones (arrival: the island cabin, the boat tied at its jetty, its lantern by the door). Keep the scenes in that world. Both stills are rendered from `scripts/scenes/stills.ts`; regenerate them with `node scripts/render-scenes.mjs` rather than hand-editing. The owner-provided `pro-card.webp` (MiniLand gallery card) and `footer-*.webp` (site footer) stay. Keep these images unless the user explicitly requests replacing them.

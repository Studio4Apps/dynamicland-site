# Launch readiness

This build is a private review. The user will supply product media and approved commercial/legal content later.

## Required content before public launch

- Set the actual HTTPS download URL, pricing, minimum macOS version, support email, and approved privacy/terms sections in `src/content/site.ts`.
- Confirm feature copy against the shipping release. No minimum OS, free tier, offer, seller identity, review, rating, or privacy promise has been invented.
- Replace the 11 media slots in `src/content/media.ts` with local approved assets; populate accurate alt text, dimensions, captions for meaningful video audio, and poster. The default `contain` preserves arbitrary source proportions. Adjust slot ratio when appropriate without restructuring a chapter. Video remains click-to-play with no autoplay.
- Set NEXT_PUBLIC_SITE_URL to the verified official domain and rebuild. Do not derive it from untrusted Host headers.
- Review the initial training-crawler opt-out separately from search visibility. The owner can change that policy in `src/app/robots.ts`.
- Public sharing requires owner intent; a private Sites URL is not crawlable by external search engines.

## Search and AI discovery

- Verify official domain ownership in Google Search Console (DNS TXT preferred) and Bing Webmaster Tools.
- Submit `/sitemap.xml`; run URL Inspection for the homepage and support page. Legal pages are noindex and absent from sitemap until approved text is supplied.
- Validate WebSite and SoftwareApplication JSON-LD. A SoftwareApplication without verified offers/ratings may not qualify for Google's software rich result, although the semantic entity is valid. Do not invent those fields to pass an optional rich-result requirement.
- Confirm indexability, canonical domain, HTTPS redirects, robots status, and rendering on the production domain.
- Ensure CDN/WAF challenges do not block legitimate search crawlers. Verify crawler identity with official IP/rDNS procedures; never allow an arbitrary user-agent string to bypass security.
- Check Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot/Claude-User, PerplexityBot/Perplexity-User, and Applebot through current official documentation before launch. No blanket bot challenge or client-only content is included in this build.
- IndexNow is optional for this low-change static site; configure it only after verified domain ownership. No account verification, submission, IndexNow notification, or indexing action has been performed.
- `llms.txt` is intentionally omitted: semantic HTML, canonical metadata, structured data, sitemap, and first-party facts are the discovery foundation.

## Security and delivery

- Deploy the static `out` directory. No production database, API, authentication layer, secrets, third-party JavaScript, or analytics is added by this code.
- `scripts/finalize-export.mjs` writes per-page hash-based CSP and static hosting headers. On hosts that do not apply `_headers`, configure the equivalent HTTP response headers at the CDN. Meta CSP still provides most document restrictions, but frame-ancestors and HSTS require response headers.
- CSP allows inline styles because Next/font and the media ratios use inline declarations; it does not allow arbitrary inline scripts or eval. All shipped inline Next payloads and JSON-LD receive exact SHA-256 hashes at build time. New external media hosts must be explicitly reviewed and added to the source policy.
- HSTS intentionally omits includeSubDomains/preload until the official domain and subdomains are verified HTTPS-ready.
- Check deployed response headers; keep dependencies patched. Re-run audit and browser checks after substantive dependency or media changes.
- Re-measure LCP, CLS, INP and video decode/rendering performance after actual imagery arrives. Current frame-only measurements do not predict final media payloads. Real field p75 Core Web Vitals require production traffic.

## Sources checked 12 September 2026

- https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers
- https://developers.openai.com/api/docs/bots
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://support.apple.com/en-us/119829
- https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 (not text-readable through research tool; confirm through Webmaster Tools on launch)
- https://nextjs.org/blog (current security release), https://github.com/vercel/next.js/security/advisories
- https://react.dev/blog
- https://github.com/google/fonts/blob/main/ofl/newsreader/OFL.txt

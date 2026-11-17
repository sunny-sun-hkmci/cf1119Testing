# Brief: Harbour Lights Festival 2027 microsite

This brief was written before the site was generated. The AI tool builds from it; people review the result.

## Purpose
A small campaign microsite used to demonstrate a governed, AI-assisted web workflow on Cloudflare:
AI proposes a change as a pull request, automated checks run, a staff-only preview is reviewed,
and only the pipeline deploys. The site content itself is a stand-in for any event campaign.

## Brand (fictional)
- Name: **Harbour Lights Festival 2027**. A made-up ten-night harbour festival, 8–17 October 2027.
- Venues are invented (Starlight Pier, Lantern Plaza, Market Steps, Old Dock Hall).
- It must not imitate any real organisation: no real organisation's name, logo, colours, slogans or
  page layout, and no real venue or event names. A visible notice on every page says the festival is fictional.
- Look: deep navy, warm lantern amber, harbour teal. Original vector illustration only.
- No photographs of people. No stock photos. No embedded video.

## Pages (static HTML, no build framework)
| Page | English | Traditional Chinese |
|---|---|---|
| Home | `/` | `/zh-hant/` |
| Programme | `/programme/` | `/zh-hant/programme/` |
| Venues and travel | `/venues/` | `/zh-hant/venues/` |
| Plan your visit (FAQ, accessibility, contact) | `/visit/` | `/zh-hant/visit/` |
| 404 page (bilingual) | `/404.html` | |

Each page has a language switch to its twin page and `hreflang` alternates.

## Requirements
- Responsive from 320 px wide up; no horizontal scrolling.
- Accessible: skip link, landmarks, one `h1` per page, visible focus, 44 px touch targets, text contrast of at
  least 4.5:1, descriptive `alt` text, `lang` on each page and on the language switch, respects reduced motion.
- No JavaScript. No external fonts, scripts, analytics or trackers. Everything is served from the same origin,
  which lets the Content-Security-Policy be strict (`default-src 'none'` plus same-origin images and styles).
- Programme times and the English and Chinese text must say the same thing.
- Contact address uses the reserved `.example` domain.

## Hosting contract
- Cloudflare Worker `harbourlights-demo` serving the `public/` folder as static assets.
- Security headers come from `public/_headers`.
- `wrangler.jsonc` has no account id and no routes; the hosting task adds the domain.

## Governance contract
See `GOVERNANCE.md`. In short: AI works on branches, never pushes to `main`, never deploys, never reads secret files.

## Acceptance checks
`npm run check` passes; `npx wrangler deploy --dry-run` exits 0; the fictional-brand check finds nothing that
refers to a real organisation; no secret scanner findings; every page has an English and a Chinese twin.

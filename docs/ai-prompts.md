# Prompts used to build this repo

Kept for transparency: this is how an AI-assisted change is documented in the workflow. Prompts are
shortened where they only repeated task wording, but nothing material is left out. The AI tool was Claude Code
(Sonnet 5.5). The page HTML was first produced by a throw-away generator script that produced the repeated page
layout in both languages; the committed HTML files are the source of truth from then on and were then edited by hand.

## 1. Brief
> Write `BRIEF.md` first for a fictional "Harbour Lights Festival 2027" campaign microsite: 3–4 static pages,
> English and Traditional Chinese, responsive, accessible. It must not use any real organisation's name, logo,
> colours or look, no real photos of people and no external trackers. Host as a Cloudflare Worker named
> `harbourlights-demo` serving static assets.

## 2. Site generation
> From `BRIEF.md`, build the site under `public/`: Home, Programme, Venues and travel, Plan your visit, in
> English at the root and Traditional Chinese under `/zh-hant/`, plus a bilingual 404 page. One shared stylesheet,
> original SVG illustration, no JavaScript, same-origin resources only. Add a language switch and `hreflang`
> alternates. Make the Chinese text natural written Traditional Chinese as used in Hong Kong, not a literal translation.

## 3. Hosting and security headers
> Add `wrangler.jsonc` (Worker `harbourlights-demo`, assets directory `./public`, 404 page, no account id, no routes)
> and a `public/_headers` file with HSTS, a strict Content-Security-Policy, nosniff, frame and referrer
> policies and a Permissions-Policy.

## 4. Governance
> Write `CLAUDE.md` and `AGENTS.md` with identical rules for Claude Code and Codex. Add `.claude/settings.json`
> deny rules for `wrangler deploy`, `npx wrangler deploy`, reading `.env*` and pushing to `main`, and a PreToolUse
> hook that blocks deploy commands and fails closed. Add a sample Codex config with approval policy and sandbox
> only (leave the model provider as a marked TODO). Add GitHub Actions for build, gitleaks, HTML and accessibility
> checks and a header check that takes a preview URL. Add `CODEOWNERS`, `GOVERNANCE.md` in plain English and a
> README with branch protection steps.

## 5. Content update (the change used in the pull request demo)
> Create branch `content-update`. Add one programme item in English and in Traditional Chinese: a
> sign-language interpreted lantern walk. Keep both languages consistent, run `npm run check`, commit, push the
> branch and do not open the pull request.

## 6. Maintenance change for the live pull request demo (headless `claude -p`)
> Maintenance change, following CLAUDE.md and BRIEF.md. On the Venues and travel pages (public/venues/index.html and public/zh-hant/venues/index.html), update the shuttle bus information: add that on closing night, Sunday 17 October, shuttle buses run until 00:30 after the closing concert (the existing text says the last bus is at 23:30). Keep English and Traditional Chinese equal in meaning, keep the existing structure, add no external resources, and do not touch any file other than those two pages. Do not commit or push. When done, run npm run check and report what you changed.

Run with `--permission-mode acceptEdits` and only Read, Edit and `npm run check` allowed.

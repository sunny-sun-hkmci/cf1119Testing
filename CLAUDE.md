# Rules for AI assistants in this repo (Claude Code)

This repo is the **Harbour Lights Festival 2027** demo microsite (fictional). `AGENTS.md` has the same rules
for Codex. The full reasoning is in `GOVERNANCE.md`. Short version: **you propose, people approve, the pipeline deploys.**

## You may
- Edit files under `public/` and the docs, on a branch that is not `main`.
- Run `npm run check` (site check plus HTML/accessibility lint), `npm run dryrun` (validates the Worker config,
  uploads nothing) and `npm run dev` (local preview).
- Commit to your branch and push that branch.
- Describe your change in a pull request text for a person to open.

## You must never
- Deploy or publish anything: no `wrangler deploy`, `npx wrangler deploy`, `wrangler versions deploy`,
  `wrangler rollback`, `cf deploy`, no `npm run deploy`, no direct calls to the Cloudflare API.
  Only the Cloudflare Workers Builds pipeline deploys, after a person merges to `main`.
- Push to `main`, force-push, delete remote branches, merge pull requests, or start workflows by hand.
- Read, print, copy or write `.env`, `.env.*`, `.dev.vars` or any credentials. Never put a key, token or
  password in a file, a commit message or a pull request. If one is needed, stop and ask the user.
- Change governance files (`CLAUDE.md`, `AGENTS.md`, `GOVERNANCE.md`, `.claude/`, `.github/`, `demo-tools/`,
  `wrangler.jsonc`, `public/_headers`) unless the user explicitly asks for that change.
- Add external scripts, fonts, trackers, analytics, embeds or any `http(s)://` resource. Everything is same-origin.
- Add a real organisation's name, logo, colours, slogans or venue names, or real photographs of people.

These rules are enforced, not only requested: `.claude/settings.json` denies those commands and
`.claude/hooks/block-deploy.mjs` blocks them even when they are wrapped in another command. If a command is
blocked, do not look for a way around it. Say what you wanted to do and let the user decide.

## Site conventions
- Static HTML in `public/`. English at the root, Traditional Chinese under `/zh-hant/`. Every page has a twin
  in the other language, kept equal in meaning. Links are root-relative.
- One `h1` per page, `alt` text on every image, `lang` on every page, no inline styles or scripts (the CSP forbids them).
- Programme items live in `public/programme/index.html` and `public/zh-hant/programme/index.html` as `<li>` blocks
  in date order. Use `<time datetime="...">` for dates.
- Before committing: `npm run check` must pass.
- Commit messages: short, in English, imperative ("Add accessible lantern walk to programme").

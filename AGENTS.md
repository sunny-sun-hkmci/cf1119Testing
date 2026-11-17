# Rules for AI assistants in this repo (Codex and other agents)

This repo is the **Harbour Lights Festival 2027** demo microsite (fictional). `CLAUDE.md` has the same rules
for Claude Code. The full reasoning is in `GOVERNANCE.md`. Short version: **you propose, people approve, the pipeline deploys.**

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

These rules are enforced, not only requested. For Codex the enforcement is the sandbox in
`demo-tools/codex-home/config.toml` (approval on request, no network from the sandbox), the branch rules on
GitHub, and the fact that the deploy credential exists only in the Cloudflare pipeline. If a command is
refused, do not look for a way around it. Say what you wanted to do and let the user decide.

## Site conventions
- Static HTML in `public/`. English at the root, Traditional Chinese under `/zh-hant/`. Every page has a twin
  in the other language, kept equal in meaning. Links are root-relative.
- One `h1` per page, `alt` text on every image, `lang` on every page, no inline styles or scripts (the CSP forbids them).
- Programme items live in `public/programme/index.html` and `public/zh-hant/programme/index.html` as `<li>` blocks
  in date order. Use `<time datetime="...">` for dates.
- Before committing: `npm run check` must pass.
- Commit messages: short, in English, imperative ("Add accessible lantern walk to programme").

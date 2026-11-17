# Harbour Lights Festival 2027 (fictional demo site)

A small bilingual (English / Traditional Chinese) campaign microsite used to demonstrate a **governed,
AI-assisted web workflow on Cloudflare**. The festival, brand and venues are invented.

- What the site is: [BRIEF.md](BRIEF.md)
- How AI is controlled: [GOVERNANCE.md](GOVERNANCE.md)
- Rules for AI tools: [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md)
- Prompts used to build it: [docs/ai-prompts.md](docs/ai-prompts.md)

## Layout

```
public/                  the website (static files) + _headers (security headers)
wrangler.jsonc           Worker "harbourlights-demo" serving public/ (no account id, no routes yet)
scripts/                 check-site.mjs (build check), check-headers.mjs (live header check)
.claude/                 Claude Code deny rules and the deploy-blocking hook
demo-tools/codex-home/   Codex config: approval, sandbox, and the AI Gateway model provider
demo-tools/claude-gateway.sh  runs Claude Code through the AI Gateway (no key on the laptop)
demo-tools/claude-code/  settings file used by that launcher (--settings, this run only)
demo-tools/managed/      samples IT would push to every laptop (Claude Code managed-settings.json, Codex requirements.toml)
.github/                 CI workflows and CODEOWNERS
```

## Work on it locally

Needs Node 20 or newer.

```bash
npm ci --ignore-scripts
npm run check        # site check + HTML/accessibility lint
npm run dryrun       # validates the Worker config, uploads nothing
npm run dev          # local preview at http://localhost:8787
```

Nothing in this repo deploys from a laptop. Deploys come only from the Cloudflare Workers Builds pipeline
after a merge to `main` (set up in the hosting task).

## AI tools through the company AI Gateway

Both tools are set up to use the Cloudflare AI Gateway at `aigw-native.mcmsp.dev` (behind Cloudflare Access).
No provider key is on the laptop: the key lives in the Gateway, and staff sign in with company SSO.
Neither setup touches `~/.claude` or `~/.codex`.

```bash
demo-tools/claude-gateway.sh                    # Claude Code through the Gateway (first run opens the SSO login)
demo-tools/claude-gateway.sh -p "your prompt"   # one-shot
CODEX_HOME="$PWD/demo-tools/codex-home" codex   # Codex, needs an OpenAI key stored in the Gateway
```

- Needs `cloudflared` and `claude` on the PATH. Codex 0.169 speaks only the OpenAI Responses API, so through the
  Gateway it needs an OpenAI model; the demo shows Codex's config and rules and runs Claude Code live.
- The Gateway log shows who (name and email from Access), which tool and model, tokens and cost.
  Its DLP (credit-card block) and per-user spend limit are Beta features.
- `demo-tools/managed/` shows how IT enforces the same rules on every laptop. See its README.

## Checks in GitHub Actions

| Workflow | When | What |
|---|---|---|
| `CI` / Build and dry-run | every pull request and push to `main` | `npm run build`, `wrangler deploy --dry-run` |
| `CI` / HTML and accessibility | same | html-validate with WCAG-oriented rules |
| `CI` / Secret scan | same | gitleaks over the full history |
| `Header check` | by hand | Actions tab, Header check, Run workflow, paste the preview or production URL. For an Access-protected preview, add secrets `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` (a service token for that app only). Locally: `node scripts/check-headers.mjs https://<host>` |

## GitHub settings to do by hand (repo owner)

The repo ships the rules; these switches live in GitHub and cannot be set from the repo.
Repo, **Settings**, then:

1. **Rules, Rulesets, New branch ruleset** (or Branches, Add branch protection rule) for `main`:
   - Require a pull request before merging, with **1 approval**.
   - **Require review from Code Owners**.
   - **Dismiss stale approvals** when new commits are pushed.
   - **Require status checks to pass**: select `Build and dry-run`, `HTML and accessibility`, `Secret scan (gitleaks)`
     (they appear in the list after the first workflow run) and **Require branches to be up to date**.
   - **Block force pushes** and **restrict deletions**.
   - Leave "Allow bypassing" empty so even admins use pull requests. On a personal repo, tick
     "Do not allow bypassing the above settings" if offered.
2. **Code security**: turn on **Secret scanning** and **Push protection**.
3. **Actions, General**: workflow permissions **Read repository contents** (the workflows also set this themselves).
4. **Actions, General, Fork pull request workflows**: require approval for outside contributors.
5. **Collaborators**: keep write access to the people who need it. Do not add a deploy token for Claude Code or Codex.
6. After the hosting task connects Workers Builds: production branch is `main`; non-production branches build previews.

Quick check that protection works: with the ruleset on, `git push origin main` from a laptop must be rejected.

## Pull request for the demo

Branch `content-update` is prepared with one programme item added by Claude Code. Open the pull request after the
hosting task has connected Workers Builds, so the preview link and checks appear on it.

# Governance: how AI is allowed to work on this website

One rule sums it up: **AI can propose, people approve, only the pipeline deploys.**
The same rule covers building the site and every later maintenance change.

## The flow

1. A person asks an AI tool (Claude Code or Codex) for a change.
2. The tool edits files on its own branch and pushes the branch. It cannot touch `main` or deploy.
3. A person opens a pull request.
4. Automated checks run: build, accessibility and HTML rules, secret scan.
5. Cloudflare builds a preview of the branch at its own web address. Only company staff can open it (Access login).
6. A named code owner reads the change and the preview, then approves and merges.
7. The merge to `main` starts the Cloudflare pipeline, which is the only thing allowed to deploy.
8. If something goes wrong, the previous version is restored from the Cloudflare dashboard in one click.

## Each control, in plain English

| Control | Where | What it stops | Why it matters |
|---|---|---|---|
| Rules file for AI tools | `CLAUDE.md`, `AGENTS.md` | AI forgetting house rules | Both tools read it at the start of every session. Good for guidance, but it is a request, not a lock, so it is backed by the controls below. |
| Command deny list | `.claude/settings.json` | Claude Code running deploy commands, pushing to `main`, merging pull requests, reading `.env` files | A hard "no" that the AI cannot talk its way past. |
| Deploy-blocking hook | `.claude/hooks/block-deploy.mjs` | The same actions when they are hidden inside another command | The deny list matches the start of a command. The hook reads the whole command and fails closed: if it cannot understand the input, it blocks. |
| Codex sandbox | `demo-tools/codex-home/config.toml` | Codex editing outside the project or using the network | Codex asks before risky actions, and its sandbox has no network, so it cannot call a deploy service. |
| Protected `main` branch | GitHub branch protection (see README) | Direct pushes, unreviewed merges, force-pushes | Even a person's mistake cannot reach production without a second look. |
| Code owners | `.github/CODEOWNERS` | Changes to rules, pipeline and headers without owner review | The files that define the controls need a named human to approve changes. |
| Required checks | `.github/workflows/ci.yml` | Broken builds, inaccessible pages, leaked secrets | Machines catch the boring problems before a person reviews. |
| Secret scanning | gitleaks job, plus GitHub push protection | Keys and tokens committed to the repo | A leaked key in history is a leaked key forever; stop it at the door. |
| Staff-only previews | Cloudflare Access on preview addresses | Unapproved work being seen by the public | Reviewers see the real result without publishing it. |
| Pipeline-only deploy credential | Cloudflare Workers Builds | Anyone deploying from a laptop | No deploy token exists on a laptop or in an AI session. |
| Security headers | `public/_headers`, header-check workflow | Clickjacking, content sniffing, injected scripts, downgrade attacks | Protects visitors; the check proves the headers really arrive. |
| No third-party code or trackers | `scripts/check-site.mjs`, CSP | Supply-chain and privacy risk | The site loads nothing from outside its own address, and the build fails if that changes. |
| Rollback | Cloudflare Workers versions | A bad release staying live | Recovery takes seconds and needs no code change. |

## Layers: no single control is trusted

To deploy by mistake, an AI tool would have to defeat the rules file, the deny list and the hook, then find
a deploy credential that does not exist on the machine, then get past a protected branch. Each layer is simple;
together they are reliable.

## What AI may and may not do

| | May | May not |
|---|---|---|
| Content and layout | Edit `public/` on a branch | Add outside scripts, trackers, real brands or real people's photos |
| Git | Commit and push its own branch | Push to `main`, force-push, merge |
| Deploy | Run `npm run dryrun` (checks only) | Deploy, roll back, call the Cloudflare API |
| Secrets | Say that one is needed | Read, print or store any |
| Governance files | Suggest changes in a pull request | Change them without the owner asking |

## Honest limits

- The deny list and hook protect Claude Code. They do not control other tools on a laptop. Codex is covered by its
  sandbox and by the branch and pipeline controls, which apply to every tool and every person.
- A person who is a repository administrator can change branch protection. Keep that group small and review it.
- The Cloudflare AI Gateway only sees traffic that is routed through it. Personal AI accounts used outside the
  Gateway are a company policy question, not something this repo can stop.
- The staff-only preview and pipeline are set up in Cloudflare, not in this repo. See the hosting task notes.

## Changing these rules

Open a pull request. A code owner must approve it. Explain which control changes and why.

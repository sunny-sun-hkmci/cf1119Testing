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
| Security audit gate | `scripts/security-gate.mjs`, `security/review-prompt.md`, Cloudflare Workers Builds deploy commands | Deploying (or previewing) a change that a security review did not pass | The build runs an AI security review of the change on Cloudflare, through the AI Gateway, and records the verdict in Workers KV. No passing audit means a failed build and nothing deployed. |
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

## The security audit gate

Every Workers Builds run (production and branch previews) runs `node scripts/security-gate.mjs` before it deploys:

1. It takes the diff of the commit being built: on a branch build, everything the branch adds to `main` (merge base); on `main`, the commit against its first parent. If the merge base cannot be computed it says so in the log and audits the last commit only.
2. It sends the diff, with the prompt in `security/review-prompt.md`, to Claude (`claude-sonnet-5-5`) through the company
   AI Gateway. Claude Code runs headless with a pinned version (lockfile in `security/tools/`) and read-only tools.
   If Claude Code cannot run, the same prompt goes to the Anthropic Messages API through the same Gateway.
3. The model must answer with JSON `{verdict, findings}`. A `fail` verdict, any `high` or `critical` finding, an error,
   a timeout, bad JSON, an oversized diff (150 KB) or a missing record is a **failed build**. The deploy command after
   `&&` never runs.
4. The verdict is written to Workers KV namespace `harbourlights-demo-audits`, key `audit:<commit sha>`. Read it with
   `npx wrangler kv key get "audit:<sha>" --namespace-id <id> --remote`. Production deploys also carry the message
   `security-audit: pass <sha>`.
5. The Gateway log shows each audit with metadata `purpose: security-audit`, the commit SHA and the repo label.

Credentials: an Access service token (`harbourlights-demo-ci`) stored as Workers Builds secrets, allowed by one Service Auth
policy on the Gateway's Access application. There is no Anthropic key anywhere in the repo or the build; it lives in the
Gateway. The token lets a caller use the Gateway (cost), nothing else.

Build settings (Cloudflare dashboard, not in this repo): production deploy command
`node scripts/security-gate.mjs && npx wrangler deploy --message "security-audit: pass $WORKERS_CI_COMMIT_SHA"`;
non-production deploy command `node scripts/security-gate.mjs && npx wrangler preview`.

## Honest limits

- The deny list and hook protect Claude Code. They do not control other tools on a laptop. Codex is covered by its
  sandbox and by the branch and pipeline controls, which apply to every tool and every person.
- A person who is a repository administrator can change branch protection. Keep that group small and review it.
- The Cloudflare AI Gateway only sees traffic that is routed through it. Personal AI accounts used outside the
  Gateway are a company policy question, not something this repo can stop.
- **The audit is a model review, not a proof.** It can miss problems and can be talked around by a determined author. The
  prompt treats the diff as untrusted data and the verdict must be strict JSON, but a human code owner still approves every merge.
- **The gate script lives in the repo it audits.** A pull request can change it. every file is under the
  catch-all CODEOWNERS rule and the review prompt names a weakened gate as a critical finding, but the real control is the code owner reading
  that change. A hardened version would run the audit outside the repo (a separate Worker or Workflow).
- **Anyone with personal deploy rights can still run `wrangler deploy` from a laptop and skip the build.** The gate covers the
  pipeline, not a person with a deploy credential. Keep that group small (see the points above).
- **Build secrets are visible to the build, so a pull request that edits the build scripts could read them.** The service token
  can only call the Gateway, and the Gateway has a spend limit.
- The staff-only preview and pipeline are set up in Cloudflare, not in this repo. See the hosting task notes.

## Changing these rules

Open a pull request. A code owner must approve it. Explain which control changes and why.

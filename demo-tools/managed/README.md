# Enforcing the rules on every laptop (samples)

The repo's `.claude/settings.json` and `codex-home/config.toml` are project defaults: a user can override them on
their own machine. IT enforces the company rules with managed files that the tools read first and users cannot
override. Both files here are samples with no secrets.

| File | Tool | Install location (macOS) | Delivered by |
|---|---|---|---|
| `managed-settings.json` | Claude Code | `/Library/Application Support/ClaudeCode/managed-settings.json` (Linux: `/etc/claude-code/`) | MDM, or server-managed settings from the Claude admin console |
| `requirements.toml` | Codex | `/etc/codex/requirements.toml` | MDM, or cloud-managed from the ChatGPT admin console |

Docs: https://code.claude.com/docs/en/settings , https://developers.openai.com/codex/enterprise/admin-setup

## `managed-settings.json`, key by key (JSON has no comments, so they are here)

- `apiKeyHelper` and `env.ANTHROPIC_BASE_URL`: every Claude Code session goes through the company AI Gateway and signs in
  with company SSO (Cloudflare Access). No Anthropic key is on the laptop.
- `env.CLAUDE_CODE_API_KEY_HELPER_TTL_MS`: how often the helper is re-run (30 minutes).
- `env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`: no telemetry or update pings to services outside the Gateway.
- `permissions.deny`: hard "no" for deploying, force-pushing, merging, and reading `.env` files, in every repo.
- `permissions.disableBypassPermissionsMode`: removes the "skip all permission prompts" mode.
- `allowManagedPermissionRulesOnly`: only these rules count. A user or repo cannot add `allow` rules that weaken them.
  Side effect: the repo's own `allow` rules stop working too, so list any needed allows in this file.

Deliberately left out: `allowManagedHooksOnly`. It would also switch off the repo's `block-deploy` hook.

## `requirements.toml`, in short

Limits Codex to `untrusted` or `on-request` approvals and a `workspace-write` sandbox at most, turns web search off, and
forbids deploy commands and force-pushes. Comments are inside the file.

## Honest limits

- These files govern Claude Code and Codex only. Other AI tools on a laptop are a policy and Zero Trust question.
- The Gateway only sees traffic that goes through it.

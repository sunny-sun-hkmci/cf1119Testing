#!/usr/bin/env bash
# Run Claude Code through the company Cloudflare AI Gateway, without touching ~/.claude.
#
#   demo-tools/claude-gateway.sh                      interactive session
#   demo-tools/claude-gateway.sh -p "your prompt"     one-shot prompt
#
# What it does:
#   - passes demo-tools/claude-code/gateway-settings.json with --settings (this run only):
#       ANTHROPIC_BASE_URL -> https://aigw-native.mcmsp.dev/anthropic (Access-protected custom domain)
#       apiKeyHelper       -> `cloudflared access login --no-verbose <gateway>`, which prints the
#                             Cloudflare Access token for the signed-in staff member
#   - no Anthropic API key exists on this laptop; the provider key is stored in the Gateway.
# First use opens a browser for the company SSO login (cloudflared). Nothing is written to this repo.
#
# Override the model with CLAUDE_GATEWAY_MODEL (default: claude-haiku-5-5, cheap and fast for a demo).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATEWAY="https://aigw-native.mcmsp.dev"
SETTINGS="$HERE/claude-code/gateway-settings.json"

command -v cloudflared >/dev/null || { echo "cloudflared is not installed (brew install cloudflared)" >&2; exit 1; }
command -v claude >/dev/null || { echo "claude (Claude Code) is not installed" >&2; exit 1; }

# A leftover key or token in the shell would win over apiKeyHelper and bypass the Gateway login.
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN CLAUDE_CODE_OAUTH_TOKEN

# Set the route in the environment as well as in the settings file, so an old value in the shell cannot win.
export ANTHROPIC_BASE_URL="$GATEWAY/anthropic"

# Log in now if there is no cached Access token, so the browser step happens before Claude starts.
if ! cloudflared access token -app="$GATEWAY" >/dev/null 2>&1; then
  cloudflared access login --no-verbose "$GATEWAY" >/dev/null
fi

# Run from the repo root so CLAUDE.md, .claude/settings.json and the deploy hook apply.
cd "$HERE/.."
exec claude --settings "$SETTINGS" --model "${CLAUDE_GATEWAY_MODEL:-claude-haiku-5-5}" "$@"

# Codex demo configuration

`config.toml` holds the approval and sandbox settings used when Codex is run for the demo.

```bash
CODEX_HOME="$PWD/demo-tools/codex-home" codex
```

Rules:
- Never point `CODEX_HOME` at `~/.codex`; that folder is a person's own setup.
- Codex also reads `AGENTS.md` at the repo root, which carries the same rules as `CLAUDE.md`.
- Codex stores its login and history under `CODEX_HOME`. The `.gitignore` in this folder keeps those files out of git.
- The model provider points at the company AI Gateway (`/openai` route, `wire_api = "responses"`, Cloudflare Access token from `cloudflared`). It needs an OpenAI key stored in the Gateway; none is stored here.
- Check that Codex reads the file: `CODEX_HOME="$PWD/demo-tools/codex-home" codex --strict-config doctor` should show `model provider = aigw`, `wire API = responses`, `config.toml parse = ok`.

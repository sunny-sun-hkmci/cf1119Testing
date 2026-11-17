#!/usr/bin/env node
// PreToolUse hook for the Bash tool.
// Reads the tool call as JSON on stdin. Exit 2 = block the command and show stderr to the model.
// Exit 0 = allow. If the input cannot be parsed the hook fails closed (exit 2).
//
// Why a hook as well as permission deny rules: deny rules match command prefixes, so wrappers
// like `sh -c "..."`, `cd x && npx wrangler deploy` or variable tricks can slip past them.
// The hook searches the whole command text. Both layers must be defeated to deploy.

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let command;
try {
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  command = input?.tool_input?.command;
  if (typeof command !== 'string') throw new Error('no tool_input.command string');
} catch (err) {
  console.error(`BLOCKED by block-deploy hook: could not read the tool call (${err.message}). Failing closed.`);
  process.exit(2);
}

// Collapse line continuations and whitespace so that "wrangler \\\n deploy" is still caught.
const text = command.replace(/\\\r?\n/g, ' ').replace(/\s+/g, ' ');

const rules = [
  [/\bwrangler(@[\w.^~-]+)?\b[^;&|]*\b(deploy|publish|rollback|versions\s+deploy)\b/i, 'Deploying or rolling back with wrangler'],
  [/\b(npm|pnpm|yarn|bun)\s+(run\s+)?(deploy|publish|release)\b/i, 'Running a deploy script'],
  [/\bcf\s+(?:--?\S+\s+)*deploy\b/i, 'Deploying with the cf CLI'],
  [/\bgit\s+push\b[^;&|]*\b(main|master)\b/i, 'Pushing to main'],
  [/\bgit\s+push\b[^;&|]*(--force|--force-with-lease|\s-f\b|--delete|\s:\S)/i, 'Force or delete push'],
  [/\bgh\s+pr\s+merge\b/i, 'Merging a pull request (a human approves and merges)'],
  [/\bgh\s+workflow\s+run\b/i, 'Starting a workflow by hand'],
  [/api\.cloudflare\.com[^;&|]*\/(workers|accounts)\b/i, 'Calling the Cloudflare API directly'],
  [/\bCLOUDFLARE_API_TOKEN\b|\bCLOUDFLARE_ACCOUNT_ID\b/, 'Using Cloudflare credentials'],
  [/\b(cat|less|more|head|tail|grep|rg|sed|awk|source|cp|mv|base64|xxd|strings)\b[^;&|]*(^|[\s/"'=])\.(env|dev\.vars)\b/i, 'Reading environment or secret files'],
  [/(^|[\s;&|(])\.\s+\S*\.env\b/, 'Sourcing an environment file'],
];

for (const [pattern, label] of rules) {
  if (pattern.test(text)) {
    console.error(
      `BLOCKED by repo policy (.claude/hooks/block-deploy.mjs): ${label}.\n` +
      'AI proposes, the pipeline deploys. Commit to a branch and open a pull request; ' +
      'after human review and merge, Cloudflare Workers Builds deploys. See GOVERNANCE.md.'
    );
    process.exit(2);
  }
}
process.exit(0);

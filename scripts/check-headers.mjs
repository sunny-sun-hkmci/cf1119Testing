#!/usr/bin/env node
// Checks the security headers of a deployed site or preview URL.
// Usage: node scripts/check-headers.mjs <url>   (or PREVIEW_URL=<url>)
// If the preview sits behind Cloudflare Access, set CF_ACCESS_CLIENT_ID and
// CF_ACCESS_CLIENT_SECRET (a service token) so the check can pass the login.
const base = (process.argv[2] ?? process.env.PREVIEW_URL ?? '').trim();
if (!/^https:\/\/[^/\s]+/.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(base)) {
  console.error('Usage: node scripts/check-headers.mjs https://<host>   (http is accepted for localhost only)');
  process.exit(2);
}
const url = new URL('/', base).toString();
const reqHeaders = {};
if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
  reqHeaders['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
  reqHeaders['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
}

const required = {
  'strict-transport-security': /max-age=\d{6,}/i,
  'content-security-policy': /default-src\s+'none'|default-src\s+'self'/i,
  'x-content-type-options': /^nosniff$/i,
  'referrer-policy': /.+/,
  'permissions-policy': /.+/,
  'x-frame-options': /^(deny|sameorigin)$/i,
};

const res = await fetch(url, { headers: reqHeaders, redirect: 'manual' });
const problems = [];
if (res.status >= 300 && res.status < 400) {
  const loc = res.headers.get('location') ?? '';
  console.error(`Got ${res.status} redirect to ${loc.split('?')[0]}.`);
  console.error(/cloudflareaccess\.com/.test(loc)
    ? 'The preview is behind Cloudflare Access. Provide CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET as secrets.'
    : 'Unexpected redirect; pass the final URL.');
  process.exit(1);
}
if (res.status !== 200) problems.push(`expected HTTP 200, got ${res.status}`);
for (const [name, pattern] of Object.entries(required)) {
  const value = res.headers.get(name);
  if (!value) problems.push(`missing header: ${name}`);
  else if (!pattern.test(value)) problems.push(`unexpected value for ${name}: ${value}`);
}
if (problems.length) {
  console.error(`Header check FAILED for ${url}\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Header check passed for ${url} (${Object.keys(required).length} headers).`);

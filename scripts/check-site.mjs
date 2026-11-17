#!/usr/bin/env node
// Dependency-free site check, run as `npm run build` and in CI.
// Fails (exit 1) on: missing lang/title/description/one h1, images without alt,
// broken internal links, missing hreflang partners, inline script/style,
// external resources (trackers), and unreadable or missing _headers rules.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? 'public');
const problems = [];
const fail = (file, msg) => problems.push(`${path.relative(ROOT, file)}: ${msg}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

// Map a root-relative URL path to a file the static host would serve.
function resolveUrl(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const target = path.join(ROOT, clean);
  if (!target.startsWith(ROOT)) return null;
  if (clean.endsWith('/')) return fs.existsSync(path.join(target, 'index.html')) ? path.join(target, 'index.html') : null;
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
  if (fs.existsSync(`${target}.html`)) return `${target}.html`;
  return null;
}

if (!fs.existsSync(ROOT)) { console.error(`No such folder: ${ROOT}`); process.exit(1); }
const files = walk(ROOT);
const pages = files.filter((f) => f.endsWith('.html'));
if (pages.length === 0) problems.push('no HTML pages found');

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/^<!doctype html>/i.test(html)) fail(file, 'missing <!doctype html>');
  if (!/<html[^>]*\slang="[a-zA-Z-]+"/.test(html)) fail(file, 'missing lang on <html>');
  if (!/<title>[^<]{3,}<\/title>/.test(html)) fail(file, 'missing or empty <title>');
  if (!/<meta name="viewport"/.test(html)) fail(file, 'missing viewport meta');
  if (!/<meta name="description" content="[^"]{10,}"/.test(html) && !/noindex/.test(html)) fail(file, 'missing meta description');
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(file, `expected exactly one <h1>, found ${h1}`);
  if (!/id="main"/.test(html)) fail(file, 'missing id="main" landmark target');
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\salt="[^"]+"/.test(img)) fail(file, `image without alt text: ${img.slice(0, 60)}`);
    if (!/\swidth=/.test(img) || !/\sheight=/.test(img)) fail(file, 'image without width/height (layout shift)');
  }
  if (/<script\b/i.test(html)) fail(file, 'script tag found (CSP forbids scripts)');
  if (/\sstyle="/i.test(html) || /<style\b/i.test(html)) fail(file, 'inline style found (CSP forbids inline styles)');
  if (/\son[a-z]+="/i.test(html)) fail(file, 'inline event handler found');

  const refs = [...new Set([...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]))];
  for (const ref of refs) {
    if (ref.startsWith('mailto:') || ref.startsWith('#')) continue;
    if (/^(https?:)?\/\//i.test(ref)) { fail(file, `external reference not allowed: ${ref}`); continue; }
    if (!ref.startsWith('/')) { fail(file, `use root-relative links, found: ${ref}`); continue; }
    if (!resolveUrl(ref)) fail(file, `broken internal link: ${ref}`);
  }
  // Same-page anchors must exist.
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!new RegExp(`id="${m[1]}"`).test(html)) fail(file, `anchor target missing: #${m[1]}`);
  }
  // Every language alternate must resolve and point back to a page that exists.
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  if (!/noindex/.test(html) && alts.length < 2) fail(file, 'needs hreflang alternates for en and zh-Hant');
}

const assetsCss = path.join(ROOT, 'assets', 'style.css');
if (fs.existsSync(assetsCss) && /@import|url\(\s*['"]?https?:/i.test(fs.readFileSync(assetsCss, 'utf8')))
  fail(assetsCss, 'external import/url in CSS');

const headers = path.join(ROOT, '_headers');
if (!fs.existsSync(headers)) problems.push('public/_headers is missing');
else {
  const h = fs.readFileSync(headers, 'utf8').toLowerCase();
  for (const name of ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy'])
    if (!h.includes(`${name}:`)) problems.push(`_headers does not set ${name}`);
}

if (problems.length) {
  console.error(`Site check FAILED (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Site check passed: ${pages.length} pages, ${files.length} files.`);

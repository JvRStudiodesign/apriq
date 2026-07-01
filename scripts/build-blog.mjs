/**
 * AprIQ blog prerenderer
 * -----------------------
 * Reads Markdown posts from /blog/posts, and writes fully static, crawlable
 * HTML into /dist/blog (index + one folder per post), plus /dist/sitemap.xml.
 *
 * No external dependencies — runs on plain Node. It is wired into the Vercel
 * build via package.json:  "build": "vite build && node scripts/build-blog.mjs"
 *
 * Why static HTML? The AprIQ app is a client-rendered SPA. Search engines and
 * social link-preview crawlers see almost nothing until JavaScript runs. For a
 * blog whose whole purpose is ranking on Google, we pre-bake the article HTML,
 * <title>, meta description, canonical, Open Graph tags and Article schema so
 * the full content is visible without running any JavaScript.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const DIST = path.join(ROOT, 'dist');
const DIST_BLOG = path.join(DIST, 'blog');
const PUBLIC_BLOG = path.join(ROOT, 'public', 'blog');

const SITE = 'https://www.apriq.co.za';
const SITE_NAME = 'AprIQ';
const LOGO = '/logo-transparent.png';

/* Static SPA routes we also want in the sitemap so Google crawls them. */
const STATIC_ROUTES = [
  { loc: '/', priority: '1.0' },
  { loc: '/how-it-works', priority: '0.7' },
  { loc: '/features', priority: '0.7' },
  { loc: '/about', priority: '0.6' },
  { loc: '/faq', priority: '0.6' },
  { loc: '/plans', priority: '0.6' },
  { loc: '/legal', priority: '0.3' },
];

/* ---------------------------------------------------------------- helpers */

const escapeHtml = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Inline markdown: run on already-escaped text. Handles links + bold. */
function inline(text) {
  let t = escapeHtml(text);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    const external = /^https?:\/\//i.test(href) && !href.includes('apriq.co.za');
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${rel}>${label}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return t;
}

/* Minimal, safe Markdown → HTML for the subset we author in.
   Supports: ## / ### headings, paragraphs, **bold**, [links](), - lists,
   > blockquotes, ![alt](src) images, and raw HTML blocks (lines starting <). */
function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];

    if (line.trim() === '') { i++; continue; }

    // Raw HTML block (e.g. tables): pass through until a blank line.
    if (line.trimStart().startsWith('<')) {
      const buf = [];
      while (i < lines.length && lines[i].trim() !== '') { buf.push(lines[i]); i++; }
      out.push(buf.join('\n'));
      continue;
    }

    // Standalone image.
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (img) {
      out.push(`<figure class="post-figure"><img src="${img[2]}" alt="${escapeHtml(img[1])}" loading="lazy"/></figure>`);
      i++; continue;
    }

    // Headings.
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const tag = h[1].length === 2 ? 'h2' : 'h3';
      const id = h[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      out.push(`<${tag} id="${id}">${inline(h[2])}</${tag}>`);
      i++; continue;
    }

    // Blockquote (one or more consecutive > lines).
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, '')); i++;
      }
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // Unordered list.
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ''))}</li>`); i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Paragraph (gather until blank line).
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !/^(#{2,3}\s|>|[-*]\s|<|!\[)/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    // Italic emphasis for the closing disclaimer line (single *…*).
    let para = inline(buf.join(' '));
    para = para.replace(/(^|[^*])\*([^*]+)\*($|[^*])/g, '$1<em>$2</em>$3');
    out.push(`<p>${para}</p>`);
  }
  return out.join('\n');
}

/* Tiny YAML-ish frontmatter parser (key: value, one level). */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('Missing frontmatter');
  const meta = {};
  for (const l of m[1].split('\n')) {
    const kv = l.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-ZA',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/* -------------------------------------------------------------- templates */

const BASE_CSS = `
:root{--petrol:#0F4C5C;--ink:#111;--paper:#F9FAFA;--white:#fff;--mist:#E4E5E5;--grey:#6b6c6d;--orange:#FF8210;
--fh:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif;--fb:'Roboto','Segoe UI',system-ui,sans-serif;}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--fb);line-height:1.7;font-size:17px}
a{color:var(--petrol);text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto;display:block}
.wrap{max-width:960px;margin:0 auto;padding:0 24px}
header.site{position:sticky;top:0;z-index:50;background:rgba(249,250,250,.92);backdrop-filter:blur(10px);
-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--mist)}
header.site .bar{display:flex;align-items:center;justify-content:space-between;max-width:960px;margin:0 auto;padding:16px 24px}
header.site img{height:56px;width:auto;mix-blend-mode:multiply}
header.site nav{display:flex;align-items:center;gap:24px}
header.site nav a{font-size:13px;color:var(--grey)}
header.site nav a.cta{background:var(--ink);color:var(--paper);padding:9px 16px;border-radius:10px;font-weight:600}
header.site nav a.cta:hover{text-decoration:none;opacity:.9}
.nav-links{display:flex;gap:24px;align-items:center}
@media(max-width:640px){.nav-links{display:none}}
main{padding:40px 0 8px}
.breadcrumb{font-size:13px;color:var(--grey);margin-bottom:20px}
.breadcrumb a{color:var(--grey)}
.post-meta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:13px;color:var(--grey);margin:0 0 14px}
.tag{display:inline-block;background:rgba(15,76,92,.08);color:var(--petrol);padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600}
article h1{font-family:var(--fh);font-size:clamp(28px,5vw,40px);line-height:1.15;letter-spacing:-.5px;color:var(--ink);margin:6px 0 18px}
article{max-width:720px}
article h2{font-family:var(--fh);font-size:26px;color:var(--petrol);margin:40px 0 12px;letter-spacing:-.3px}
article h3{font-family:var(--fh);font-size:20px;color:var(--ink);margin:28px 0 8px}
article p{margin:0 0 18px}
article ul{margin:0 0 18px;padding-left:22px}article li{margin:0 0 8px}
article strong{color:var(--ink)}
.post-figure{margin:24px 0}.post-figure img{border:1px solid var(--mist);border-radius:14px}
.cover{margin:8px 0 28px}.cover img{border:1px solid var(--mist);border-radius:16px;width:100%}
blockquote{margin:24px 0;padding:14px 20px;border-left:4px solid var(--orange);background:var(--white);
border-radius:0 12px 12px 0;color:var(--ink);font-size:18px}
blockquote p{margin:0}
table{width:100%;border-collapse:collapse;margin:22px 0;font-size:15px;background:var(--white);border:1px solid var(--mist);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--mist);vertical-align:top}
thead th{background:var(--petrol);color:#fff;font-family:var(--fh);font-size:13px;font-weight:600}
tbody tr:last-child td{border-bottom:none}
tbody tr:nth-child(even){background:#fbfcfc}
.cta{max-width:720px;margin:44px 0 8px;background:var(--petrol);color:#fff;border-radius:18px;padding:30px 28px}
.cta h3{font-family:var(--fh);color:#fff;font-size:22px;margin:0 0 8px}
.cta p{color:#dbe6e9;margin:0 0 18px;font-size:15px}
.cta a.btn{display:inline-block;background:var(--orange);color:var(--ink);font-weight:700;padding:12px 22px;border-radius:11px}
.cta a.btn:hover{text-decoration:none;opacity:.92}
.backlink{max-width:720px;margin:26px 0 0;font-size:14px}
.disclaimer em,article em{color:var(--grey);font-style:italic;font-size:14px}
footer.site{margin-top:56px;border-top:1px solid var(--mist);background:var(--paper);padding:30px 0;color:var(--grey);font-size:13px}
footer.site .bar{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;max-width:960px;margin:0 auto;padding:0 24px}
footer.site a{color:var(--grey)}
/* index grid */
.blog-hero{max-width:720px;margin:0 0 34px}
.blog-hero h1{font-family:var(--fh);font-size:clamp(30px,6vw,44px);letter-spacing:-.5px;margin:0 0 12px}
.blog-hero p{color:var(--grey);font-size:18px;margin:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:26px}
.card{background:var(--white);border:1px solid var(--mist);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:transform .15s ease,box-shadow .15s ease}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(15,76,92,.10);text-decoration:none}
.card .thumb{aspect-ratio:16/9;background:var(--paper);border-bottom:1px solid var(--mist)}
.card .thumb img{width:100%;height:100%;object-fit:cover}
.card .body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:8px;flex:1}
.card .tag{align-self:flex-start}
.card h2{font-family:var(--fh);font-size:19px;color:var(--ink);margin:2px 0 0;line-height:1.3}
.card p{color:var(--grey);font-size:14px;margin:0;flex:1}
.card .date{color:var(--grey);font-size:12px;margin-top:6px}
`;

function headMeta({ title, description, url, image, type = 'website', published, modified, jsonld }) {
  const abs = image ? (image.startsWith('http') ? image : SITE + image) : SITE + '/logo.png';
  return `<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}"/>
<link rel="canonical" href="${url}"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:type" content="${type}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(description)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${abs}"/>
${published ? `<meta property="article:published_time" content="${published}"/>` : ''}
${modified ? `<meta property="article:modified_time" content="${modified}"/>` : ''}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(description)}"/>
<meta name="twitter:image" content="${abs}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet"/>
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
<style>${BASE_CSS}</style>`;
}

const HEADER = `<header class="site"><div class="bar">
<a href="/home" aria-label="AprIQ home"><img src="${LOGO}" alt="AprIQ"/></a>
<nav><span class="nav-links">
<a href="/blog">Blog</a><a href="/how-it-works">How it works</a><a href="/features">Features</a><a href="/about">About</a>
</span><a class="cta" href="/signup">Get started</a></nav>
</div></header>`;

const FOOTER = `<footer class="site"><div class="bar">
<span>© ${new Date().getFullYear()} AprIQ · ROM cost estimates for South African construction.</span>
<span><a href="/blog">Blog</a> · <a href="/faq">FAQ</a> · <a href="/legal">Terms &amp; Privacy</a></span>
</div></footer>`;

function postPage(post) {
  const url = `${SITE}/blog/${post.slug}`;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: [SITE + post.cover],
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE },
    publisher: {
      '@type': 'Organization', name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE + LOGO },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });

  const head = headMeta({
    title: `${post.title} | ${SITE_NAME}`,
    description: post.description,
    url, image: post.ogImage || post.cover, type: 'article',
    published: post.date, modified: post.updated || post.date, jsonld,
  });

  return `<!doctype html><html lang="en"><head>${head}</head><body>
${HEADER}
<main class="wrap">
<div class="breadcrumb"><a href="/blog">Blog</a> &rsaquo; ${escapeHtml(post.category || 'Article')}</div>
<article>
<div class="post-meta"><span class="tag">${escapeHtml(post.category || 'Article')}</span>
<span>${fmtDate(post.date)}</span>${post.readingTime ? `<span>· ${post.readingTime} min read</span>` : ''}</div>
<h1>${escapeHtml(post.title)}</h1>
<figure class="cover"><img src="${post.cover}" alt="${escapeHtml(post.coverAlt || post.title)}"/></figure>
${post.html}
</article>
<div class="cta">
<h3>Put a real number on your project in minutes</h3>
<p>AprIQ turns a building brief into a rough order of magnitude cost estimate — the layers a per-square-metre rate leaves out, done for you.</p>
<a class="btn" href="/signup">Try AprIQ free</a>
</div>
<p class="backlink"><a href="/blog">&larr; Back to all articles</a></p>
</main>
${FOOTER}
</body></html>`;
}

function indexPage(posts) {
  const url = `${SITE}/blog`;
  const cards = posts.map((p) => `<a class="card" href="/blog/${p.slug}">
<div class="thumb"><img src="${p.cover}" alt="${escapeHtml(p.coverAlt || p.title)}" loading="lazy"/></div>
<div class="body"><span class="tag">${escapeHtml(p.category || 'Article')}</span>
<h2>${escapeHtml(p.title)}</h2>
<p>${escapeHtml(p.description)}</p>
<span class="date">${fmtDate(p.date)}${p.readingTime ? ` · ${p.readingTime} min read` : ''}</span></div></a>`).join('\n');

  const head = headMeta({
    title: `Blog | ${SITE_NAME} — Construction cost insight for South Africa`,
    description: 'Practical, sourced guides on South African construction costs, estimating and building budgets — from the team behind AprIQ.',
    url, image: posts[0]?.cover || LOGO, type: 'website',
  });

  return `<!doctype html><html lang="en"><head>${head}</head><body>
${HEADER}
<main class="wrap">
<div class="blog-hero"><h1>AprIQ Blog</h1>
<p>Clear, sourced insight on what building actually costs in South Africa — and how to budget for it early.</p></div>
<div class="grid">${cards}</div>
</main>
${FOOTER}
</body></html>`;
}

function sitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ...STATIC_ROUTES.map((r) => ({ loc: SITE + r.loc, lastmod: today, priority: r.priority })),
    { loc: `${SITE}/blog`, lastmod: today, priority: '0.9' },
    ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.updated || p.date, priority: '0.8' })),
  ];
  const body = urls.map((u) =>
    `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/* ------------------------------------------------------------------- main */

async function main() {
  await fs.mkdir(DIST_BLOG, { recursive: true });

  // Ensure cover images exist under dist/blog even if run standalone.
  try {
    const covers = await fs.readdir(PUBLIC_BLOG);
    for (const f of covers) {
      await fs.copyFile(path.join(PUBLIC_BLOG, f), path.join(DIST_BLOG, f)).catch(() => {});
    }
  } catch { /* no public/blog yet */ }

  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.slug) meta.slug = file.replace(/\.md$/, '');
    meta.html = renderMarkdown(body);
    posts.push(meta);
  }

  // Newest first.
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  for (const post of posts) {
    const dir = path.join(DIST_BLOG, post.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), postPage(post), 'utf8');
  }

  await fs.writeFile(path.join(DIST_BLOG, 'index.html'), indexPage(posts), 'utf8');
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap(posts), 'utf8');

  console.log(`[build-blog] ${posts.length} post(s) → dist/blog, sitemap.xml written`);
  for (const p of posts) console.log(`  • /blog/${p.slug}`);
}

main().catch((err) => { console.error('[build-blog] failed:', err); process.exit(1); });

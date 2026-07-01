/**
 * Blog content loader (client-side).
 * -----------------------------------
 * Reads every Markdown post in /blog/posts at build time (via Vite's
 * import.meta.glob), parses its frontmatter, and renders the body to HTML.
 *
 * The Markdown → HTML logic here is intentionally identical to
 * scripts/build-blog.mjs so the in-app React pages and the prerendered SEO
 * pages produce the same output. Drop a new .md into /blog/posts and it shows
 * up automatically — no code changes needed.
 */

const RAW_POSTS = import.meta.glob('/blog/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

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
    const line = lines[i];

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
    let para = inline(buf.join(' '));
    // Italic emphasis for single *…* runs (e.g. closing disclaimer line).
    para = para.replace(/(^|[^*])\*([^*]+)\*($|[^*])/g, '$1<em>$2</em>$3');
    out.push(`<p>${para}</p>`);
  }
  return out.join('\n');
}

/* Tiny YAML-ish frontmatter parser (key: value, one level). */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const l of m[1].split('\n')) {
    const kv = l.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/* Build the post list once at module load. */
const POSTS = Object.entries(RAW_POSTS).map(([filePath, raw]) => {
  const { meta, body } = parseFrontmatter(raw);
  const slug = meta.slug || filePath.split('/').pop().replace(/\.md$/, '');
  return {
    ...meta,
    slug,
    readingTime: meta.readingTime ? Number(meta.readingTime) : undefined,
    html: renderMarkdown(body),
  };
}).sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

export function getAllPosts() {
  return POSTS;
}

export function getPostBySlug(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}

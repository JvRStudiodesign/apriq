import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';
import { getPostBySlug, formatDate } from '../lib/blogPosts';
import '../styles/blog.css';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const r1 = useFadeIn();

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | AprIQ`;
    setMeta('description', post.description);
    setMeta('og:title', `${post.title} | AprIQ`, 'property');
    setMeta('og:description', post.description, 'property');
    if (post.ogImage || post.cover) setMeta('og:image', post.ogImage || post.cover, 'property');
    window.scrollTo(0, 0);
    return () => { document.title = 'AprIQ'; };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div>
      <div style={s.pageTop} />

      <section className="section section-page-end"><div className="wrap" ref={r1}>
        <div className="fi-group">
          <div style={s.breadcrumb} className="fi">
            <Link to="/blog" style={s.crumbLink}>Blog</Link>
            <span style={s.crumbSep}>›</span>
            <span>{post.category || 'Article'}</span>
          </div>

          <div style={s.meta} className="fi">
            {post.category && <span style={s.tag}>{post.category}</span>}
            <span>{formatDate(post.date)}</span>
            {post.readingTime ? <span>· {post.readingTime} min read</span> : null}
          </div>

          <h1 style={s.h1} className="fi">{post.title}</h1>

          {post.cover && (
            <figure style={s.cover} className="fi">
              <img src={post.cover} alt={post.coverAlt || post.title} style={s.coverImg} />
            </figure>
          )}

          <article
            className="blog-article fi"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div style={s.cta} className="fi">
            <h3 style={s.ctaTitle}>Put a real number on your project in minutes</h3>
            <p style={s.ctaBody}>
              AprIQ turns a building brief into a rough order of magnitude cost estimate — the
              layers a per-square-metre rate leaves out, done for you.
            </p>
            <Link to="/signup" className="btn-ink" style={{ background: '#FF8210', color: '#111111', fontWeight: 700 }}>
              Try AprIQ free
            </Link>
          </div>

          <p style={s.backlink} className="fi">
            <Link to="/blog" style={s.crumbLink}>← Back to all articles</Link>
          </p>
        </div>
      </div></section>
    </div>
  );
}

const s = {
  pageTop:    { height: 48 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 13, color: '#979899', marginBottom: 18 },
  crumbLink:  { color: '#0F4C5C', textDecoration: 'none' },
  crumbSep:   { color: '#C8C9CA' },
  meta:       { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 13, color: '#979899', marginBottom: 14 },
  tag:        { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 100, background: 'rgba(15,76,92,0.08)', color: '#0F4C5C', fontSize: 11, fontWeight: 600 },
  h1:         { fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 700, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.5px', margin: '4px 0 22px', maxWidth: 720 },
  cover:      { margin: '0 0 30px', maxWidth: 860 },
  coverImg:   { width: '100%', border: '1px solid #E4E5E5', borderRadius: 16, display: 'block' },
  cta:        { maxWidth: 720, margin: '44px 0 8px', background: '#0F4C5C', color: '#fff', borderRadius: 18, padding: '30px 28px' },
  ctaTitle:   { fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 8px' },
  ctaBody:    { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 14, color: '#dbe6e9', lineHeight: 1.6, margin: '0 0 18px' },
  backlink:   { maxWidth: 720, margin: '26px 0 0', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 14 },
};

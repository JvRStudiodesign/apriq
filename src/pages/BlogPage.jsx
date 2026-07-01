import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';
import { getAllPosts, formatDate } from '../lib/blogPosts';

export default function BlogPage() {
  const r1 = useFadeIn(), r2 = useFadeIn();
  const posts = getAllPosts();

  useEffect(() => {
    document.title = 'Blog | AprIQ — Construction cost insight for South Africa';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <div style={s.pageTop} />

      <section className="section"><div className="wrap" ref={r1}><div className="panel fi-group">
        <h1 style={s.h1} className="fi">Blog</h1>
        <p style={s.body} className="fi">
          Clear, sourced insight on what building actually costs in South Africa — and how to
          budget for it early. Practical guides from the team behind AprIQ.
        </p>
      </div></div></section>

      <section className="section section-page-end"><div className="wrap" ref={r2}>
        {posts.length === 0 ? (
          <div className="panel fi-group">
            <p style={s.body} className="fi">New articles are on the way. Check back soon.</p>
          </div>
        ) : (
          <div style={s.grid} className="fi-group">
            {posts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="card-tile fi" style={s.card}>
                {post.cover && (
                  <div style={s.thumb}>
                    <img src={post.cover} alt={post.coverAlt || post.title} loading="lazy" style={s.thumbImg} />
                  </div>
                )}
                <div style={s.cardBody}>
                  {post.category && <span style={s.tag}>{post.category}</span>}
                  <h2 style={s.cardTitle}>{post.title}</h2>
                  <p style={s.cardSummary}>{post.description}</p>
                  <span style={s.cardDate}>
                    {formatDate(post.date)}{post.readingTime ? ` · ${post.readingTime} min read` : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div></section>
    </div>
  );
}

const s = {
  pageTop:     { height: 48 },
  h1:          { fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", fontSize: 28, fontWeight: 700, color: '#111111', marginBottom: 20 },
  body:        { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 14, color: '#979899', lineHeight: 1.72 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  card:        { display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', textDecoration: 'none', minHeight: '100%' },
  thumb:       { aspectRatio: '16 / 9', background: '#F9FAFA', borderBottom: '1px solid #E4E5E5' },
  thumbImg:    { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardBody:    { padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  tag:         { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 100, background: 'rgba(15,76,92,0.08)', color: '#0F4C5C', fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 11, fontWeight: 600 },
  cardTitle:   { fontFamily:"'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif", fontSize: 17, fontWeight: 600, color: '#111111', margin: '2px 0 0', lineHeight: 1.3 },
  cardSummary: { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 13, color: '#979899', lineHeight: 1.6, margin: 0, flex: 1 },
  cardDate:    { fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif", fontSize: 12, color: '#979899', marginTop: 6 },
};

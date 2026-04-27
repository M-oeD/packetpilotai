import { useState, useMemo } from 'react';

export type PostData = {
  slug: string;
  title: string;
  desc: string;
  date: string;
  read: string;
  tags: string[];
  ascii: string[];
  accent: string;
};

function PostCard({ post }: { post: PostData }) {
  return (
    <article className="ppc-post">
      <div className="ppc-post-meta">
        <span className="ppc-post-date">{post.date}</span>
        <span className="ppc-post-sep">·</span>
        <span className="muted">{post.read}</span>
        <span className="ppc-post-sep">·</span>
        <span className={`ppc-pill ${post.accent}`}>{post.tags[0]}</span>
      </div>
      <h3 className="ppc-post-title">
        <a href={`/blog/${post.slug}`}>{post.title}</a>
      </h3>
      <p className="ppc-post-desc">{post.desc}</p>
      <pre className={`ppc-post-ascii mono accent-${post.accent}`}>
        {post.ascii.join('\n')}
      </pre>
      <div className="ppc-post-foot">
        <span className="ppc-post-tags">
          {post.tags.map((t) => (
            <span key={t} className="ppc-post-tag">#{t}</span>
          ))}
        </span>
        <a className="ppc-post-link" href={`/blog/${post.slug}`}>read ▸</a>
      </div>
    </article>
  );
}

export default function BlogIndex({ posts }: { posts: PostData[] }) {
  const [tag, setTag] = useState('all');
  const [query, setQuery] = useState('');

  const allTags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return ['all', ...Array.from(s)];
  }, [posts]);

  const filtered = useMemo(() => {
    let result = tag === 'all' ? posts : posts.filter((p) => p.tags.includes(tag));
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    return result;
  }, [posts, tag, query]);

  return (
    <>
      <div className="ppc-blog-head">
        <div>
          <div className="ppc-section-kicker mono">
            <span className="ppc-section-bracket">[</span>
            blog.index
            <span className="ppc-section-bracket">]</span>
          </div>
          <h1 className="ppc-section-h2 ppc-section-h2-big">The PacketPilot field manual.</h1>
          <p className="ppc-section-lede">
            Long-form guides for network admins. Every post ends with a workflow you can paste into a runbook.
          </p>
        </div>
        <div className="ppc-blog-search mono">
          <span className="ppc-blog-search-prompt">grep —</span>
          <input
            placeholder="filter posts by keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="ppc-pill muted">⌘K</span>
        </div>
      </div>

      <div className="ppc-blog-tags">
        {allTags.map((t) => (
          <button
            key={t}
            className={`ppc-blog-tag${t === tag ? ' is-active' : ''}`}
            onClick={() => setTag(t)}
          >
            <span>#{t}</span>
            <span className="ppc-blog-tag-count mono">
              {t === 'all' ? posts.length : posts.filter((p) => p.tags.includes(t)).length}
            </span>
          </button>
        ))}
      </div>

      <div className="ppc-post-grid two">
        {filtered.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mono muted" style={{ padding: '40px 0' }}>
          no posts match <span style={{ color: 'var(--ppc-accent)' }}>{tag !== 'all' ? `#${tag}` : query}</span>
        </p>
      )}
    </>
  );
}

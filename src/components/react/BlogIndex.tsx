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
  stream?: string;
  streamNum?: number;
};

export type StreamMeta = {
  key: string;
  name: string;
  short: string;
  accent: string;
  glyph: string;
};

function PostCard({ post, streamMap }: { post: PostData; streamMap: Map<string, StreamMeta> }) {
  const stream = post.stream ? streamMap.get(post.stream) : undefined;
  return (
    <article className="ppc-post">
      <div className="ppc-post-meta">
        <span className="ppc-post-date">{post.date}</span>
        <span className="ppc-post-sep">·</span>
        <span className="muted">{post.read}</span>
        <span className="ppc-post-sep">·</span>
        {stream ? (
          <a
            href={`/series/${stream.key}/`}
            className={`ppc-pill ${stream.accent}`}
            style={{ textDecoration: 'none' }}
            title={stream.name}
          >
            <span style={{ marginRight: 4 }}>{stream.glyph}</span>
            {stream.short}
          </a>
        ) : (
          <span className={`ppc-pill ${post.accent}`}>{post.tags[0]}</span>
        )}
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

export default function BlogIndex({
  posts,
  streams = [],
}: {
  posts: PostData[];
  streams?: StreamMeta[];
}) {
  const [stream, setStream] = useState('all');
  const [tag, setTag] = useState('all');
  const [query, setQuery] = useState('');

  const streamMap = useMemo(() => {
    const m = new Map<string, StreamMeta>();
    streams.forEach((s) => m.set(s.key, s));
    return m;
  }, [streams]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return ['all', ...Array.from(s)];
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (stream !== 'all') {
      result = result.filter((p) => p.stream === stream);
    }
    if (tag !== 'all') {
      result = result.filter((p) => p.tags.includes(tag));
    }
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
  }, [posts, stream, tag, query]);

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

      {streams.length > 0 && (
        <>
          <div
            className="ppc-section-kicker mono"
            style={{ margin: '4px 0 8px', opacity: 0.7 }}
          >
            <span className="ppc-section-bracket">[</span>
            streams
            <span className="ppc-section-bracket">]</span>
          </div>
          <div className="ppc-blog-tags" style={{ marginBottom: 14 }}>
            <button
              className={`ppc-blog-tag${stream === 'all' ? ' is-active' : ''}`}
              onClick={() => setStream('all')}
            >
              <span>all</span>
              <span className="ppc-blog-tag-count mono">{posts.length}</span>
            </button>
            {streams.map((s) => {
              const count = posts.filter((p) => p.stream === s.key).length;
              return (
                <button
                  key={s.key}
                  className={`ppc-blog-tag${stream === s.key ? ' is-active' : ''}`}
                  onClick={() => setStream(s.key)}
                  title={s.name}
                >
                  <span className="mono" style={{ marginRight: 6 }}>{s.glyph}</span>
                  <span>{s.short}</span>
                  <span className="ppc-blog-tag-count mono">{count}</span>
                </button>
              );
            })}
          </div>
          <div
            className="ppc-section-kicker mono"
            style={{ margin: '4px 0 8px', opacity: 0.7 }}
          >
            <span className="ppc-section-bracket">[</span>
            tags
            <span className="ppc-section-bracket">]</span>
          </div>
        </>
      )}

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
          <PostCard key={p.slug} post={p} streamMap={streamMap} />
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

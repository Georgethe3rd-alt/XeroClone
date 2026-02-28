'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type FeedItem = {
  id: string;
  headline: string;
  caption: string;
  category: string;
  tags: string[];
  tone: string;
  published_at_live: string;
  source_url: string;
  mp4_url: string;
  thumb_url: string;
  duration_seconds: number;
};

const CATEGORIES = ['All', 'Politics', 'Sports', 'Culture', 'Economy', 'Crime', 'Environment', 'Technology', 'Health'];

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState('');
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      params.set('limit', '20');
      const res = await fetch(`${API}/feed?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error('Feed fetch error:', e);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const h = window.innerHeight;
      const idx = Math.round(container.scrollTop / h);
      setActiveIndex(idx);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      {/* Minimal top bar - floating over content */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#E31937', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>loop</span>
            <span style={{ color: '#00B4D8', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>vybz</span>
          </div>
        </div>

        {/* Subtle category pills */}
        <div style={{
          display: 'flex', gap: 6, padding: '0 16px 12px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {CATEGORIES.map((cat) => {
            const val = cat === 'All' ? '' : cat;
            const active = category === val;
            return (
              <button
                key={cat}
                onClick={() => setCategory(val)}
                style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                  backgroundColor: active ? '#E31937' : 'rgba(255,255,255,0.12)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100vh', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {loading && items.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#E31937', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
            <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>No stories yet</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              {category ? 'Try a different category' : 'Check back soon'}
            </div>
            <button onClick={fetchFeed} style={{
              backgroundColor: 'transparent', color: '#FFFFFF', fontWeight: 600, fontSize: 14,
              padding: '10px 24px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            }}>Refresh</button>
          </div>
        )}

        {items.map((item, i) => (
          <VideoCard
            key={item.id}
            item={item}
            isActive={i === activeIndex}
            muted={muted}
            onToggleMute={() => setMuted(!muted)}
          />
        ))}
      </div>
    </div>
  );
}

function VideoCard({ item, isActive, muted, onToggleMute }: {
  item: FeedItem; isActive: boolean; muted: boolean; onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  return (
    <div style={{
      width: '100%', height: '100vh', position: 'relative',
      scrollSnapAlign: 'start', backgroundColor: '#000',
    }}>
      {item.mp4_url ? (
        <video
          ref={videoRef}
          src={item.mp4_url}
          poster={item.thumb_url || undefined}
          loop
          muted={muted}
          playsInline
          onClick={onToggleMute}
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#111',
        }}>
          <div style={{ textAlign: 'center', padding: 40, maxWidth: 320 }}>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{item.headline}</div>
          </div>
        </div>
      )}

      {/* Bottom info - minimal */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '100px 20px 48px 20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <span style={{
          display: 'inline-block', marginBottom: 10,
          color: '#E31937', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '1px',
        }}>
          {item.category}
        </span>

        <h2 style={{
          color: '#FFFFFF', fontSize: 18, fontWeight: 700, margin: '0 0 6px',
          lineHeight: 1.3, maxWidth: '85%',
        }}>
          {item.headline}
        </h2>

        {item.caption && (
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0,
            lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', maxWidth: '80%',
          }}>
            {item.caption}
          </p>
        )}
      </div>

      {/* Right side - minimal icons */}
      <div style={{
        position: 'absolute', right: 16, bottom: 140, display: 'flex',
        flexDirection: 'column', gap: 24, alignItems: 'center', pointerEvents: 'auto',
      }}>
        <button onClick={onToggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.6 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            {muted ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            )}
          </svg>
        </button>
        {item.source_url && (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ opacity: 0.6 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

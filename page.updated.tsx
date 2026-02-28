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
  region?: string;
  published_at_live: string;
  source_url: string;
  mp4_url: string;
  thumb_url: string;
  duration_seconds: number;
  view_count?: number;
  like_count?: number;
  share_count?: number;
  save_count?: number;
  comment_count?: number;
  liked?: boolean;
  saved?: boolean;
};

type AdSlot = {
  id: string;
  name: string;
  type: string;
  image_url: string;
  video_url: string;
  click_url: string;
  frequency: number;
};

const CATEGORIES = ['All', 'Politics', 'Sports', 'Culture', 'Economy', 'Crime', 'Environment', 'Technology', 'Health'];
const REGIONS = ['All Caribbean', 'Trinidad', 'Jamaica', 'Barbados', 'Cayman'];

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [muted, setMuted] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('loopvybz_token');
    if (token) {
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((u) => setUser(u))
        .catch(() => localStorage.removeItem('loopvybz_token'));
    }

    // Check push subscription status
    const subStatus = localStorage.getItem('loopvybz_push_subscribed');
    if (subStatus === 'true') setPushSubscribed(true);

    // Restore region preference
    const savedRegion = localStorage.getItem('loopvybz_region');
    if (savedRegion) setRegion(savedRegion);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (region && region !== 'All Caribbean') params.set('region', region);
      params.set('limit', '20');
      const res = await fetch(`${API}/feed?${params}`);
      const data = await res.json();
      setItems(data.items || []);

      const adsRes = await fetch(`${API}/feed/ads`);
      const adsData = await adsRes.json();
      setAds(adsData || []);
    } catch (e) {
      console.error('Feed fetch error:', e);
    }
    setLoading(false);
  }, [category, region]);

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

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handlePushSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const vapidRes = await fetch(`${API}/api/notifications/vapid-key`);
      const { publicKey } = await vapidRes.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      const token = localStorage.getItem('loopvybz_token');
      await fetch(`${API}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: user?.id,
        }),
      });

      setPushSubscribed(true);
      localStorage.setItem('loopvybz_push_subscribed', 'true');
    } catch (error) {
      console.error('Push subscription error:', error);
    }
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    localStorage.setItem('loopvybz_region', newRegion);
  };

  const feedWithAds: (FeedItem | AdSlot)[] = [];
  const adFrequency = ads[0]?.frequency || 4;
  items.forEach((item, idx) => {
    feedWithAds.push(item);
    if ((idx + 1) % adFrequency === 0 && ads.length > 0) {
      const adIdx = Math.floor(idx / adFrequency) % ads.length;
      feedWithAds.push(ads[adIdx]);
    }
  });

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
      {showInstallPrompt && (
        <div style={{
          position: 'fixed', top: 'env(safe-area-inset-top, 0px)', left: 0, right: 0, zIndex: 101,
          backgroundColor: 'rgba(0,0,0,0.9)', padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF', fontSize: 13 }}>
            <span style={{ fontSize: 18 }}>📱</span>
            <span>Add LOOPVYBZ to your home screen</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleInstallApp} style={{
              background: '#E31937', color: '#FFF', border: 'none',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Install</button>
            <button onClick={() => setShowInstallPrompt(false)} style={{
              background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            }}>Dismiss</button>
          </div>
        </div>
      )}

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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handlePushSubscribe} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              opacity: pushSubscribed ? 1 : 0.5,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={pushSubscribed ? '#00B4D8' : 'white'}>
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
              </svg>
            </button>
            {user ? (
              <div style={{ color: '#FFF', fontSize: 12 }}>👤 {user.name || user.email}</div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#FFF',
                padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Login</button>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 6, padding: '0 16px 8px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {REGIONS.map((r) => {
            const active = region === r || (region === '' && r === 'All Caribbean');
            return (
              <button
                key={r}
                onClick={() => handleRegionChange(r)}
                style={{
                  padding: '4px 10px', borderRadius: 14, fontSize: 11, fontWeight: 600,
                  backgroundColor: active ? '#00B4D8' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {r === 'All Caribbean' ? '🌴' : ''} {r}
              </button>
            );
          })}
        </div>

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

      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100vh', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {loading && feedWithAds.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#E31937', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {!loading && feedWithAds.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
            <div style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>No stories yet</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              {category || region ? 'Try a different filter' : 'Check back soon'}
            </div>
            <button onClick={fetchFeed} style={{
              backgroundColor: 'transparent', color: '#FFFFFF', fontWeight: 600, fontSize: 14,
              padding: '10px 24px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            }}>Refresh</button>
          </div>
        )}

        {feedWithAds.map((item, i) => {
          const isAd = 'click_url' in item;
          return isAd ? (
            <AdCard key={`ad-${i}`} ad={item as AdSlot} isActive={i === activeIndex} />
          ) : (
            <VideoCard
              key={item.id}
              item={item as FeedItem}
              isActive={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted(!muted)}
              user={user}
              onNeedAuth={() => setShowLogin(true)}
            />
          );
        })}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={(u) => { setUser(u); setShowLogin(false); }} />}
    </div>
  );
}

function VideoCard({ item, isActive, muted, onToggleMute, user, onNeedAuth }: {
  item: FeedItem; isActive: boolean; muted: boolean; onToggleMute: () => void; user: any; onNeedAuth: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [engagement, setEngagement] = useState({
    view_count: item.view_count || 0,
    like_count: item.like_count || 0,
    share_count: item.share_count || 0,
    save_count: item.save_count || 0,
    comment_count: item.comment_count || 0,
    liked: item.liked || false,
    saved: item.saved || false,
  });
  const [viewTracked, setViewTracked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      if (!viewTracked) {
        fetch(`${API}/feed/${item.id}/view`, { method: 'POST' });
        setViewTracked(true);
        setEngagement((e) => ({ ...e, view_count: e.view_count + 1 }));
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, item.id, viewTracked]);

  const handleLike = async () => {
    if (!user) { onNeedAuth(); return; }
    const token = localStorage.getItem('loopvybz_token');
    const res = await fetch(`${API}/feed/${item.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEngagement((e) => ({
      ...e,
      liked: data.liked,
      like_count: e.like_count + (data.liked ? 1 : -1),
    }));
  };

  const handleSave = async () => {
    if (!user) { onNeedAuth(); return; }
    const token = localStorage.getItem('loopvybz_token');
    const res = await fetch(`${API}/feed/${item.id}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setEngagement((e) => ({
      ...e,
      saved: data.saved,
      save_count: e.save_count + (data.saved ? 1 : -1),
    }));
  };

  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${item.id}`;

  const shareToSocial = (platform: string) => {
    const eu = encodeURIComponent(shareUrl);
    const et = encodeURIComponent(item.headline);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${eu}`,
      instagram: `https://www.instagram.com/`,
      youtube: `https://www.youtube.com/`,
      tiktok: `https://www.tiktok.com/`,
      x: `https://x.com/intent/tweet?text=${et}&url=${eu}`,
      copy: '',
    };
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setShowShareMenu(false);
      return;
    }
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
    fetch(`${API}/feed/${item.id}/share`, { method: 'POST' });
    setEngagement((e) => ({ ...e, share_count: e.share_count + 1 }));
  };

  const handleShare = () => setShowShareMenu(!showShareMenu);

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

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>
          👁 {engagement.view_count.toLocaleString()} views
        </div>
      </div>

      <div style={{
        position: 'absolute', right: 16, bottom: 140, display: 'flex',
        flexDirection: 'column', gap: 20, alignItems: 'center', pointerEvents: 'auto',
      }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill={engagement.liked ? '#E31937' : 'white'} opacity={engagement.liked ? 1 : 0.7}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <div style={{ color: 'white', fontSize: 11, marginTop: 2 }}>{engagement.like_count > 0 && engagement.like_count}</div>
        </button>

        <button onClick={() => setShowComments(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7, textAlign: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div style={{ color: 'white', fontSize: 11, marginTop: 2 }}>💬 {engagement.comment_count > 0 && engagement.comment_count}</div>
        </button>

        <button onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7, textAlign: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill={engagement.saved ? '#00B4D8' : 'none'} stroke="white" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <div style={{ color: 'white', fontSize: 11, marginTop: 2 }}>{engagement.save_count > 0 && engagement.save_count}</div>
        </button>

        <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7, textAlign: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <div style={{ color: 'white', fontSize: 11, marginTop: 2 }}>{engagement.share_count > 0 && engagement.share_count}</div>
        </button>

        {showShareMenu && (
          <div style={{
            position: 'absolute', right: 44, bottom: 60,
            background: 'rgba(0,0,0,0.92)', borderRadius: 12,
            padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 2,
            backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 170, zIndex: 50,
          }}>
            {[
              { id: 'facebook', icon: '📘', label: 'Facebook' },
              { id: 'instagram', icon: '📸', label: 'Instagram' },
              { id: 'youtube', icon: '▶️', label: 'YouTube' },
              { id: 'tiktok', icon: '🎵', label: 'TikTok' },
              { id: 'x', icon: '𝕏', label: 'X.com' },
              { id: 'copy', icon: '🔗', label: 'Copy Link' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => shareToSocial(p.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, color: 'white', fontSize: 13,
                  textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        )}

        <button onClick={onToggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.6, marginTop: 8 }}>
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

      {showComments && <CommentsSheet postId={item.id} user={user} onNeedAuth={onNeedAuth} onClose={() => setShowComments(false)} onCommentAdded={() => setEngagement(e => ({ ...e, comment_count: e.comment_count + 1 }))} />}
    </div>
  );
}

function CommentsSheet({ postId, user, onNeedAuth, onClose, onCommentAdded }: {
  postId: string; user: any; onNeedAuth: () => void; onClose: () => void; onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API}/feed/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error('Comments fetch error:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      onNeedAuth();
      return;
    }

    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('loopvybz_token');
      const res = await fetch(`${API}/feed/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          parent_id: replyTo?.id,
        }),
      });

      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
        onCommentAdded();
      }
    } catch (e) {
      console.error('Comment submit error:', e);
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, top: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 150,
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1A1A1A', width: '100%',
          maxHeight: '70vh', borderTopLeftRadius: 16, borderTopRightRadius: 16,
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ color: '#FFF', fontSize: 16, fontWeight: 700 }}>
            💬 Comments ({comments.length})
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: 24, cursor: 'pointer', padding: 0,
          }}>
            ×
          </button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 20px',
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
              Loading...
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
              No comments yet. Be the first!
            </div>
          )}

          {comments.map((comment) => (
            <div key={comment.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: '#E31937', color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, flexShrink: 0,
                }}>
                  {comment.user.avatar_url ? (
                    <img src={comment.user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  ) : (
                    comment.user.name[0]?.toUpperCase() || 'A'
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <div style={{ color: '#FFF', fontSize: 13, fontWeight: 600 }}>
                      {comment.user.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      {timeAgo(comment.created_at)}
                    </div>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.4, marginBottom: 6 }}>
                    {comment.content}
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                      fontSize: 11, cursor: 'pointer', padding: 0,
                    }}>
                      👍 {comment.like_count > 0 && comment.like_count}
                    </button>
                    <button
                      onClick={() => setReplyTo(comment)}
                      style={{
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                        fontSize: 11, cursor: 'pointer', padding: 0,
                      }}
                    >
                      Reply
                    </button>
                  </div>

                  {comment.replies?.map((reply: any) => (
                    <div key={reply.id} style={{ marginTop: 12, marginLeft: 20, paddingLeft: 12, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <div style={{ color: '#FFF', fontSize: 12, fontWeight: 600 }}>
                          {reply.user.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                          {timeAgo(reply.created_at)}
                        </div>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.4 }}>
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {replyTo && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.6)',
              marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Replying to @{replyTo.user.name}</span>
              <button onClick={() => setReplyTo(null)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: 11, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder={user ? "Add a comment..." : "Login to comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={!user}
              style={{
                flex: 1, padding: 10, borderRadius: 20,
                backgroundColor: '#2A2A2A', color: '#FFF',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!user || !newComment.trim()}
              style={{
                padding: '10px 20px', borderRadius: 20,
                backgroundColor: '#E31937', color: '#FFF',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: user && newComment.trim() ? 'pointer' : 'not-allowed',
                opacity: user && newComment.trim() ? 1 : 0.5,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdCard({ ad, isActive }: { ad: AdSlot; isActive: boolean }) {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (isActive && !tracked) {
      fetch(`${API}/feed/ads/${ad.id}/impression`, { method: 'POST' });
      setTracked(true);
    }
  }, [isActive, ad.id, tracked]);

  const handleClick = () => {
    fetch(`${API}/feed/ads/${ad.id}/click`, { method: 'POST' });
    if (ad.click_url) window.open(ad.click_url, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100%', height: '100vh', position: 'relative',
        scrollSnapAlign: 'start', backgroundColor: '#000',
        cursor: 'pointer',
      }}
    >
      {ad.video_url ? (
        <video
          src={ad.video_url}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : ad.image_url ? (
        <img src={ad.image_url} alt={ad.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#FFF', fontSize: 24, fontWeight: 700 }}>{ad.name}</div>
        </div>
      )}

      <div style={{
        position: 'absolute', top: 80, left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.7)',
        padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        Sponsored
      </div>
    </div>
  );
}

function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin ? { email, password } : { email, password, name };
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      localStorage.setItem('loopvybz_token', data.token);
      onSuccess(data.user);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1A1A1A', padding: 32, borderRadius: 16,
          maxWidth: 400, width: '90%',
        }}
      >
        <h2 style={{ color: '#FFF', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {isLogin ? 'Login' : 'Create Account'}
        </h2>

        {!isLogin && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%', padding: 12, marginBottom: 12, borderRadius: 8,
              backgroundColor: '#2A2A2A', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 14,
            }}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', padding: 12, marginBottom: 12, borderRadius: 8,
            backgroundColor: '#2A2A2A', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 14,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%', padding: 12, marginBottom: 16, borderRadius: 8,
            backgroundColor: '#2A2A2A', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 14,
          }}
        />

        {error && <div style={{ color: '#E31937', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 600,
            backgroundColor: '#E31937', color: '#FFF', border: 'none', cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{
            width: '100%', padding: 14, borderRadius: 8, fontSize: 14,
            backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
          }}
        >
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: 10, marginTop: 16, fontSize: 13,
            backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)',
            border: 'none', cursor: 'pointer',
          }}
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}

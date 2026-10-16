import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  Tag,
  Building2,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import * as api from '../services/api';

/**
 * SponsoredCard component
 * Matches Anvesha's cultural palette (Cream #FCF7F0, Blush #E9CDB8, Terracotta #C56E50, Cocoa #5B332C, Ochre #D9A441).
 * Features visible "Sponsored" / "Advertisement" identification, viewport impression tracking,
 * and click logging.
 */
export default function SponsoredCard({
  ad,
  placement = 'HOMEPAGE',
  locationContext = '',
  format = 'card', // 'card' | 'banner' | 'compact'
  onSelectEvent = null,
  className = ''
}) {
  const cardRef = useRef(null);
  const impressionRecorded = useRef(false);
  const [clicked, setClicked] = useState(false);

  // Track impression once when entering viewport
  useEffect(() => {
    if (!ad?.id || impressionRecorded.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionRecorded.current) {
            impressionRecorded.current = true;
            api.ads.recordImpression(ad.id, { placement, locationContext }).catch(() => {
              // Silently fail gracefully on network glitch
            });
          }
        });
      },
      { threshold: 0.4 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [ad?.id, placement, locationContext]);

  if (!ad) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    setClicked(true);
    // Track click on backend
    api.ads.recordClick(ad.id, { placement, locationContext })
      .then((res) => {
        const dest = res?.destinationUrl || ad.destinationUrl;
        if (dest) {
          window.open(dest, '_blank', 'noopener,noreferrer');
        }
      })
      .catch(() => {
        if (ad.destinationUrl) {
          window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
        }
      });
  };

  // ── Compact format (ideal for sidebar, food drawers, or mini headers) ────────
  if (format === 'compact') {
    return (
      <div
        ref={cardRef}
        onClick={handleClick}
        className={`group p-3 rounded-2xl bg-surface-container-lowest border-2 border-ochre-accent/30 hover:border-terra-primary/50 shadow-xs hover:shadow-warm transition-all cursor-pointer flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-blush-surface/40 flex-shrink-0">
            <img
              src={ad.imageUrl || '/images/heritage-tapestry-bg.png'}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/heritage-tapestry-bg.png';
              }}
            />
            <span className="absolute top-0.5 left-0.5 text-[8px] font-bold uppercase px-1 rounded bg-cocoa-text/80 text-cream-canvas">
              Ad
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-ochre-accent">
                Sponsored · {ad.advertiserName}
              </span>
            </div>
            <h4 className="font-serif text-xs font-bold text-cocoa-text truncate group-hover:text-terra-primary transition-colors">
              {ad.title}
            </h4>
            <p className="text-[11px] text-cocoa-text/70 truncate">{ad.description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-1.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
        >
          <span>{ad.ctaLabel || 'Explore'}</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // ── Horizontal Banner format (ideal for Map & State Discovery) ─────────────
  if (format === 'banner') {
    return (
      <div
        ref={cardRef}
        onClick={handleClick}
        className={`group p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border-2 border-ochre-accent/40 hover:border-terra-primary/60 shadow-warm hover:shadow-warm-hover transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${className}`}
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-ochre-accent/10 blur-2xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-blush-surface/50 flex-shrink-0 shadow-xs">
            <img
              src={ad.imageUrl || '/images/cinematic_india_hero.jpg'}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/cinematic_india_hero.jpg';
              }}
            />
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-canvas/95 text-cocoa-text shadow-xs border border-blush-surface flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-ochre-accent" />
                <span>Sponsored</span>
              </span>
            </div>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary flex items-center gap-1">
                <Building2 className="w-3 h-3 text-terra-primary/80" />
                {ad.advertiserName}
              </span>
              {(ad.targetCity || ad.targetState) && (
                <span className="text-[10px] text-cocoa-text/60 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-ochre-accent" />
                  {ad.targetCity ? `${ad.targetCity}, ` : ''}{ad.targetState?.toUpperCase()}
                </span>
              )}
            </div>

            <h3 className="font-serif text-base sm:text-lg font-bold text-cocoa-text group-hover:text-terra-primary transition-colors leading-snug">
              {ad.title}
            </h3>

            <p className="text-xs text-cocoa-text/75 line-clamp-2 leading-relaxed">
              {ad.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-blush-surface/40">
          <button
            type="button"
            onClick={handleClick}
            className="w-full sm:w-auto px-4 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-md hover:scale-102 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{ad.ctaLabel || 'Explore Offer'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Standard Card format (Matches EventCard styling in feed) ───────────────
  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`group bg-surface-container-lowest rounded-3xl border-2 border-ochre-accent/35 hover:border-terra-primary/60 overflow-hidden shadow-warm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer relative ${className}`}
    >
      {/* Banner Media */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-blush-surface/30">
        <img
          src={ad.imageUrl || '/images/cinematic_india_hero.jpg'}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/cinematic_india_hero.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/80 via-cocoa-text/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Prominent Sponsored Badge */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cream-canvas/95 backdrop-blur-sm text-cocoa-text shadow-xs border border-ochre-accent/40">
            <Sparkles className="w-3 h-3 text-ochre-accent" />
            <span>Sponsored</span>
          </span>

          {/* Advertiser Name Tag */}
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cocoa-text/75 backdrop-blur-sm text-cream-canvas max-w-[150px] truncate">
            {ad.advertiserName}
          </span>
        </div>

        {/* Bottom banner details */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-cream-canvas text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] drop-shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-ochre-accent" />
            <span className="truncate max-w-[140px]">{ad.category ? ad.category.toUpperCase() : 'PARTNER'}</span>
          </div>

          {(ad.targetState || ad.targetCity) && (
            <div className="flex items-center gap-1 text-[11px] text-cream-canvas/90 drop-shadow-sm">
              <MapPin className="w-3 h-3 text-cream-canvas/70" />
              <span>{ad.targetCity ? `${ad.targetCity}, ` : ''}{ad.targetState !== 'all' ? ad.targetState : 'India'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ochre-accent">
            <span>Verified Cultural Partner</span>
            <span>•</span>
            <span>Featured Offer</span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl font-bold text-cocoa-text group-hover:text-terra-primary transition-colors leading-snug">
            {ad.title}
          </h3>

          <p className="text-xs text-cocoa-text/75 line-clamp-3 leading-relaxed">
            {ad.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-blush-surface/60 flex items-center justify-between gap-2">
          <span className="text-[11px] text-cocoa-text/60 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Promotion</span>
          </span>

          <button
            type="button"
            onClick={handleClick}
            className="px-4 py-1.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-xs hover:scale-102 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{ad.ctaLabel || 'Explore Offer'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AdSlot component wrapper
 * Supports admin-managed sponsored cultural ads today and external ad network
 * integration (such as Google AdSense) in the future without refactoring caller views.
 */
export function AdSlot({
  placement = 'HOMEPAGE',
  state = 'ALL',
  category = 'ALL',
  format = 'card',
  fallbackAds = [],
  onSelectEvent = null,
  className = ''
}) {
  const [activeAd, setActiveAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAd = () => {
      api.ads.list({ placement, state, category, limit: 5 })
        .then((items) => {
          if (!isMounted) return;
          if (Array.isArray(items) && items.length > 0) {
            setActiveAd(items[0]);
          } else if (fallbackAds.length > 0) {
            setActiveAd(fallbackAds[0]);
          } else {
            setActiveAd(null);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          if (fallbackAds.length > 0) setActiveAd(fallbackAds[0]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    fetchAd();
    window.addEventListener('focus', fetchAd);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', fetchAd);
    };
  }, [placement, state, category]);

  if (loading || !activeAd) return null;

  return (
    <SponsoredCard
      ad={activeAd}
      placement={placement}
      locationContext={state}
      format={format}
      onSelectEvent={onSelectEvent}
      className={className}
    />
  );
}

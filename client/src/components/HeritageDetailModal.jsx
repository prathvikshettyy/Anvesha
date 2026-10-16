import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Landmark,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Camera,
  ExternalLink,
  Share2,
  Bookmark,
  Sparkles,
  Info,
  Footprints,
  Shirt,
  Compass
} from 'lucide-react';

export default function HeritageDetailModal({
  site,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave = null,
}) {
  if (!isOpen || !site) return null;

  const isPermanent = Boolean(site.is_permanent_place ?? site.isPermanent);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Discover ${site.name} in ${site.city}, ${site.state} on Anvesha Culture & Heritage Atlas!`
      );
      alert('Heritage site link copied to clipboard!');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-cream-canvas rounded-3xl border border-blush-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close heritage details"
          className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-cream-canvas/90 backdrop-blur-md border border-blush-surface flex items-center justify-center text-cocoa-text hover:bg-terra-primary hover:text-cream-canvas transition-all cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Image */}
        <div className="relative h-60 sm:h-72 w-full bg-blush-surface/40 overflow-hidden flex-shrink-0">
          <img
            src={site.image_url || site.imageUrl}
            alt={site.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/90 via-cocoa-text/30 to-transparent" />

          {/* Badges Top Left */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 flex-wrap max-w-[80%]">
            <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-cream-canvas/95 backdrop-blur-md text-cocoa-text border border-blush-surface shadow-xs flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-terra-primary" />
              <span>{site.category_label || site.categoryLabel || site.category}</span>
            </span>

            {isPermanent ? (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
                Permanent Heritage Landmark
              </span>
            ) : (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Scheduled Cultural Event</span>
              </span>
            )}
          </div>

          {/* Hero Caption */}
          <div className="absolute bottom-4 left-4 right-4 text-cream-canvas">
            <div className="flex items-center gap-1.5 text-xs text-cream-canvas/90 mb-1">
              <MapPin className="w-3.5 h-3.5 text-ochre-accent" />
              <span>{site.city}, {site.state}</span>
              {site.location_summary && (
                <span className="text-cream-canvas/70 hidden sm:inline">• {site.location_summary}</span>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">
              {site.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Visiting Schedule / Event Dates banner */}
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-blush-surface flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-terra-primary/10 text-terra-primary flex-shrink-0 mt-0.5">
              {isPermanent ? <Clock className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-cocoa-text/60">
                {isPermanent ? 'Visiting Hours & Access' : 'Scheduled Dates & Season'}
              </p>
              <p className="text-sm font-semibold text-cocoa-text mt-0.5">
                {isPermanent
                  ? (site.visiting_hours || site.visitingHours || 'Open daily during daytime visiting hours')
                  : (site.event_date || site.eventDate || 'Seasonal cultural performance schedule')}
              </p>
              <p className="text-[11px] text-cocoa-text/70 mt-1">
                {isPermanent
                  ? 'Open year-round as a permanent sacred/historical landmark.'
                  : 'Traditional cultural performance with seasonal or festival programming.'}
              </p>
            </div>
          </div>

          {/* Description & Cultural Significance */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-cocoa-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-terra-primary" />
              <span>Cultural Significance & History</span>
            </h3>
            <p className="text-sm text-cocoa-text/85 leading-relaxed">
              {site.description}
            </p>
            {site.cultural_significance && (
              <div className="p-3.5 rounded-xl bg-blush-surface/30 border border-blush-surface/80 text-xs text-cocoa-text/90 italic leading-relaxed">
                "{site.cultural_significance}"
              </div>
            )}
          </div>

          {/* Visitor Guidelines & Customs Section */}
          <div className="space-y-3 pt-2 border-t border-blush-surface/60">
            <h3 className="font-serif text-base font-bold text-cocoa-text flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Visitor Guidelines, Customs & Access Etiquette</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dress Guidelines */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-blush-surface/70 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-terra-primary">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Dress Code</span>
                </div>
                <p className="text-[12px] text-cocoa-text/80 leading-normal">
                  {site.dress_guidelines || site.dressGuidelines || 'Modest clothing recommended.'}
                </p>
              </div>

              {/* Photography Rules */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-blush-surface/70 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ochre-accent">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photography</span>
                </div>
                <p className="text-[12px] text-cocoa-text/80 leading-normal">
                  {site.photography_rules || site.photographyRules || 'Photography permitted in designated outdoor areas.'}
                </p>
              </div>

              {/* Footwear & Sacred Customs */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-blush-surface/70 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cocoa-text">
                  <Footprints className="w-3.5 h-3.5 text-terra-primary" />
                  <span>Customs & Footwear</span>
                </div>
                <p className="text-[12px] text-cocoa-text/80 leading-normal">
                  {site.customs_etiquette || site.customsEtiquette || 'Remove footwear where indicated. Maintain reverent decorum.'}
                </p>
              </div>
            </div>
          </div>

          {/* Organizer, Verification & Official Contacts */}
          <div className="p-4 rounded-2xl bg-cream-canvas border border-terra-primary/20 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-cocoa-text flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-terra-primary" />
                <span>Verified Authority & Information Source</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {site.verification_status || 'VERIFIED'}
              </span>
            </div>

            <div className="text-xs text-cocoa-text/80 space-y-1">
              {site.organizer_name && (
                <p>
                  <strong className="text-cocoa-text">Preservation Authority / Organizer:</strong> {site.organizer_name}
                </p>
              )}
              {site.contact_info && (
                <p>
                  <strong className="text-cocoa-text">Official Contact / Facilitation:</strong> {site.contact_info}
                </p>
              )}
              {site.source_label && (
                <p className="flex items-center gap-1.5 pt-1">
                  <strong className="text-cocoa-text">Official Documentation:</strong>
                  {site.source_url ? (
                    <a
                      href={site.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terra-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>{site.source_label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span>{site.source_label}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-6 bg-surface-container-lowest border-t border-blush-surface/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(site.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSaved
                    ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                    : 'bg-cream-canvas border-blush-surface text-cocoa-text hover:bg-blush-surface/50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-cream-canvas' : ''}`} />
                <span>{isSaved ? 'Saved in Itinerary' : 'Save Landmark'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cream-canvas border border-blush-surface text-cocoa-text hover:bg-blush-surface/50 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cocoa-text text-cream-canvas text-xs font-bold hover:bg-terra-primary transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

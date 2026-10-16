import React from 'react';
import { createPortal } from 'react-dom';
import { X, Utensils, Compass, AlertTriangle, Bookmark, Check, Calendar, MapPin, Share2, Sparkles, ExternalLink } from 'lucide-react';

const DIETARY_LABELS = {
  VEGAN: { label: 'Vegan', symbol: '🌱', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  VEGETARIAN: { label: 'Vegetarian', symbol: '🥬', badgeClass: 'bg-green-100 text-green-800 border-green-300' },
  NON_VEGETARIAN: { label: 'Non-Vegetarian', symbol: '🍗', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
};

export default function DishDetailModal({
  dish,
  isOpen,
  onClose,
  isWishlisted = false,
  onToggleWishlist,
  isTasted = false,
  onToggleTasted,
  onSelectEvent = null,
  relatedEvent = null,
}) {
  if (!isOpen || !dish) return null;

  const dietary = DIETARY_LABELS[dish.dietaryType] || null;
  const hasAllergens = Array.isArray(dish.allergens) && dish.allergens.length > 0;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Discover traditional ${dish.name} (${dish.regionalName || ''}) from ${dish.region} on Anvesha!`
      );
      alert('Dish details copied to clipboard!');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-cream-canvas rounded-3xl border border-blush-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dish details"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-cream-canvas/90 backdrop-blur-md border border-blush-surface flex items-center justify-center text-cocoa-text hover:bg-terra-primary hover:text-cream-canvas transition-all cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Image */}
        <div className="relative h-52 sm:h-60 w-full bg-blush-surface/40 overflow-hidden flex-shrink-0">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/kadak_chai.jpg';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/85 via-cocoa-text/20 to-transparent" />

          {/* Badges Top */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-cream-canvas/90 backdrop-blur-md text-cocoa-text border border-blush-surface shadow-xs">
              {dish.categoryLabel || dish.category}
            </span>
            {dietary && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${dietary.badgeClass}`}>
                {dietary.symbol} {dietary.label}
              </span>
            )}
          </div>

          {/* Bottom Overlay Title */}
          <div className="absolute bottom-3 left-4 right-4 text-cream-canvas">
            <h2 className="font-serif text-xl sm:text-2xl font-bold drop-shadow-md">
              {dish.name}
            </h2>
            {dish.regionalName && (
              <p className="text-sm font-serif text-ochre-accent drop-shadow-sm mt-0.5">
                {dish.regionalName}
              </p>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Location & Heritage Origin */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-surface-container/60 border border-blush-surface text-xs">
            <div className="flex items-center gap-2 text-cocoa-text/80">
              <MapPin className="w-4 h-4 text-terra-primary flex-shrink-0" />
              <div>
                <span className="font-bold text-cocoa-text">{dish.region}</span>
                {dish.city && <span className="text-cocoa-text/60"> · Near {dish.city}</span>}
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-[11px] font-bold text-terra-primary hover:underline cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-serif font-bold text-sm text-cocoa-text mb-1 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-terra-primary" />
              <span>Culinary Profile</span>
            </h4>
            <p className="text-xs sm:text-sm text-cocoa-text/80 leading-relaxed">
              {dish.description}
            </p>
          </div>

          {/* Living Cultural Heritage Story */}
          {dish.culturalTradition && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-cocoa-text space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Compass className="w-4 h-4 text-amber-700" />
                <span>Living Cultural Tradition & Story</span>
              </div>
              <p className="text-xs text-cocoa-text/85 leading-relaxed">
                {dish.culturalTradition}
              </p>
            </div>
          )}

          {/* Allergens & Dietary Notice */}
          <div className="p-3 rounded-2xl bg-cream-canvas border border-blush-surface space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cocoa-text">Dietary Intelligence</span>
              {dietary && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dietary.badgeClass}`}>
                  {dietary.label}
                </span>
              )}
            </div>
            {hasAllergens ? (
              <div className="flex items-center gap-1.5 text-amber-800 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Known Allergens: <strong>{dish.allergens.join(', ')}</strong></span>
              </div>
            ) : (
              <p className="text-[11px] text-cocoa-text/60">
                No common allergens declared. In traditional kitchens, check with local preparation cooks.
              </p>
            )}
          </div>

          {/* Associated Cultural Event (Two-way discovery link) */}
          {relatedEvent && (
            <div className="p-3.5 rounded-2xl bg-surface-container border border-terra-primary/30 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary">
                Featured at Cultural Gathering
              </span>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-serif font-bold text-xs sm:text-sm text-cocoa-text">
                    {relatedEvent.title}
                  </h5>
                  <p className="text-[11px] text-cocoa-text/70 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-terra-primary" />
                    <span>{relatedEvent.date}</span>
                    <span>·</span>
                    <span>{relatedEvent.city}</span>
                  </p>
                </div>
                {onSelectEvent && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectEvent(relatedEvent);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    <span>View Gathering</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dataset Status Notice */}
          <div className="text-[10px] text-cocoa-text/50 pt-2 border-t border-blush-surface/50 leading-relaxed">
            Curated cultural heritage archive for traditional food exploration. We never invent fake restaurant ratings or artificial commercial vendor listings.
          </div>
        </div>

        {/* Footer Actions: Want to Try / Already Tasted */}
        <div className="p-4 bg-cream-canvas border-t border-blush-surface flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWishlist && onToggleWishlist(dish.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isWishlisted
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'bg-surface-container text-cocoa-text hover:bg-blush-surface/70 border border-blush-surface'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-cream-canvas' : ''}`} />
              <span>{isWishlisted ? 'Saved to Wishlist' : 'Want to Try'}</span>
            </button>

            <button
              onClick={() => onToggleTasted && onToggleTasted(dish.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isTasted
                  ? 'bg-emerald-600 text-cream-canvas shadow-xs'
                  : 'bg-surface-container text-cocoa-text hover:bg-blush-surface/70 border border-blush-surface'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isTasted ? 'Tasted ✓' : 'I’ve Tasted This'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-cocoa-text/70 hover:bg-blush-surface/50 cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

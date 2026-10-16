import React from 'react';
import { Calendar, MapPin, Bookmark, CheckCircle, Share2, ExternalLink, ArrowRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getEventImage, handleEventImageError } from '../utils/eventPlaceholder';

export default function EventCard({ event, isSaved, onToggleSave, onSelect }) {
  const handleSaveClick = (e) => {
    e.stopPropagation();
    onToggleSave(event.id);
    if (!isSaved) {
      confetti({
        particleCount: 20,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
    }
  };

  return (
    <div
      onClick={() => onSelect(event)}
      className="group bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-blush-surface overflow-hidden shadow-warm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Event Image Banner */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-blush-surface/30">
        <img
          src={getEventImage(event)}
          alt={event.title}
          onError={(e) => handleEventImageError(e, event?.category)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/60 via-transparent to-transparent opacity-60" />

        {/* Category Pill Tag */}
        <span className="absolute top-3 left-3 text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full bg-cream-canvas/90 backdrop-blur-sm text-cocoa-text shadow-sm border border-blush-surface">
          {event.categoryLabel}
        </span>

        {/* Save Bookmark Action */}
        <button
          onClick={handleSaveClick}
          aria-label={isSaved ? "Remove from saved events" : "Save this event"}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isSaved
              ? 'bg-terra-primary text-cream-canvas shadow-md'
              : 'bg-cream-canvas/80 text-cocoa-text hover:bg-cream-canvas'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-cream-canvas' : ''}`} />
        </button>

        {/* Verification Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cream-canvas/90 backdrop-blur-sm text-[11px] font-semibold text-cocoa-text">
          <CheckCircle className="w-3.5 h-3.5 text-terra-primary" />
          <span>{event.sourceLabel}</span>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-terra-primary mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{event.date}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-lg sm:text-xl font-bold text-cocoa-text leading-snug group-hover:text-terra-primary transition-colors">
            {event.title}
          </h3>

          {/* Venue & Neighborhood */}
          <p className="text-xs text-cocoa-text/75 mt-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-terra-primary flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </p>

          {/* Short Excerpt */}
          <p className="text-xs sm:text-sm text-cocoa-text/70 mt-3 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Card Footer: Attendees & View Details CTA */}
        <div className="mt-5 pt-4 border-t border-blush-surface/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap text-xs text-cocoa-text/60">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-ochre-accent">group</span>
              <span>{event.attendeeCount} interested</span>
            </div>
            {event.reviewCount > 0 && (
              <div className="flex items-center gap-1 font-semibold text-cocoa-text/85 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[11px]">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{event.averageRating}</span>
                <span className="text-cocoa-text/50 text-[10px]">({event.reviewCount})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-terra-primary group-hover:translate-x-1 transition-transform flex-shrink-0">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

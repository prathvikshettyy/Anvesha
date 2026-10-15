import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, CheckCircle, ExternalLink, Bookmark, Users, Heart, Share2, Loader2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getEventImage, handleEventImageError } from '../utils/eventPlaceholder';

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onOpenCommunity,
  onJoinCommunity,
  communities = []
}) {
  if (!isOpen || !event) return null;

  // Find linked community for this event if one exists
  const matchedCommunity = communities.find(c => c.eventId === event.id || c.event_id === event.id)
    || (event.id === 'evt_1' ? { id: 'comm_evt_manipal_fest', name: 'Manipal Cultural Fest 2026', memberCount: 38 }
    : event.id === 'evt_2' ? { id: 'comm_evt_dasara', name: 'Mysuru Dasara Cultural Circle', memberCount: 42 }
    : event.id === 'evt_3' || event.id === 'evt_k1' ? { id: 'comm_evt_hackathon', name: 'Bengaluru Culture Tech Hackers', memberCount: 54 }
    : event.id === 'evt_6' ? { id: 'comm_dialects_lit', name: 'Tulu & Konkani Dialect Circle', memberCount: 22 }
    : null);

  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [memberCount, setMemberCount] = useState(42);

  useEffect(() => {
    if (matchedCommunity) {
      setIsJoined(Boolean(matchedCommunity.isMember));
      setMemberCount(matchedCommunity.memberCount || 42);
    }
  }, [matchedCommunity?.id, matchedCommunity?.isMember, matchedCommunity?.memberCount]);

  const handleJoinClick = async () => {
    if (!matchedCommunity || joining) return;
    setJoining(true);
    try {
      if (onJoinCommunity) {
        await onJoinCommunity(matchedCommunity);
      }
      setIsJoined(true);
      setMemberCount(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
    } catch (err) {
      console.error('Failed to join community:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleRsvp = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C56E50', '#D9A441', '#E9CDB8']
    });
    alert(`🎉 RSVP Confirmed for "${event.title}"! Added to your calendar.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-canvas w-full max-w-2xl rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Banner with Close button */}
        <div className="relative h-56 sm:h-64 w-full bg-blush-surface/30">
          <img
            src={getEventImage(event)}
            alt={event.title}
            onError={(e) => handleEventImageError(e, event?.category)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/75 via-cocoa-text/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-cream-canvas/80 hover:bg-cream-canvas text-cocoa-text flex items-center justify-center shadow-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Verification badge */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cream-canvas text-cocoa-text shadow-sm border border-blush-surface">
              {event.categoryLabel}
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-canvas/90 text-xs font-semibold text-cocoa-text backdrop-blur-sm">
              <CheckCircle className="w-3.5 h-3.5 text-terra-primary" />
              <span>{event.sourceLabel}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text leading-tight">
              {event.title}
            </h2>
            <p className="text-xs sm:text-sm text-cocoa-text/70 mt-1 font-medium">
              Organized by <strong className="text-cocoa-text">{event.organizer}</strong>
            </p>
          </div>

          {/* Date & Location Pill Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-container/60 border border-blush-surface text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-cocoa-text/60 font-medium">Date & Time</span>
                <p className="font-bold text-cocoa-text">{event.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-cocoa-text/60 font-medium">Location</span>
                <p className="font-bold text-cocoa-text">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-cocoa-text/60 mb-2">
              About This Cultural Gathering
            </h4>
            <p className="text-sm text-cocoa-text/85 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Event-based Community Entry Point */}
          {matchedCommunity && (
            <div className="p-4 rounded-2xl bg-terra-primary/5 border border-terra-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary">
                      Event Community Circle
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-canvas text-cocoa-text/70 border border-blush-surface font-semibold">
                      {memberCount}+ members
                    </span>
                    {isJoined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Joined
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-cocoa-text text-sm sm:text-base">
                    {matchedCommunity.name}
                  </h4>
                  <p className="text-xs text-cocoa-text/70">
                    Connect with attendees, coordinate arrival, and share live discussions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isJoined ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCommunity?.(matchedCommunity);
                    }}
                    className="px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-cream-canvas text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Open Circle Discussion</span>
                  </button>
                ) : (
                  <button
                    disabled={joining}
                    onClick={handleJoinClick}
                    className="px-4 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-75"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Community</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Source Attribution Box */}
          <div className="p-3.5 rounded-2xl bg-cream-canvas border border-blush-surface flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-cocoa-text">Source Lead:</span>
              <p className="text-cocoa-text/70 mt-0.5">{event.sourceLabel}</p>
            </div>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blush-surface/50 hover:bg-blush-surface text-cocoa-text font-bold transition-all"
              >
                <span>View Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-surface-container/60 border-t border-blush-surface flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleSave(event.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all ${
              isSaved
                ? 'bg-blush-surface border-terra-primary text-terra-primary'
                : 'border-blush-surface text-cocoa-text hover:bg-blush-surface/40'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-terra-primary' : ''}`} />
            <span>{isSaved ? 'Saved to Calendar' : 'Save Event'}</span>
          </button>

          <button
            onClick={handleRsvp}
            className="flex-1 max-w-xs px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm transition-all flex items-center justify-center gap-2"
          >
            <span>RSVP & Attend</span>
          </button>
        </div>
      </div>
    </div>
  );
}

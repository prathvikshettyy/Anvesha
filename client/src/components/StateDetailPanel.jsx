import React from 'react';
import { CULTURAL_ART_REGISTRY } from '../data/culturalArtRegistry';
import { PIN_CATEGORIES } from './IllustratedPin';
import { Calendar, MapPin, Bookmark, ArrowRight, Sparkles, X, ChevronRight, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StateDetailPanel({
  selectedStateId,
  selectedStateName,
  events = [],
  savedEvents = [],
  onClearState,
  onToggleSave,
  onSelectEvent
}) {
  const reg = selectedStateId ? CULTURAL_ART_REGISTRY[selectedStateId] : null;

  const stateEvents = events.filter(e => {
    if (!selectedStateId) return true;
    return e.stateId === selectedStateId || e.state?.toLowerCase().replace(/\s+/g, '-') === selectedStateId;
  });

  const handleSaveClick = (e, eventId) => {
    e.stopPropagation();
    onToggleSave(eventId);
    if (!savedEvents.includes(eventId)) {
      confetti({
        particleCount: 20,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface p-5 sm:p-6 shadow-warm flex flex-col h-full space-y-5">
      
      {/* Panel Top Header */}
      {selectedStateId ? (
        <div className="border-b border-blush-surface/80 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{reg?.artIllustration?.symbol || '📍'}</span>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-cocoa-text">
                  {reg?.stateName || selectedStateName}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
                  State Living Heritage
                </span>
              </div>
            </div>

            <button
              onClick={onClearState}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blush-surface/50 hover:bg-blush-surface text-cocoa-text transition-all"
              title="Return to full India view"
            >
              Reset view
            </button>
          </div>

          {reg && (
            <div className="mt-3 space-y-2 text-xs">
              <p className="font-serif text-sm font-semibold text-terra-primary">
                {reg.culturalTitle}
              </p>
              <p className="text-cocoa-text/75 leading-relaxed">
                {reg.tagline}
              </p>

              {/* Native Dialects */}
              {reg.dialects && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-cocoa-text/60">Dialects:</span>
                  {reg.dialects.map((d, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-container text-cocoa-text font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border-b border-blush-surface/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-terra-primary text-2xl">auto_awesome</span>
            <h3 className="font-serif text-xl font-bold text-cocoa-text">
              All-India Living Heritage
            </h3>
          </div>
          <p className="text-xs text-cocoa-text/70 mt-1">
            Click any state on the illustrated map to explore its specific traditions, native dialect circles, and upcoming workshops.
          </p>
        </div>
      )}

      {/* Events List in State */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[620px]">
        <div className="flex items-center justify-between text-xs font-bold text-cocoa-text/70">
          <span>{selectedStateId ? `Gatherings in ${reg?.stateName || selectedStateName}` : 'Featured Countrywide Gatherings'} ({stateEvents.length})</span>
        </div>

        {stateEvents.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface-container/50 border border-blush-surface text-xs text-cocoa-text/70">
            <p>No upcoming events currently scheduled for this state.</p>
            <p className="mt-1">Be the first to submit a community gathering!</p>
          </div>
        ) : (
          stateEvents.map(evt => {
            const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;
            const isSaved = savedEvents.includes(evt.id);

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="group p-4 rounded-2xl bg-cream-canvas border border-blush-surface hover:border-terra-primary/40 shadow-xs hover:shadow-warm transition-all cursor-pointer flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-cream-canvas flex items-center gap-1"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span>{cat.symbol}</span>
                    <span>{cat.label.split(' ')[0]}</span>
                  </span>

                  <button
                    onClick={(e) => handleSaveClick(e, evt.id)}
                    aria-label={isSaved ? "Remove from saved events" : "Save this event"}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSaved ? 'bg-terra-primary text-cream-canvas' : 'text-cocoa-text/50 hover:text-cocoa-text hover:bg-blush-surface/50'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-cream-canvas' : ''}`} />
                  </button>
                </div>

                <div>
                  <h4 className="font-serif text-sm font-bold text-cocoa-text leading-snug group-hover:text-terra-primary transition-colors">
                    {evt.title}
                  </h4>
                  <p className="text-[11px] text-cocoa-text/70 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-terra-primary flex-shrink-0" />
                    <span>{evt.date}</span>
                  </p>
                  <p className="text-[11px] text-cocoa-text/70 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-terra-primary flex-shrink-0" />
                    <span className="truncate">{evt.venue} · {evt.city}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-blush-surface/50 flex items-center justify-between text-[11px]">
                  <span className="text-cocoa-text/60 italic truncate">
                    {evt.sourceLabel}
                  </span>
                  <span className="font-bold text-terra-primary flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { MapPin, Users, Compass, Eye, ShieldCheck, Sparkles, Navigation, Layers } from 'lucide-react';

export default function InteractiveMap({ events = [], people = [], onSelectEvent, onSelectPerson }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activeItem, setActiveItem] = useState(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);

  // Map bounds normalized to Manipal region (latitude ~13.348 to 13.366, longitude ~74.786 to 74.800)
  const minLat = 13.346;
  const maxLat = 13.368;
  const minLng = 74.785;
  const maxLng = 74.802;

  // Convert GPS coordinates to percentage positions on the custom rendered map canvas
  const getCoordinatesPct = (lat, lng) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100; // inverted Y for screen coords
    return {
      left: `${Math.max(8, Math.min(92, x))}%`,
      top: `${Math.max(8, Math.min(90, y))}%`
    };
  };

  const filteredEvents = events.filter(e => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CULTURE') return e.category === 'culture';
    if (selectedFilter === 'LANGUAGES') return e.category === 'languages';
    if (selectedFilter === 'CRAFTS') return e.category === 'crafts';
    if (selectedFilter === 'MUSIC') return e.category === 'music';
    return true;
  });

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-blush-surface bg-[#F5EBE1] shadow-warm flex flex-col">
      
      {/* Map Control Header Bar */}
      <div className="p-4 sm:p-5 bg-cream-canvas/95 border-b border-blush-surface flex flex-wrap items-center justify-between gap-3 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-terra-primary text-xl">explore</span>
            <h3 className="font-serif text-lg font-bold text-cocoa-text">Living Cultural & Campus Map</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
              Manipal Hub
            </span>
          </div>
          <p className="text-xs text-cocoa-text/60 mt-0.5">
            Public events shown at exact venues • Individual members represented as privacy-safe halos
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Gatherings' },
            { id: 'LANGUAGES', label: '🗣️ Dialect Circles' },
            { id: 'CULTURE', label: '🎭 Heritage & Folk' },
            { id: 'CRAFTS', label: '🏺 Traditional Crafts' },
            { id: 'MUSIC', label: '🎵 Music & Jams' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedFilter === f.id
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'bg-blush-surface/50 hover:bg-blush-surface text-cocoa-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative w-full h-[520px] sm:h-[600px] overflow-hidden bg-[#ECE0D4] select-none">
        
        {/* Stylized SVG Map Topography & Campus River Canvas */}
        <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Swarna River curve on the west */}
          <path
            d="M 20 0 Q 80 180 50 320 T 120 600"
            fill="none"
            stroke="#C0D5D8"
            strokeWidth="32"
            strokeLinecap="round"
          />
          {/* Valley hills contour curves */}
          <path d="M 0 120 Q 250 80 500 160 T 1000 120" fill="none" stroke="#DFC4B2" strokeWidth="2" strokeDasharray="6,6" />
          <path d="M 0 280 Q 300 240 600 320 T 1200 260" fill="none" stroke="#DFC4B2" strokeWidth="2" strokeDasharray="6,6" />
          <path d="M 0 440 Q 350 400 700 480 T 1400 420" fill="none" stroke="#DFC4B2" strokeWidth="2" strokeDasharray="6,6" />
          
          {/* Campus Road Network */}
          <path d="M 250 0 L 320 220 L 480 340 L 700 600" fill="none" stroke="#D3B8A4" strokeWidth="6" strokeLinecap="round" />
          <path d="M 320 220 L 800 180" fill="none" stroke="#D3B8A4" strokeWidth="5" strokeLinecap="round" />
          <path d="M 480 340 L 150 480" fill="none" stroke="#D3B8A4" strokeWidth="4" strokeLinecap="round" />
        </svg>

        {/* Campus Landmark Labels */}
        <div className="absolute top-[8%] left-[12%] text-[11px] font-bold tracking-wider text-cocoa-text/50 pointer-events-none">
          SWARNA RIVER VALLEY
        </div>
        <div className="absolute top-[18%] left-[28%] text-xs font-serif font-bold text-cocoa-text/70 bg-cream-canvas/70 px-2 py-0.5 rounded border border-blush-surface/50 pointer-events-none">
          🌿 End Point Nature Reserve
        </div>
        <div className="absolute top-[48%] left-[45%] text-xs font-serif font-bold text-cocoa-text/70 bg-cream-canvas/70 px-2 py-0.5 rounded border border-blush-surface/50 pointer-events-none">
          🏛️ MIT Campus Quadrangle
        </div>
        <div className="absolute top-[68%] left-[32%] text-xs font-serif font-bold text-cocoa-text/70 bg-cream-canvas/70 px-2 py-0.5 rounded border border-blush-surface/50 pointer-events-none">
          🐅 Tiger Circle & KMC Greens
        </div>
        <div className="absolute top-[35%] right-[18%] text-xs font-serif font-bold text-cocoa-text/70 bg-cream-canvas/70 px-2 py-0.5 rounded border border-blush-surface/50 pointer-events-none">
          🏺 Heritage Village (Hastashilpa)
        </div>

        {/* 1. RENDER PRIVACY-SAFE COMMUNITY USER HALOS */}
        {people.map(p => {
          const coords = getCoordinatesPct(p.lat, p.lng);
          return (
            <div
              key={p.id}
              style={{ left: coords.left, top: coords.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              onClick={() => setActiveItem({ type: 'PERSON', data: p })}
            >
              {/* Fuzzy Belonging Circle (No exact GPS!) */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-terra-primary/15 border border-terra-primary/30 flex items-center justify-center animate-pulse group-hover:bg-terra-primary/25 transition-all">
                <div className="w-12 h-12 rounded-full bg-cream-canvas/90 shadow-md border-2 border-terra-primary/50 flex flex-col items-center justify-center p-1 group-hover:scale-110 transition-transform">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-[9px] font-bold text-terra-primary tracking-tighter mt-0.5">
                    {p.speaks?.[0] || 'Peer'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* 2. RENDER VERIFIED EVENT VENUE PINS */}
        {filteredEvents.map(evt => {
          const coords = getCoordinatesPct(evt.lat, evt.lng);
          const isSelected = activeItem?.data?.id === evt.id;
          return (
            <div
              key={evt.id}
              style={{ left: coords.left, top: coords.top }}
              className="absolute -translate-x-1/2 -translate-y-full cursor-pointer z-20 group"
              onClick={() => setActiveItem({ type: 'EVENT', data: evt })}
            >
              <div className={`relative flex flex-col items-center transition-all ${
                isSelected ? 'scale-125 z-30' : 'group-hover:scale-115'
              }`}>
                {/* Event Category Badge Pill */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cocoa-text text-cream-canvas shadow-md whitespace-nowrap mb-1">
                  {evt.categoryLabel.split(' ')[0]}
                </span>

                {/* Pin Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-cream-canvas shadow-lg border-2 border-cream-canvas ${
                  evt.category === 'languages' ? 'bg-[#996C04]' :
                  evt.category === 'crafts' ? 'bg-[#7A5500]' :
                  evt.category === 'music' ? 'bg-[#C56E50]' : 'bg-terra-primary'
                }`}>
                  <MapPin className="w-5 h-5 fill-cream-canvas/20" />
                </div>
                
                {/* Pin Stem */}
                <div className="w-1 h-2 bg-cocoa-text/70" />
              </div>
            </div>
          );
        })}

        {/* Selected Event / Person Flyout Popup Card */}
        {activeItem && (
          <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:w-96 z-40 bg-cream-canvas rounded-2xl p-4 sm:p-5 border-2 border-terra-primary/40 shadow-warm-hover animate-fadeIn">
            {activeItem.type === 'EVENT' ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-terra-primary/15 text-terra-primary">
                    {activeItem.data.categoryLabel}
                  </span>
                  <button
                    onClick={() => setActiveItem(null)}
                    className="text-cocoa-text/50 hover:text-cocoa-text text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                <h4 className="font-serif text-base font-bold text-cocoa-text mt-1.5 leading-snug">
                  {activeItem.data.title}
                </h4>

                <p className="text-xs text-cocoa-text/70 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-terra-primary">schedule</span>
                  <span>{activeItem.data.date}</span>
                </p>

                <p className="text-xs text-cocoa-text/70 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-terra-primary">location_on</span>
                  <span className="font-medium">{activeItem.data.venue}</span>
                </p>

                <div className="mt-3 pt-3 border-t border-blush-surface flex items-center justify-between">
                  <span className="text-[11px] text-cocoa-text/60 italic">
                    Source: {activeItem.data.sourceLabel}
                  </span>
                  <button
                    onClick={() => onSelectEvent(activeItem.data)}
                    className="px-3 py-1.5 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container transition-all shadow-sm"
                  >
                    View Details & RSVP
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ochre-accent/20 text-cocoa-text">
                    Community Member Circle
                  </span>
                  <button onClick={() => setActiveItem(null)} className="text-cocoa-text/50 hover:text-cocoa-text text-xs">✕</button>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <img src={activeItem.data.avatar} alt={activeItem.data.name} className="w-12 h-12 rounded-full object-cover border border-terra-primary/40" />
                  <div>
                    <h4 className="font-serif text-base font-bold text-cocoa-text">{activeItem.data.name}</h4>
                    <p className="text-xs text-cocoa-text/70">{activeItem.data.broadRegion}</p>
                  </div>
                </div>

                <div className="mt-2.5 bg-surface-container/60 p-2.5 rounded-xl border border-blush-surface text-xs text-cocoa-text">
                  <p className="font-semibold text-terra-primary">Speaks: {activeItem.data.speaks?.join(', ')}</p>
                  <p className="text-cocoa-text/80 mt-1">{activeItem.data.matchReason}</p>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onSelectPerson(activeItem.data)}
                    className="px-3 py-1.5 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container transition-all shadow-sm"
                  >
                    Connect with {activeItem.data.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privacy Notice Banner */}
        {showPrivacyNotice && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 bg-cream-canvas/90 backdrop-blur-sm p-2.5 rounded-xl border border-blush-surface shadow-sm flex items-center justify-between text-xs text-cocoa-text">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-terra-primary flex-shrink-0" />
              <span>
                <strong>Privacy by Design:</strong> Peer locations are fuzzed into general 500m circles. Exact dorm or home addresses are never published.
              </span>
            </div>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="text-cocoa-text/50 hover:text-cocoa-text ml-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-10 bg-cream-canvas/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-blush-surface text-[11px] text-cocoa-text space-y-1 shadow-sm hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-terra-primary" />
            <span>Public Event / Workshop Pin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-terra-primary/20 border border-terra-primary" />
            <span>Privacy-Safe Dialect Learner Halo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

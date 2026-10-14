import React, { useState, useMemo } from 'react';
import indiaData from '../data/indiaStatesData.json';
import { CULTURAL_ART_REGISTRY } from '../data/culturalArtRegistry';
import IllustratedPin, { PIN_CATEGORIES } from './IllustratedPin';
import { ZoomIn, ZoomOut, RotateCcw, Compass, MapPin, Sparkles, Layers, Eye } from 'lucide-react';

export default function InteractiveIndiaMap({
  events = [],
  selectedCategory = 'ALL',
  selectedStateId = null,
  onSelectState,
  onSelectEvent
}) {
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 920 });

  // Filter events based on active category
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchState = !selectedStateId || e.stateId === selectedStateId || e.state?.toLowerCase().replace(/\s+/g, '-') === selectedStateId;
      return matchCat && matchState;
    });
  }, [events, selectedCategory, selectedStateId]);

  // Handle State Click
  const handleStateClick = (state) => {
    const normId = state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (selectedStateId === normId) {
      // Toggle off / reset
      onSelectState(null);
      resetView();
    } else {
      onSelectState(normId, state.name);
      // Zoom camera smoothly into state bounding box
      if (state.bounds) {
        const [p0, p1] = state.bounds;
        const bW = Math.max(120, p1[0] - p0[0]);
        const bH = Math.max(120, p1[1] - p0[1]);
        const padding = 60;
        const targetW = bW + padding * 2;
        const targetH = bH + padding * 2;
        const targetX = Math.max(0, Math.min(800 - targetW, p0[0] - padding));
        const targetY = Math.max(0, Math.min(920 - targetH, p0[1] - padding));
        setViewBox({ x: targetX, y: targetY, w: targetW, h: targetH });
      }
    }
  };

  const resetView = () => {
    setViewBox({ x: 0, y: 0, w: 800, h: 920 });
    onSelectState(null);
  };

  const handleZoom = (delta) => {
    setViewBox(prev => {
      const factor = delta > 0 ? 0.8 : 1.25;
      const newW = Math.max(200, Math.min(800, prev.w * factor));
      const newH = Math.max(230, Math.min(920, prev.h * factor));
      const newX = Math.max(0, Math.min(800 - newW, prev.x + (prev.w - newW) / 2));
      const newY = Math.max(0, Math.min(920 - newH, prev.y + (prev.h - newH) / 2));
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-blush-surface shadow-warm parchment-canvas select-none">
      
      {/* Top Map Header & Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        
        {/* State/Atlas Status Banner */}
        <div className="bg-cream-canvas/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-blush-surface shadow-sm pointer-events-auto flex items-center gap-2.5">
          <span className="material-symbols-outlined text-terra-primary text-xl">travel_explore</span>
          <div>
            <h3 className="font-serif text-sm font-bold text-cocoa-text">
              {selectedStateId
                ? `${CULTURAL_ART_REGISTRY[selectedStateId]?.stateName || selectedStateId} Selected`
                : 'Cultural Atlas of India'}
            </h3>
            <p className="text-[11px] text-cocoa-text/70">
              {filteredEvents.length} living cultural gathering{filteredEvents.length !== 1 ? 's' : ''} shown
            </p>
          </div>
          {selectedStateId && (
            <button
              onClick={resetView}
              className="ml-2 px-2.5 py-1 rounded-full bg-terra-primary/10 hover:bg-terra-primary hover:text-cream-canvas text-terra-primary text-xs font-bold transition-all"
            >
              Reset to India
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-cream-canvas/95 backdrop-blur-md p-1.5 rounded-2xl border border-blush-surface shadow-sm pointer-events-auto">
          <button
            onClick={() => handleZoom(1)}
            aria-label="Zoom in"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-cocoa-text hover:bg-blush-surface/50 text-sm font-bold transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            aria-label="Zoom out"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-cocoa-text hover:bg-blush-surface/50 text-sm font-bold transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            aria-label="Reset map view"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-terra-primary hover:bg-blush-surface/50 text-sm font-bold transition-all"
            title="Reset to full India view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full h-[620px] sm:h-[750px] lg:h-[820px] overflow-hidden">
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-full transition-all duration-700 ease-out"
          style={{ transformOrigin: 'center center' }}
        >
          <defs>
            {/* Soft parchment paper gradient */}
            <radialGradient id="parchmentGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FAF4EA" />
              <stop offset="100%" stopColor="#F2E6D4" />
            </radialGradient>

            {/* Ocean waves pattern */}
            <pattern id="oceanWaves" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 Q 10 5, 20 10 T 40 10" fill="none" stroke="#D8C8B5" strokeWidth="0.75" opacity="0.6" />
            </pattern>

            {/* Drop shadow for raised states */}
            <filter id="stateElevation" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#5B332C" floodOpacity="0.12" />
            </filter>
            
            <filter id="stateSelectedGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#C56E50" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 1. Surrounding Ocean Waters Texture */}
          <rect x="0" y="0" width="800" height="920" fill="url(#parchmentGrad)" />
          <rect x="0" y="0" width="800" height="920" fill="url(#oceanWaves)" />

          {/* Ocean Calligraphy Labels */}
          <text x="70" y="620" fontFamily="Fraunces, Georgia, serif" fontSize="19" fontStyle="italic" fill="#8C7563" letterSpacing="3" opacity="0.65">
            ARABIAN SEA
          </text>
          <text x="590" y="640" fontFamily="Fraunces, Georgia, serif" fontSize="19" fontStyle="italic" fill="#8C7563" letterSpacing="3" opacity="0.65">
            BAY OF BENGAL
          </text>
          <text x="310" y="890" fontFamily="Fraunces, Georgia, serif" fontSize="16" fontStyle="italic" fill="#8C7563" letterSpacing="4" opacity="0.65">
            INDIAN OCEAN
          </text>

          {/* Vintage Merchant Ship Illustration in Bay of Bengal */}
          <g transform="translate(630, 720) scale(0.7)" opacity="0.55" pointerEvents="none">
            {/* Hull */}
            <path d="M 0 20 Q 25 35, 60 20 L 50 40 Q 25 45, 10 40 Z" fill="#8C7563" />
            {/* Masts & Sails */}
            <line x1="25" y1="20" x2="25" y2="-15" stroke="#5B332C" strokeWidth="1.5" />
            <path d="M 25 -10 Q 40 -5, 25 15 Z" fill="#E8DACB" stroke="#8C7563" strokeWidth="1" />
            <line x1="45" y1="20" x2="45" y2="-5" stroke="#5B332C" strokeWidth="1.5" />
            <path d="M 45 0 Q 55 5, 45 18 Z" fill="#E8DACB" stroke="#8C7563" strokeWidth="1" />
            {/* Water ripples */}
            <path d="M -10 42 Q 25 48, 70 42" fill="none" stroke="#8C7563" strokeWidth="1" strokeDasharray="3,3" />
          </g>

          {/* Traditional Fishing Boat in Arabian Sea */}
          <g transform="translate(85, 480) scale(0.6)" opacity="0.5" pointerEvents="none">
            <path d="M 0 10 Q 20 20, 45 10 L 38 22 Q 20 25, 8 22 Z" fill="#8C7563" />
            <line x1="20" y1="10" x2="20" y2="-10" stroke="#5B332C" strokeWidth="1.5" />
            <path d="M 20 -8 Q 32 0, 20 8 Z" fill="#E8DACB" stroke="#8C7563" strokeWidth="0.8" />
          </g>

          {/* Vintage Nautical 16-Point Compass Rose (South-East in Indian Ocean) */}
          <g transform="translate(680, 810) scale(0.75)" opacity="0.75" pointerEvents="none">
            {/* Outer rings */}
            <circle cx="0" cy="0" r="42" fill="none" stroke="#C56E50" strokeWidth="1" strokeDasharray="2,3" />
            <circle cx="0" cy="0" r="38" fill="none" stroke="#5B332C" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="34" fill="none" stroke="#8C7563" strokeWidth="0.75" />
            
            {/* Cardinal points */}
            {/* North (with fleur-de-lis tip) */}
            <polygon points="0,0 -7,-12 0,-34" fill="#C56E50" />
            <polygon points="0,0 7,-12 0,-34" fill="#E9CDB8" />
            {/* South */}
            <polygon points="0,0 -7,12 0,34" fill="#8C7563" />
            <polygon points="0,0 7,12 0,34" fill="#D6BEA8" />
            {/* East */}
            <polygon points="0,0 12,-7 34,0" fill="#C56E50" />
            <polygon points="0,0 12,7 34,0" fill="#E9CDB8" />
            {/* West */}
            <polygon points="0,0 -12,-7 -34,0" fill="#8C7563" />
            <polygon points="0,0 -12,7 -34,0" fill="#D6BEA8" />
            
            {/* Intermediate points */}
            <polygon points="0,0 -5,-5 -22,-22" fill="#5B332C" opacity="0.6" />
            <polygon points="0,0 5,-5 22,-22" fill="#5B332C" opacity="0.6" />
            <polygon points="0,0 -5,5 -22,22" fill="#5B332C" opacity="0.6" />
            <polygon points="0,0 5,5 22,22" fill="#5B332C" opacity="0.6" />

            <circle cx="0" cy="0" r="4" fill="#5B332C" />

            {/* Labels */}
            <text x="0" y="-40" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="11" fontWeight="bold" fill="#5B332C">N</text>
            <text x="0" y="50" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="10" fill="#8C7563">S</text>
            <text x="44" y="4" textAnchor="start" fontFamily="Fraunces, serif" fontSize="10" fill="#8C7563">E</text>
            <text x="-44" y="4" textAnchor="end" fontFamily="Fraunces, serif" fontSize="10" fill="#8C7563">W</text>
          </g>

          {/* 2. RENDER ACCURATE SELECTABLE STATE GEOMETRY */}
          <g id="india-states-group" filter="url(#stateElevation)">
            {indiaData.states.map(state => {
              const normId = state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const isSelected = selectedStateId === normId;
              const hasEvents = events.some(e => e.stateId === normId || e.state?.toLowerCase().replace(/\s+/g, '-') === normId);
              const reg = CULTURAL_ART_REGISTRY[normId];

              return (
                <path
                  key={state.id || normId}
                  d={state.path}
                  className={`india-state-path ${isSelected ? 'selected' : ''}`}
                  style={{
                    fill: isSelected
                      ? (reg?.accentColor ? `${reg.accentColor}33` : '#E5C2A8')
                      : hasEvents
                        ? '#F9F1E6'
                        : '#F3E9DD',
                    stroke: isSelected ? (reg?.accentColor || '#C56E50') : '#D1B9A2',
                    strokeWidth: isSelected ? 2.5 : 1.2
                  }}
                  onClick={() => handleStateClick(state)}
                  onMouseEnter={(e) => {
                    setHoveredState({
                      id: normId,
                      name: state.name,
                      registry: reg,
                      eventCount: events.filter(ev => ev.stateId === normId || ev.state?.toLowerCase().replace(/\s+/g, '-') === normId).length
                    });
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                />
              );
            })}
          </g>

          {/* 3. CULTURAL ART VIGNETTES OVER KEY STATES (Matching Reference Images!) */}
          <g id="cultural-art-vignettes" pointerEvents="none">
            
            {/* Karnataka: Yakshagana Crown & Veena (Image 2) */}
            <g transform="translate(210, 630) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#C56E50" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒÄ¡</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Karnataka
              </text>
            </g>

            {/* Kerala: Kathakali Face Art (Image 1 & 2) */}
            <g transform="translate(235, 735) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#2D5F3E" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒææ</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#2D5F3E">
                Kerala
              </text>
            </g>

            {/* Tamil Nadu: Bharatanatyam Classical Pose & Gopuram */}
            <g transform="translate(325, 680) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#A9332A" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒ¢ò</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Tamil Nadu
              </text>
            </g>

            {/* Maharashtra: Warli Tribal Circle Dance */}
            <g transform="translate(200, 510) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#E09F3E" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">Γ¡ò</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Maharashtra
              </text>
            </g>

            {/* Rajasthan: Kathputli Royal Puppet */}
            <g transform="translate(225, 335) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#D9A441" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒÄ¬</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Rajasthan
              </text>
            </g>

            {/* Gujarat: Raas Garba Dandiya */}
            <g transform="translate(150, 420) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#1A5B66" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">Γ£¿</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#1A5B66">
                Gujarat
              </text>
            </g>

            {/* West Bengal: Baul Ektara Singer */}
            <g transform="translate(505, 425) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#A9332A" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒ¬ò</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                West Bengal
              </text>
            </g>

            {/* Uttar Pradesh: Taj Mahal Mughal Arch & Kathak */}
            <g transform="translate(340, 330) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#6B2D5C" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒòî</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Uttar Pradesh
              </text>
            </g>

            {/* Odisha: Konark Sun Wheel */}
            <g transform="translate(445, 500) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#C56E50" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">Γÿ╕∩╕Å</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Odisha
              </text>
            </g>

            {/* Jammu & Kashmir: Kashmiri Santoor */}
            <g transform="translate(225, 140) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#1A5B66" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒÅö∩╕Å</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Kashmir
              </text>
            </g>

            {/* Punjab: Bhangra Dhol */}
            <g transform="translate(230, 235) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#E09F3E" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒÑü</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">
                Punjab
              </text>
            </g>

            {/* Madhya Pradesh: Gond Tribal Deer */}
            <g transform="translate(315, 455) scale(0.85)">
              <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#2D5F3E" strokeWidth="1.5" opacity="0.9" />
              <text x="20" y="25" textAnchor="middle" fontSize="17">≡ƒªî</text>
              <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#2D5F3E">
                Madhya Pradesh
              </text>
            </g>
          </g>

          {/* 4. RENDER ILLUSTRATED EVENT PINS */}
          <g id="event-pins-overlay">
            {filteredEvents.map(evt => {
              if (evt.mapX === undefined || evt.mapY === undefined) return null;
              const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;

              return (
                <g
                  key={evt.id}
                  transform={`translate(${evt.mapX}, ${evt.mapY})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(evt);
                  }}
                >
                  {/* Outer pulsating ring */}
                  <circle
                    cx="0"
                    cy="-14"
                    r="12"
                    fill={cat.color}
                    opacity="0.25"
                    className="animate-ping"
                  />

                  {/* Pin Body Badge */}
                  <circle
                    cx="0"
                    cy="-14"
                    r="10"
                    fill={cat.color}
                    stroke="#FCF7F0"
                    strokeWidth="2"
                    className="group-hover:scale-125 transition-transform origin-center"
                    filter="url(#stateElevation)"
                  />

                  {/* Icon Symbol */}
                  <text
                    x="0"
                    y="-10"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#FFFFFF"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {cat.symbol}
                  </text>

                  {/* Stem */}
                  <line
                    x1="0"
                    y1="-4"
                    x2="0"
                    y2="2"
                    stroke={cat.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="3" r="2" fill="#5B332C" opacity="0.6" />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hovered State Tooltip */}
        {hoveredState && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-cream-canvas/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-terra-primary/40 shadow-warm pointer-events-none flex items-center gap-3 animate-fadeIn">
            <span className="text-2xl">{hoveredState.registry?.artIllustration?.symbol || '≡ƒôì'}</span>
            <div>
              <h4 className="font-serif text-sm font-bold text-cocoa-text">
                {hoveredState.name}
              </h4>
              <p className="text-[11px] text-cocoa-text/75">
                {hoveredState.registry?.culturalTitle || 'Regional Living Heritage'} ┬╖{' '}
                <strong className="text-terra-primary">{hoveredState.eventCount} active gathering{hoveredState.eventCount !== 1 ? 's' : ''}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Floating Category Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-cream-canvas/95 backdrop-blur-md p-3 rounded-2xl border border-blush-surface shadow-sm hidden md:block max-w-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cocoa-text mb-2">
            <Layers className="w-3.5 h-3.5 text-terra-primary" />
            <span>Atlas Pin Motifs</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {Object.entries(PIN_CATEGORIES).slice(0, 6).map(([key, cat]) => (
              <div key={key} className="flex items-center gap-1.5 text-cocoa-text/80 truncate">
                <span>{cat.symbol}</span>
                <span className="truncate">{cat.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import indiaData from '../data/indiaStatesData.json';
import { CULTURAL_ART_REGISTRY } from '../data/culturalArtRegistry';
import { STATE_CENTROIDS, resolveEventCoords } from '../data/indiaGeoData';
import { PIN_CATEGORIES } from './IllustratedPin';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Sparkles, Layers, Eye, Map, Compass } from 'lucide-react';

export default function InteractiveIndiaMap({
  events = [],
  selectedCategory = 'ALL',
  selectedStateId = null,
  onSelectState,
  onSelectEvent
}) {
  // 'OSM' (real Leaflet + OpenStreetMap) or 'SVG' (handcrafted folk canvas)
  const [mapEngine, setMapEngine] = useState('OSM'); 
  const [osmTileStyle, setOsmTileStyle] = useState('VOYAGER'); // 'VOYAGER' (warm heritage) or 'STANDARD' (classic OSM)
  const [hoveredState, setHoveredState] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 920 });

  // Leaflet refs
  const leafletContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Filter events based on active category and state
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchState = !selectedStateId || e.stateId === selectedStateId || e.state?.toLowerCase().replace(/\s+/g, '-') === selectedStateId;
      return matchCat && matchState;
    });
  }, [events, selectedCategory, selectedStateId]);

  // ── Leaflet Initialization & Tile Management ───────────────────────────────
  useEffect(() => {
    if (mapEngine !== 'OSM' || !leafletContainerRef.current) return;

    // Clean up if already exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Determine initial center and zoom
    let initialCenter = [22.5, 79.5];
    let initialZoom = 5;

    if (selectedStateId && STATE_CENTROIDS[selectedStateId]) {
      const s = STATE_CENTROIDS[selectedStateId];
      initialCenter = [s.lat, s.lng];
      initialZoom = s.zoom;
    }

    // Initialize Leaflet map
    const map = L.map(leafletContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false, // custom zoom buttons on header
      attributionControl: true,
      maxBounds: [
        [4.0, 64.0],  // South-West
        [39.0, 100.0] // North-East
      ],
      maxBoundsViscosity: 0.8
    });

    // Tile URLs
    const tileUrl = osmTileStyle === 'VOYAGER'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = osmTileStyle === 'VOYAGER'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size after layout settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapEngine, osmTileStyle]);

  // ── Sync Active State with Leaflet Camera ───────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedStateId && STATE_CENTROIDS[selectedStateId]) {
      const s = STATE_CENTROIDS[selectedStateId];
      map.flyTo([s.lat, s.lng], s.zoom, { duration: 1.2 });
    } else if (!selectedStateId) {
      map.flyTo([22.5, 79.5], 5, { duration: 1.0 });
    }
  }, [selectedStateId]);

  // ── Render Leaflet Event Markers & Popups ───────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // 1. Cultural State Heritage Emblems
    Object.entries(CULTURAL_ART_REGISTRY).forEach(([stateId, reg]) => {
      const centroid = STATE_CENTROIDS[stateId];
      if (!centroid) return;

      const isSelected = selectedStateId === stateId;
      const emblemHtml = `
        <div class="group cursor-pointer flex flex-col items-center" style="transform: translate(-50%, -50%);">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border-2 transition-transform duration-300 ${
            isSelected
              ? 'bg-terra-primary text-cream-canvas border-cream-canvas scale-125 ring-4 ring-terra-primary/30'
              : 'bg-cream-canvas text-cocoa-text border-terra-primary/50 hover:scale-115'
          }">
            <span>${reg.artIllustration?.symbol || '🪷'}</span>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight whitespace-nowrap shadow-xs ${
            isSelected ? 'bg-terra-primary text-cream-canvas' : 'bg-cream-canvas/90 text-cocoa-text border border-blush-surface'
          }">
            ${reg.stateName}
          </span>
        </div>
      `;

      const icon = L.divIcon({
        html: emblemHtml,
        className: 'leaflet-state-emblem',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([centroid.lat, centroid.lng], { icon, zIndexOffset: 100 });
      marker.on('click', () => {
        onSelectState(stateId, reg.stateName);
      });
      markersGroup.addLayer(marker);
    });

    // 2. Cultural Gathering / Event Pins
    filteredEvents.forEach(evt => {
      const [lat, lng] = resolveEventCoords(evt);
      const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;

      const pinHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <div class="absolute -inset-1 rounded-full animate-ping opacity-30" style="background-color: ${cat.color};"></div>
          <div class="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-cream-canvas text-cream-canvas text-xs font-bold transition-transform group-hover:scale-125" style="background-color: ${cat.color};">
            <span>${cat.symbol}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: pinHtml,
        className: 'leaflet-event-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 200 });

      // Build popup content
      const popupHtml = `
        <div style="min-width: 210px; max-width: 260px; font-family: system-ui, sans-serif;">
          ${evt.image ? `<div style="height: 100px; width: 100%; overflow: hidden; border-radius: 1rem 1rem 0 0;"><img src="${evt.image}" alt="${evt.title}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
          <div style="padding: 0.85rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background-color: ${cat.color}15; color: ${cat.color}; font-size: 10px; font-weight: bold;">
              <span>${cat.symbol}</span>
              <span>${cat.label}</span>
            </div>
            <h4 style="font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #3b2d26; margin: 0.35rem 0 0.25rem; line-height: 1.3;">
              ${evt.title}
            </h4>
            <p style="font-size: 11px; color: #6e5548; margin: 0 0 0.5rem; line-height: 1.3;">
              📍 ${evt.venue || evt.city || 'Karnataka'}
              ${evt.date ? `<br />🗓️ ${evt.date}` : ''}
            </p>
            <button id="leaflet-btn-${evt.id}" style="width: 100%; background-color: #c56e50; color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 9999px; font-size: 11px; font-weight: bold; cursor: pointer;">
              Explore Gathering Details →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -12], closeButton: true });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`leaflet-btn-${evt.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onSelectEvent(evt);
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredEvents, selectedStateId, onSelectState, onSelectEvent]);

  // ── SVG Mode Helpers (Folk Canvas) ──────────────────────────────────────────
  const handleSvgStateClick = (state) => {
    const normId = state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (selectedStateId === normId) {
      onSelectState(null);
      resetView();
    } else {
      onSelectState(normId, state.name);
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
    onSelectState(null);
    if (mapEngine === 'OSM' && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.5, 79.5], 5, { duration: 1.0 });
    } else {
      setViewBox({ x: 0, y: 0, w: 800, h: 920 });
    }
  };

  const handleZoom = (delta) => {
    if (mapEngine === 'OSM' && mapInstanceRef.current) {
      if (delta > 0) mapInstanceRef.current.zoomIn();
      else mapInstanceRef.current.zoomOut();
    } else {
      setViewBox(prev => {
        const factor = delta > 0 ? 0.8 : 1.25;
        const newW = Math.max(200, Math.min(800, prev.w * factor));
        const newH = Math.max(230, Math.min(920, prev.h * factor));
        const newX = Math.max(0, Math.min(800 - newW, prev.x + (prev.w - newW) / 2));
        const newY = Math.max(0, Math.min(920 - newH, prev.y + (prev.h - newH) / 2));
        return { x: newX, y: newY, w: newW, h: newH };
      });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-blush-surface shadow-warm parchment-canvas select-none">
      
      {/* ── Top Map Header & Controls Bar ───────────────────────────────────── */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* State/Atlas Status Banner */}
        <div className="bg-cream-canvas/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-blush-surface shadow-sm pointer-events-auto flex items-center gap-2.5">
          <span className="material-symbols-outlined text-terra-primary text-xl">travel_explore</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif text-xs sm:text-sm font-bold text-cocoa-text">
                {selectedStateId
                  ? `${STATE_CENTROIDS[selectedStateId]?.name || selectedStateId} Atlas`
                  : 'Cultural Atlas of India'}
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-terra-primary/10 text-terra-primary">
                {mapEngine === 'OSM' ? 'OSM Live' : 'Folk Atlas'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-cocoa-text/70">
              {filteredEvents.length} living cultural gathering{filteredEvents.length !== 1 ? 's' : ''} mapped
            </p>
          </div>
          {selectedStateId && (
            <button
              onClick={resetView}
              className="ml-1 sm:ml-2 px-2.5 py-1 rounded-full bg-terra-primary/10 hover:bg-terra-primary hover:text-cream-canvas text-terra-primary text-[11px] font-bold transition-all"
            >
              Reset to India
            </button>
          )}
        </div>

        {/* Engine Switcher & Map Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Map Engine Toggle: OpenStreetMap (OSM) vs Folk SVG */}
          <div className="bg-cream-canvas/95 backdrop-blur-md p-1 rounded-2xl border border-blush-surface shadow-sm flex items-center">
            <button
              onClick={() => setMapEngine('OSM')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                mapEngine === 'OSM'
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'text-cocoa-text/75 hover:bg-blush-surface/50'
              }`}
              title="OpenStreetMap Live Tiles with interactive navigation"
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OSM Map</span>
            </button>
            <button
              onClick={() => setMapEngine('SVG')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                mapEngine === 'SVG'
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'text-cocoa-text/75 hover:bg-blush-surface/50'
              }`}
              title="Illustrated Folk Art Atlas Canvas"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Folk Atlas</span>
            </button>
          </div>

          {/* OSM Tile Style Switcher (only in OSM mode) */}
          {mapEngine === 'OSM' && (
            <button
              onClick={() => setOsmTileStyle(prev => prev === 'VOYAGER' ? 'STANDARD' : 'VOYAGER')}
              className="bg-cream-canvas/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-blush-surface shadow-sm text-xs font-bold text-cocoa-text hover:bg-blush-surface/40 transition-all flex items-center gap-1"
              title="Toggle OSM Carto Heritage vs OSM Standard"
            >
              <span>{osmTileStyle === 'VOYAGER' ? '🎨 Heritage OSM' : '🌍 Standard OSM'}</span>
            </button>
          )}

          {/* Zoom & Reset Controls */}
          <div className="flex items-center gap-1 bg-cream-canvas/95 backdrop-blur-md p-1 rounded-2xl border border-blush-surface shadow-sm">
            <button
              onClick={() => handleZoom(1)}
              aria-label="Zoom in"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-cocoa-text hover:bg-blush-surface/50 text-xs font-bold transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-1)}
              aria-label="Zoom out"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-cocoa-text hover:bg-blush-surface/50 text-xs font-bold transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              aria-label="Reset map view"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-terra-primary hover:bg-blush-surface/50 text-xs font-bold transition-all"
              title="Reset to full India view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Map Canvas: Leaflet (OSM) or Handcrafted SVG ──────────────── */}
      <div className="relative w-full h-[620px] sm:h-[750px] lg:h-[820px] overflow-hidden">
        
        {/* 1. Leaflet (OpenStreetMap) Canvas */}
        <div
          ref={leafletContainerRef}
          className={`w-full h-full transition-opacity duration-300 ${
            mapEngine === 'OSM' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10 absolute inset-0'
          }`}
        />

        {/* 2. Handcrafted SVG Folk Atlas Canvas */}
        {mapEngine === 'SVG' && (
          <svg
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            className="w-full h-full transition-all duration-700 ease-out"
            style={{ transformOrigin: 'center center' }}
          >
            <defs>
              <radialGradient id="parchmentGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FAF4EA" />
                <stop offset="100%" stopColor="#F2E6D4" />
              </radialGradient>
              <pattern id="oceanWaves" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 0 10 Q 10 5, 20 10 T 40 10" fill="none" stroke="#D8C8B5" strokeWidth="0.75" opacity="0.6" />
              </pattern>
              <filter id="stateElevation" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#5B332C" floodOpacity="0.12" />
              </filter>
            </defs>

            <rect x="0" y="0" width="800" height="920" fill="url(#parchmentGrad)" />
            <rect x="0" y="0" width="800" height="920" fill="url(#oceanWaves)" />

            <text x="70" y="620" fontFamily="Fraunces, Georgia, serif" fontSize="19" fontStyle="italic" fill="#8C7563" letterSpacing="3" opacity="0.65">
              ARABIAN SEA
            </text>
            <text x="590" y="640" fontFamily="Fraunces, Georgia, serif" fontSize="19" fontStyle="italic" fill="#8C7563" letterSpacing="3" opacity="0.65">
              BAY OF BENGAL
            </text>
            <text x="310" y="890" fontFamily="Fraunces, Georgia, serif" fontSize="16" fontStyle="italic" fill="#8C7563" letterSpacing="4" opacity="0.65">
              INDIAN OCEAN
            </text>

            {/* States Geo Paths */}
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
                    onClick={() => handleSvgStateClick(state)}
                    onMouseEnter={() => {
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

            {/* Cultural Vignettes on SVG */}
            <g id="cultural-art-vignettes" pointerEvents="none">
              <g transform="translate(210, 630) scale(0.85)">
                <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#C56E50" strokeWidth="1.5" opacity="0.9" />
                <text x="20" y="25" textAnchor="middle" fontSize="17">🎭</text>
                <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">Karnataka</text>
              </g>
              <g transform="translate(235, 735) scale(0.85)">
                <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#2D5F3E" strokeWidth="1.5" opacity="0.9" />
                <text x="20" y="25" textAnchor="middle" fontSize="17">👑</text>
                <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#2D5F3E">Kerala</text>
              </g>
              <g transform="translate(325, 680) scale(0.85)">
                <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#A9332A" strokeWidth="1.5" opacity="0.9" />
                <text x="20" y="25" textAnchor="middle" fontSize="17">🛕</text>
                <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">Tamil Nadu</text>
              </g>
              <g transform="translate(200, 510) scale(0.85)">
                <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#E09F3E" strokeWidth="1.5" opacity="0.9" />
                <text x="20" y="25" textAnchor="middle" fontSize="17">⭕</text>
                <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">Maharashtra</text>
              </g>
              <g transform="translate(225, 335) scale(0.85)">
                <circle cx="20" cy="20" r="16" fill="#FCF7F0" stroke="#D9A441" strokeWidth="1.5" opacity="0.9" />
                <text x="20" y="25" textAnchor="middle" fontSize="17">🎪</text>
                <text x="20" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="9" fontWeight="bold" fill="#5B332C">Rajasthan</text>
              </g>
            </g>

            {/* Event Pins on SVG */}
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
                    <circle cx="0" cy="-14" r="12" fill={cat.color} opacity="0.25" className="animate-ping" />
                    <circle cx="0" cy="-14" r="10" fill={cat.color} stroke="#FCF7F0" strokeWidth="2" className="group-hover:scale-125 transition-transform origin-center" />
                    <text x="0" y="-10" textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="bold" pointerEvents="none">
                      {cat.symbol}
                    </text>
                    <line x1="0" y1="-4" x2="0" y2="2" stroke={cat.color} strokeWidth="2" strokeLinecap="round" />
                    <circle cx="0" cy="3" r="2" fill="#5B332C" opacity="0.6" />
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Hovered State Tooltip (SVG mode) */}
        {mapEngine === 'SVG' && hoveredState && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-cream-canvas/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-terra-primary/40 shadow-warm pointer-events-none flex items-center gap-3 animate-fadeIn">
            <span className="text-2xl">{hoveredState.registry?.artIllustration?.symbol || '📍'}</span>
            <div>
              <h4 className="font-serif text-sm font-bold text-cocoa-text">
                {hoveredState.name}
              </h4>
              <p className="text-[11px] text-cocoa-text/75">
                {hoveredState.registry?.culturalTitle || 'Regional Living Heritage'} ·{' '}
                <strong className="text-terra-primary">{hoveredState.eventCount} active gathering{hoveredState.eventCount !== 1 ? 's' : ''}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Floating Category Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-cream-canvas/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-blush-surface shadow-sm hidden md:block max-w-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cocoa-text mb-1.5">
            <Layers className="w-3.5 h-3.5 text-terra-primary" />
            <span>Map Motifs ({mapEngine === 'OSM' ? 'OpenStreetMap Data' : 'Folk Atlas'})</span>
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

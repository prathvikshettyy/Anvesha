import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import indiaData from '../data/indiaStatesData.json';
import indiaBoundariesData from '../data/indiaStateBoundaries.json';
import { CULTURAL_ART_REGISTRY } from '../data/culturalArtRegistry';
import { STATE_CENTROIDS, resolveEventCoords } from '../data/indiaGeoData';
import { PIN_CATEGORIES } from './IllustratedPin';
import { ZoomIn, ZoomOut, RotateCcw, Map, Compass } from 'lucide-react';

export default function InteractiveIndiaMap({
  events = [],
  selectedCategory = 'ALL',
  selectedStateId = null,
  onSelectState,
  onSelectEvent
}) {
  // 'OSM' (real Leaflet + OpenStreetMap) or 'SVG' (handcrafted folk canvas)
  const [mapEngine, setMapEngine] = useState('OSM'); 
  // 'STANDARD' (OpenStreetMap official) or 'HOT' (Humanitarian OpenStreetMap) — 100% free, NO API key required!
  const [osmTileStyle, setOsmTileStyle] = useState('STANDARD'); 
  const [hoveredState, setHoveredState] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 920 });

  // Leaflet refs
  const leafletContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Helper to normalize state ids (handles aliases like nct-of-delhi -> delhi)
  const normalizeStateId = (id) => {
    if (!id) return '';
    const norm = id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    if (norm === 'nct-of-delhi') return 'delhi';
    return norm;
  };

  // Filter events based on active category and state
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchState = !selectedStateId || e.stateId === selectedStateId || e.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedStateId;
      return matchCat && matchState;
    });
  }, [events, selectedCategory, selectedStateId]);

  // Separate states into unselected and selected for proper SVG layer stacking (elevates selected state above others)
  const { unselectedStates, activeSelectedState } = useMemo(() => {
    let active = null;
    const unselected = [];
    indiaData.states.forEach(st => {
      const normId = st.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (selectedStateId && (st.id === selectedStateId || normId === selectedStateId)) {
        active = { ...st, normId };
      } else {
        unselected.push({ ...st, normId });
      }
    });
    return { unselectedStates: unselected, activeSelectedState: active };
  }, [selectedStateId]);

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
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [4.0, 64.0],  // South-West
        [39.0, 100.0] // North-East
      ],
      maxBoundsViscosity: 0.8
    });

    // Pure OpenStreetMap tiles (100% open-source, NO API KEY required!)
    const tileUrl = osmTileStyle === 'HOT'
      ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = osmTileStyle === 'HOT'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(map);

    // Interactive GeoJSON state boundary layer for real geographical borders
    const getFeatureStyle = (feature) => {
      const featureNormId = normalizeStateId(feature.id);
      const isSelected = selectedStateId && (featureNormId === selectedStateId || feature.id === selectedStateId);

      return {
        weight: isSelected ? 3.5 : 1.2,
        color: isSelected ? '#C56E50' : '#8C7563',
        opacity: isSelected ? 1 : 0.45,
        fillColor: isSelected ? '#C56E50' : '#D1B9A2',
        fillOpacity: isSelected ? 0.25 : 0.03,
        className: isSelected ? 'elevated-state-path' : 'india-state-boundary'
      };
    };

    geoJsonLayerRef.current = L.geoJSON(indiaBoundariesData, {
      style: getFeatureStyle,
      onEachFeature: (feature, layer) => {
        layer.on({
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            const featureNormId = normalizeStateId(feature.id);
            if (selectedStateId === featureNormId) {
              onSelectState(null);
              map.flyTo([22.5, 79.5], 5, { duration: 1.0 });
            } else {
              onSelectState(featureNormId, feature.properties.name);
              map.fitBounds(layer.getBounds(), { padding: [35, 35], maxZoom: 8, animate: true, duration: 1.0 });
            }
          },
          mouseover: () => {
            if (!selectedStateId) {
              const featureNormId = normalizeStateId(feature.id);
              setHoveredState({
                id: featureNormId,
                name: feature.properties.name,
                registry: CULTURAL_ART_REGISTRY[featureNormId],
                eventCount: events.filter(ev => ev.stateId === featureNormId || ev.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === featureNormId).length
              });
            }
          },
          mouseout: () => {
            setHoveredState(null);
          }
        });
      }
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

  // ── Sync Active State with Leaflet GeoJSON Boundaries (Protruding Border) ───
  useEffect(() => {
    if (!mapInstanceRef.current || !geoJsonLayerRef.current) return;
    const map = mapInstanceRef.current;
    const geoLayer = geoJsonLayerRef.current;

    let selectedLayerBounds = null;

    geoLayer.eachLayer(layer => {
      const feature = layer.feature;
      const featureNormId = normalizeStateId(feature.id);
      const isSelected = selectedStateId && (featureNormId === selectedStateId || feature.id === selectedStateId);

      layer.setStyle({
        weight: isSelected ? 3.5 : 1.2,
        color: isSelected ? '#C56E50' : '#8C7563',
        opacity: isSelected ? 1 : 0.45,
        fillColor: isSelected ? '#C56E50' : '#D1B9A2',
        fillOpacity: isSelected ? 0.25 : 0.03,
        className: isSelected ? 'elevated-state-path' : 'india-state-boundary'
      });

      if (isSelected) {
        layer.bringToFront();
        selectedLayerBounds = layer.getBounds();
      }
    });

    if (selectedLayerBounds) {
      map.fitBounds(selectedLayerBounds, { padding: [35, 35], maxZoom: 8, animate: true, duration: 1.0 });
    } else if (!selectedStateId) {
      map.flyTo([22.5, 79.5], 5, { duration: 1.0 });
    }
  }, [selectedStateId]);

  // ── Render Leaflet Event Markers & Popups (Results in Form of Pins) ────────
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // Group events by location anchor to avoid overlapping collisions
    const locationGroups = {};
    filteredEvents.forEach(evt => {
      const baseKey = (evt.city || evt.neighborhood || evt.stateId || evt.state || 'default').toLowerCase().trim();
      if (!locationGroups[baseKey]) locationGroups[baseKey] = [];
      locationGroups[baseKey].push(evt);
    });

    let firstMarker = null;

    Object.values(locationGroups).forEach(group => {
      group.forEach((evt, idx) => {
        const [lat, lng] = resolveEventCoords(evt, idx, group.length);
        const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;
        const isSelectedState = selectedStateId && (evt.stateId === selectedStateId || evt.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedStateId);

        const pinHtml = `
          <div class="relative group cursor-pointer ${isSelectedState ? 'pin-drop-bounce' : ''}" style="transform: translate(-50%, -50%);">
            <div class="absolute -inset-1.5 rounded-full animate-ping opacity-40" style="background-color: ${cat.color};"></div>
            <div class="relative ${isSelectedState ? 'w-9 h-9' : 'w-8 h-8'} rounded-full flex items-center justify-center shadow-xl border-2 border-cream-canvas text-cream-canvas text-xs font-bold transition-transform group-hover:scale-125" style="background-color: ${cat.color};">
              <span>${cat.symbol}</span>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 ${isSelectedState ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'} transition-opacity bg-cocoa-text text-cream-canvas text-[9px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none z-50">
              ${evt.title.length > 20 ? `${evt.title.slice(0, 19)}…` : evt.title}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: pinHtml,
          className: 'leaflet-event-pin',
          iconSize: isSelectedState ? [36, 36] : [32, 32],
          iconAnchor: isSelectedState ? [18, 18] : [16, 16]
        });

        const marker = L.marker([lat, lng], {
          icon,
          zIndexOffset: isSelectedState ? 1500 : 200
        });

        // Build popup content
        const popupHtml = `
          <div style="min-width: 220px; max-width: 270px; font-family: system-ui, sans-serif;">
            ${evt.image ? `<div style="height: 105px; width: 100%; overflow: hidden; border-radius: 1rem 1rem 0 0;"><img src="${evt.image}" alt="${evt.title}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
            <div style="padding: 0.85rem;">
              <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background-color: ${cat.color}18; color: ${cat.color}; font-size: 10px; font-weight: bold;">
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
              <button id="leaflet-btn-${evt.id}" style="width: 100%; background-color: #c56e50; color: white; border: none; padding: 0.45rem 0.75rem; border-radius: 9999px; font-size: 11px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(197, 110, 80, 0.3);">
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

        if (!firstMarker && isSelectedState) {
          firstMarker = marker;
        }
      });
    });

    // When a state is selected, automatically open popup of primary pin after flyTo settles
    if (firstMarker && selectedStateId) {
      const timer = setTimeout(() => {
        firstMarker.openPopup();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [filteredEvents, selectedStateId, onSelectEvent]);

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
                  ? `${STATE_CENTROIDS[selectedStateId]?.name || selectedStateId}`
                  : 'Cultural Atlas of India'}
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-terra-primary/10 text-terra-primary">
                {mapEngine === 'OSM' ? (osmTileStyle === 'HOT' ? 'OSM Vibrant' : 'OpenStreetMap') : 'Folk Atlas'}
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
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          
          {/* State Quick-Fly Selector Dropdown */}
          <select
            value={selectedStateId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) resetView();
              else onSelectState(val, STATE_CENTROIDS[val]?.name || val);
            }}
            className="bg-cream-canvas/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-blush-surface text-xs font-bold text-cocoa-text focus:outline-none focus:ring-1 focus:ring-terra-primary shadow-sm"
          >
            <option value="">Focus State (All India)</option>
            {Object.entries(STATE_CENTROIDS).map(([key, s]) => (
              <option key={key} value={key}>{s.name}</option>
            ))}
          </select>

          {/* Map Engine Toggle: OpenStreetMap (OSM) vs Folk SVG */}
          <div className="bg-cream-canvas/95 backdrop-blur-md p-1 rounded-2xl border border-blush-surface shadow-sm flex items-center">
            <button
              onClick={() => setMapEngine('OSM')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                mapEngine === 'OSM'
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'text-cocoa-text/75 hover:bg-blush-surface/50'
              }`}
              title="OpenStreetMap Live Tiles"
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
              <span className="hidden sm:inline">Folk Canvas</span>
            </button>
          </div>

          {/* OSM Style Toggle (Standard vs HOT) */}
          {mapEngine === 'OSM' && (
            <button
              onClick={() => setOsmTileStyle(prev => prev === 'HOT' ? 'STANDARD' : 'HOT')}
              className="bg-cream-canvas/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-blush-surface shadow-sm text-xs font-bold text-cocoa-text hover:bg-blush-surface/40 transition-all flex items-center gap-1"
              title="Toggle OSM Style"
            >
              <span>{osmTileStyle === 'HOT' ? 'OSM Vibrant' : 'OSM Classic'}</span>
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
        
        {/* 1. Leaflet (OpenStreetMap) Canvas with Interactive State Boundaries */}
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
              
              {/* Standard Elevation Shadow */}
              <filter id="stateElevation" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#5B332C" floodOpacity="0.12" />
              </filter>

              {/* Elevated Selected State Dual Glow and Deep Shadow Filter */}
              <filter id="stateElevationGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#3B231D" floodOpacity="0.45" />
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#C56E50" floodOpacity="0.38" />
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

            {/* Base Group: Unselected States (Softened when a state is active) */}
            <g id="india-states-group" filter="url(#stateElevation)" opacity={selectedStateId ? 0.72 : 1} className="transition-opacity duration-500">
              {unselectedStates.map(state => {
                const normId = state.normId;
                const hasEvents = events.some(e => e.stateId === normId || e.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normId);
                const reg = CULTURAL_ART_REGISTRY[normId];

                return (
                  <path
                    key={state.id || normId}
                    d={state.path}
                    className="india-state-path"
                    style={{
                      fill: hasEvents ? '#F9F1E6' : '#F3E9DD',
                      stroke: '#D1B9A2',
                      strokeWidth: 1.2
                    }}
                    onClick={() => handleSvgStateClick(state)}
                    onMouseEnter={() => {
                      setHoveredState({
                        id: normId,
                        name: state.name,
                        registry: reg,
                        eventCount: events.filter(ev => ev.stateId === normId || ev.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normId).length
                      });
                    }}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                );
              })}
            </g>

            {/* Elevated Layer: Active Selected State rendered strictly ON TOP of all others */}
            {activeSelectedState && (
              <g id="elevated-selected-state" className="transition-all duration-500">
                {/* Glow Shadow Underlay */}
                <path
                  d={activeSelectedState.path}
                  fill="none"
                  stroke={CULTURAL_ART_REGISTRY[activeSelectedState.normId]?.accentColor || '#C56E50'}
                  strokeWidth="7"
                  opacity="0.35"
                  filter="url(#stateElevationGlow)"
                />
                {/* Elevated State Path */}
                <path
                  d={activeSelectedState.path}
                  className="india-state-path selected elevated-state-path"
                  style={{
                    fill: CULTURAL_ART_REGISTRY[activeSelectedState.normId]?.accentColor
                      ? `${CULTURAL_ART_REGISTRY[activeSelectedState.normId].accentColor}38`
                      : '#FBD4BE',
                    stroke: CULTURAL_ART_REGISTRY[activeSelectedState.normId]?.accentColor || '#C56E50',
                    strokeWidth: 3.5
                  }}
                  onClick={() => handleSvgStateClick(activeSelectedState)}
                  onMouseEnter={() => {
                    setHoveredState({
                      id: activeSelectedState.normId,
                      name: activeSelectedState.name,
                      registry: CULTURAL_ART_REGISTRY[activeSelectedState.normId],
                      eventCount: events.filter(ev => ev.stateId === activeSelectedState.normId || ev.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeSelectedState.normId).length
                    });
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                />
              </g>
            )}

            {/* Event Pins on SVG */}
            <g id="event-pins-overlay">
              {filteredEvents.map(evt => {
                if (evt.mapX === undefined || evt.mapY === undefined) return null;
                const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;
                const isSelectedState = selectedStateId && (evt.stateId === selectedStateId || evt.state?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedStateId);

                return (
                  <g
                    key={evt.id}
                    transform={`translate(${evt.mapX}, ${evt.mapY})`}
                    className={`cursor-pointer group ${isSelectedState ? 'pin-drop-bounce' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt);
                    }}
                  >
                    <circle cx="0" cy="-15" r="14" fill={cat.color} opacity="0.3" className="animate-ping" />
                    <circle
                      cx="0"
                      cy="-15"
                      r={isSelectedState ? 12 : 10}
                      fill={cat.color}
                      stroke="#FCF7F0"
                      strokeWidth="2.5"
                      className="group-hover:scale-125 transition-transform origin-center shadow-lg"
                    />
                    <text x="0" y="-11" textAnchor="middle" fontSize={isSelectedState ? 11 : 10} fill="#FFFFFF" fontWeight="bold" pointerEvents="none">
                      {cat.symbol}
                    </text>
                    <line x1="0" y1="-3" x2="0" y2="3" stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="0" cy="4" r="2.5" fill="#5B332C" opacity="0.7" />

                    {/* Pin Label Chip */}
                    {isSelectedState && (
                      <g transform="translate(0, 16)" className="pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                        <rect x="-45" y="-6" width="90" height="15" rx="4" fill="#3B2D26" />
                        <text x="0" y="4" textAnchor="middle" fontSize="8" fill="#FAF4EA" fontWeight="bold">
                          {evt.title.length > 15 ? `${evt.title.slice(0, 14)}…` : evt.title}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Floating State Gathering Results Ribbon (Both Modes) */}
        {selectedStateId && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 z-30 bg-cream-canvas/95 backdrop-blur-md p-3 rounded-2xl border-2 border-terra-primary/30 shadow-warm flex flex-wrap items-center justify-between gap-3 animate-hero-fade">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-cocoa-text">
                    {STATE_CENTROIDS[selectedStateId]?.name || selectedStateId}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
                    {filteredEvents.length} Gathering Pin{filteredEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-cocoa-text/75 line-clamp-1">
                  {CULTURAL_ART_REGISTRY[selectedStateId]?.culturalTitle || 'Living Regional Cultural Heritage'}
                </p>
              </div>
            </div>

            {/* Quick Event Pills for this State */}
            {filteredEvents.length > 0 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-md py-0.5 scrollbar-none no-scrollbar">
                {filteredEvents.map(evt => {
                  const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        onSelectEvent(evt);
                        if (mapEngine === 'OSM' && mapInstanceRef.current) {
                          const [lat, lng] = resolveEventCoords(evt);
                          mapInstanceRef.current.flyTo([lat, lng], 10, { duration: 0.8 });
                        }
                      }}
                      className="px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-terra-primary/15 border border-blush-surface text-cocoa-text text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      <span>{cat.symbol}</span>
                      <span className="max-w-[110px] truncate">{evt.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-cocoa-text/70 italic">
                No gatherings scheduled yet in this state · Be the first to host one!
              </div>
            )}

            <button
              onClick={resetView}
              className="px-3 py-1 rounded-full bg-blush-surface/60 hover:bg-terra-primary hover:text-cream-canvas text-cocoa-text text-xs font-bold transition-all ml-auto cursor-pointer"
            >
              Show All India
            </button>
          </div>
        )}

        {/* Hovered State Tooltip (when exploring with no state selected) */}
        {hoveredState && !selectedStateId && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-cream-canvas/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-terra-primary/30 shadow-warm pointer-events-none flex items-center gap-2.5 animate-fadeIn">
            <div>
              <h4 className="font-serif text-xs sm:text-sm font-bold text-cocoa-text">
                {hoveredState.name}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-cocoa-text/75">
                {hoveredState.eventCount} living gathering{hoveredState.eventCount !== 1 ? 's' : ''} mapped
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

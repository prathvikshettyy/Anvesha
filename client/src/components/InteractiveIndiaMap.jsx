import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import indiaBoundariesData from '../data/indiaStateBoundaries.json';
import { CULTURAL_ART_REGISTRY } from '../data/culturalArtRegistry';
import { STATE_CENTROIDS, resolveEventCoords, matchesEventState } from '../data/indiaGeoData';
import { PIN_CATEGORIES } from './IllustratedPin';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function InteractiveIndiaMap({
  events = [],
  selectedCategory = 'ALL',
  selectedStateId = null,
  onSelectState,
  onSelectEvent
}) {
  // Always use OSM Vibrant (HOT humanitarian tiles)
  const [hoveredState, setHoveredState] = useState(null);

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

  // Events filtered by active category
  const categoryEvents = useMemo(() => {
    return events.filter(e => {
      return selectedCategory === 'ALL' || e.category === selectedCategory;
    });
  }, [events, selectedCategory]);

  // Specific events matching the selected state
  const stateEvents = useMemo(() => {
    if (!selectedStateId) return categoryEvents;
    return categoryEvents.filter(e => matchesEventState(e, selectedStateId));
  }, [categoryEvents, selectedStateId]);


  // ── Leaflet Initialization & Tile Management ───────────────────────────────
  useEffect(() => {
    if (!leafletContainerRef.current) return;

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

    // OSM Vibrant (HOT humanitarian tiles) — 100% open-source, NO API KEY required!
    const tileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>';

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
  }, []);

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

    // Group events ONLY if they share the exact same geographic coordinate
    const coordGroups = {};
    categoryEvents.forEach(evt => {
      const [baseLat, baseLng] = resolveEventCoords(evt, 0, 1);
      const key = `${baseLat.toFixed(3)},${baseLng.toFixed(3)}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(evt);
    });

    let firstActiveMarker = null;

    Object.values(coordGroups).forEach(group => {
      group.forEach((evt, idx) => {
        const [lat, lng] = resolveEventCoords(evt, idx, group.length);
        const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;
        const isSelectedState = selectedStateId ? matchesEventState(evt, selectedStateId) : false;
        const isDimmed = Boolean(selectedStateId && !isSelectedState);

        const pinHtml = `
          <div class="relative group cursor-pointer ${isSelectedState ? 'pin-drop-bounce' : ''}" style="transform: translate(-50%, -50%); opacity: ${isDimmed ? 0.6 : 1.0}; transition: all 0.25s ease;">
            <div class="absolute -inset-1.5 rounded-full ${isSelectedState ? 'animate-ping' : ''} opacity-40" style="background-color: ${cat.color};"></div>
            <div class="relative ${isSelectedState ? 'w-10 h-10 ring-4 ring-terra-primary/40' : (isDimmed ? 'w-7 h-7' : 'w-8 h-8')} rounded-full flex items-center justify-center shadow-xl border-2 border-cream-canvas text-cream-canvas text-xs font-bold transition-transform group-hover:scale-125" style="background-color: ${cat.color};">
              <span>${cat.symbol}</span>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 ${isSelectedState ? 'opacity-95' : 'opacity-0 group-hover:opacity-100'} transition-opacity bg-cocoa-text text-cream-canvas text-[9px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none z-50">
              ${evt.title.length > 20 ? `${evt.title.slice(0, 19)}…` : evt.title}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: pinHtml,
          className: 'leaflet-event-pin',
          iconSize: isSelectedState ? [40, 40] : (isDimmed ? [28, 28] : [32, 32]),
          iconAnchor: isSelectedState ? [20, 20] : (isDimmed ? [14, 14] : [16, 16])
        });

        const marker = L.marker([lat, lng], {
          icon,
          zIndexOffset: isSelectedState ? 1500 : (isDimmed ? 100 : 300)
        });

        // Build popup content
        const mapImg = getEventImage(evt);
        const mapFallback = getCategorySvgPlaceholder(evt?.category);
        const popupHtml = `
          <div style="min-width: 220px; max-width: 270px; font-family: system-ui, sans-serif;">
            <div style="height: 105px; width: 100%; overflow: hidden; border-radius: 1rem 1rem 0 0;">
              <img src="${mapImg}" alt="${evt.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='${mapFallback}';" />
            </div>
            <div style="padding: 0.85rem;">
              <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background-color: ${cat.color}18; color: ${cat.color}; font-size: 10px; font-weight: bold;">
                <span>${cat.symbol}</span>
                <span>${cat.label}</span>
              </div>
              <h4 style="font-family: Georgia, serif; font-size: 13px; font-weight: bold; color: #3b2d26; margin: 0.35rem 0 0.25rem; line-height: 1.3;">
                ${evt.title}
              </h4>
              <p style="font-size: 11px; color: #6e5548; margin: 0 0 0.5rem; line-height: 1.3;">
                📍 ${evt.venue || evt.city || 'Heritage Center'}
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

        if (!firstActiveMarker && isSelectedState) {
          firstActiveMarker = marker;
        }
      });
    });

    // When a state is selected, automatically open popup of primary pin after flyTo settles
    if (firstActiveMarker && selectedStateId) {
      const timer = setTimeout(() => {
        firstActiveMarker.openPopup();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [categoryEvents, selectedStateId, onSelectEvent]);

  const resetView = () => {
    onSelectState(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.5, 79.5], 5, { duration: 1.0 });
    }
  };

  const handleZoom = (delta) => {
    if (mapInstanceRef.current) {
      if (delta > 0) mapInstanceRef.current.zoomIn();
      else mapInstanceRef.current.zoomOut();
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
            </div>
            <p className="text-[10px] sm:text-[11px] text-cocoa-text/70">
              {selectedStateId
                ? `${stateEvents.length} living cultural gathering${stateEvents.length !== 1 ? 's' : ''} mapped in ${STATE_CENTROIDS[selectedStateId]?.name || selectedStateId}`
                : `${categoryEvents.length} living cultural gathering${categoryEvents.length !== 1 ? 's' : ''} mapped across India`}
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

        {/* Map Controls */}
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

      {/* ── Main Map Canvas: Leaflet OSM Vibrant ──────────────── */}
      <div className="relative w-full h-[620px] sm:h-[750px] lg:h-[820px] overflow-hidden">

        {/* Leaflet (OpenStreetMap Vibrant) Canvas with Interactive State Boundaries */}
        <div
          ref={leafletContainerRef}
          className="w-full h-full"
        />


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
                    {stateEvents.length} Gathering Pin{stateEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-cocoa-text/75 line-clamp-1">
                  {CULTURAL_ART_REGISTRY[selectedStateId]?.culturalTitle || 'Living Regional Cultural Heritage'}
                </p>
              </div>
            </div>

            {/* Quick Event Pills for this State */}
            {stateEvents.length > 0 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-md py-0.5 scrollbar-none no-scrollbar">
                {stateEvents.map(evt => {
                  const cat = PIN_CATEGORIES[evt.category] || PIN_CATEGORIES.culture;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        onSelectEvent(evt);
                        if (mapInstanceRef.current) {
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

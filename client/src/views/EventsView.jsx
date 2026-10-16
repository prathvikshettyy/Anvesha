import React, { useState, useMemo, useEffect } from 'react';
import { Search, Map, LayoutGrid, PlusCircle, Bookmark, RotateCcw, Sparkles, CalendarX2, Compass, Utensils, Landmark } from 'lucide-react';
import EventCard from '../components/EventCard';
import InteractiveIndiaMap from '../components/InteractiveIndiaMap';
import StateDetailPanel from '../components/StateDetailPanel';
import { PIN_CATEGORIES } from '../components/IllustratedPin';
import { dedupeEvents, CATEGORY_MAP } from './HomeView';
import { matchesEventState } from '../data/indiaGeoData';
import * as api from '../services/api';
import FoodDiscoveryView from './FoodDiscoveryView';
import { AdSlot } from '../components/SponsoredCard';

export default function EventsView({
  user,
  events,
  people,
  savedEvents,
  onToggleSave,
  onSelectEvent,
  onSelectPerson,
  onOpenSubmitModal,
  onNavigateFood,
  onNavigate
}) {
  const [viewMode, setViewMode] = useState('MAP'); // 'MAP' or 'GRID'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlySaved, setOnlySaved] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedStateName, setSelectedStateName] = useState(null);
  const [apiEvents, setApiEvents] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const userInterests = user?.interests || [];

  // Debounced API search on searchQuery + selectedCategory
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await api.events.list({
          q: searchQuery,
          category: selectedCategory === 'MY_ROOTS' ? 'ALL' : selectedCategory
        });
        if (Array.isArray(res)) {
          setApiEvents(res);
        }
      } catch (err) {
        console.warn('Failed to fetch events from API, using local events:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const categories = [
    { id: 'ALL', label: 'All Heritage', symbol: '🇮🇳' },
    ...(userInterests.length > 0 ? [{ id: 'MY_ROOTS', label: '🎯 For Your Roots', symbol: '✨' }] : []),
    { id: 'culture', label: 'Culture & Heritage', symbol: '🪷' },
    { id: 'languages', label: 'Dialects & Languages', symbol: '🗣️' },
    { id: 'food', label: 'Culinary Heritage', symbol: '🥘' },
    { id: 'music', label: 'Folk & Classical Music', symbol: '🪕' },
    { id: 'art', label: 'Art & Traditional Crafts', symbol: '🎨' },
    { id: 'festivals', label: 'Festivals & Utsavs', symbol: '✨' },
    { id: 'technology', label: 'Tech & Hackathons', symbol: '⚡' },
    { id: 'film', label: 'Film & Theatre', symbol: '🎭' },
    { id: 'literature', label: 'Literature & Stories', symbol: '📜' },
    { id: 'workshops', label: 'Hands-on Workshops', symbol: '💡' },
    { id: 'community', label: 'Community Circles', symbol: '🤝' }
  ];

  // Merge local initial events + backend API events safely so no events are lost
  const allSourceEvents = useMemo(() => {
    const list = [...(events || [])];
    if (Array.isArray(apiEvents) && apiEvents.length > 0) {
      list.push(...apiEvents);
    }
    return dedupeEvents(list);
  }, [events, apiEvents]);

  // Events filtered by category, search and saved (used by Map across India so pins don't disappear!)
  const mapEvents = useMemo(() => {
    return allSourceEvents.filter(evt => {
      // Category filter with alias mapping support
      let matchesCategory = true;
      if (selectedCategory === 'ALL') {
        matchesCategory = true;
      } else if (selectedCategory === 'MY_ROOTS') {
        const accepted = new Set(userInterests.flatMap(i => CATEGORY_MAP[i] || [i]));
        matchesCategory = accepted.has(evt.category);
      } else {
        const accepted = new Set(CATEGORY_MAP[selectedCategory] || [selectedCategory]);
        matchesCategory = accepted.has(evt.category);
      }

      // Saved filter
      const matchesSaved = !onlySaved || savedEvents.includes(evt.id);

      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (evt.title ?? '').toLowerCase().includes(q) ||
        (evt.description ?? '').toLowerCase().includes(q) ||
        (evt.venue ?? '').toLowerCase().includes(q) ||
        (evt.organizer ?? '').toLowerCase().includes(q) ||
        (evt.state && evt.state.toLowerCase().includes(q)) ||
        (evt.city && evt.city.toLowerCase().includes(q))
      );

      return matchesCategory && matchesSaved && matchesSearch;
    });
  }, [allSourceEvents, selectedCategory, userInterests, onlySaved, searchQuery, savedEvents]);

  // Events filtered including active state (for StateDetailPanel and Grid View)
  const filteredEvents = useMemo(() => {
    return mapEvents.filter(evt => {
      if (!selectedStateId) return true;
      return matchesEventState(evt, selectedStateId);
    });
  }, [mapEvents, selectedStateId]);

  // All deduplicated events across categories for computing alternative suggestions
  const allUniqueEvents = useMemo(() => allSourceEvents, [allSourceEvents]);

  const availableCategoriesWithEvents = useMemo(() => {
    const counts = {};
    allUniqueEvents.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return categories
      .filter(c => c.id !== 'ALL' && c.id !== 'MY_ROOTS' && (counts[c.id] || 0) > 0 && c.id !== selectedCategory)
      .map(c => ({ ...c, count: counts[c.id] || 0 }));
  }, [allUniqueEvents, categories, selectedCategory]);

  const handleSelectState = (stateId, stateName) => {
    setSelectedStateId(stateId);
    setSelectedStateName(stateName);
  };

  const handleClearState = () => {
    setSelectedStateId(null);
    setSelectedStateName(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">

      {/* Top Banner and Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blush-surface/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terra-primary/10 border border-terra-primary/20 text-terra-primary text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-sm">explore</span>
            <span>Interactive Living Atlas of India</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
            Cultural Atlas and Gatherings
          </h1>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-1 font-medium">
            Explore 35 states and union territories. Discover living folk traditions, indigenous craft circles, and student-led cultural gatherings.
          </p>
        </div>

        {/* View Mode & Submit CTA */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Saved Filter Toggle */}
          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${onlySaved
                ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                : 'bg-surface-container-lowest border-blush-surface text-cocoa-text hover:bg-blush-surface/40'
              }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-cream-canvas' : ''}`} />
            <span>Saved ({savedEvents.length})</span>
          </button>

          {/* Standalone Taste Local Flavours Button */}
          <button
            onClick={() => setViewMode(prev => prev === 'FOOD' ? 'MAP' : 'FOOD')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border shadow-xs cursor-pointer ${viewMode === 'FOOD'
                ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-sm'
                : 'bg-surface-container-lowest border-blush-surface text-cocoa-text hover:bg-blush-surface/40 hover:text-terra-primary'
              }`}
          >
            <Utensils className={`w-3.5 h-3.5 ${viewMode === 'FOOD' ? 'text-cream-canvas' : 'text-ochre-accent'}`} />
            <span>Taste Local Flavours</span>
          </button>

          {/* Toggle between Map and Grid View */}
          <div className="bg-surface-container p-1 rounded-full border border-blush-surface flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${viewMode === 'MAP'
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'text-cocoa-text hover:bg-blush-surface/50'
                }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Atlas Map</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${viewMode === 'GRID'
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'text-cocoa-text hover:bg-blush-surface/50'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Submit Event Button */}
          <button
            onClick={onOpenSubmitModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container shadow-warm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Gathering</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (for Map & Grid views) */}
      {viewMode !== 'FOOD' && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-cocoa-text/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by state, tradition, instrument, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-full border border-blush-surface bg-surface-container-lowest text-xs sm:text-sm text-cocoa-text placeholder-cocoa-text/50 focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
            {isLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <span className="w-3.5 h-3.5 border-2 border-terra-primary border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            )}
          </div>

          {/* Category Scrollable Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat.id
                    ? 'bg-terra-primary text-cream-canvas shadow-sm'
                    : 'bg-surface-container-lowest hover:bg-blush-surface/40 text-cocoa-text border border-blush-surface'
                  }`}
              >
                <span>{cat.symbol}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active State / Filter Toast Notice if State Selected */}
      {selectedStateId && viewMode !== 'FOOD' && (
        <div className="flex items-center justify-between bg-surface-container px-4 py-2.5 rounded-2xl border border-blush-surface text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-terra-primary text-base">pin_drop</span>
            <span className="text-cocoa-text">
              Focusing on <strong>{selectedStateName || selectedStateId}</strong>. Showing matching folk arts, dialect circles, and community gatherings.
            </span>
          </div>
          <button
            onClick={handleClearState}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-cream-canvas hover:bg-blush-surface/50 text-cocoa-text font-bold text-xs border border-blush-surface transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Show all India</span>
          </button>
        </div>
      )}

      {/* Culture & Heritage Gateway Notice if culture category selected */}
      {selectedCategory === 'culture' && onNavigate && viewMode !== 'FOOD' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-terra-primary/10 border border-terra-primary/30 p-3.5 sm:px-4 sm:py-3 rounded-2xl text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terra-primary text-cream-canvas flex items-center justify-center flex-shrink-0 shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif font-bold text-cocoa-text text-sm">
                Explore the Dedicated Culture & Heritage National Atlas
              </p>
              <p className="text-cocoa-text/80 text-[11px]">
                Discover sacred temples, cathedrals, Islamic architecture, monasteries, monuments, and hidden craft villages.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('heritage')}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm transition-all flex-shrink-0 cursor-pointer"
          >
            <span>Open Culture & Heritage</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Dynamic View: Food Discovery, Illustrated Atlas Map, or Card Grid */}
      {viewMode === 'FOOD' ? (
        <FoodDiscoveryView
          events={allUniqueEvents}
          onSelectEvent={onSelectEvent}
          initialStateId={selectedStateId || 'ALL'}
        />
      ) : viewMode === 'MAP' ? (
        <div className="space-y-6">
          {/* Desktop: 2-Column Side-by-Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Dominant Column: Interactive India Map Canvas (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <InteractiveIndiaMap
                events={mapEvents}
                selectedCategory={selectedCategory}
                selectedStateId={selectedStateId}
                onSelectState={handleSelectState}
                onSelectEvent={onSelectEvent}
              />

              {/* Pin Category Legend */}
              <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-3.5 rounded-2xl border border-blush-surface/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-cocoa-text/80 shadow-xs">
                <span className="font-bold text-cocoa-text flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-terra-primary">legend_toggle</span>
                  Atlas Pins:
                </span>
                {Object.entries(PIN_CATEGORIES).map(([key, cat]) => (
                  <div key={key} className="flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Selected State Living Heritage & Event List (5 cols) */}
            <div className="lg:col-span-5 h-[760px] sticky top-24">
              <StateDetailPanel
                selectedStateId={selectedStateId}
                selectedStateName={selectedStateName}
                events={filteredEvents}
                savedEvents={savedEvents}
                onClearState={handleClearState}
                onToggleSave={onToggleSave}
                onSelectEvent={onSelectEvent}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Grid / List View Alternative */
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-surface-container/70 border-2 border-dashed border-blush-surface space-y-4 max-w-2xl mx-auto animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-full bg-terra-primary/10 border border-terra-primary/20 flex items-center justify-center text-terra-primary">
                <CalendarX2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-terra-primary px-2.5 py-0.5 rounded-full bg-terra-primary/10">
                  0 Events Present
                </span>
                <h3 className="font-serif text-2xl font-bold text-cocoa-text mt-2">
                  No events present for this topic
                </h3>
                <p className="text-xs sm:text-sm text-cocoa-text/75 leading-relaxed font-medium">
                  There are currently zero gatherings scheduled for this topic. Since there are no events present right now, you can explore other active categories below or propose a community gathering!
                </p>
              </div>

              {availableCategoriesWithEvents.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-cocoa-text/60 mb-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
                    <span>Explore These Other Topics Instead:</span>
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableCategoriesWithEvents.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="px-3.5 py-1.5 rounded-full bg-surface-container-lowest hover:bg-terra-primary/10 border border-blush-surface hover:border-terra-primary/30 text-cocoa-text hover:text-terra-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{cat.symbol}</span>
                        <span>{cat.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container text-cocoa-text/70">
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setOnlySaved(false); setSelectedStateId(null); }}
                  className="px-5 py-2.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs sm:text-sm font-bold shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Show All Cultural Gatherings ({allUniqueEvents.length})</span>
                </button>

                {onOpenSubmitModal && (
                  <button
                    onClick={onOpenSubmitModal}
                    className="px-5 py-2.5 rounded-full bg-surface-container-lowest hover:bg-blush-surface border border-blush-surface text-cocoa-text text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-terra-primary" />
                    <span>Host or Suggest an Event</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.slice(0, 2).map(evt => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isSaved={savedEvents.includes(evt.id)}
                  onToggleSave={onToggleSave}
                  onSelect={onSelectEvent}
                />
              ))}
              <AdSlot
                placement="EVENTS"
                state={selectedStateId || user?.state || 'all'}
                category={selectedCategory}
                format="card"
                onSelectEvent={onSelectEvent}
              />
              {filteredEvents.slice(2).map(evt => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isSaved={savedEvents.includes(evt.id)}
                  onToggleSave={onToggleSave}
                  onSelect={onSelectEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


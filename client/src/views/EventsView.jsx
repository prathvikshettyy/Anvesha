import React, { useState, useMemo, useEffect } from 'react';
import { Search, Map, LayoutGrid, PlusCircle, Bookmark, RotateCcw, Sparkles } from 'lucide-react';
import EventCard from '../components/EventCard';
import InteractiveIndiaMap from '../components/InteractiveIndiaMap';
import StateDetailPanel from '../components/StateDetailPanel';
import { PIN_CATEGORIES } from '../components/IllustratedPin';
import * as api from '../services/api';

export default function EventsView({
  events,
  people,
  savedEvents,
  onToggleSave,
  onSelectEvent,
  onSelectPerson,
  onOpenSubmitModal
}) {
  const [viewMode, setViewMode] = useState('MAP'); // 'MAP' or 'GRID'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlySaved, setOnlySaved] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedStateName, setSelectedStateName] = useState(null);
  const [apiEvents, setApiEvents] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced API search on searchQuery + selectedCategory
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await api.events.list({
          q: searchQuery,
          category: selectedCategory
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
    { id: 'culture', label: 'Culture & Heritage', symbol: '🪷' },
    { id: 'festivals', label: 'Festivals', symbol: '✨' },
    { id: 'technology', label: 'Technology', symbol: '⚡' },
    { id: 'music', label: 'Folk & Classical Music', symbol: '🪕' },
    { id: 'art', label: 'Art & Crafts', symbol: '🎨' },
    { id: 'film', label: 'Film & Theatre', symbol: '🎭' },
    { id: 'literature', label: 'Literature', symbol: '📜' },
    { id: 'science', label: 'Science', symbol: '⚛️' },
    { id: 'workshops', label: 'Workshops', symbol: '💡' },
    { id: 'community', label: 'Community', symbol: '🤝' }
  ];

  // Filter events based on state, category, search, and saved filter
  const filteredEvents = useMemo(() => {
    const source = apiEvents ?? events;
    return source.filter(evt => {
      // Category filter
      const matchesCategory = selectedCategory === 'ALL' || evt.category === selectedCategory;
      
      // Saved filter
      const matchesSaved = !onlySaved || savedEvents.includes(evt.id);
      
      // Search query (null-safe with ?? '')
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (evt.title ?? '').toLowerCase().includes(q) ||
        (evt.description ?? '').toLowerCase().includes(q) ||
        (evt.venue ?? '').toLowerCase().includes(q) ||
        (evt.organizer ?? '').toLowerCase().includes(q) ||
        (evt.state && evt.state.toLowerCase().includes(q)) ||
        (evt.city && evt.city.toLowerCase().includes(q))
      );

      // State filter if in grid mode or map mode
      const matchesState = !selectedStateId ||
        evt.stateId === selectedStateId ||
        (evt.state && evt.state.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedStateId);

      return matchesCategory && matchesSaved && matchesSearch && matchesState;
    });
  }, [apiEvents, events, selectedCategory, onlySaved, searchQuery, selectedStateId, savedEvents]);

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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              onlySaved
                ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                : 'bg-surface-container-lowest border-blush-surface text-cocoa-text hover:bg-blush-surface/40'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-cream-canvas' : ''}`} />
            <span>Saved ({savedEvents.length})</span>
          </button>

          {/* Toggle between Map and Grid */}
          <div className="bg-surface-container p-1 rounded-full border border-blush-surface flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'MAP'
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'text-cocoa-text hover:bg-blush-surface/50'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Atlas Map</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'GRID'
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

      {/* Filter and Search Bar */}
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
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

      {/* Active State / Filter Toast Notice if State Selected */}
      {selectedStateId && (
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

      {/* Dynamic View: Illustrated Atlas Map or Card Grid */}
      {viewMode === 'MAP' ? (
        <div className="space-y-6">
          {/* Desktop: 2-Column Side-by-Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Dominant Column: Interactive India Map Canvas (7 cols) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <InteractiveIndiaMap
                events={apiEvents ?? events}
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
            <div className="p-12 text-center rounded-3xl bg-surface-container/60 border border-blush-surface">
              <p className="font-serif text-lg text-cocoa-text">No gatherings match your current filters.</p>
              <p className="text-xs text-cocoa-text/70 mt-1">Try switching to All Heritage or clearing your state filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setOnlySaved(false); setSelectedStateId(null); }}
                className="mt-4 px-4 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold shadow-warm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(evt => (
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


import React, { useState } from 'react';
import { Search, Map, LayoutGrid, PlusCircle, Filter, Sparkles, CheckCircle } from 'lucide-react';
import EventCard from '../components/EventCard';
import InteractiveMap from '../components/InteractiveMap';

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

  const filteredEvents = events.filter(evt => {
    const matchesCategory = selectedCategory === 'ALL' || evt.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      evt.title.toLowerCase().includes(q) ||
      evt.description.toLowerCase().includes(q) ||
      evt.venue.toLowerCase().includes(q) ||
      evt.organizer.toLowerCase().includes(q)
    );
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'ALL', label: 'All Gatherings' },
    { id: 'culture', label: '🎭 Culture & Heritage' },
    { id: 'languages', label: '🗣️ Dialects & Languages' },
    { id: 'crafts', label: '🏺 Traditional Crafts' },
    { id: 'music', label: '🎵 Folk & Classical Music' },
    { id: 'food', label: '🍛 Culinary Heritage' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
            Cultural Gatherings & Living Map
          </h1>
          <p className="text-xs sm:text-sm text-cocoa-text/70 mt-1">
            Discover workshops, dialect circles, and performances happening across Manipal and coastal Karnataka.
          </p>
        </div>

        {/* View Toggle & Submit Event CTA */}
        <div className="flex items-center gap-3">
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
              <span>Living Map</span>
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
              <span>Grid View</span>
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
            placeholder="Search by topic, venue, organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-blush-surface bg-surface-container-lowest text-xs sm:text-sm text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'bg-surface-container-lowest hover:bg-blush-surface/40 text-cocoa-text border border-blush-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic View: Map or Grid */}
      {viewMode === 'MAP' ? (
        <InteractiveMap
          events={filteredEvents}
          people={people}
          onSelectEvent={onSelectEvent}
          onSelectPerson={onSelectPerson}
        />
      ) : (
        <div>
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container/60 border border-blush-surface">
              <p className="text-sm text-cocoa-text/70">No events matched your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                className="mt-3 px-4 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold"
              >
                Reset Filters
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

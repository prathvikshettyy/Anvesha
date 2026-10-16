import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Search,
  MapPin,
  Calendar,
  Clock,
  Bookmark,
  PlusCircle,
  Map,
  LayoutGrid,
  ShieldCheck,
  Camera,
  Shirt,
  Footprints,
  Sparkles,
  Loader2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import * as api from '../services/api';
import InteractiveIndiaMap from '../components/InteractiveIndiaMap';
import HeritageDetailModal from '../components/HeritageDetailModal';
import ProposeHeritageModal from '../components/ProposeHeritageModal';

const HERITAGE_CATEGORIES = [
  { id: 'ALL', label: 'All Heritage', symbol: '🇮🇳' },
  { id: 'TEMPLES_RELIGIOUS', label: 'Temples & Sacred Sites', symbol: '🛕' },
  { id: 'CHURCHES_CATHEDRALS', label: 'Churches & Cathedrals', symbol: '⛪' },
  { id: 'MOSQUES_ISLAMIC', label: 'Mosques & Islamic Heritage', symbol: '🕌' },
  { id: 'MONASTERIES_SPIRITUAL', label: 'Monasteries & Spiritual Sanctuaries', symbol: '☸️' },
  { id: 'MONUMENTS_WALKS', label: 'Monuments & Heritage Walks', symbol: '🏛️' },
  { id: 'PERFORMANCES_CRAFTS', label: 'Performances, Festivals & Crafts', symbol: '🎭' },
  { id: 'HIDDEN_VILLAGES', label: 'Hidden Villages & Vernacular Living', symbol: '🌿' },
];

const STATES_FILTER = [
  { id: 'ALL', label: 'All India (National Archive)' },
  { id: 'karnataka', label: 'Karnataka (ಕರ್ನಾಟಕ)' },
  { id: 'tamil-nadu', label: 'Tamil Nadu (தமிழ்நாடு)' },
  { id: 'goa', label: 'Goa (गोंय)' },
  { id: 'kerala', label: 'Kerala (കേരളം)' },
  { id: 'delhi', label: 'Delhi (दिल्ली)' },
  { id: 'telangana', label: 'Telangana (తెలంగాణ)' },
  { id: 'ladakh', label: 'Ladakh (ལ་དྭགས)' },
  { id: 'rajasthan', label: 'Rajasthan (राजस्थान)' },
  { id: 'odisha', label: 'Odisha (ଓଡ଼ିଶା)' },
  { id: 'meghalaya', label: 'Meghalaya' },
  { id: 'himachal-pradesh', label: 'Himachal Pradesh (हिमाचल प्रदेश)' },
  { id: 'maharashtra', label: 'Maharashtra (महाराष्ट्र)' },
  { id: 'west-bengal', label: 'West Bengal (পশ্চিমবঙ্গ)' },
  { id: 'uttar-pradesh', label: 'Uttar Pradesh (उत्तर प्रदेश)' },
];

const SAVED_HERITAGE_STORAGE_KEY = 'anvesha_saved_heritage';

export default function CultureHeritageView({
  currentUser,
  onNavigate,
  onSelectEvent
}) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'PERMANENT' | 'SCHEDULED'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'MAP'
  const [onlySaved, setOnlySaved] = useState(false);

  // Modals
  const [selectedSite, setSelectedSite] = useState(null);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);

  // Saved bookmark IDs in localStorage
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_HERITAGE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleSaveSite = (id) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem(SAVED_HERITAGE_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not persist saved heritage:', e);
      }
      return next;
    });
  };

  // Fetch heritage sites from backend
  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.heritage.list({
        q: searchQuery,
        category: selectedCategory,
        state: selectedState,
        type: selectedType,
      });

      setSites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load heritage sites:', err);
      setError('Unable to load heritage archive. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search & filter re-fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSites();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedState, selectedType]);

  // Client-side saved filter
  const displayedSites = useMemo(() => {
    if (!onlySaved) return sites;
    return sites.filter((s) => savedIds.includes(s.id));
  }, [sites, onlySaved, savedIds]);

  // Adapt heritage sites for the existing InteractiveIndiaMap component
  const mapCompatibleSites = useMemo(() => {
    return displayedSites.map((s) => ({
      ...s,
      title: s.name,
      venue: `${s.city}, ${s.state} • ${s.location_summary || s.category_label}`,
      date: s.is_permanent_place ? (s.visiting_hours || 'Permanent Landmark') : (s.event_date || 'Scheduled Event'),
      category: 'culture', // Maps to the IllustratedPin "culture" terracotta landmark pin!
      image: s.image_url,
      stateId: s.state_id,
    }));
  }, [displayedSites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* ── Top Header Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blush-surface/70 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terra-primary/10 border border-terra-primary/20 text-terra-primary text-xs font-bold mb-2">
            <Landmark className="w-3.5 h-3.5" />
            <span>Sacred Landmarks & Living Traditions</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
            Culture & Heritage of India
          </h1>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-1 font-medium max-w-2xl">
            Explore authentic temples, historic cathedrals, Islamic architecture, monasteries, monuments, living folk theatre, and protected heritage craft villages.
          </p>
        </div>

        {/* View Switchers & CTAs */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Saved Filter Pill */}
          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              onlySaved
                ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                : 'bg-surface-container-lowest border-blush-surface text-cocoa-text hover:bg-blush-surface/40'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-cream-canvas' : ''}`} />
            <span>Saved ({savedIds.length})</span>
          </button>

          {/* Map vs List View Switcher */}
          <div className="bg-surface-container p-1 rounded-full border border-blush-surface flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'text-cocoa-text hover:bg-blush-surface/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Sanctuaries Grid</span>
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'text-cocoa-text hover:bg-blush-surface/50'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Atlas Map</span>
            </button>
          </div>

          {/* Propose Heritage Landmark CTA */}
          <button
            onClick={() => setIsProposeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container shadow-warm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Propose Landmark</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Search Bar + State Select + Type Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-text/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by temple, monument, village, craft, or city..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-lowest border border-blush-surface/90 text-xs sm:text-sm text-cocoa-text focus:outline-none focus:border-terra-primary shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cocoa-text/40 hover:text-cocoa-text"
              >
                ✕
              </button>
            )}
          </div>

          {/* State / Region Select */}
          <div className="md:col-span-3">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full py-2.5 px-3 rounded-2xl bg-surface-container-lowest border border-blush-surface/90 text-xs text-cocoa-text focus:outline-none focus:border-terra-primary shadow-xs"
            >
              {STATES_FILTER.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Toggle: All / Permanent / Scheduled Events */}
          <div className="md:col-span-3 flex rounded-2xl border border-blush-surface/90 bg-surface-container-lowest p-1 shadow-xs">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedType === 'ALL'
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'text-cocoa-text/70 hover:bg-blush-surface/30'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('PERMANENT')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedType === 'PERMANENT'
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'text-cocoa-text/70 hover:bg-blush-surface/30'
              }`}
              title="Only permanent temples, monuments, mosques, churches, and villages"
            >
              Permanent Sites
            </button>
            <button
              onClick={() => setSelectedType('SCHEDULED')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedType === 'SCHEDULED'
                  ? 'bg-terra-primary text-cream-canvas shadow-xs'
                  : 'text-cocoa-text/70 hover:bg-blush-surface/30'
              }`}
              title="Traditional performances, walks, and scheduled festivals"
            >
              Scheduled
            </button>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {HERITAGE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                    : 'bg-surface-container-lowest border-blush-surface/70 text-cocoa-text hover:bg-blush-surface/40 hover:text-terra-primary'
                }`}
              >
                <span>{cat.symbol}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content View (Map or Grid) ──────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-terra-primary animate-spin" />
          <p className="text-sm font-semibold text-cocoa-text/70">
            Gathering sacred landmarks and heritage archives...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-surface-container-lowest border border-red-200 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-cocoa-text">{error}</h3>
          <button
            onClick={fetchSites}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : displayedSites.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-surface-container-lowest border border-blush-surface text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-terra-primary/10 text-terra-primary flex items-center justify-center mx-auto">
            <Landmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-cocoa-text">
              No Heritage Sites Found
            </h3>
            <p className="text-xs text-cocoa-text/70 max-w-md mx-auto">
              We couldn't find any heritage destinations matching your current search or category filters.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedState('ALL');
                setSelectedType('ALL');
                setOnlySaved(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
            <button
              onClick={() => setIsProposeModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blush-surface text-xs font-bold text-cocoa-text hover:bg-blush-surface/40 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Propose a Landmark</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'MAP' ? (
        /* Map Integration View using existing InteractiveIndiaMap */
        <div className="rounded-3xl overflow-hidden border border-blush-surface bg-cream-canvas shadow-warm p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cocoa-text">
              <MapPin className="w-4 h-4 text-terra-primary" />
              <span>
                Displaying {mapCompatibleSites.length} cultural landmarks on the National Living Map
              </span>
            </div>
            <span className="text-[11px] text-cocoa-text/60">
              Click any landmark pin to view visitor guidelines & history
            </span>
          </div>

          <div className="h-[620px] rounded-2xl overflow-hidden">
            <InteractiveIndiaMap
              events={mapCompatibleSites}
              selectedCategory="ALL"
              selectedStateId={selectedState === 'ALL' ? null : selectedState}
              onSelectState={(stateId) => setSelectedState(stateId || 'ALL')}
              onSelectEvent={(evt) => {
                // Find matching original site by ID
                const matched = displayedSites.find((s) => s.id === evt.id) || evt;
                setSelectedSite(matched);
              }}
            />
          </div>
        </div>
      ) : (
        /* Rich Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedSites.map((site) => {
            const isSaved = savedIds.includes(site.id);
            const isPermanent = Boolean(site.is_permanent_place ?? site.isPermanent);

            return (
              <div
                key={site.id}
                onClick={() => setSelectedSite(site)}
                className="group relative flex flex-col rounded-3xl bg-surface-container-lowest border border-blush-surface overflow-hidden shadow-xs hover:shadow-warm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Image Banner */}
                <div className="relative h-48 w-full bg-blush-surface/30 overflow-hidden">
                  <img
                    src={site.image_url || site.imageUrl}
                    alt={site.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/80 via-transparent to-transparent" />

                  {/* Badges Top Left & Right */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-cream-canvas/95 backdrop-blur-md text-cocoa-text border border-blush-surface shadow-xs">
                      {site.category_label || site.category}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveSite(site.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                        isSaved
                          ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                          : 'bg-cream-canvas/90 text-cocoa-text/70 border-blush-surface hover:text-terra-primary'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save landmark'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-cream-canvas' : ''}`} />
                    </button>
                  </div>

                  {/* Landmark Status Pill (Permanent vs Scheduled) */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-cream-canvas text-[11px] font-semibold">
                    <span className="flex items-center gap-1 drop-shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-ochre-accent" />
                      <span>{site.city}, {site.state}</span>
                    </span>

                    {isPermanent ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-[10px] font-bold">
                        Permanent Landmark
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-[10px] font-bold">
                        Scheduled Event
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-lg font-bold text-cocoa-text group-hover:text-terra-primary transition-colors line-clamp-1">
                      {site.name}
                    </h3>
                    <p className="text-xs text-cocoa-text/80 line-clamp-2 leading-relaxed">
                      {site.description}
                    </p>
                  </div>

                  {/* Schedule / Hours */}
                  <div className="p-2.5 rounded-xl bg-cream-canvas/70 border border-blush-surface/60 flex items-center gap-2 text-xs text-cocoa-text/85">
                    {isPermanent ? (
                      <Clock className="w-3.5 h-3.5 text-terra-primary flex-shrink-0" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-ochre-accent flex-shrink-0" />
                    )}
                    <span className="truncate text-[11px] font-medium">
                      {isPermanent
                        ? (site.visiting_hours || 'Daytime visiting hours')
                        : (site.event_date || 'Seasonal schedule')}
                    </span>
                  </div>

                  {/* Visitor Etiquette Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-cocoa-text/75">
                    {site.dress_guidelines && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container border border-blush-surface">
                        <Shirt className="w-2.5 h-2.5 text-terra-primary" />
                        <span>Dress Guidelines</span>
                      </span>
                    )}
                    {site.photography_rules && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container border border-blush-surface">
                        <Camera className="w-2.5 h-2.5 text-ochre-accent" />
                        <span>Photo Rules</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-2 border-t border-blush-surface/50 flex items-center justify-between text-xs font-bold text-terra-primary">
                    <span className="flex items-center gap-1">
                      <span>Explore Guidelines & Lore</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {site.organizer_name && (
                      <span className="text-[10px] text-cocoa-text/50 font-normal truncate max-w-[120px]">
                        {site.organizer_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {selectedSite && (
        <HeritageDetailModal
          site={selectedSite}
          isOpen={Boolean(selectedSite)}
          onClose={() => setSelectedSite(null)}
          isSaved={savedIds.includes(selectedSite.id)}
          onToggleSave={toggleSaveSite}
        />
      )}

      {isProposeModalOpen && (
        <ProposeHeritageModal
          isOpen={isProposeModalOpen}
          onClose={() => setIsProposeModalOpen(false)}
          currentUser={currentUser}
          onHeritageAdded={(newSite) => {
            fetchSites();
            setSelectedSite(newSite);
          }}
        />
      )}
    </div>
  );
}

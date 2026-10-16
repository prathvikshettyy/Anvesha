import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  Sparkles,
  Calendar,
  MapPin,
  Filter,
  CheckCircle,
  Loader2,
  AlertCircle,
  PlusCircle,
  Compass
} from 'lucide-react';
import CommunityCard from '../components/CommunityCard';
import CommunityDetailModal from '../components/CommunityDetailModal';
import { INITIAL_COMMUNITIES } from '../data/initialData';
import * as api from '../services/api';

const CATEGORIES = [
  { id: 'ALL', label: 'All Circles' },
  { id: 'music', label: 'Music & Ragas' },
  { id: 'art', label: 'Art & Crafts' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'literature', label: 'Literature & Dialects' },
  { id: 'regional', label: 'Regional Culture' },
  { id: 'technology', label: 'Technology' },
];

const COMMUNITY_TYPES = [
  { id: 'ALL', label: 'All Formats' },
  { id: 'INTEREST', label: 'Interest Circles' },
  { id: 'EVENT', label: 'Event Circles' },
  { id: 'LOCATION', label: 'Local Hubs' },
];

export default function CommunitiesView({
  currentUser,
  isAuthenticated,
  onSelectEvent,
  initialActiveCommunityId = null,
  onContactOrganiser,
  people = []
}) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [activeCommunity, setActiveCommunity] = useState(null);

  // Load communities from API or fallback to INITIAL_COMMUNITIES
  const fetchCommunities = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAuthenticated) {
        const data = await api.communities.list({
          q: searchQuery,
          category: selectedCategory,
          type: selectedType
        });
        if (Array.isArray(data)) {
          setCommunities(data);
          return;
        }
      }
      // Demo / fallback filtering
      let list = [...INITIAL_COMMUNITIES];
      if (selectedCategory !== 'ALL') {
        list = list.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
      }
      if (selectedType !== 'ALL') {
        list = list.filter(c => c.type.toUpperCase() === selectedType.toUpperCase());
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        list = list.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q))
        );
      }
      setCommunities(list);
    } catch (err) {
      console.warn('Failed to load communities from API, using demo data:', err);
      setCommunities(INITIAL_COMMUNITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommunities();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedType, isAuthenticated]);

  // Open initial community if specified by caller
  useEffect(() => {
    if (initialActiveCommunityId && communities.length > 0) {
      const found = communities.find(c => c.id === initialActiveCommunityId || c.slug === initialActiveCommunityId);
      if (found) setActiveCommunity(found);
    }
  }, [initialActiveCommunityId, communities]);

  // Handle Join / Leave toggle
  const handleJoinToggle = async (comm) => {
    const wasMember = comm.isMember;
    const newStatus = !wasMember;
    const newCount = (comm.memberCount || 0) + (newStatus ? 1 : -1);

    // Optimistic UI update
    setCommunities(prev =>
      prev.map(c => c.id === comm.id ? { ...c, isMember: newStatus, memberCount: Math.max(0, newCount) } : c)
    );
    if (activeCommunity?.id === comm.id) {
      setActiveCommunity(prev => ({ ...prev, isMember: newStatus, memberCount: Math.max(0, newCount) }));
    }

    if (isAuthenticated) {
      try {
        if (newStatus) {
          await api.communities.join(comm.id);
        } else {
          await api.communities.leave(comm.id);
        }
      } catch (err) {
        console.error('Failed to update membership:', err);
        // Revert on error
        setCommunities(prev =>
          prev.map(c => c.id === comm.id ? { ...c, isMember: wasMember, memberCount: comm.memberCount } : c)
        );
        if (activeCommunity?.id === comm.id) {
          setActiveCommunity(prev => ({ ...prev, isMember: wasMember, memberCount: comm.memberCount }));
        }
      }
    }
  };

  // Split into Joined and Suggested
  const joinedCommunities = useMemo(() => {
    return communities.filter(c => c.isMember);
  }, [communities]);

  const suggestedCommunities = useMemo(() => {
    return communities.filter(c => !c.isMember);
  }, [communities]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Search & Filter Header Bar */}
      <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface p-4 sm:p-6 shadow-warm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cocoa-text/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cultural circles by name, craft, dialect, or location..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-blush-surface bg-surface-container/40 text-cocoa-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          {/* Type Selector (Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {COMMUNITY_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-cocoa-text text-cream-canvas shadow-xs'
                    : 'bg-surface-container text-cocoa-text/70 hover:bg-blush-surface/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-blush-surface/60">
          <span className="text-[11px] font-bold text-cocoa-text/50 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-terra-primary text-cream-canvas shadow-xs font-bold'
                  : 'bg-cream-canvas text-cocoa-text/75 hover:bg-blush-surface border border-blush-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 flex items-center justify-center text-terra-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && communities.length === 0 && (
        <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-terra-primary/10 text-terra-primary mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-cocoa-text">No circles found</h3>
          <p className="text-xs sm:text-sm text-cocoa-text/70 max-w-md mx-auto">
            No cultural circles match your current search or category filter. Try clearing your search term or select another category.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedType('ALL'); }}
            className="px-4 py-2 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs shadow-xs hover:bg-primary-container"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ── Section 1: Joined Communities ───────────────────────────────── */}
      {!loading && joinedCommunities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-cocoa-text">
                Your Joined Circles
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {joinedCommunities.length}
              </span>
            </div>
            <span className="text-xs text-cocoa-text/60">Participating & sharing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {joinedCommunities.map((comm) => (
              <CommunityCard
                key={comm.id}
                community={comm}
                onSelect={setActiveCommunity}
                onJoinToggle={handleJoinToggle}
                onContactOrganiser={onContactOrganiser}
                people={people}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Section 2: Explore & Suggested Communities ──────────────────── */}
      {!loading && suggestedCommunities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ochre-accent" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-cocoa-text">
                Discover Cultural Communities
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blush-surface text-cocoa-text/80">
                {suggestedCommunities.length}
              </span>
            </div>
            <span className="text-xs text-cocoa-text/60">Connect by shared interests & traditions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {suggestedCommunities.map((comm) => (
              <CommunityCard
                key={comm.id}
                community={comm}
                onSelect={setActiveCommunity}
                onJoinToggle={handleJoinToggle}
                onContactOrganiser={onContactOrganiser}
                people={people}
              />
            ))}
          </div>
        </div>
      )}

      {/* Community Detail & Discussion Modal */}
      {activeCommunity && (
        <CommunityDetailModal
          community={activeCommunity}
          isOpen={Boolean(activeCommunity)}
          onClose={() => setActiveCommunity(null)}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onJoinToggle={handleJoinToggle}
          onSelectEvent={onSelectEvent}
          onContactOrganiser={onContactOrganiser}
          people={people}
        />
      )}
    </div>
  );
}

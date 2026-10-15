import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Sparkles, ShieldCheck, Filter, LogIn, MapPin } from 'lucide-react';
import PersonCard from '../components/PersonCard';
import { INITIAL_INTERESTS } from '../data/initialData';
import * as api from '../services/api';

function normalisePersonRow(p) {
  return {
    id:               p.id,
    name:             p.name,
    handle:           p.handle        ?? `@${p.username}`,
    avatar:           p.avatar       ?? p.avatar_url ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    bio:              p.bio           ?? '',
    city:             p.city          ?? 'India',
    broadRegion:      p.broadRegion  ?? p.city ?? p.neighborhood ?? 'India',
    neighborhood:     p.neighborhood  ?? 'Nearby',
    speaks:           p.speaks       ?? p.languages ?? [],
    interests:        Array.isArray(p.interests) ? p.interests.map(i => i.interest_id ?? i) : [],
    willingToTeach:   p.willingToTeach ?? (Array.isArray(p.skills) ? p.skills.filter(s => s.skill_type === 'TEACH').map(s => s.skill) : []),
    wantsToLearn:     p.wantsToLearn  ?? (Array.isArray(p.skills) ? p.skills.filter(s => s.skill_type === 'LEARN').map(s => s.skill) : []),
    matchScore:       p.matchScore    ?? p.match_score ?? null,
    matchReason:      p.matchReason   ?? '',
    matchReasons:     Array.isArray(p.matchReasons) ? p.matchReasons : [],
    mutualConnections: p.mutualConnections ?? 0,
    connectionStatus: p.connectionStatus ?? p.connection_status ?? 'NONE',
    isMentor:         p.isMentor      ?? p.is_mentor ?? false,
  };
}

export default function PeopleView({ user, people, onConnect, onStartChat, onSendLocketPulse, isAuthenticated }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiPeople, setApiPeople] = useState(null);

  // Debounced API search on searchQuery + selectedFilter
  useEffect(() => {
    if (!api.token.get()) return;

    const timer = setTimeout(async () => {
      try {
        const res = await api.people.discover({
          q: searchQuery,
          filter: selectedFilter
        });
        if (Array.isArray(res)) {
          setApiPeople(res.map(normalisePersonRow));
        }
      } catch (err) {
        console.warn('Failed to fetch people from API:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilter]);

  const activePeopleList = apiPeople ?? people;

  const userInterests = useMemo(() => Array.isArray(user?.interests) ? user.interests : [], [user?.interests]);
  const activeInterestObjs = useMemo(() => 
    INITIAL_INTERESTS.filter(i => userInterests.includes(i.id)),
    [userInterests]
  );

  // Compute dynamic match scores and explanations for all people
  const rankedPeople = useMemo(() => {
    return activePeopleList.map(p => {
      const personInterests = Array.isArray(p.interests) ? p.interests : [];
      const shared = userInterests.filter(x => personInterests.includes(x));
      const sharedNames = INITIAL_INTERESTS.filter(i => shared.includes(i.id)).map(i => i.name);

      let score = 55 + (shared.length * 15);
      if (user?.preferredMode === 'BOTH' || p.preferredMode === 'BOTH' || user?.preferredMode === p.preferredMode) {
        score += 8;
      }
      if (user?.intentions?.languages === 'WANTS_TO_LEARN' && (p.speaks?.length > 0 || p.willingToTeach?.length > 0)) {
        score += 10;
      }
      score = Math.min(Math.max(score, 65), 98);

      let reason = '';
      if (sharedNames.length > 0) {
        reason = `You both care about ${sharedNames.slice(0, 2).join(' & ')}. `;
      }
      if (user?.intentions?.languages === 'WANTS_TO_LEARN' && p.speaks?.length > 0) {
        reason += `${p.name.split(' ')[0]} speaks ${p.speaks.slice(0, 2).join(', ')} and can practice conversational idioms with you.`;
      } else if (p.willingToTeach?.length > 0) {
        reason += `Demonstrates ${p.willingToTeach.slice(0, 2).join(' & ')} near ${user?.neighborhood || 'campus'}.`;
      } else {
        reason += `Shares your cultural wavelength and local community circles.`;
      }

      return {
        ...p,
        matchScore: p.matchScore ? Math.max(p.matchScore, score) : score,
        matchReason: p.matchReason || reason,
        hasSharedRoots: shared.length > 0
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [activePeopleList, userInterests, user?.preferredMode, user?.intentions, user?.neighborhood]);

  const filteredPeople = useMemo(() => {
    return rankedPeople.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        p.name.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        (p.speaks && p.speaks.some(s => s.toLowerCase().includes(q))) ||
        (p.willingToTeach && p.willingToTeach.some(t => t.toLowerCase().includes(q)))
      );

      const matchesFilter =
        selectedFilter === 'ALL' ||
        (selectedFilter === 'MATCHED' && p.hasSharedRoots) ||
        (selectedFilter === 'TULU' && p.speaks && p.speaks.includes('Tulu')) ||
        (selectedFilter === 'YAKSHA' && p.interests && p.interests.includes('culture')) ||
        (selectedFilter === 'MENTORS' && p.willingToTeach && p.willingToTeach.length > 0);

      return matchesSearch && matchesFilter;
    });
  }, [rankedPeople, searchQuery, selectedFilter]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-terra-primary" />
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
              Find Your People
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-1">
            Discover language conversation partners, traditional artisans, and peers with shared cultural roots.
          </p>

          {/* Active User Roots Pill Row */}
          {activeInterestObjs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cocoa-text/60">Matching for:</span>
              {activeInterestObjs.map(item => (
                <span
                  key={item.id}
                  className="px-2 py-0.5 rounded-full bg-terra-primary/10 border border-terra-primary/20 text-terra-primary text-[11px] font-bold"
                >
                  {item.name}
                </span>
              ))}
              {user?.preferredMode && (
                <span className="px-2 py-0.5 rounded-full bg-ochre-accent/15 border border-ochre-accent/30 text-cocoa-text text-[11px] font-semibold">
                  {user.preferredMode === 'BOTH' ? '🤝 In-Person & Virtual' : user.preferredMode === 'IN_PERSON' ? '📍 In-Person' : '💻 Virtual'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-blush-surface text-xs text-cocoa-text self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-terra-primary" />
          <span>Opt-in profiles only · Approximate neighborhood proximity</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cocoa-text/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, dialect (Tulu, Konkani), or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-blush-surface bg-surface-container-lowest text-xs sm:text-sm text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
          {[
            { id: 'ALL', label: 'All Members' },
            ...(userInterests.length > 0 ? [{ id: 'MATCHED', label: '🎯 Best Matched for You' }] : []),
            { id: 'MENTORS', label: '🎓 Willing to Teach' },
            { id: 'TULU', label: '🗣️ Tulu Speakers' },
            { id: 'YAKSHA', label: '🎭 Folk Artists' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === f.id
                  ? 'bg-terra-primary text-cream-canvas shadow-sm'
                  : 'bg-surface-container-lowest hover:bg-blush-surface/40 text-cocoa-text border border-blush-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPeople.map(person => (
          <PersonCard
            key={person.id}
            person={person}
            onConnect={onConnect}
            onStartChat={onStartChat}
            onSendLocketPulse={onSendLocketPulse}
          />
        ))}
      </div>
    </div>
  );
}

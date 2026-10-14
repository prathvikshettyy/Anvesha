import React, { useState } from 'react';
import { Users, Search, Sparkles, ShieldCheck, Filter, LogIn } from 'lucide-react';
import PersonCard from '../components/PersonCard';

export default function PeopleView({ people, onConnect, onStartChat, onSendLocketPulse, isAuthenticated }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPeople = people.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      p.name.toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q) ||
      p.speaks.some(s => s.toLowerCase().includes(q)) ||
      (p.willingToTeach && p.willingToTeach.some(t => t.toLowerCase().includes(q)))
    );

    const matchesFilter = selectedFilter === 'ALL' ||
      (selectedFilter === 'TULU' && p.speaks.includes('Tulu')) ||
      (selectedFilter === 'YAKSHA' && p.interests.includes('culture')) ||
      (selectedFilter === 'MENTORS' && p.willingToTeach && p.willingToTeach.length > 0);

    return matchesSearch && matchesFilter;
  });

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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Members' },
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

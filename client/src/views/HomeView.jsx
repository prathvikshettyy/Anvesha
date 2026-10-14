import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Calendar, Users, MapPin, ArrowRight, Mic, Heart, Bookmark, Compass, CheckCircle, CalendarX2, PlusCircle } from 'lucide-react';
import CultureLocketCard from '../components/CultureLocketCard';
import EventCard from '../components/EventCard';
import PersonCard from '../components/PersonCard';
import { INITIAL_INTERESTS } from '../data/initialData';

/**
 * Deduplicate events by id and normalized title so duplicate/identical
 * events (like two "KMC Greens Dialect Exchange Circle" cards) never appear.
 */
export function dedupeEvents(list) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenTitles = new Set();
  return list.filter(evt => {
    if (!evt) return false;
    const normTitle = (evt.title || '').trim().toLowerCase();
    // Filter out residual test artifacts
    if (normTitle.includes('<script') || normTitle.includes('security test')) return false;
    if ((evt.id && seenIds.has(evt.id)) || (normTitle && seenTitles.has(normTitle))) {
      return false;
    }
    if (evt.id) seenIds.add(evt.id);
    if (normTitle) seenTitles.add(normTitle);
    return true;
  });
}

/**
 * Category aliases mapping user interest IDs to event category strings.
 */
export const CATEGORY_MAP = {
  culture: ['culture', 'heritage'],
  community: ['community', 'languages', 'dialects'],
  languages: ['languages', 'community', 'dialects'],
  food: ['food', 'culinary'],
  music: ['music', 'classical', 'folk'],
  art: ['art', 'crafts'],
  crafts: ['crafts', 'art'],
  technology: ['technology', 'hackathons'],
  hackathons: ['hackathons', 'technology'],
  festivals: ['festivals', 'utsavs'],
  literature: ['literature', 'books'],
  film: ['film', 'theatre', 'cinema'],
  workshops: ['workshops', 'mentorship'],
};

export default function HomeView({
  user,
  events,
  people,
  locketMoments,
  savedEvents,
  onToggleSave,
  onSelectEvent,
  onSelectPerson,
  onOpenLocketModal,
  onReactLocket,
  onNavigate,
  onOpenSubmitModal,
  onUpdateInterests
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Deduplicate events strictly
  const uniqueEvents = useMemo(() => dedupeEvents(events), [events]);

  // Extract user's active interests
  const userInterests = useMemo(() => Array.isArray(user.interests) ? user.interests : [], [user.interests]);
  const activeInterestObjs = useMemo(() => 
    INITIAL_INTERESTS.filter(i => userInterests.includes(i.id)),
    [userInterests]
  );
  const activeInterestLabels = useMemo(() => activeInterestObjs.map(i => i.name), [activeInterestObjs]);

  // 2. Filter events based on search query
  const searchFilteredEvents = useMemo(() => {
    if (!searchQuery) return uniqueEvents;
    const q = searchQuery.toLowerCase().trim();
    return uniqueEvents.filter(e =>
      (e.title ?? '').toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q) ||
      (e.categoryLabel ?? '').toLowerCase().includes(q) ||
      (e.venue ?? '').toLowerCase().includes(q)
    );
  }, [uniqueEvents, searchQuery]);

  // 3. Accepted categories based on user's active interests
  const acceptedCategories = useMemo(() => {
    return new Set(
      userInterests.flatMap(intId => CATEGORY_MAP[intId] || [intId])
    );
  }, [userInterests]);

  // 4. Picked for you: dynamically matching user's selected interests STRICTLY
  const pickedEvents = useMemo(() => {
    // If no specific roots selected, return all search-filtered events
    if (userInterests.length === 0) return searchFilteredEvents;

    // Strict matching: ONLY events that belong to the user's active categories
    return searchFilteredEvents.filter(e => acceptedCategories.has(e.category));
    // CRITICAL: Absolutely NO fallback to unrelated events when 0 match!
  }, [searchFilteredEvents, userInterests, acceptedCategories]);

  // 5. Compute other available categories with real upcoming events
  const alternativeCategories = useMemo(() => {
    const counts = {};
    uniqueEvents.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([cat]) => !acceptedCategories.has(cat))
      .map(([cat, count]) => {
        const meta = INITIAL_INTERESTS.find(i => (CATEGORY_MAP[i.id] || [i.id]).includes(cat)) || {
          id: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
          icon: 'event'
        };
        return {
          id: meta.id,
          name: meta.name,
          icon: meta.icon,
          count,
        };
      });
  }, [uniqueEvents, acceptedCategories]);

  // Dynamically score and explain people matches based on user's selected roots and intentions
  const rankedPeople = useMemo(() => {
    return people.map(p => {
      const personInterests = Array.isArray(p.interests) ? p.interests : [];
      const shared = userInterests.filter(x => personInterests.includes(x));
      const sharedNames = INITIAL_INTERESTS.filter(i => shared.includes(i.id)).map(i => i.name);

      // Dynamic match score calculation
      let score = 55 + (shared.length * 15);
      if (user.preferredMode === 'BOTH' || p.preferredMode === 'BOTH' || user.preferredMode === p.preferredMode) {
        score += 8;
      }
      if (user.intentions?.languages === 'WANTS_TO_LEARN' && (p.speaks?.length > 0 || p.willingToTeach?.length > 0)) {
        score += 10;
      }
      score = Math.min(Math.max(score, 65), 98);

      // Dynamic human-readable reason
      let reason = '';
      if (sharedNames.length > 0) {
        reason = `You both care about ${sharedNames.slice(0, 2).join(' & ')}. `;
      }
      if (user.intentions?.languages === 'WANTS_TO_LEARN' && p.speaks?.length > 0) {
        reason += `${p.name.split(' ')[0]} speaks ${p.speaks.slice(0, 2).join(', ')} and can practice conversational idioms with you.`;
      } else if (p.willingToTeach?.length > 0) {
        reason += `Demonstrates ${p.willingToTeach.slice(0, 2).join(' & ')} near ${user.neighborhood || 'campus'}.`;
      } else {
        reason += `Shares your cultural wavelength and local community circles.`;
      }

      return {
        ...p,
        matchScore: score,
        matchReason: reason,
        sharedInterestsCount: shared.length
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [people, userInterests, user.preferredMode, user.intentions, user.neighborhood]);

  // Coming up: saved events or nearest events (deduplicated)
  const comingUpEvents = useMemo(() => {
    const saved = uniqueEvents.filter(e => savedEvents.includes(e.id));
    return saved.length > 0 ? saved : uniqueEvents.slice(0, 2);
  }, [uniqueEvents, savedEvents]);

  const activeLocketMoment = locketMoments[0];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
      
      {/* 1. Hero Welcome & Dynamic Preferences Banner */}
      <div className="flex flex-col gap-4 pb-6 border-b border-blush-surface/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
                Namaskara, {user.name ? user.name.split(' ')[0] : 'Explorer'}
              </h1>
              <span className="text-xl">🌿</span>
            </div>
            <p className="text-sm text-cocoa-text/75 mt-1 font-medium">
              {pickedEvents.length === 0 ? (
                <span className="text-terra-primary font-bold">
                  0 events currently present for your selected roots — discover alternative cultural topics below
                </span>
              ) : (
                <span>
                  {pickedEvents.length} cultural {pickedEvents.length === 1 ? 'gathering' : 'gatherings'} tailored strictly to your selected roots
                </span>
              )}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-cocoa-text/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dialect circles, crafts, music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-blush-surface bg-surface-container-lowest text-xs sm:text-sm text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30 shadow-xs"
            />
          </div>
        </div>

        {/* Dynamic User Preferences Strip (Reflecting Onboarding Inputs) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/60 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-terra-primary" />
            <span>Active Roots:</span>
          </span>

          {activeInterestObjs.length > 0 ? (
            activeInterestObjs.map(item => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terra-primary/10 border border-terra-primary/20 text-terra-primary text-xs font-bold shadow-xs animate-fadeIn"
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                <span>{item.name}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-cocoa-text/60 italic">All Cultural Traditions</span>
          )}

          {user.preferredMode && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-ochre-accent/15 border border-ochre-accent/30 text-cocoa-text text-xs font-semibold">
              <span>{user.preferredMode === 'BOTH' ? '🤝 In-Person & Virtual Exchange' : user.preferredMode === 'IN_PERSON' ? '📍 In-Person Only' : '💻 Virtual Only'}</span>
            </span>
          )}

          {user.intentions?.languages && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container border border-blush-surface text-cocoa-text/80 text-xs font-medium">
              <span>{user.intentions.languages === 'WANTS_TO_LEARN' ? '🗣️ Learning by Conversation' : user.intentions.languages === 'WILLING_TO_TEACH' ? '🎓 Fluent Native Speaker' : '✨ Casual Enthusiast'}</span>
            </span>
          )}

          {user.neighborhood && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container border border-blush-surface text-cocoa-text/80 text-xs font-medium">
              <MapPin className="w-3 h-3 text-terra-primary" />
              <span>{user.neighborhood}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Atlas Spotlight Feature Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-blush-surface bg-gradient-to-r from-surface-container via-cream-canvas to-surface-container p-6 sm:p-8 shadow-warm">
        {/* Decorative corner folk ornaments */}
        <div className="absolute top-2 right-2 text-terra-primary/20 text-3xl font-serif select-none pointer-events-none">
          🪷
        </div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-terra-primary/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terra-primary/10 border border-terra-primary/20 text-terra-primary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">public</span>
              <span>Living Cultural Atlas</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
              Discover Your India.
            </h2>
            <p className="text-xs sm:text-sm text-cocoa-text/80 leading-relaxed font-medium">
              Explore 35 states and union territories rendered as a living, illustrated folk atlas. Discover Yakshagana in Karnataka, Kathakali in Kerala, Warli art in Maharashtra, and Baul poetry in Bengal with category-specific pins.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('events')}
              className="px-5 py-3 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs sm:text-sm font-bold shadow-warm transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">travel_explore</span>
              <span>Open India Atlas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Top Highlight Row: Culture Locket Widget & Coming Up Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Signature Culture Locket */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-terra-primary text-xl">auto_stories</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-cocoa-text">
                Your Culture Locket
              </h2>
            </div>
            <button
              onClick={() => onNavigate('locket')}
              className="text-xs font-bold text-terra-primary hover:underline flex items-center gap-1"
            >
              <span>Dialect Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeLocketMoment ? (
            <CultureLocketCard
              moment={activeLocketMoment}
              onOpenCreate={onOpenLocketModal}
              onReact={onReactLocket}
            />
          ) : (
            <div className="p-8 rounded-3xl bg-surface-container/60 border border-blush-surface text-center">
              <p className="text-sm text-cocoa-text/70">No active pulse today. Send one to your connection!</p>
              <button
                onClick={onOpenLocketModal}
                className="mt-3 px-4 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold"
              >
                Send Moment
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Coming Up Next / Saved Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-ochre-accent text-xl">event_upcoming</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-cocoa-text">
                Coming Up on Campus
              </h2>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-bold text-terra-primary hover:underline flex items-center gap-1"
            >
              <span>Explore Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(comingUpEvents.length > 0 ? comingUpEvents : uniqueEvents.slice(0, 2)).map(evt => (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="p-4 rounded-2xl bg-surface-container-lowest border border-blush-surface hover:border-terra-primary/40 shadow-xs hover:shadow-warm transition-all cursor-pointer flex items-center gap-3.5"
              >
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary">
                    {evt.categoryLabel.split(' ')[0]}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-cocoa-text truncate">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-cocoa-text/70 mt-0.5 truncate flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-terra-primary" />
                    <span>{evt.date}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Section: Picked for You (Explainable Cultural Recommendations) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ochre-accent" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
                Picked for You ({pickedEvents.length})
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-cocoa-text/70 mt-0.5">
              Ranked dynamically for your roots:{' '}
              <span className="font-bold text-terra-primary">
                {activeInterestLabels.join(', ') || 'All Traditions'}
              </span>
            </p>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="text-xs sm:text-sm font-bold text-terra-primary hover:underline flex items-center gap-1"
          >
            <span>View All ({uniqueEvents.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* When pickedEvents is empty (Zero events present for this topic) */}
        {pickedEvents.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-surface-container/70 border-2 border-dashed border-blush-surface text-center space-y-5 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-terra-primary/10 border border-terra-primary/20 flex items-center justify-center text-terra-primary shadow-xs">
              <CalendarX2 className="w-7 h-7" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terra-primary/10 text-terra-primary text-xs font-bold">
                <span>0 Events Present</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
                No events present for this topic
              </h3>
              <p className="text-xs sm:text-sm text-cocoa-text/75 leading-relaxed font-medium">
                There are currently zero gatherings scheduled for{' '}
                <span className="font-bold text-terra-primary">
                  {activeInterestLabels.join(', ') || 'your selected roots'}
                </span>
                . Since there are no events in this specific topic right now, you can explore other active cultural topics below or propose a new community gathering!
              </p>
            </div>

            {/* Alternative Topics to Explore */}
            {alternativeCategories.length > 0 && (
              <div className="pt-3 max-w-2xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-cocoa-text/60 mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
                  <span>Since no events are present in this topic, explore these other topics:</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {alternativeCategories.map(alt => (
                    <button
                      key={alt.id}
                      onClick={() => {
                        if (onUpdateInterests) {
                          onUpdateInterests([alt.id]);
                        } else {
                          onNavigate('events');
                        }
                      }}
                      className="px-4 py-2 rounded-full bg-surface-container-lowest hover:bg-terra-primary/10 border border-blush-surface hover:border-terra-primary/30 text-cocoa-text hover:text-terra-primary text-xs font-bold transition-all shadow-xs flex items-center gap-2 group cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-terra-primary group-hover:scale-110 transition-transform">
                        {alt.icon}
                      </span>
                      <span>{alt.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-cocoa-text/80 font-semibold">
                        {alt.count} {alt.count === 1 ? 'event' : 'events'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (onUpdateInterests) onUpdateInterests([]);
                  onNavigate('events');
                }}
                className="px-5 py-2.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs sm:text-sm font-bold shadow-warm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore All Cultural Gatherings ({uniqueEvents.length})</span>
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
          /* Event Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pickedEvents.slice(0, 3).map(evt => (
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
      </section>

      {/* 4. Section: Find Your People (Explainable Matching Preview) */}
      <section className="space-y-4 pt-4 border-t border-blush-surface/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-terra-primary" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
                Kindred Minds & Dialect Mentors
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-cocoa-text/70 mt-0.5">
              Opted-in community members matched with your <span className="font-semibold text-terra-primary">{activeInterestLabels.slice(0, 2).join(' & ') || 'cultural roots'}</span> and conversation goals.
            </p>
          </div>

          <button
            onClick={() => onNavigate('people')}
            className="text-xs sm:text-sm font-bold text-terra-primary hover:underline flex items-center gap-1"
          >
            <span>See All People ({people.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rankedPeople.slice(0, 2).map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onConnect={() => onSelectPerson && onSelectPerson(person)}
              onStartChat={() => onNavigate('messages')}
              onSendLocketPulse={() => onOpenLocketModal(person)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

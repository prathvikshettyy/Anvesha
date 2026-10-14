import React, { useState } from 'react';
import { Search, Sparkles, Calendar, Users, MapPin, ArrowRight, Mic, Heart, Bookmark } from 'lucide-react';
import CultureLocketCard from '../components/CultureLocketCard';
import EventCard from '../components/EventCard';
import PersonCard from '../components/PersonCard';

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
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events based on search or user interests
  const searchFilteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.categoryLabel.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)
    );
  });

  // Picked for you: events matching user's selected interests
  const pickedEvents = searchFilteredEvents.filter(e =>
    user.interests.includes(e.category)
  );

  // Coming up: saved events or nearest events
  const comingUpEvents = events.filter(e =>
    savedEvents.includes(e.id)
  );

  const activeLocketMoment = locketMoments[0];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
      
      {/* 1. Hero Welcome & Search Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-blush-surface/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
              Namaskara, {user.name.split(' ')[0]}
            </h1>
            <span className="text-xl">🌿</span>
          </div>
          <p className="text-sm text-cocoa-text/75 mt-1">
            4 cultural gatherings happening near your campus this week.
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

      {/* 2. Top Highlight Row: Culture Locket Widget & Coming Up Calendar */}
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
            {(comingUpEvents.length > 0 ? comingUpEvents : events.slice(0, 2)).map(evt => (
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
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ochre-accent" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
                Picked for You
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-cocoa-text/70 mt-0.5">
              Ranked by your selected interests: <span className="font-medium text-terra-primary">Dialects, Heritage & Traditional Crafts</span>
            </p>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="text-xs sm:text-sm font-bold text-terra-primary hover:underline flex items-center gap-1"
          >
            <span>View All ({events.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(pickedEvents.length > 0 ? pickedEvents : events).slice(0, 3).map(evt => (
            <EventCard
              key={evt.id}
              event={evt}
              isSaved={savedEvents.includes(evt.id)}
              onToggleSave={onToggleSave}
              onSelect={onSelectEvent}
            />
          ))}
        </div>
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
              Opted-in community members matching your learning goals and cultural roots.
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
          {people.slice(0, 2).map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onConnect={() => {}}
              onStartChat={() => onNavigate('messages')}
              onSendLocketPulse={() => onOpenLocketModal(person)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

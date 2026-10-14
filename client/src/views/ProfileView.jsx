import React, { useState } from 'react';
import { User, Bookmark, Heart, Shield, Settings, Sparkles, MapPin, CheckCircle, ExternalLink } from 'lucide-react';
import { INITIAL_INTERESTS } from '../data/initialData';
import EventCard from '../components/EventCard';

export default function ProfileView({
  user,
  events,
  savedEvents,
  onToggleSave,
  onSelectEvent,
  onUpdateUser,
  onResetDemo,
  onSaveProfile
}) {
  const [activeTab, setActiveTab] = useState('SAVED'); // 'SAVED', 'INTERESTS', 'PRIVACY'
  const [isDiscoverable, setIsDiscoverable] = useState(user.isDiscoverable);
  const [fuzzedLocation, setFuzzedLocation] = useState(user.fuzzedLocation ?? true);

  const bookmarkedEvents = events.filter(e => savedEvents.includes(e.id));

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-8">
      
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border-2 border-blush-surface shadow-warm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-terra-primary/40 shadow-md"
        />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
                {user.name}
              </h1>
              <p className="text-xs text-cocoa-text/60 mt-0.5">{user.handle}</p>
            </div>

            <button
              onClick={onResetDemo}
              className="text-xs font-semibold px-4 py-1.5 rounded-full border border-blush-surface text-cocoa-text hover:bg-blush-surface/50 transition-all self-center sm:self-auto"
            >
              Reset Demo Session
            </button>
          </div>

          <p className="text-xs sm:text-sm text-cocoa-text/80 mt-3 max-w-2xl leading-relaxed">
            {user.bio}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-cocoa-text/75">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-terra-primary" />
              <span>{user.neighborhood}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active Culture Circle Member</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-blush-surface flex items-center gap-6">
        <button
          onClick={() => setActiveTab('SAVED')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'SAVED'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Gatherings ({bookmarkedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INTERESTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'INTERESTS'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Cultural Interests ({user.interests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRIVACY')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PRIVACY'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & Discovery</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'SAVED' && (
        <div>
          {bookmarkedEvents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container/60 border border-blush-surface">
              <p className="text-sm text-cocoa-text/70">You haven't saved any gatherings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedEvents.map(evt => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isSaved={true}
                  onToggleSave={onToggleSave}
                  onSelect={onSelectEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'INTERESTS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-blush-surface space-y-4">
          <h3 className="font-serif text-xl font-bold text-cocoa-text">Active Cultural Domains</h3>
          <p className="text-xs text-cocoa-text/70">These determine your explainable match scores with peers and events.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {INITIAL_INTERESTS.filter(i => user.interests.includes(i.id)).map(item => (
              <div key={item.id} className="p-3.5 rounded-2xl bg-surface-container/60 border border-blush-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-terra-primary text-xl">{item.icon}</span>
                <div>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-cocoa-text">{item.name}</h4>
                  <span className="text-[10px] text-terra-primary font-bold">Active Interest</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PRIVACY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-blush-surface space-y-6">
          <h3 className="font-serif text-xl font-bold text-cocoa-text">Privacy by Design Settings</h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/60 border border-blush-surface">
              <div>
                <h4 className="font-bold text-cocoa-text">Public Discoverability</h4>
                <p className="text-xs text-cocoa-text/70 mt-0.5">Allow other students and elders to find your profile based on shared dialects</p>
              </div>
              <input
                type="checkbox"
                checked={isDiscoverable}
                onChange={() => {
                  const next = !isDiscoverable;
                  setIsDiscoverable(next);
                  onSaveProfile?.({ is_discoverable: next ? 1 : 0 });
                }}
                className="w-5 h-5 accent-terra-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/60 border border-blush-surface">
              <div>
                <h4 className="font-bold text-cocoa-text">Neighborhood Geohashing Halo</h4>
                <p className="text-xs text-cocoa-text/70 mt-0.5">Fuzz your location into a broad 500m zone. Exact dorm numbers and hostel rooms are never shared.</p>
              </div>
              <input
                type="checkbox"
                checked={fuzzedLocation}
                onChange={() => {
                  const next = !fuzzedLocation;
                  setFuzzedLocation(next);
                  onSaveProfile?.({ fuzzed_location: next ? 1 : 0 });
                }}
                className="w-5 h-5 accent-terra-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

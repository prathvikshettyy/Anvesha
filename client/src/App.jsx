import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WelcomeView from './views/WelcomeView';
import OnboardingView from './views/OnboardingView';
import HomeView from './views/HomeView';
import EventsView from './views/EventsView';
import PeopleView from './views/PeopleView';
import LocketView from './views/LocketView';
import MessagesView from './views/MessagesView';
import ProfileView from './views/ProfileView';

import EventDetailModal from './components/EventDetailModal';
import LocketModal from './components/LocketModal';
import SubmitEventModal from './components/SubmitEventModal';

import {
  INITIAL_USER,
  INITIAL_EVENTS,
  INITIAL_PEOPLE,
  INITIAL_LOCKET_MOMENTS
} from './data/initialData';

import * as api from './services/api';

function normalizeUser(u) {
  if (!u) return INITIAL_USER;
  return {
    ...INITIAL_USER,
    ...u,
    avatar: u.avatar_url || u.avatar || INITIAL_USER.avatar,
    isDiscoverable: u.is_discoverable !== undefined ? Boolean(u.is_discoverable) : (u.isDiscoverable ?? true),
    preferredMode: u.preferred_mode || u.preferredMode || 'BOTH',
    interests: Array.isArray(u.interests)
      ? u.interests.map(i => typeof i === 'string' ? i : i.interest_id)
      : INITIAL_USER.interests,
    savedEvents: u.saved_event_ids || u.savedEvents || INITIAL_USER.savedEvents,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [user, setUser] = useState(INITIAL_USER);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [locketMoments, setLocketMoments] = useState(INITIAL_LOCKET_MOMENTS);
  const [savedEvents, setSavedEvents] = useState(INITIAL_USER.savedEvents);
  const [backendConnected, setBackendConnected] = useState(false);

  // Modals
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [isLocketModalOpen, setIsLocketModalOpen] = useState(false);
  const [locketRecipient, setLocketRecipient] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Initial Data Sync with SQLite Backend
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      try {
        // 1. Check if backend is alive
        const health = await api.health();
        if (!health || health.status !== 'ok') return;

        if (!isMounted) return;
        setBackendConnected(true);

        // 2. Ensure auth token is active; if not, log in as demo user
        let meUser = null;
        try {
          if (api.token.get()) {
            meUser = await api.auth.me();
          } else {
            const loginRes = await api.auth.login({ username: 'rohan', password: 'demo1234' });
            meUser = loginRes.user;
          }
        } catch {
          // If token expired, re-login as demo
          try {
            const loginRes = await api.auth.login({ username: 'rohan', password: 'demo1234' });
            meUser = loginRes.user;
          } catch (err) {
            console.warn('[Sync] Auto-login demo failed, continuing with cached session:', err);
          }
        }

        if (meUser && isMounted) {
          setUser(normalizeUser(meUser));
        }

        // 3. Fetch real events from SQLite
        try {
          const remoteEvents = await api.events.list();
          if (Array.isArray(remoteEvents) && remoteEvents.length > 0 && isMounted) {
            setEvents(remoteEvents);
          }
        } catch (e) {
          console.warn('[Sync] Events fetch error:', e);
        }

        // 4. Fetch discoverable people with real Jaccard match scores
        try {
          const remotePeople = await api.people.discover();
          if (Array.isArray(remotePeople) && remotePeople.length > 0 && isMounted) {
            setPeople(remotePeople);
          }
        } catch (e) {
          console.warn('[Sync] People fetch error:', e);
        }

        // 5. Fetch culture locket moments
        try {
          const remoteLockets = await api.locket.list();
          if (Array.isArray(remoteLockets) && remoteLockets.length > 0 && isMounted) {
            setLocketMoments(remoteLockets);
          }
        } catch (e) {
          console.warn('[Sync] Locket fetch error:', e);
        }

        // 6. Fetch user's saved events
        try {
          const savedRows = await api.events.saved();
          if (Array.isArray(savedRows) && isMounted) {
            setSavedEvents(savedRows.map(r => r.id));
          }
        } catch (e) {
          console.warn('[Sync] Saved events fetch error:', e);
        }

      } catch (err) {
        console.info('[ShareSpot] Backend unavailable or offline. Using standalone preview mode:', err?.message || err);
        if (isMounted) setBackendConnected(false);
      }
    }

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleToggleSave = async (eventId) => {
    // Optimistic UI update
    setSavedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );

    if (backendConnected) {
      try {
        await api.events.toggleSave(eventId);
      } catch (err) {
        console.error('[API] toggleSave failed:', err);
      }
    }
  };

  const handleAddEvent = async (newEvent) => {
    if (backendConnected) {
      try {
        const persisted = await api.events.submit({
          title: newEvent.title,
          category: newEvent.category,
          date_label: newEvent.date,
          datetime_iso: newEvent.datetime,
          venue: newEvent.venue,
          neighborhood: newEvent.neighborhood,
          lat: newEvent.lat,
          lng: newEvent.lng,
          organizer: newEvent.organizer,
          image_url: newEvent.image,
          description: newEvent.description,
          source_url: newEvent.sourceUrl,
        });
        setEvents(prev => [persisted || newEvent, ...prev]);
        return;
      } catch (err) {
        console.error('[API] Submit event failed, saving locally:', err);
      }
    }
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleSendLocketMoment = async (newMoment) => {
    if (backendConnected) {
      try {
        const persisted = await api.locket.create({
          moment_type: newMoment.momentType,
          vernacular_text: newMoment.vernacularText,
          phonetic_text: newMoment.phoneticText,
          meaning: newMoment.meaning,
          provenance: newMoment.provenance,
          audio_duration: newMoment.audioDuration,
          recipient_id: locketRecipient?.id || null,
        });
        setLocketMoments(prev => [persisted || newMoment, ...prev]);
        return;
      } catch (err) {
        console.error('[API] Locket create failed, saving locally:', err);
      }
    }
    setLocketMoments(prev => [newMoment, ...prev]);
  };

  const handleConnectPerson = async (personId) => {
    setPeople(prev =>
      prev.map(p => p.id === personId ? { ...p, connectionStatus: 'CONNECTED' } : p)
    );

    if (backendConnected) {
      try {
        await api.people.connect(personId);
      } catch (err) {
        console.error('[API] Connect person failed:', err);
      }
    }
  };

  const handleReactLocket = async (momentId, text) => {
    if (backendConnected) {
      try {
        await api.locket.react(momentId, text);
      } catch (err) {
        console.error('[API] Locket react failed:', err);
      }
    }
  };

  const handleOpenLocketForPerson = (person) => {
    setLocketRecipient(person);
    setIsLocketModalOpen(true);
  };

  const handleOnboardingComplete = async (preferences) => {
    setUser(prev => ({
      ...prev,
      ...preferences
    }));

    if (backendConnected) {
      try {
        await api.auth.updateMe({
          interests: preferences.interests,
          preferred_mode: preferences.preferredMode,
          neighborhood: preferences.neighborhood
        });
      } catch (err) {
        console.error('[API] updateMe failed:', err);
      }
    }

    setCurrentView('home');
  };

  const handleResetDemo = () => {
    api.token.clear();
    setUser(INITIAL_USER);
    setEvents(INITIAL_EVENTS);
    setPeople(INITIAL_PEOPLE);
    setLocketMoments(INITIAL_LOCKET_MOMENTS);
    setSavedEvents(INITIAL_USER.savedEvents);
    setCurrentView('welcome');
  };

  return (
    <div className="min-h-screen bg-cream-canvas text-cocoa-text flex flex-col font-sans selection:bg-terra-primary/20 selection:text-cocoa-text">
      
      {/* Top Navbar (visible on all screens except onboarding & welcome, though accessible if desired) */}
      {currentView !== 'welcome' && currentView !== 'onboarding' && (
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          unreadCount={1}
          savedCount={savedEvents.length}
          user={user}
          backendConnected={backendConnected}
        />
      )}

      {/* Main View Switcher */}
      <main className="flex-1 pb-16 md:pb-8">
        {currentView === 'welcome' && (
          <WelcomeView
            onGetStarted={() => setCurrentView('onboarding')}
            onExploreDemo={() => setCurrentView('home')}
          />
        )}

        {currentView === 'onboarding' && (
          <OnboardingView
            initialUserInterests={user.interests}
            onComplete={handleOnboardingComplete}
          />
        )}

        {currentView === 'home' && (
          <HomeView
            user={user}
            events={events}
            people={people}
            locketMoments={locketMoments}
            savedEvents={savedEvents}
            onToggleSave={handleToggleSave}
            onSelectEvent={setActiveDetailEvent}
            onSelectPerson={(p) => {
              setLocketRecipient(p);
              setCurrentView('people');
            }}
            onOpenLocketModal={() => {
              setLocketRecipient(null);
              setIsLocketModalOpen(true);
            }}
            onReactLocket={(id, text) => {}}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'events' && (
          <EventsView
            events={events}
            people={people}
            savedEvents={savedEvents}
            onToggleSave={handleToggleSave}
            onSelectEvent={setActiveDetailEvent}
            onSelectPerson={(p) => {
              setLocketRecipient(p);
              setCurrentView('people');
            }}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        )}

        {currentView === 'people' && (
          <PeopleView
            people={people}
            onConnect={handleConnectPerson}
            onStartChat={() => setCurrentView('messages')}
            onSendLocketPulse={handleOpenLocketForPerson}
          />
        )}

        {currentView === 'locket' && (
          <LocketView
            locketMoments={locketMoments}
            onOpenLocketModal={() => {
              setLocketRecipient(null);
              setIsLocketModalOpen(true);
            }}
            onReactLocket={(id, text) => {}}
          />
        )}

        {currentView === 'messages' && (
          <MessagesView
            onOpenLocketModal={() => {
              setLocketRecipient(null);
              setIsLocketModalOpen(true);
            }}
          />
        )}

        {currentView === 'saved' && (
          <ProfileView
            user={user}
            events={events}
            savedEvents={savedEvents}
            onToggleSave={handleToggleSave}
            onSelectEvent={setActiveDetailEvent}
            onUpdateUser={setUser}
            onResetDemo={handleResetDemo}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            user={user}
            events={events}
            savedEvents={savedEvents}
            onToggleSave={handleToggleSave}
            onSelectEvent={setActiveDetailEvent}
            onUpdateUser={setUser}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Global Modals */}
      <EventDetailModal
        event={activeDetailEvent}
        isOpen={!!activeDetailEvent}
        onClose={() => setActiveDetailEvent(null)}
        isSaved={activeDetailEvent ? savedEvents.includes(activeDetailEvent.id) : false}
        onToggleSave={handleToggleSave}
      />

      <LocketModal
        isOpen={isLocketModalOpen}
        onClose={() => setIsLocketModalOpen(false)}
        onSendMoment={handleSendLocketMoment}
        defaultRecipient={locketRecipient}
      />

      <SubmitEventModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}

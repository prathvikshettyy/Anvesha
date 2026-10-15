import React, { useState, useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket } from './services/socket';
import Sidebar from './components/Sidebar';
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
import AestheticMandalaBg from './components/AestheticMandalaBg';

import {
  INITIAL_USER,
  INITIAL_EVENTS,
  INITIAL_PEOPLE,
  INITIAL_LOCKET_MOMENTS
} from './data/initialData';

import * as api from './services/api';
import { dedupeEvents } from './views/HomeView';
import { io } from 'socket.io-client';
import { generateIdenticon } from './utils/identicon';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a backend user into the shape initialData uses in views */
function normaliseUser(backendUser) {
  if (!backendUser) return null;
  return {
    ...INITIAL_USER,               // keep all UI-only fields as defaults
    id: backendUser.id,
    name: backendUser.name ?? INITIAL_USER.name,
    handle: backendUser.handle ?? INITIAL_USER.handle,
    avatar: backendUser.avatar_url || (backendUser.username ? generateIdenticon(backendUser.username) : INITIAL_USER.avatar),
    bio: backendUser.bio ?? INITIAL_USER.bio,
    state: backendUser.state ?? INITIAL_USER.state,
    city: backendUser.city ?? INITIAL_USER.city,
    neighborhood: backendUser.neighborhood ?? INITIAL_USER.neighborhood,
    preferredMode: backendUser.preferred_mode ?? INITIAL_USER.preferredMode,
    isDiscoverable: backendUser.is_discoverable !== undefined
      ? Boolean(backendUser.is_discoverable)
      : INITIAL_USER.isDiscoverable,
    fuzzedLocation: backendUser.fuzzed_location !== undefined
      ? Boolean(backendUser.fuzzed_location)
      : true,
    // Map interest array [{interest_id, intention}] → [id, id, ...]
    interests: Array.isArray(backendUser.interests)
      ? backendUser.interests.map(i => i.interest_id ?? i)
      : INITIAL_USER.interests,
    savedEvents: Array.isArray(backendUser.saved_event_ids)
      ? backendUser.saved_event_ids
      : INITIAL_USER.savedEvents,
  };
}

/**
 * Map a backend /api/people response item → shape expected by PersonCard.
 * The backend already returns most fields pre-shaped for the UI (camelCase
 * matchScore/matchReason/broadRegion/etc.) — this just fills in sensible
 * fallbacks for demo/guest mode data, which uses a slightly different shape.
 */
function normalisePerson(p) {
  return {
    id: p.id,
    name: p.name,
    handle: p.handle ?? `@${p.username}`,
    avatar: p.avatar || p.avatar_url || (p.username ? generateIdenticon(p.username) : '/avatars/rohan.jpg'),
    bio: p.bio ?? '',
    city: p.city ?? 'India',
    broadRegion: p.broadRegion ?? p.city ?? p.neighborhood ?? 'India',
    neighborhood: p.neighborhood ?? 'Nearby',
    speaks: p.speaks ?? p.languages ?? [],
    interests: Array.isArray(p.interests) ? p.interests.map(i => i.interest_id ?? i) : [],
    willingToTeach: p.willingToTeach ?? (Array.isArray(p.skills) ? p.skills.filter(s => s.skill_type === 'TEACH').map(s => s.skill) : []),
    wantsToLearn: p.wantsToLearn ?? (Array.isArray(p.skills) ? p.skills.filter(s => s.skill_type === 'LEARN').map(s => s.skill) : []),
    matchScore: p.matchScore ?? p.match_score ?? null,
    matchReason: p.matchReason ?? '',
    matchReasons: Array.isArray(p.matchReasons) ? p.matchReasons : [],
    mutualConnections: p.mutualConnections ?? 0,
    connectionStatus: p.connectionStatus ?? p.connection_status ?? 'NONE',
    isMentor: p.isMentor ?? p.is_mentor ?? false,
  };
}

/** Map a backend locket moment → shape expected by CultureLocketCard */
function normaliseMoment(m) {
  return {
    id: m.id,
    senderId: m.sender_id ?? m.senderId,
    senderName: m.sender_name ?? m.senderName ?? 'Community Member',
    senderAvatar: m.sender_avatar ?? m.senderAvatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    momentType: m.moment_type ?? m.momentType,
    title: m.title ?? (m.moment_type === 'WORD_OF_DAY' ? 'Dialect Word of the Day' : 'Cultural Moment'),
    vernacularText: m.vernacular_text ?? m.vernacularText ?? '',
    phoneticText: m.phonetic_text ?? m.phoneticText ?? '',
    meaning: m.meaning ?? '',
    provenance: m.provenance ?? '',
    audioUrl: m.audio_url ?? m.audioUrl ?? '',
    imageUrl: m.image_url ?? m.imageUrl ?? m.image ?? '',
    image: m.image_url ?? m.imageUrl ?? m.image ?? '',
    audioDuration: m.audio_duration ?? m.audioDuration ?? '0:04',
    timestamp: m.timestamp ?? (m.timestamp_iso
      ? new Date(m.timestamp_iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : m.created_at
        ? new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : 'Recently'),
    reactions: Array.isArray(m.reactions) ? m.reactions : [],
  };
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [authUser, setAuthUser] = useState(null);   // raw backend user
  const [user, setUser] = useState(INITIAL_USER); // normalised UI user
  const [events, setEvents] = useState(() => dedupeEvents(INITIAL_EVENTS));
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [locketMoments, setLocketMoments] = useState(INITIAL_LOCKET_MOMENTS);
  const [savedEvents, setSavedEvents] = useState(INITIAL_USER.savedEvents);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [isLocketModalOpen, setIsLocketModalOpen] = useState(false);
  const [locketRecipient, setLocketRecipient] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [connectTab, setConnectTab] = useState('communities'); // 'communities' | 'messages'
  const [targetCommunityId, setTargetCommunityId] = useState(null);
  const [communities, setCommunities] = useState([]);

  const loadCommunities = useCallback(() => {
    api.communities.list()
      .then(list => {
        if (Array.isArray(list)) setCommunities(list);
      })
      .catch(err => console.warn('Could not load communities in App:', err));
  }, []);

  const handleJoinCommunity = async (comm) => {
    if (!comm) return;
    const commId = comm.id || comm.slug;
    if (authUser && api.token.get()) {
      try {
        await api.communities.join(commId);
      } catch (err) {
        console.warn('API error joining community:', err);
      }
    }
    setCommunities(prev => {
      const exists = prev.some(c => c.id === commId || c.slug === commId);
      if (exists) {
        return prev.map(c => (c.id === commId || c.slug === commId)
          ? { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 }
          : c
        );
      }
      return [...prev, { ...comm, isMember: true, memberCount: (comm.memberCount || 0) + 1 }];
    });
  };

  const handleOpenCommunity = (comm, autoJoin = false) => {
    if (autoJoin) {
      handleJoinCommunity(comm);
    }
    setActiveDetailEvent(null);
    setTargetCommunityId(comm.id || comm.slug);
    setConnectTab('communities');
    setCurrentView('messages');
  };

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = sessionStorage.getItem('ss_token');
    if (savedToken) {
      api.auth.me()
        .then(backendUser => {
          const u = normaliseUser(backendUser);
          setAuthUser(backendUser);
          setUser(u);
          setSavedEvents(u.savedEvents);
          setCurrentView('home');
        })
        .catch(() => {
          // Invalid/expired token — clear it and stay on welcome
          api.token.clear();
        });
    }
  }, []);

  // ── Fetch real events ───────────────────────────────────────────────────────
  const loadEvents = useCallback(() => {
    api.events.list()
      .then(list => setEvents(dedupeEvents(list)))
      .catch(() => setEvents(dedupeEvents(INITIAL_EVENTS)));
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // ── Fetch real people (only when logged in) ─────────────────────────────────
  const loadPeople = useCallback(() => {
    if (!api.token.get()) return;
    api.people.discover()
      .then(list => setPeople(list.map(normalisePerson)))
      .catch(() => {/* keep initialData */ });
  }, []);

  // ── Fetch real locket moments (available for both authenticated users & guests)
  const loadLocket = useCallback(() => {
    api.locket.list()
      .then(list => {
        if (Array.isArray(list)) {
          setLocketMoments(list.map(normaliseMoment));
        }
      })
      .catch(() => {/* keep initialData */ });
  }, []);

  // Fetch moments on mount and refresh periodically / on window focus
  useEffect(() => {
    loadLocket();
    const interval = setInterval(loadLocket, 10000);
    const onFocus = () => loadLocket();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadLocket]);

  // Reload community and social data when user logs in
  useEffect(() => {
    loadCommunities();
    if (authUser) {
      loadPeople();
      loadLocket();
    }
  }, [authUser, loadPeople, loadLocket, loadCommunities]);

  // ── Authenticated Socket.IO connection & connection-scoped realtime sync ──────
  useEffect(() => {
    const t = api.token.get();
    if (authUser && t) {
      const socket = connectSocket(t);
      if (socket) {
        const handleNewMoment = (newMoment) => {
          if (!newMoment) return;
          const norm = normaliseMoment(newMoment);
          setLocketMoments(prev => {
            if (prev.some(m => m.id === norm.id)) return prev;
            return [norm, ...prev];
          });
        };
        socket.off('locket:new', handleNewMoment);
        socket.on('locket:new', handleNewMoment);
        return () => {
          socket.off('locket:new', handleNewMoment);
        };
      }
    } else {
      disconnectSocket();
    }
    return () => { };
  }, [authUser]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // ── Auth handlers ───────────────────────────────────────────────────────────
  const handleLogin = async (username, password) => {
    const { user: backendUser } = await api.auth.login({ username, password });
    const u = normaliseUser(backendUser);
    setAuthUser(backendUser);
    setUser(u);
    setSavedEvents(u.savedEvents);
    loadPeople();
    loadLocket();
    return u;
  };

  const handleRegister = async (data) => {
    const { user: backendUser } = await api.auth.register(data);
    const u = normaliseUser(backendUser);
    setAuthUser(backendUser);
    setUser(u);
    setSavedEvents([]);
    return u;
  };

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleToggleSave = async (eventId) => {
    // Optimistic toggle
    setSavedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
    // Persist to backend if logged in
    if (api.token.get()) {
      api.events.toggleSave(eventId).catch(() => {
        // Roll back on error
        setSavedEvents(prev =>
          prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
        );
      });
    }
  };

  const handleAddEvent = (newEvent) => {
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleSendLocketMoment = (newMoment) => {
    setLocketMoments(prev => [newMoment, ...prev]);
  };

  const handleConnectPerson = async (personId) => {
    // Optimistic UI
    setPeople(prev =>
      prev.map(p => p.id === personId ? { ...p, connectionStatus: 'CONNECTED' } : p)
    );
    if (api.token.get()) {
      api.people.connect(personId).catch(() => {
        setPeople(prev =>
          prev.map(p => p.id === personId ? { ...p, connectionStatus: 'NONE' } : p)
        );
      });
    }
  };

  const handleOpenLocketForPerson = (person) => {
    setLocketRecipient(person);
    setIsLocketModalOpen(true);
  };

  const handleOnboardingComplete = async (preferences) => {
    // Optimistic local update so UI reacts immediately
    setUser(prev => ({ ...prev, ...preferences }));

    // If logged in, persist to backend and then sync state from DB
    if (api.token.get()) {
      try {
        await api.auth.updateMe({
          state: preferences.state,
          city: preferences.city,
          neighborhood: preferences.neighborhood,
          preferred_mode: preferences.preferredMode,
          interests: preferences.interests, // already [{interest_id, intention}]
        });
        // Re-fetch /me so authUser and user are in sync with what is now in DB
        const refreshed = await api.auth.me();
        const u = normaliseUser(refreshed);
        setAuthUser(refreshed);
        setUser(u);
        loadPeople();
        loadLocket();
      } catch {
        // Non-fatal — local state already shows the picked interests
      }
    }
    setCurrentView('home');
  };

  const handleUpdateInterests = async (newInterests) => {
    setUser(prev => ({
      ...prev,
      interests: newInterests,
    }));
    if (authUser && api.token.get()) {
      try {
        await api.auth.updateMe({
          interests: newInterests.map(id => ({ interest_id: id, intention: 'CASUAL_ENTHUSIAST' }))
        });
      } catch (_) { }
    }
  };

  const handleResetDemo = () => {
    disconnectSocket();
    api.auth.logout();
    setAuthUser(null);
    setUser(INITIAL_USER);
    setEvents(INITIAL_EVENTS);
    setPeople(INITIAL_PEOPLE);
    setLocketMoments(INITIAL_LOCKET_MOMENTS);
    setSavedEvents(INITIAL_USER.savedEvents);
    setUnreadCount(0);
    setCurrentView('welcome');
    // Reload public events
    loadEvents();
  };

  const handleReactLocket = async (momentId, text) => {
    if (api.token.get()) {
      try {
        await api.locket.react(momentId, text);
        loadLocket();
      } catch (_) { }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`relative min-h-screen bg-cream-canvas text-cocoa-text flex font-sans selection:bg-terra-primary/20 selection:text-cocoa-text ${currentView === 'welcome' ? 'h-screen overflow-hidden flex-col' : 'flex-col md:flex-row'
      }`}>

      {/* Ambient Transparent Mandala & Sacred Geometry Background Layer */}
      <AestheticMandalaBg />

      {/* Left Sidebar (visible on all screens except onboarding & welcome) */}
      {currentView !== 'welcome' && currentView !== 'onboarding' && (
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          unreadCount={unreadCount}
          savedCount={savedEvents.length}
          user={user}
          onSignOut={handleResetDemo}
        />
      )}

      {/* Main View Container */}
      <main className={`flex-1 min-w-0 ${currentView === 'welcome' ? 'h-full overflow-hidden p-0' : 'overflow-y-auto pb-16 md:pb-8'}`}>
        {currentView === 'welcome' && (
          <WelcomeView
            onGetStarted={() => setCurrentView('onboarding')}
            onExploreDemo={() => setCurrentView('home')}
            onExploreIndia={() => setCurrentView('events')}
            onDiscoverEvents={() => setCurrentView('events')}
            onNavigate={setCurrentView}
            onLogin={handleLogin}
            onRegister={handleRegister}
            events={events}
            people={people}
            savedEvents={savedEvents}
            onToggleSave={handleToggleSave}
            onSelectEvent={setActiveDetailEvent}
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
            onReactLocket={handleReactLocket}
            onNavigate={(view, extra) => {
              if (view === 'messages' && extra) setChatPartner(extra);
              setCurrentView(view);
            }}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            onUpdateInterests={handleUpdateInterests}
          />
        )}

        {currentView === 'events' && (
          <EventsView
            user={user}
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
            user={user}
            people={people}
            onConnect={handleConnectPerson}
            onStartChat={(person) => {
              setChatPartner(person);
              setCurrentView('messages');
            }}
            onSendLocketPulse={handleOpenLocketForPerson}
            isAuthenticated={!!authUser}
          />
        )}

        {currentView === 'locket' && (
          <LocketView
            locketMoments={locketMoments}
            currentUser={user}
            onOpenLocketModal={() => {
              setLocketRecipient(null);
              setIsLocketModalOpen(true);
            }}
            onReactLocket={handleReactLocket}
            onFindPeople={() => setCurrentView('people')}
          />
        )}

        {(currentView === 'messages' || currentView === 'communities') && (
          <MessagesView
            currentUser={user}
            initialPartner={chatPartner}
            onOpenLocketModal={() => {
              setLocketRecipient(null);
              setIsLocketModalOpen(true);
            }}
            isAuthenticated={!!authUser}
            onUnreadCountChange={setUnreadCount}
            authToken={api.token.get()}
            initialTab={currentView === 'communities' ? 'communities' : (currentView === 'messages' ? 'messages' : connectTab)}
            initialCommunityId={targetCommunityId}
            onSelectEvent={setActiveDetailEvent}
            onTabChange={(tab) => {
              setConnectTab(tab);
              if (currentView === 'messages' || currentView === 'communities') {
                setCurrentView(tab);
              }
            }}
          />
        )}

        {(currentView === 'saved' || currentView === 'profile') && (
          <ProfileView
            user={user}
            events={events}
            savedEvents={savedEvents}
            onToggleSave={handleToggleSave}
            onSelectEvent={setActiveDetailEvent}
            onUpdateUser={setUser}
            onResetDemo={handleResetDemo}
            isAuthenticated={!!authUser}
            onSaveProfile={async (updates) => {
              if (api.token.get()) {
                await api.auth.updateMe(updates);
                const refreshed = await api.auth.me();
                const u = normaliseUser(refreshed);
                setAuthUser(refreshed);
                setUser(u);
              }
            }}
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
        onOpenCommunity={handleOpenCommunity}
        onJoinCommunity={handleJoinCommunity}
        communities={communities}
        currentUser={user}
        isAuthenticated={!!authUser}
        onEventUpdated={(stats) => {
          setEvents(prev => prev.map(e => e.id === stats.id ? { ...e, averageRating: stats.averageRating, reviewCount: stats.reviewCount } : e));
        }}
      />

      <LocketModal
        isOpen={isLocketModalOpen}
        onClose={() => setIsLocketModalOpen(false)}
        onSendMoment={handleSendLocketMoment}
        defaultRecipient={locketRecipient}
        currentUser={user}
        isAuthenticated={!!authUser}
      />

      <SubmitEventModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onAddEvent={handleAddEvent}
        isAuthenticated={!!authUser}
      />
    </div>
  );
}

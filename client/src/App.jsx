import React, { useState, useEffect } from 'react';
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

import {
  INITIAL_USER,
  INITIAL_EVENTS,
  INITIAL_PEOPLE,
  INITIAL_LOCKET_MOMENTS
} from './data/initialData';

export default function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [user, setUser] = useState(INITIAL_USER);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [locketMoments, setLocketMoments] = useState(INITIAL_LOCKET_MOMENTS);
  const [savedEvents, setSavedEvents] = useState(INITIAL_USER.savedEvents);

  // Modals
  const [activeDetailEvent, setActiveDetailEvent] = useState(null);
  const [isLocketModalOpen, setIsLocketModalOpen] = useState(false);
  const [locketRecipient, setLocketRecipient] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleToggleSave = (eventId) => {
    setSavedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleAddEvent = (newEvent) => {
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleSendLocketMoment = (newMoment) => {
    setLocketMoments(prev => [newMoment, ...prev]);
  };

  const handleConnectPerson = (personId) => {
    setPeople(prev =>
      prev.map(p => p.id === personId ? { ...p, connectionStatus: 'CONNECTED' } : p)
    );
  };

  const handleOpenLocketForPerson = (person) => {
    setLocketRecipient(person);
    setIsLocketModalOpen(true);
  };

  const handleOnboardingComplete = (preferences) => {
    setUser(prev => ({
      ...prev,
      ...preferences
    }));
    setCurrentView('home');
  };

  const handleResetDemo = () => {
    setUser(INITIAL_USER);
    setEvents(INITIAL_EVENTS);
    setPeople(INITIAL_PEOPLE);
    setLocketMoments(INITIAL_LOCKET_MOMENTS);
    setSavedEvents(INITIAL_USER.savedEvents);
    setCurrentView('welcome');
  };

  return (
    <div className={`min-h-screen bg-cream-canvas text-cocoa-text flex font-sans selection:bg-terra-primary/20 selection:text-cocoa-text ${
      currentView === 'welcome' ? 'flex-col' : 'flex-col md:flex-row'
    }`}>
      
      {/* Left Sidebar (visible on all screens except onboarding & welcome) */}
      {currentView !== 'welcome' && currentView !== 'onboarding' && (
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          unreadCount={1}
          savedCount={savedEvents.length}
          user={user}
          onSignOut={handleResetDemo}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-8">
        {currentView === 'welcome' && (
          <WelcomeView
            onGetStarted={() => setCurrentView('onboarding')}
            onExploreDemo={() => setCurrentView('home')}
            onExploreIndia={() => setCurrentView('events')}
            onDiscoverEvents={() => setCurrentView('events')}
            onNavigate={setCurrentView}
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

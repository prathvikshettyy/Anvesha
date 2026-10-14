import React from 'react';
import { Compass, Calendar, Users, MessageSquare, Bookmark, HeartHandshake, Mic } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, unreadCount = 1, savedCount = 2, user }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'events', label: 'Atlas & Events', icon: Calendar },
    { id: 'people', label: 'Find People', icon: Users },
    { id: 'locket', label: 'Culture Locket', icon: Mic, badge: 'Daily' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: unreadCount },
    { id: 'saved', label: 'Saved', icon: Bookmark, count: savedCount }
  ];

  return (
    <header className="sticky top-0 z-40 bg-cream-canvas/95 backdrop-blur-md border-b border-blush-surface/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentView('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-terra-primary flex items-center justify-center text-cream-canvas shadow-warm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">all_inclusive</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-cocoa-text">
                  <span className="text-terra-primary font-bold">αñà</span>nvesha
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blush-surface/60 text-cocoa-text border border-terra-primary/20">
                  Culture
                </span>
              </div>
              <p className="text-xs text-cocoa-text/60 hidden sm:block font-medium">Discover India. Find your story.</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-terra-primary text-cream-canvas shadow-warm'
                      : 'text-cocoa-text hover:bg-blush-surface/50 hover:text-cocoa-text'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-ochre-accent text-cocoa-text' : 'bg-terra-primary text-cream-canvas'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-cream-canvas text-terra-primary' : 'bg-terra-primary text-cream-canvas'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Demo Switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border transition-all ${
                currentView === 'profile'
                  ? 'border-terra-primary bg-blush-surface/40 ring-2 ring-terra-primary/20'
                  : 'border-blush-surface hover:bg-blush-surface/30'
              }`}
            >
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user?.name || "User Avatar"}
                className="w-8 h-8 rounded-full object-cover border border-terra-primary/30"
              />
              <span className="text-sm font-medium text-cocoa-text hidden sm:block">
                {user?.name?.split(' ')[0] || 'Rohan'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cream-canvas/98 border-t border-blush-surface py-2 px-3 flex justify-around backdrop-blur-md shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 relative ${
                isActive ? 'text-terra-primary font-bold' : 'text-cocoa-text/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label.split(' ')[0]}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-terra-primary" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}

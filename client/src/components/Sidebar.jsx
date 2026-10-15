import React from 'react';
import {
  Compass,
  Calendar,
  Users,
  MessageSquare,
  Bookmark,
  Mic,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  unreadCount = 0,
  savedCount = 0,
  user,
  onSignOut
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'events', label: 'Atlas & Events', icon: Calendar },
    { id: 'people', label: 'Find People', icon: Users },
    { id: 'locket', label: 'Culture Locket', icon: Mic, badge: 'Daily' },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: unreadCount },
    { id: 'saved', label: 'Saved Gatherings', icon: Bookmark, count: savedCount }
  ];

  return (
    <>
      {/* Desktop Left Sidebar (Fixed on the left side) */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-cream-canvas/98 border-r border-blush-surface/80 p-5 z-40 flex-shrink-0 select-none shadow-xs">

        {/* Top: Brand Header */}
        <div className="space-y-6">
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
                  <span className="text-terra-primary font-bold">अ</span>nvesha
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blush-surface/60 text-cocoa-text border border-terra-primary/20">
                  Culture
                </span>
              </div>
              <p className="text-[11px] text-cocoa-text/60 font-medium">Discover India. Find your story.</p>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cocoa-text/50 px-3">
              Explore Platform
            </span>
            <nav className="space-y-1 mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${isActive
                        ? 'bg-terra-primary text-cream-canvas shadow-warm font-bold'
                        : 'text-cocoa-text hover:bg-blush-surface/50 hover:text-cocoa-text'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cream-canvas' : 'text-terra-primary'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-ochre-accent text-cocoa-text' : 'bg-terra-primary text-cream-canvas'
                          }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-cream-canvas text-terra-primary' : 'bg-terra-primary text-cream-canvas'
                          }`}>
                          {item.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: User Profile & Sign Out Action */}
        <div className="pt-4 border-t border-blush-surface/80 space-y-3">
          {/* User profile card */}
          <div
            onClick={() => setCurrentView('profile')}
            className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-all border ${currentView === 'profile'
                ? 'border-terra-primary bg-blush-surface/40 ring-1 ring-terra-primary/20'
                : 'border-transparent hover:bg-blush-surface/40'
              }`}
          >
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
              alt={user?.name || "User"}
              className="w-10 h-10 rounded-full object-cover border border-terra-primary/30"
            />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-bold text-cocoa-text truncate">
                {user?.name || 'Rohan Shenoy'}
              </p>
              <p className="text-[11px] text-cocoa-text/60 truncate">
                {user?.neighborhood || user?.city || 'India'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-cocoa-text/40" />
          </div>

          {/* Sign Out to Welcome button */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-cocoa-text/70 hover:text-terra-primary hover:bg-terra-primary/10 transition-all"
            title="Return to cinematic landing page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out to Landing</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (for small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cream-canvas/98 border-t border-blush-surface py-2 px-3 flex justify-around backdrop-blur-md shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 relative ${isActive ? 'text-terra-primary font-bold' : 'text-cocoa-text/70'
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
    </>
  );
}

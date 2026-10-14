import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  X,
  User,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WelcomeView({
  onGetStarted,
  onExploreDemo,
  onExploreIndia,
  onDiscoverEvents,
  onLogin,
  onRegister
}) {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Floating Hero Pins with preview tooltips
  const heroPins = [
    {
      id: 'hero-pin-1',
      city: 'Agra, UP',
      title: 'Yamuna Twilight Sitar & Dhrupad',
      x: '52%',
      y: '48%'
    },
    {
      id: 'hero-pin-2',
      city: 'Jaipur, Rajasthan',
      title: 'Desert Folk Ballads & Sarangi',
      x: '38%',
      y: '42%'
    },
    {
      id: 'hero-pin-3',
      city: 'Udupi, Karnataka',
      title: 'Yakshagana Night Performance',
      x: '46%',
      y: '68%'
    }
  ];

  const resetAuthForm = () => {
    setUsername(''); setPassword(''); setName('');
    setAuthError(''); setAuthLoading(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await onLogin(username, password);
      } else {
        await onRegister({ username, password, name });
      }
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
      setIsSignInOpen(false);
      resetAuthForm();
      onExploreDemo();
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cocoa-text text-cream-canvas flex flex-col justify-between select-none">
      
      {/* 1. Cinematic Background Artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/cinematic_india_hero.jpg"
          alt="Cinematic panorama of India at sunset with wanderer and monument reflections"
          className="w-full h-full object-cover object-center animate-hero-fade filter brightness-[0.92] contrast-[1.05]"
        />
        {/* Subtle localized gradient overlay for contrast over artwork without darkening the whole scene */}
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa-text/85 via-cocoa-text/45 to-transparent sm:w-2/3" />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/90 via-transparent to-cocoa-text/30" />
      </div>

      {/* 2. Minimalist Top Navigation Overlay */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div
          onClick={onExploreDemo}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-terra-primary flex items-center justify-center text-cream-canvas shadow-warm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-xl">all_inclusive</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-cream-canvas drop-shadow-sm">
                <span className="text-ochre-accent font-bold">अ</span>nvesha
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cream-canvas/15 text-cream-canvas border border-cream-canvas/30 backdrop-blur-xs">
                Culture
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Understated Tagline on Desktop */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-cream-canvas/80">
          <span>DISCOVER INDIA. FIND YOUR STORY.</span>
        </div>

        {/* Actions: Sign in & Start Exploring */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSignInOpen(true)}
            className="text-xs font-bold text-cream-canvas/90 hover:text-cream-canvas px-3.5 py-2 transition-colors cursor-pointer rounded-full hover:bg-cream-canvas/10"
          >
            Sign in
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-warm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
          >
            <span>Start exploring</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Hero Main Editorial Content (Left-aligned) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl space-y-6">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-canvas/15 border border-cream-canvas/25 text-cream-canvas text-xs font-semibold backdrop-blur-md animate-hero-title">
            <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
            <span>Living Cultural Landscape of India</span>
          </div>

          {/* Enormous Editorial Display Headline */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight text-cream-canvas leading-[0.95] drop-shadow-md animate-hero-title">
            INDIA,<br />
            IN MOTION.
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base lg:text-lg text-cream-canvas/90 leading-relaxed max-w-xl font-normal drop-shadow-xs animate-hero-sub">
            From hidden art gatherings to music festivals and cultural traditions, discover the events bringing India's communities to life.
          </p>

          {/* Call to Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-hero-cta">
            <button
              onClick={onExploreIndia || onExploreDemo}
              className="px-7 py-3.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas font-bold text-sm shadow-warm transition-all flex items-center justify-center gap-2.5 hover:scale-105 cursor-pointer"
            >
              <span>Explore India</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onDiscoverEvents || onExploreDemo}
              className="px-6 py-3.5 rounded-full border-2 border-cream-canvas/60 hover:border-cream-canvas text-cream-canvas hover:bg-cream-canvas/10 font-bold text-sm backdrop-blur-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Discover events</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Floating Live Event Markers Over Hero Canvas */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
        {heroPins.map(pin => (
          <div
            key={pin.id}
            className="absolute pointer-events-auto group cursor-pointer animate-float-pin"
            style={{ left: pin.x, top: pin.y }}
            onClick={onExploreDemo}
          >
            <div className="relative flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-ochre-accent border-2 border-cream-canvas shadow-lg animate-pulse-glow" />
              <div className="bg-cocoa-text/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-cream-canvas/20 text-[11px] font-semibold text-cream-canvas whitespace-nowrap shadow-md opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all">
                <span className="text-ochre-accent font-bold">{pin.city}</span> · {pin.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Minimalist Single-Screen Bottom Status Bar */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5 flex items-center justify-between text-xs text-cream-canvas/70">
        <div className="flex items-center gap-2">
          <span className="font-serif text-cream-canvas font-bold text-sm">01</span>
          <span className="text-cream-canvas/50">/</span>
          <span>Journey</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-ochre-accent" />
          <span>Opt-in discovery · Authentic cultural cartography</span>
        </div>
      </div>      {/* 6. Auth Modal (Sign-in / Register) */}
      {isSignInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa-text/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-cream-canvas text-cocoa-text w-full max-w-md rounded-3xl border-2 border-blush-surface shadow-2xl p-6 sm:p-7 space-y-5">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
                  Student & Mentor Access
                </span>
                <h3 className="font-serif text-2xl font-bold text-cocoa-text mt-1.5">
                  {authMode === 'login' ? 'Sign in to' : 'Join'}{' '}
                  <span className="text-terra-primary font-bold">अ</span>nvesha
                </h3>
              </div>
              <button
                onClick={() => { setIsSignInOpen(false); resetAuthForm(); }}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-cocoa-text/70 hover:text-cocoa-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-full border border-blush-surface overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 transition-all ${
                  authMode === 'login'
                    ? 'bg-terra-primary text-cream-canvas'
                    : 'bg-surface-container-lowest text-cocoa-text/70 hover:bg-blush-surface/40'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 transition-all ${
                  authMode === 'register'
                    ? 'bg-terra-primary text-cream-canvas'
                    : 'bg-surface-container-lowest text-cocoa-text/70 hover:bg-blush-surface/40'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === 'register' && (
                <div>
                  <label className="block font-bold text-cocoa-text mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Shenoy"
                    className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-cocoa-text mb-1">Username *</label>
                <input
                  id="auth-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. rohan_coastal"
                  className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block font-bold text-cocoa-text mb-1">Password *</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'register' ? 'Min 6 characters' : '••••••••'}
                  className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
                  required
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{authLoading ? 'Please wait...' : authMode === 'login' ? 'Enter Anvesha' : 'Create Account'}</span>
              </button>
            </form>

            <div className="text-center border-t border-blush-surface pt-3">
              <button
                onClick={() => {
                  setIsSignInOpen(false);
                  resetAuthForm();
                  onGetStarted();
                }}
                className="text-xs text-terra-primary font-bold hover:underline"
              >
                Explore as guest → Tailor interests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

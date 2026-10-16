import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  X,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WelcomeView({
  onGetStarted,
  onExploreDemo,
  onQuickDemo,
  onExploreIndia,
  onDiscoverEvents,
  onLogin,
  onRegister
}) {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
    setAuthError(''); setAuthLoading(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await onLogin(username, password);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C56E50', '#D9A441', '#E9CDB8']
        });
        setIsSignInOpen(false);
        resetAuthForm();
        onExploreDemo();
      } else {
        await onRegister({ username, password, name });
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C56E50', '#D9A441', '#E9CDB8']
        });
        setIsSignInOpen(false);
        resetAuthForm();
        onGetStarted();
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already taken')) {
        setAuthError(`The username "${username}" is already registered. Please switch to "Sign In" above to log in!`);
      } else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        setAuthError('Connection failed: Please check that the server is running on port 3001.');
      } else {
        setAuthError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-cocoa-text text-cream-canvas flex flex-col justify-between select-none z-20">
      
      {/* 1. Cinematic Background Artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
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
      <header className="relative z-20 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-5 flex items-center justify-between gap-2">
        {/* Brand Wordmark */}
        <div
          onClick={onExploreDemo}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group flex-shrink-0 min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-terra-primary flex items-center justify-center text-cream-canvas shadow-warm group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">all_inclusive</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-cream-canvas drop-shadow-sm whitespace-nowrap">
              <span className="text-ochre-accent font-bold">अ</span>nvesha
            </span>
            <span className="hidden min-[400px]:inline-flex text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-cream-canvas/15 text-cream-canvas border border-cream-canvas/30 backdrop-blur-xs flex-shrink-0">
              Culture
            </span>
          </div>
        </div>

        {/* Minimal Understated Tagline on Desktop - Perfectly Centered */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-[0.25em] uppercase text-cream-canvas/80 pointer-events-none">
          <span>DISCOVER INDIA. FIND YOUR STORY.</span>
        </div>

        {/* Actions: Start Exploring */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={() => { setAuthMode('login'); setAuthError(''); setIsSignInOpen(true); }}
            className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-[11px] sm:text-xs font-bold shadow-warm transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:scale-105 whitespace-nowrap flex-shrink-0"
          >
            <span>Start exploring</span>
            <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Hero Main Editorial Content (Left-aligned) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 flex-1 flex flex-col justify-center min-h-0">
        <div className="max-w-2xl lg:max-w-3xl space-y-2.5 sm:space-y-4 lg:space-y-5">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cream-canvas/15 border border-cream-canvas/25 text-cream-canvas text-[11px] sm:text-xs font-semibold backdrop-blur-md animate-hero-title">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-ochre-accent" />
            <span>Living Cultural Landscape of India</span>
          </div>

          {/* Editorial Display Headline */}
          <h1 className="tracking-tight text-cream-canvas leading-[1.08] drop-shadow-md animate-hero-title">
            <span className="block font-sans text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              Find your people.
            </span>
            <span
              className="block font-serif italic font-normal text-ochre-accent text-2xl sm:text-4xl md:text-5xl lg:text-6xl mt-0.5 sm:mt-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Discover something new.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-sm md:text-base text-cream-canvas/90 leading-relaxed max-w-lg font-normal drop-shadow-xs animate-hero-sub line-clamp-3 sm:line-clamp-none">
            From hidden art gatherings to music festivals and cultural traditions, discover the events bringing India's communities to life.
          </p>

          {/* Call to Actions */}
          <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-4 animate-hero-cta">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); setIsSignInOpen(true); }}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas font-bold text-xs sm:text-sm shadow-warm transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer"
            >
              <span>Start exploring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onQuickDemo || onGetStarted}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-full border-2 border-cream-canvas/60 hover:border-cream-canvas text-cream-canvas hover:bg-cream-canvas/10 font-bold text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
              <span>Quick Demo Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Auth Modal (Sign-in / Register) */}
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
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === 'register' ? 'Min 6 characters' : '••••••••'}
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
                    required
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-text/50 hover:text-cocoa-text p-1 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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

            <div className="text-center border-t border-blush-surface pt-3 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsSignInOpen(false);
                  resetAuthForm();
                  onGetStarted();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs text-cocoa-text font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-terra-primary" />
                <span>Launch Quick Demo Session · No Sign-in</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

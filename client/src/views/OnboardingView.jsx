import React, { useState, useMemo } from 'react';
import { Check, ArrowRight, MapPin, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_INTERESTS } from '../data/initialData';
import { INDIAN_STATES, citiesForState } from '../data/locationData';

const INTENTION_OPTIONS = [
  { id: 'WANTS_TO_LEARN', label: 'Want to learn' },
  { id: 'WILLING_TO_TEACH', label: 'Can teach' },
  { id: 'CASUAL_ENTHUSIAST', label: 'Just curious' },
];

export default function OnboardingView({ onComplete, initialUserInterests = ['culture', 'languages'] }) {
  const [state, setState] = useState('Karnataka');
  const [city, setCity] = useState('');
  const [selectedInterests, setSelectedInterests] = useState(initialUserInterests);
  const [intentions, setIntentions] = useState({}); // { [interestId]: intentionId }
  const [preferredMode, setPreferredMode] = useState('BOTH');
  const [isDiscoverable, setIsDiscoverable] = useState(false);

  const citySuggestions = useMemo(() => citiesForState(state), [state]);

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const setIntentionFor = (id, intentionId) => {
    setIntentions(prev => ({ ...prev, [id]: intentionId }));
  };

  const handleFinish = () => {
    if (!city.trim()) {
      alert('Let us know which city or town you are based in — this powers nearby matches and the live map.');
      return;
    }
    if (selectedInterests.length === 0) {
      alert('Please choose at least one cultural or creative interest!');
      return;
    }

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#C56E50', '#D9A441', '#E9CDB8']
    });

    onComplete({
      state,
      city: city.trim(),
      neighborhood: city.trim(),
      interests: selectedInterests.map(id => ({
        interest_id: id,
        intention: intentions[id] || 'CASUAL_ENTHUSIAST',
      })),
      preferredMode,
      is_discoverable: isDiscoverable ? 1 : 0,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">

      {/* Onboarding Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blush-surface/70 text-cocoa-text border border-terra-primary/20">
          Tell us about you
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-cocoa-text mt-3">
          Where are you, and what do you care about?
        </h2>
        <p className="text-sm sm:text-base text-cocoa-text/75 mt-2">
          This is what powers your matches, your map, and your recommendations — it gets better the more specific you are.
        </p>
      </div>

      {/* Location Section */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-container/60 border border-blush-surface space-y-4 mb-8">
        <h3 className="font-serif text-lg font-bold text-cocoa-text flex items-center gap-2">
          <MapPin className="w-5 h-5 text-terra-primary" />
          Where are you based?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-cocoa-text mb-1.5">State</label>
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setCity(''); }}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-cream-canvas text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            >
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-cocoa-text mb-1.5">City / Town</label>
            <input
              type="text"
              required
              list="onboarding-city-options"
              placeholder={state === 'Karnataka' ? 'e.g. Bengaluru, Mysuru, Mangaluru...' : 'e.g. your city or town'}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-cream-canvas text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
            {citySuggestions.length > 0 && (
              <datalist id="onboarding-city-options">
                {citySuggestions.map(c => <option key={c} value={c} />)}
              </datalist>
            )}
          </div>
        </div>
        <p className="text-[11px] text-cocoa-text/60 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-terra-primary flex-shrink-0" />
          Used for nearby matches and the live map — your exact address is never shared with other members.
        </p>
      </div>

      {/* Grid of Interests with inline intentions */}
      <h3 className="font-serif text-lg font-bold text-cocoa-text mb-3">
        What cultural roots, arts, or skills do you care about?
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {INITIAL_INTERESTS.map(item => {
          const isSelected = selectedInterests.includes(item.id);
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-terra-primary bg-terra-primary/10 shadow-sm'
                  : 'border-blush-surface bg-surface-container-lowest hover:border-terra-primary/40 hover:bg-surface-container/50'
              }`}
            >
              <div
                onClick={() => toggleInterest(item.id)}
                className="flex items-start gap-3.5 cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-terra-primary text-cream-canvas' : 'bg-blush-surface/50 text-cocoa-text'
                }`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-bold text-cocoa-text">{item.name}</h4>
                    {isSelected && <Check className="w-4 h-4 text-terra-primary stroke-[3]" />}
                  </div>
                  <p className="text-xs text-cocoa-text/70 mt-0.5">{item.desc}</p>
                </div>
              </div>

              {/* Per-interest intention — only shown once selected */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-terra-primary/20 flex flex-wrap gap-1.5">
                  {INTENTION_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIntentionFor(item.id, opt.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        (intentions[item.id] || 'CASUAL_ENTHUSIAST') === opt.id
                          ? 'bg-terra-primary text-cream-canvas'
                          : 'bg-cream-canvas text-cocoa-text border border-blush-surface'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preferences Section: Mode */}
      <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-surface-container/60 border border-blush-surface space-y-6">
        <h3 className="font-serif text-xl font-bold text-cocoa-text">
          How do you wish to participate?
        </h3>

        <div className="text-xs sm:text-sm">
          <label className="block font-bold text-cocoa-text mb-2">
            Preferred Participation Mode:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {[
              { id: 'BOTH', label: 'Both in-person and virtual' },
              { id: 'IN_PERSON', label: 'In-person only' },
              { id: 'ONLINE', label: 'Virtual / remote only' }
            ].map(opt => (
              <label
                key={opt.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  preferredMode === opt.id
                    ? 'border-terra-primary bg-cream-canvas font-semibold text-terra-primary shadow-xs'
                    : 'border-blush-surface/70 bg-cream-canvas/50 text-cocoa-text'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={preferredMode === opt.id}
                  onChange={() => setPreferredMode(opt.id)}
                  className="accent-terra-primary"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Discoverability Opt-in */}
        <div className="p-4 rounded-2xl bg-cream-canvas border border-blush-surface space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDiscoverable}
              onChange={(e) => setIsDiscoverable(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-blush-surface text-terra-primary focus:ring-terra-primary/30 accent-terra-primary"
            />
            <div>
              <span className="font-bold text-xs sm:text-sm text-cocoa-text block">
                Make my profile discoverable to other cultural explorers
              </span>
              <span className="text-xs text-cocoa-text/75 block mt-0.5">
                When enabled, other community members in your area can discover your profile, invite you to circles, and exchange skills. You can change this at any time in your profile settings.
              </span>
            </div>
          </label>
        </div>

        {/* Location / Privacy Note */}
        <div className="pt-4 border-t border-blush-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cocoa-text/75">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-terra-primary flex-shrink-0" />
            <span>
              Your matches improve as you add more detail — you can always update this later from your profile.
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="px-8 py-3 rounded-full bg-terra-primary text-cream-canvas font-bold text-sm hover:bg-primary-container shadow-warm hover:shadow-warm-hover transition-all flex items-center justify-center gap-2"
          >
            <span>Complete setup & enter <span className="font-bold">अ</span>nvesha</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

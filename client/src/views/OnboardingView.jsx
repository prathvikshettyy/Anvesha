import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Compass, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_INTERESTS } from '../data/initialData';

export default function OnboardingView({ onComplete, initialUserInterests = ['culture', 'languages'] }) {
  const [selectedInterests, setSelectedInterests] = useState(initialUserInterests);
  const [languageIntent, setLanguageIntent] = useState('WANTS_TO_LEARN');
  const [craftIntent, setCraftIntent] = useState('WANTS_TO_LEARN');
  const [preferredMode, setPreferredMode] = useState('BOTH');
  const [campusZone, setCampusZone] = useState('Manipal Campus & Coastal Hub');

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
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
      interests: selectedInterests,
      intentions: {
        languages: languageIntent,
        crafts: craftIntent
      },
      preferredMode,
      neighborhood: campusZone
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      
      {/* Onboarding Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blush-surface/70 text-cocoa-text border border-terra-primary/20">
          Step 1 of 1 ┬╖ Tailor Your Belonging
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-cocoa-text mt-3">
          What cultural roots & arts do you care about?
        </h2>
        <p className="text-sm sm:text-base text-cocoa-text/75 mt-2">
          Select the traditions, languages, and skills you want to explore, practice, or share with people nearby.
        </p>
      </div>

      {/* Grid of Interests */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {INITIAL_INTERESTS.map(item => {
          const isSelected = selectedInterests.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleInterest(item.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                isSelected
                  ? 'border-terra-primary bg-terra-primary/10 shadow-sm'
                  : 'border-blush-surface bg-surface-container-lowest hover:border-terra-primary/40 hover:bg-surface-container/50'
              }`}
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
          );
        })}
      </div>

      {/* Preferences Section: Skill Intentions & Mode */}
      <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-surface-container/60 border border-blush-surface space-y-6">
        <h3 className="font-serif text-xl font-bold text-cocoa-text">
          How do you wish to participate?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
          {/* Language Intent */}
          <div>
            <label className="block font-bold text-cocoa-text mb-2">
              For Dialects & Languages (e.g. Tulu, Konkani, Beary):
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'WANTS_TO_LEARN', label: '≡ƒî▒ I want to learn / practice conversational basics' },
                { id: 'WILLING_TO_TEACH', label: '≡ƒÄô I am a fluent/native speaker willing to guide others' },
                { id: 'CASUAL_ENTHUSIAST', label: 'Γÿò Casual listener / exploring coastal folklore' }
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    languageIntent === opt.id
                      ? 'border-terra-primary bg-cream-canvas font-semibold text-terra-primary shadow-xs'
                      : 'border-blush-surface/70 bg-cream-canvas/50 text-cocoa-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="lang_intent"
                    checked={languageIntent === opt.id}
                    onChange={() => setLanguageIntent(opt.id)}
                    className="accent-terra-primary"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Mode */}
          <div>
            <label className="block font-bold text-cocoa-text mb-2">
              Preferred Participation Mode:
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'BOTH', label: '≡ƒñ¥ Both In-Person and Virtual exchanges' },
                { id: 'IN_PERSON', label: '≡ƒôì In-Person only (Campus, Cafes, Workshops)' },
                { id: 'ONLINE', label: '≡ƒÆ╗ Virtual / Remote audio calls only' }
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
        </div>

        {/* Location / Privacy Note */}
        <div className="pt-4 border-t border-blush-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cocoa-text/75">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-terra-primary flex-shrink-0" />
            <span>
              Your profile is matched via broad region (<strong>{campusZone}</strong>). Exact GPS is never shared.
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="px-8 py-3 rounded-full bg-terra-primary text-cream-canvas font-bold text-sm hover:bg-primary-container shadow-warm hover:shadow-warm-hover transition-all flex items-center justify-center gap-2"
          >
            <span>Complete Setup & Enter <span className="font-bold">αñà</span>nvesha</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

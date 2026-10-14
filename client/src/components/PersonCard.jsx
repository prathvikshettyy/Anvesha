import React, { useState } from 'react';
import { Sparkles, MessageCircle, UserPlus, Check, Mic, MapPin, BookOpen, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PersonCard({ person, onConnect, onStartChat, onSendLocketPulse }) {
  const [status, setStatus] = useState(person.connectionStatus || 'NONE');

  const handleConnectClick = () => {
    setStatus('CONNECTED');
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#C56E50', '#D9A441', '#E9CDB8']
    });
    if (onConnect) onConnect(person.id);
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-blush-surface p-5 sm:p-6 shadow-warm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top Header: Avatar, Name, and Match Score Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={person.avatar}
              alt={person.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-terra-primary/30 shadow-sm"
            />
            <div>
              <h3 className="font-serif text-lg font-bold text-cocoa-text">{person.name}</h3>
              <p className="text-xs text-cocoa-text/60">{person.handle}</p>
              <p className="text-xs text-cocoa-text/80 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-terra-primary" />
                <span>{person.broadRegion}</span>
              </p>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-terra-primary/10 text-terra-primary font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
              <span>{person.matchScore}% Match</span>
            </span>
          </div>
        </div>

        {/* Explainable Matching Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-surface-container/60 border border-blush-surface text-xs leading-relaxed text-cocoa-text/90">
          <div className="flex items-center gap-1.5 font-bold text-terra-primary mb-1">
            <span className="material-symbols-outlined text-sm">hub</span>
            <span>Why you matched</span>
          </div>
          {person.matchReasons && person.matchReasons.length > 0 ? (
            <ul className="space-y-0.5 list-disc list-inside">
              {person.matchReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>{person.matchReason}</p>
          )}
        </div>

        {/* Bio */}
        <p className="text-xs sm:text-sm text-cocoa-text/80 mt-3 leading-relaxed">
          {person.bio}
        </p>

        {/* Languages & Dialects Spoken */}
        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/60">
            Speaks:
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {person.speaks?.map((lang, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blush-surface/50 text-cocoa-text border border-blush-surface"
              >
                🗣️ {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Skill Exchange Intentions (Teach & Learn) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {person.willingToTeach && (
            <div className="p-2 rounded-xl bg-cream-canvas border border-blush-surface">
              <div className="flex items-center gap-1 text-[11px] font-bold text-terra-primary">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Can Teach / Share</span>
              </div>
              <p className="text-cocoa-text/80 mt-0.5 font-medium">{person.willingToTeach.join(', ')}</p>
            </div>
          )}

          {person.wantsToLearn && (
            <div className="p-2 rounded-xl bg-cream-canvas border border-blush-surface">
              <div className="flex items-center gap-1 text-[11px] font-bold text-ochre-accent">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Wants to Learn</span>
              </div>
              <p className="text-cocoa-text/80 mt-0.5 font-medium">{person.wantsToLearn.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 pt-4 border-t border-blush-surface flex items-center justify-between gap-2">
        <button
          onClick={() => onSendLocketPulse(person)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-terra-primary text-terra-primary hover:bg-blush-surface/40 text-xs font-bold transition-all"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Send Locket</span>
        </button>

        {status === 'CONNECTED' ? (
          <button
            onClick={() => onStartChat(person)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container shadow-sm transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        ) : (
          <button
            onClick={handleConnectClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>
        )}
      </div>
    </div>
  );
}

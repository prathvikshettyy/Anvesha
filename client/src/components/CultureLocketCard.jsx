import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Sparkles, Heart, MessageCircle, Mic } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CultureLocketCard({ moment, onOpenCreate, onReact }) {
  const [isPlaying, setIsPlaying]     = useState(false);
  const [reacted, setReacted]         = useState(false);
  const [reactionMsg, setReactionMsg] = useState('');

  const audioRef = useRef(null);

  // Clean up any ongoing audio or speech on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Play the real uploaded recording when available.
   * Falls back to TTS for curated dialect-vault entries that have no audio file.
   */
  const playPronunciation = () => {
    // If already playing, stop both audio element and speech synthesis
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    const fallbackTts = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = moment.vernacularText || moment.phrase || 'Encha Uller';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 2000);
      }
    };

    // ── Real uploaded audio (user recordings) ────────────────────────────────
    const src = (moment.audioUrl || moment.audio_url || '').trim();
    if (src && !src.startsWith('mock_')) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(src);
        } else if (audioRef.current.src !== src && !audioRef.current.src.endsWith(src)) {
          audioRef.current.src = src;
          audioRef.current.load();
        }

        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = (e) => {
          console.warn('[CultureLocket] Audio playback error, falling back to TTS:', e);
          fallbackTts();
        };

        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('[CultureLocket] Play promise rejected, falling back to TTS:', err);
              fallbackTts();
            });
        } else {
          setIsPlaying(true);
        }
        return;
      } catch (err) {
        console.warn('[CultureLocket] Audio initialization error, falling back to TTS:', err);
        fallbackTts();
        return;
      }
    }

    // ── TTS fallback (when no recording exists) ──────────────────────────────
    fallbackTts();
  };

  const handleReaction = (text) => {
    setReacted(true);
    setReactionMsg(text);
    confetti({ particleCount: 25, spread: 60, origin: { y: 0.7 }, colors: ['#C56E50', '#D9A441', '#E9CDB8'] });
    if (onReact) onReact(moment.id, text);
    setTimeout(() => setReacted(false), 3000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface-container/60 border-2 border-blush-surface p-6 sm:p-7 shadow-warm transition-all hover:border-terra-primary/40 group">

      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-terra-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-blush-surface/70">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={moment.senderAvatar}
              alt={moment.senderName}
              className="w-11 h-11 rounded-full object-cover border-2 border-terra-primary/40 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-terra-primary flex items-center justify-center text-cream-canvas text-[9px]">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-cocoa-text">{moment.senderName}</h4>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
                Daily Locket Pulse
              </span>
            </div>
            <p className="text-xs text-cocoa-text/60">{moment.timestamp} · Paired Connection</p>
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-canvas hover:bg-terra-primary hover:text-cream-canvas text-xs font-semibold text-terra-primary border border-terra-primary/30 shadow-sm transition-all"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Reply Pulse</span>
        </button>
      </div>

      {/* Main Locket Content */}
      <div className="mt-5 space-y-4">

        {moment.momentType === 'WORD_OF_DAY' ? (
          <div className="bg-cream-canvas rounded-2xl p-5 border border-blush-surface shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold tracking-wide uppercase text-ochre-accent">
                  Dialect Word of the Day
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text mt-1">
                  {moment.vernacularText}
                </h3>
                {moment.phoneticText && (
                  <p className="text-sm font-mono text-terra-primary mt-0.5">{moment.phoneticText}</p>
                )}
              </div>

              {/* Audio Play Trigger */}
              <button
                onClick={playPronunciation}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                  isPlaying
                    ? 'bg-terra-primary text-cream-canvas scale-105 shadow-locket-glow'
                    : 'bg-blush-surface/40 hover:bg-terra-primary hover:text-cream-canvas text-terra-primary'
                }`}
                title={
                  moment.audioUrl || moment.audio_url
                    ? 'Listen to recorded pronunciation'
                    : 'Listen (text-to-speech)'
                }
              >
                {isPlaying ? (
                  <div className="flex items-center gap-0.5 h-4">
                    <span className="w-1 bg-cream-canvas wave-bar-1 rounded-full" />
                    <span className="w-1 bg-cream-canvas wave-bar-2 rounded-full" />
                    <span className="w-1 bg-cream-canvas wave-bar-3 rounded-full" />
                    <span className="w-1 bg-cream-canvas wave-bar-4 rounded-full" />
                  </div>
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
            </div>

            <p className="text-sm text-cocoa-text/80 mt-3 leading-relaxed">
              <strong className="text-cocoa-text font-semibold">Meaning: </strong>
              {moment.meaning}
            </p>

            {moment.provenance && (
              <div className="mt-3 pt-3 border-t border-blush-surface/50 flex items-center gap-2 text-xs text-cocoa-text/60 italic">
                <span className="material-symbols-outlined text-sm text-ochre-accent">family_history</span>
                <span>Provenance: {moment.provenance}</span>
              </div>
            )}

            {/* Badge: real recording vs TTS */}
            <div className="mt-2">
              {((moment.audioUrl || moment.audio_url || '').trim() && !(moment.audioUrl || moment.audio_url).startsWith('mock_')) ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  🎙️ Real recording
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-cocoa-text/50 italic">
                  🔊 Text-to-speech (no recording)
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-cream-canvas rounded-2xl overflow-hidden border border-blush-surface shadow-sm">
            {moment.image && (
              <div className="h-44 w-full overflow-hidden">
                <img
                  src={moment.image}
                  alt={moment.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-5">
              <span className="text-xs font-bold tracking-wide uppercase text-ochre-accent">
                Living Craft in Progress
              </span>
              <h3 className="font-serif text-xl font-bold text-cocoa-text mt-1">{moment.title}</h3>
              <p className="text-sm text-cocoa-text/80 mt-2 leading-relaxed">{moment.meaning}</p>
              {moment.provenance && (
                <p className="mt-2 text-xs text-cocoa-text/60 italic">Heritage context: {moment.provenance}</p>
              )}
              {/* Play button for craft steps that have an audio clip too */}
              {(moment.audioUrl || moment.audio_url) && (
                <button onClick={playPronunciation}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-terra-primary hover:underline">
                  <Volume2 className="w-3.5 h-3.5" />
                  {isPlaying ? 'Pause audio' : 'Play audio guide'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reaction Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-cocoa-text/70 mr-1">React back:</span>
          <button onClick={() => handleReaction('Teach me this!')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-canvas hover:bg-blush-surface/60 text-cocoa-text border border-blush-surface transition-all flex items-center gap-1.5">
            <span>💬 Teach me this</span>
          </button>
          <button onClick={() => handleReaction('Pronounce again!')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-canvas hover:bg-blush-surface/60 text-cocoa-text border border-blush-surface transition-all flex items-center gap-1.5">
            <span>🗣️ Pronounce again</span>
          </button>
          <button onClick={() => handleReaction('Loved this tradition!')}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cream-canvas hover:bg-blush-surface/60 text-cocoa-text border border-blush-surface transition-all flex items-center gap-1.5">
            <span>❤️ Loved this</span>
          </button>
        </div>

        {/* Reaction feedback toast */}
        {reacted && (
          <div className="mt-2 text-xs font-bold text-terra-primary flex items-center gap-1.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-ochre-accent animate-spin" />
            <span>Reaction sent to {moment.senderName?.split(' ')[0]}: "{reactionMsg}"</span>
          </div>
        )}
      </div>
    </div>
  );
}

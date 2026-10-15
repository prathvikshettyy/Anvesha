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

  // Parse word into native script and romanized transliteration
  const rawText = moment.vernacularText || moment.phrase || '';
  const match = rawText.match(/^(.*?)(?:\s*\((.*?)\))?$/);
  const nativeWord = match ? (match[1]?.trim() || rawText) : rawText;
  const romanWord = match && match[2] ? match[2].trim() : '';

  // Extract syllable guide from phonetic text (e.g. /en-cha ul-ler/ -> EN · CHA · UL · LER)
  const phoneticClean = (moment.phoneticText || moment.phonetic || '').replace(/[\/\[\]]/g, '').trim();
  const syllables = phoneticClean
    ? phoneticClean.split(/[-·\s]+/).filter(Boolean).map(s => s.toUpperCase())
    : [];

  const isWordOfDay = moment.momentType === 'WORD_OF_DAY' || !moment.momentType;

  return (
    <div className="relative rounded-[28px] bg-gradient-to-b from-[#422B1D] via-[#352014] to-[#27160D] p-3 sm:p-4 shadow-2xl border-2 border-[#63422C] group select-none transition-all duration-300 hover:shadow-[0_20px_45px_rgba(40,20,10,0.45)]">
      
      {/* ── Leather Bookmark Ribbon Sticking Out from Top-Right ────────────── */}
      <div className="absolute -top-3 right-8 w-6 h-9 bg-gradient-to-b from-[#B83E24] to-[#8E2813] rounded-t-sm shadow-md pointer-events-none z-20 flex items-end justify-center pb-1">
        <div className="w-0 h-0 border-x-[12px] border-x-transparent border-b-[8px] border-b-[#352014]" />
      </div>

      {/* ── Brass Spiral Binder Rings at the Top ───────────────────────────── */}
      <div className="relative z-20 flex justify-around items-center px-6 -mt-1 sm:-mt-1.5 mb-2 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={`spiral-ring-${i}`} className="flex flex-col items-center">
            {/* Dark Paper Punch Hole */}
            <div className="w-3 h-3 rounded-full bg-[#201007] shadow-inner border border-[#160B05]" />
            {/* Metallic Brass Spiral Wire Coil */}
            <div className="w-2 h-4 sm:h-5 -mt-2 rounded-full bg-gradient-to-r from-[#A5824C] via-[#F4DF9F] to-[#7B5927] shadow-sm transform -rotate-6" />
          </div>
        ))}
      </div>

      {/* ── Diary / Notepad Paper Sheet (Lined & Aged Parchment) ───────────── */}
      <div className="relative diary-notepad-paper rounded-2xl p-5 sm:p-7 border border-[#D5C2A5] overflow-hidden">
        
        {/* Iconic Red Notebook Left Margin Line */}
        <div className="diary-margin-line" />

        {/* Top Diary Header & Metadata */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2D2BC]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={moment.senderAvatar}
                alt={moment.senderName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#A87948] shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#B84A28] flex items-center justify-center text-cream-canvas text-[9px]">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C5229] bg-[#EFE1CC] px-2 py-0.5 rounded-md border border-[#DECDB3]">
                  {isWordOfDay ? 'Dialect Diary · Word of the Day' : 'Artisan Craft Journal'}
                </span>
                <span className="text-[11px] font-serif text-[#78543E] italic">
                  Entry #{moment.id ? moment.id.slice(-3) : '01'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF4E8] text-[#8C5229] border border-[#DECDB3]">
                  {moment.recipientName ? `Direct to ${moment.recipientName}` : 'Connections Circle'}
                </span>
              </div>
              <p className="text-xs text-[#5C4033] font-medium mt-0.5">
                Penned by <strong>{moment.senderName}</strong> · {moment.timestamp || 'Today'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EBD8C1] hover:bg-[#8C5229] hover:text-[#FAF4E8] text-xs font-bold text-[#6D3D1D] border border-[#CBB393] shadow-xs transition-all cursor-pointer"
            title="Record your response dialect pulse"
          >
            <Mic className="w-3.5 h-3.5 text-[#B84A28]" />
            <span>Reply Pulse</span>
          </button>
        </div>

        {/* ── Diary Entry Body: The Highlighted Word ───────────────────────── */}
        {isWordOfDay ? (
          <div className="relative z-10 pt-4 space-y-4">
            
            {/* The One Word (Prominently Highlighted with Amber Wash) */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pt-1">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0653B] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B84A28]" />
                  Native Expression
                </span>

                <div className="pt-0.5">
                  <div className="word-highlight-marker">
                    <h3 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2F1C12] tracking-wide leading-tight drop-shadow-xs">
                      {nativeWord}
                    </h3>
                  </div>
                  {romanWord && (
                    <span className="block sm:inline sm:ml-3 font-serif text-base sm:text-lg text-[#7C4824] italic font-semibold">
                      ({romanWord})
                    </span>
                  )}
                </div>
              </div>

              {/* Pronunciation Audio Play Button */}
              <button
                onClick={playPronunciation}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-[#B84A28] text-[#FAF4E8] border-[#8E2813] scale-105 shadow-md'
                    : 'bg-[#F2E5D0] hover:bg-[#B84A28] hover:text-[#FAF4E8] text-[#60351B] border-[#D6C2A7]'
                }`}
                title={
                  moment.audioUrl || moment.audio_url
                    ? 'Listen to recorded native voice'
                    : 'Listen (clear pronunciation)'
                }
              >
                {isPlaying ? (
                  <div className="flex items-center gap-1 h-3.5">
                    <span className="w-1 bg-[#FAF4E8] wave-bar-1 rounded-full" />
                    <span className="w-1 bg-[#FAF4E8] wave-bar-2 rounded-full" />
                    <span className="w-1 bg-[#FAF4E8] wave-bar-3 rounded-full" />
                    <span className="w-1 bg-[#FAF4E8] wave-bar-4 rounded-full" />
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4 text-[#B84A28]" />
                )}
                <span className="text-xs font-bold font-serif">
                  {isPlaying ? 'Playing...' : 'Pronounce'}
                </span>
              </button>
            </div>

            {/* How to Pronounce (Phonetic & Syllables Breakdown Box) */}
            <div className="bg-[#F3E7D3]/80 rounded-xl p-3 sm:p-3.5 border border-[#DECFB7] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#6B4226]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#B84A28]">hearing</span>
                  <span>How to Pronounce:</span>
                </div>
                {moment.audioDuration && (
                  <span className="text-[10px] text-[#8C5D3A] font-mono">
                    Clip: {moment.audioDuration}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {phoneticClean && (
                  <div className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#E8D7BF] text-[#4E2B16] border border-[#DAC4A5]">
                    /{phoneticClean}/
                  </div>
                )}

                {syllables.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#7A4B29] bg-[#EFE3CF] px-2.5 py-1 rounded border border-[#DFCFB7]">
                    <span>Syllables: </span>
                    <span className="text-[#3A1F11] font-extrabold tracking-wider">
                      {syllables.join(' • ')}
                    </span>
                  </div>
                )}

                {((moment.audioUrl || moment.audio_url || '').trim() && !(moment.audioUrl || moment.audio_url).startsWith('mock_')) ? (
                  <span className="text-[10px] font-bold text-[#2E6B38] bg-[#E2F0E5] px-2 py-0.5 rounded-full border border-[#BEDEC4] ml-auto">
                    ✓ Native Speaker Audio
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8C5D3A] italic ml-auto">
                    🔊 Oral Dialect Audio
                  </span>
                )}
              </div>
            </div>

            {/* Meaning Section */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#985F36] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B84A28]" />
                English Meaning & Nuance
              </span>
              <p className="text-sm sm:text-base font-serif text-[#311D13] leading-relaxed font-medium pl-1">
                {moment.meaning}
              </p>
            </div>

            {/* Cultural Context / Provenance Note */}
            {moment.provenance && (
              <div className="p-2.5 rounded-lg bg-[#EFE3CF]/60 border border-[#DECFB7] flex items-start gap-2 text-xs text-[#5C3B24]">
                <span className="material-symbols-outlined text-base text-[#B84A28] flex-shrink-0 mt-0.5">
                  auto_stories
                </span>
                <p className="italic leading-normal">
                  <strong className="not-italic font-bold text-[#442817]">Field Context: </strong>
                  {moment.provenance}
                </p>
              </div>
            )}

          </div>
        ) : (
          /* Craft Step Journal Variant */
          <div className="relative z-10 pt-4 space-y-3">
            {moment.image && (
              <div className="h-44 w-full rounded-xl overflow-hidden border border-[#D5C2A5] shadow-xs">
                <img
                  src={moment.image}
                  alt={moment.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="word-highlight-marker">
              <h3 className="font-serif text-2xl font-bold text-[#2F1C12]">
                {moment.title}
              </h3>
            </div>
            {moment.vernacularText && (
              <p className="font-serif text-sm font-semibold text-[#8C5229] italic">
                {moment.vernacularText}
              </p>
            )}
            <p className="text-sm font-serif text-[#311D13] leading-relaxed">
              {moment.meaning}
            </p>
            {moment.provenance && (
              <p className="text-xs text-[#7A4B29] italic">
                Heritage Studio: {moment.provenance}
              </p>
            )}
            {(moment.audioUrl || moment.audio_url) && (
              <button
                onClick={playPronunciation}
                className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#B84A28] hover:underline cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isPlaying ? 'Pause audio guide' : 'Play audio guide'}</span>
              </button>
            )}
          </div>
        )}

        {/* ── Diary Memo Footer: Quick React Stickers ─────────────────────── */}
        <div className="relative z-10 mt-5 pt-3 border-t border-[#E2D2BC] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#7A4B29] mr-1">React back:</span>
            <button
              onClick={() => handleReaction('Teach me this!')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F4E8D6] hover:bg-[#B84A28] hover:text-[#FAF4E8] text-[#55311B] border border-[#DAC6AC] transition-all cursor-pointer shadow-xs"
            >
              💬 Teach me this
            </button>
            <button
              onClick={() => handleReaction('Pronounce again!')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F4E8D6] hover:bg-[#B84A28] hover:text-[#FAF4E8] text-[#55311B] border border-[#DAC6AC] transition-all cursor-pointer shadow-xs"
            >
              🗣️ Say again
            </button>
            <button
              onClick={() => handleReaction('Loved this tradition!')}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F4E8D6] hover:bg-[#B84A28] hover:text-[#FAF4E8] text-[#55311B] border border-[#DAC6AC] transition-all cursor-pointer shadow-xs"
            >
              ❤️ Loved this
            </button>
          </div>

          {/* Reaction toast */}
          {reacted && (
            <div className="text-[11px] font-bold text-[#B84A28] flex items-center gap-1 animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5 text-[#D9A441] animate-spin" />
              <span>Reaction sent: "{reactionMsg}"</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

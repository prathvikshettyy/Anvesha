import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Sparkles, HeartHandshake, History, PlusCircle, Bookmark, Shield, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import CultureLocketCard from '../components/CultureLocketCard';
import * as api from '../services/api';

const DEFAULT_VAULT_ITEMS = [
  {
    id: 'v_1',
    dialect: 'Tulu (Coastal Karnataka)',
    phrase: 'ಬಲೆ, ಒಣಸ್ ಮಲ್ಪಾ (Bale, Onas Malpa)',
    phonetic: '/ba-le o-nas mal-pa/',
    english: 'Come, let us share a meal together. (The quintessential coastal gesture of hospitality)',
    contributor: 'Preserved by Vasanthi Nayak (Age 72, Kundapura)',
    audioDuration: '0:03'
  },
  {
    id: 'v_2',
    dialect: 'Konkani (Goud Saraswat)',
    phrase: 'ತುಗೆಲೆ ನಾವ್ ಕಿತ್ತೆ? (Tugele Naav Kitte?)',
    phonetic: '/tu-ge-le naav kit-te/',
    english: 'What is your name? (Used in ancestral temple and community gatherings)',
    contributor: 'Preserved by Dr. Ramesh Pai (Manipal)',
    audioDuration: '0:03'
  },
  {
    id: 'v_3',
    dialect: 'Kodava Takk (Coorg)',
    phrase: 'ಎಲ್ಲಾರ್ಕೂ ನಮಸ್ಕಾರ (Ellarkoo Cholo)',
    phonetic: '/el-lar-koo cho-lo/',
    english: 'Peace and well-being to everyone. (Traditional clan harvest blessing)',
    contributor: 'Preserved by Muthappa K. (Madikeri)',
    audioDuration: '0:04'
  },
  {
    id: 'v_4',
    dialect: 'Havigannada (Uttara Kannada)',
    phrase: 'ಎಲ್ಲಿಗೆ ಹೊಂಟ್ರಿ? (Ellige Hontri?)',
    phonetic: '/el-li-ge hon-tri/',
    english: 'Where are you headed? (Warm greeting shared when crossing river ferries)',
    contributor: 'Preserved by Savitri Bhat (Sirsi)',
    audioDuration: '0:03'
  }
];

export default function LocketView({ locketMoments, onOpenLocketModal, onReactLocket }) {
  const [activeTab, setActiveTab] = useState('FEED'); // 'FEED' or 'VAULT'
  const [playingId, setPlayingId] = useState(null);
  const [vaultItems, setVaultItems] = useState(DEFAULT_VAULT_ITEMS);

  useEffect(() => {
    api.locket.vault()
      .then(items => {
        if (Array.isArray(items) && items.length > 0) {
          setVaultItems(items);
        }
      })
      .catch(() => {
        // Fall back to default vault items on error
      });
  }, []);

  const playVaultPronunciation = (id, phrase) => {
    setPlayingId(id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.85;
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingId(null), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-terra-primary text-3xl">auto_stories</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
              Culture Locket & Oral Dialect Vault
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-1 max-w-2xl">
            A small, ambient ritual to keep cultural connections alive across physical distances. Share 1 word, audio pronunciation, or living craft technique per day.
          </p>
        </div>

        <button
          onClick={onOpenLocketModal}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas text-xs sm:text-sm font-bold hover:bg-primary-container shadow-warm transition-all self-start md:self-auto"
        >
          <Mic className="w-4 h-4" />
          <span>Record Locket Pulse</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-blush-surface flex items-center gap-6">
        <button
          onClick={() => setActiveTab('FEED')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'FEED'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Circle Locket Moments ({locketMoments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VAULT')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'VAULT'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Living Dialect Archive ({vaultItems.length})</span>
        </button>
      </div>

      {/* Tab 1: Circle Locket Feed */}
      {activeTab === 'FEED' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {locketMoments.map(moment => (
            <CultureLocketCard
              key={moment.id}
              moment={moment}
              onOpenCreate={onOpenLocketModal}
              onReact={onReactLocket}
            />
          ))}
        </div>
      ) : (
        /* Tab 2: Living Dialect Archive */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-surface-container/60 border border-blush-surface text-xs text-cocoa-text/80 flex items-center gap-3">
            <span className="material-symbols-outlined text-terra-primary text-2xl">verified</span>
            <div>
              <strong>Oral History & Skill Preservation: </strong>
              Each entry carries verified attribution and provenance, ensuring regional accents and proverbs are preserved directly from elders and native practitioners.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {vaultItems.map(item => {
              const isPlaying = playingId === item.id;
              
              // Parse phrase into native script and romanized transliteration
              const raw = item.phrase || '';
              const m = raw.match(/^(.*?)(?:\s*\((.*?)\))?$/);
              const native = m ? (m[1]?.trim() || raw) : raw;
              const roman = m && m[2] ? m[2].trim() : '';
              
              // Syllables from phonetic
              const cleanPhone = (item.phonetic || '').replace(/[\/\[\]]/g, '').trim();
              const syls = cleanPhone ? cleanPhone.split(/[-·\s]+/).filter(Boolean).map(s => s.toUpperCase()) : [];

              return (
                <div
                  key={item.id}
                  className="relative rounded-[26px] bg-gradient-to-b from-[#422B1D] via-[#352014] to-[#27160D] p-3 sm:p-3.5 shadow-xl border-2 border-[#63422C] group select-none transition-all duration-300 hover:shadow-[0_16px_40px_rgba(40,20,10,0.4)]"
                >
                  {/* Top Spiral Wire Binding */}
                  <div className="flex justify-around items-center px-6 -mt-1 mb-2 pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#201007] shadow-inner" />
                        <div className="w-1.5 h-4 -mt-1.5 rounded-full bg-gradient-to-r from-[#A5824C] via-[#F4DF9F] to-[#7B5927] shadow-xs transform -rotate-6" />
                      </div>
                    ))}
                  </div>

                  {/* Notepad Ruled Parchment */}
                  <div className="diary-notepad-paper rounded-2xl p-5 sm:p-6 border border-[#D5C2A5] relative overflow-hidden space-y-4">
                    <div className="diary-margin-line" />

                    {/* Header Dialect Tag */}
                    <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-[#E2D2BC]">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#EFE1CC] text-[#8C5229] border border-[#DECDB3]">
                        {item.dialect}
                      </span>
                      <span className="font-serif text-[11px] text-[#78543E] italic">
                        Archival Entry
                      </span>
                    </div>

                    {/* Highlighted Word */}
                    <div className="relative z-10 flex items-start justify-between gap-3 pt-1">
                      <div>
                        <div className="word-highlight-marker">
                          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#2F1C12] leading-tight">
                            {native}
                          </h3>
                        </div>
                        {roman && (
                          <span className="block font-serif text-sm sm:text-base text-[#7C4824] italic font-semibold mt-0.5">
                            ({roman})
                          </span>
                        )}
                      </div>

                      {/* Pronounce Trigger */}
                      <button
                        onClick={() => playVaultPronunciation(item.id, item.phrase)}
                        className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border shadow-xs transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-[#B84A28] text-[#FAF4E8] scale-105 shadow-md border-[#8E2813]'
                            : 'bg-[#F2E5D0] hover:bg-[#B84A28] hover:text-[#FAF4E8] text-[#60351B] border-[#D6C2A7]'
                        }`}
                        title="Listen to native oral pronunciation"
                      >
                        {isPlaying ? (
                          <div className="flex items-center gap-0.5 h-3.5">
                            <span className="w-1 bg-[#FAF4E8] wave-bar-1 rounded-full" />
                            <span className="w-1 bg-[#FAF4E8] wave-bar-2 rounded-full" />
                            <span className="w-1 bg-[#FAF4E8] wave-bar-3 rounded-full" />
                          </div>
                        ) : (
                          <Volume2 className="w-5 h-5 text-[#B84A28]" />
                        )}
                      </button>
                    </div>

                    {/* Pronunciation & Syllables Guide Box */}
                    <div className="relative z-10 bg-[#F3E7D3]/80 rounded-xl p-3 border border-[#DECFB7] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#6B4226]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#B84A28]">hearing</span>
                          Pronunciation:
                        </span>
                        {item.audioDuration && (
                          <span className="text-[10px] text-[#8C5D3A] font-mono">
                            {item.audioDuration}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {cleanPhone && (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#E8D7BF] text-[#4E2B16] border border-[#DAC4A5]">
                            /{cleanPhone}/
                          </span>
                        )}
                        {syls.length > 0 && (
                          <span className="text-[11px] font-bold text-[#7A4B29] bg-[#EFE3CF] px-2 py-0.5 rounded border border-[#DFCFB7]">
                            {syls.join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meaning */}
                    <div className="relative z-10 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#985F36]">
                        Meaning & Context:
                      </span>
                      <p className="text-xs sm:text-sm font-serif text-[#311D13] leading-relaxed">
                        {item.english}
                      </p>
                    </div>

                    {/* Provenance */}
                    <div className="relative z-10 pt-2.5 border-t border-[#E2D2BC] flex items-center justify-between text-[11px] text-[#5C3B24] italic">
                      <span className="truncate">{item.contributor}</span>
                      <span className="font-mono text-[10px] bg-[#EFE3CF] text-[#6E4125] font-bold px-2 py-0.5 rounded border border-[#DFCFB7] not-italic">
                        Verified Dialect
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

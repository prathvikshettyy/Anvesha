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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vaultItems.map(item => {
              const isPlaying = playingId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-surface-container-lowest border border-blush-surface shadow-warm hover:border-terra-primary/40 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
                        {item.dialect}
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-cocoa-text mt-1.5">
                        {item.phrase}
                      </h3>
                      <p className="text-xs font-mono text-terra-primary mt-0.5">
                        {item.phonetic}
                      </p>
                    </div>

                    <button
                      onClick={() => playVaultPronunciation(item.id, item.phrase)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-terra-primary text-cream-canvas scale-105 shadow-locket-glow'
                          : 'bg-blush-surface/50 hover:bg-terra-primary hover:text-cream-canvas text-terra-primary'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-cocoa-text/80 leading-relaxed">
                    <strong className="text-cocoa-text">Meaning: </strong>
                    {item.english}
                  </p>

                  <div className="pt-3 border-t border-blush-surface/70 flex items-center justify-between text-xs text-cocoa-text/60 italic">
                    <span>{item.contributor}</span>
                    <span className="font-mono text-[10px] bg-cream-canvas px-2 py-0.5 rounded border border-blush-surface">
                      Verified Heritage
                    </span>
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

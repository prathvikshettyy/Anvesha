import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Sparkles, HeartHandshake, PlusCircle, Users } from 'lucide-react';
import CultureLocketCard from '../components/CultureLocketCard';
import * as api from '../services/api';

// Kept dialect preservation data as required (not rendered as a tab)
export const DEFAULT_VAULT_ITEMS = [
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

export default function LocketView({
  locketMoments = [],
  currentUser,
  onOpenLocketModal,
  onReactLocket,
  onFindPeople
}) {
  const [activeTab, setActiveTab] = useState('CONNECTIONS'); // 'CONNECTIONS' or 'MINE'
  const [connectionsMoments, setConnectionsMoments] = useState([]);
  const [myMoments, setMyMoments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMoments = useCallback(async () => {
    if (!api.token.get()) {
      setConnectionsMoments([]);
      const myId = currentUser?.id;
      setMyMoments(locketMoments.filter(m => (m.senderId === myId || m.authorId === myId)));
      return;
    }

    try {
      setIsLoading(true);
      const [connRes, mineRes] = await Promise.all([
        api.locket.connectionsMoments().catch(() => []),
        api.locket.mine().catch(() => [])
      ]);
      setConnectionsMoments(Array.isArray(connRes) ? connRes : []);
      setMyMoments(Array.isArray(mineRes) ? mineRes : []);
    } catch (err) {
      console.warn('Error loading locket moments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, locketMoments]);

  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  // Synchronize newly submitted moments from modal or socket
  useEffect(() => {
    if (locketMoments && locketMoments.length > 0) {
      const myId = currentUser?.id;
      const latest = locketMoments[0];
      if (latest && (!myId || latest.senderId === myId || latest.authorId === myId)) {
        setMyMoments(prev => {
          if (prev.some(m => m.id === latest.id)) return prev;
          return [latest, ...prev];
        });
        setActiveTab('MINE');
        if (api.token.get()) {
          api.locket.mine().then(res => {
            if (Array.isArray(res)) setMyMoments(res);
          }).catch(() => {});
        }
      }
    }
  }, [locketMoments, currentUser?.id]);

  const handleReact = (momentId, text) => {
    if (onReactLocket) onReactLocket(momentId, text);
    const updater = list => list.map(m => {
      if (m.id !== momentId) return m;
      const reactions = Array.isArray(m.reactions) ? m.reactions : [];
      return {
        ...m,
        reactionCount: (m.reactionCount || reactions.length) + 1,
        reactions: [...reactions, { id: Date.now().toString(), text, user_name: currentUser?.name || 'You' }]
      };
    });
    setConnectionsMoments(updater);
    setMyMoments(updater);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-terra-primary text-3xl">auto_stories</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cocoa-text">
              Culture Locket
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-1 max-w-2xl">
            A small, ambient ritual to keep cultural connections alive across physical distances. Share 1 word, audio pronunciation, or living craft technique per day.
          </p>
        </div>

        <button
          onClick={onOpenLocketModal}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas text-xs sm:text-sm font-bold hover:bg-primary-container shadow-warm transition-all self-start md:self-auto cursor-pointer"
        >
          <Mic className="w-4 h-4" />
          <span>Record Locket Pulse</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-blush-surface flex items-center gap-6">
        <button
          onClick={() => setActiveTab('CONNECTIONS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'CONNECTIONS'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Connections' Lockets ({connectionsMoments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MINE')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'MINE'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Lockets ({myMoments.length})</span>
        </button>
      </div>

      {/* Tab 1: Connections' Lockets */}
      {activeTab === 'CONNECTIONS' && (
        <div>
          {connectionsMoments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {connectionsMoments.map(moment => (
                <CultureLocketCard
                  key={moment.id}
                  moment={moment}
                  onOpenCreate={onOpenLocketModal}
                  onReact={handleReact}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 px-4 text-center rounded-3xl bg-surface-container-lowest/70 border-2 border-dashed border-blush-surface flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary mb-1">
                <Users className="w-7 h-7" />
              </div>
              <p className="font-serif text-lg font-bold text-cocoa-text">
                Connect with people to see their Locket moments here
              </p>
              <p className="text-xs sm:text-sm text-cocoa-text/70 max-w-md">
                When your mutual connections share words of the day or craft technique recordings, they will appear here.
              </p>
              {onFindPeople && (
                <button
                  onClick={onFindPeople}
                  className="mt-3 px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas text-xs sm:text-sm font-bold hover:bg-primary-container shadow-warm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Find People</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Lockets */}
      {activeTab === 'MINE' && (
        <div>
          {myMoments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {myMoments.map(moment => (
                <CultureLocketCard
                  key={moment.id}
                  moment={moment}
                  onOpenCreate={onOpenLocketModal}
                  onReact={handleReact}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 px-4 text-center rounded-3xl bg-surface-container-lowest/70 border-2 border-dashed border-blush-surface flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary mb-1">
                <Mic className="w-7 h-7" />
              </div>
              <p className="font-serif text-lg font-bold text-cocoa-text">
                You haven't shared a Locket yet
              </p>
              <p className="text-xs sm:text-sm text-cocoa-text/70 max-w-md">
                Preserve a dialect phrase, indigenous greeting, or artisan technique with your voice.
              </p>
              <button
                onClick={onOpenLocketModal}
                className="mt-3 px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas text-xs sm:text-sm font-bold hover:bg-primary-container shadow-warm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Record Locket Pulse</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Send, Mic, Phone, Video, MoreVertical, Sparkles, Volume2 } from 'lucide-react';
import { INITIAL_CONVERSATIONS } from '../data/initialData';
import * as api from '../services/api';

export default function MessagesView({ onOpenLocketModal }) {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState('conv_usr_priya');
  const [inputText, setInputText] = useState('');

  // Sync conversations and thread history from SQLite DB
  useEffect(() => {
    let mounted = true;

    async function loadThreads() {
      try {
        const rows = await api.messages.conversations();
        if (Array.isArray(rows) && rows.length > 0 && mounted) {
          const loaded = await Promise.all(
            rows.map(async (row) => {
              try {
                const thread = await api.messages.thread(row.partnerId);
                return {
                  id: `conv_${row.partnerId}`,
                  partnerId: row.partnerId,
                  partnerName: row.partnerName,
                  partnerAvatar: row.partnerAvatar,
                  partnerHandle: row.partnerHandle,
                  lastMessage: row.lastMessage,
                  lastTime: 'Recent',
                  unread: row.unreadCount || 0,
                  messages: (thread.messages || []).map(m => ({
                    id: m.id,
                    sender: m.sender_id,
                    text: m.text,
                    time: 'Recent',
                  })),
                };
              } catch {
                return {
                  id: `conv_${row.partnerId}`,
                  partnerId: row.partnerId,
                  partnerName: row.partnerName,
                  partnerAvatar: row.partnerAvatar,
                  partnerHandle: row.partnerHandle,
                  lastMessage: row.lastMessage,
                  lastTime: 'Recent',
                  unread: row.unreadCount || 0,
                  messages: [],
                };
              }
            })
          );
          if (mounted && loaded.length > 0) {
            setConversations(loaded);
            setActiveConvId(loaded[0].id);
          }
        }
      } catch (err) {
        console.info('[Messages] Using offline seed threads:', err?.message || err);
      }
    }

    loadThreads();
    return () => { mounted = false; };
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId || c.partnerId === activeConvId) || conversations[0];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'usr_rohan',
      text: messageText,
      time: 'Just now'
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === activeConvId || c.partnerId === activeConv?.partnerId) {
          return {
            ...c,
            lastMessage: messageText,
            lastTime: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    setInputText('');

    // Persist to SQLite backend
    try {
      if (activeConv?.partnerId) {
        await api.messages.send(activeConv.partnerId, messageText);
      }
    } catch (err) {
      console.warn('[Messages] Persist failed, relying on local state:', err);
    }

    // Simulated reply after 1.5 seconds if talking to demo friend
    setTimeout(() => {
      const reply = {
        id: `m_${Date.now() + 1}`,
        sender: activeConv?.partnerId || 'partner',
        text: 'Awesome! Glad we connected on ShareSpot. Practice coastal phrases on Culture Locket!',
        time: 'Just now'
      };
      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeConvId || c.partnerId === activeConv?.partnerId) {
            return {
              ...c,
              lastMessage: reply.text,
              messages: [...c.messages, reply]
            };
          }
          return c;
        })
      );
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface shadow-warm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] h-[calc(100vh-14rem)]">
        
        {/* Left Column (4 cols): Conversations List */}
        <div className="md:col-span-4 border-r border-blush-surface flex flex-col bg-surface-container/30">
          <div className="p-4 border-b border-blush-surface">
            <h2 className="font-serif text-xl font-bold text-cocoa-text">Connected Circles</h2>
            <p className="text-xs text-cocoa-text/60 mt-0.5">Private conversations with accepted connections</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-blush-surface/50">
            {conversations.map(conv => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-cream-canvas border-l-4 border-terra-primary shadow-xs'
                      : 'hover:bg-blush-surface/30'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.partnerAvatar}
                      alt={conv.partnerName}
                      className="w-12 h-12 rounded-full object-cover border border-terra-primary/30"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-600 border-2 border-cream-canvas" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-bold text-cocoa-text truncate">
                        {conv.partnerName}
                      </h4>
                      <span className="text-[10px] text-cocoa-text/50">{conv.lastTime}</span>
                    </div>
                    <p className="text-xs text-cocoa-text/70 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Chat Window */}
        <div className="md:col-span-8 flex flex-col bg-cream-canvas">
          
          {/* Active Conversation Header */}
          <div className="p-4 border-b border-blush-surface flex items-center justify-between bg-surface-container/40">
            <div className="flex items-center gap-3">
              <img
                src={activeConv.partnerAvatar}
                alt={activeConv.partnerName}
                className="w-10 h-10 rounded-full object-cover border border-terra-primary/30"
              />
              <div>
                <h3 className="font-serif text-base font-bold text-cocoa-text">{activeConv.partnerName}</h3>
                <span className="text-[11px] text-green-700 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span>Online · Paired Culture Connection</span>
                </span>
              </div>
            </div>

            <button
              onClick={onOpenLocketModal}
              className="px-3.5 py-1.5 rounded-full bg-terra-primary/10 hover:bg-terra-primary hover:text-cream-canvas text-terra-primary text-xs font-bold border border-terra-primary/30 flex items-center gap-1.5 transition-all"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Send Locket Pulse</span>
            </button>
          </div>

          {/* Messages History */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="text-center my-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-blush-surface/50 text-cocoa-text/70">
                End-to-end private conversation
              </span>
            </div>

            {activeConv.messages.map(msg => {
              const isMe = msg.sender === 'usr_rohan';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-sm sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-terra-primary text-cream-canvas rounded-br-none shadow-sm'
                        : 'bg-surface-container-high text-cocoa-text rounded-bl-none border border-blush-surface'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-cocoa-text/50 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-blush-surface bg-surface-container-lowest flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenLocketModal}
              className="p-2 rounded-full text-terra-primary hover:bg-blush-surface/50 transition-colors"
              title="Record voice pulse"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder={`Message ${activeConv.partnerName.split(' ')[0]}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full border border-blush-surface bg-cream-canvas text-xs sm:text-sm text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />

            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-terra-primary text-cream-canvas flex items-center justify-center hover:bg-primary-container shadow-warm transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, AlertCircle, Loader2 } from 'lucide-react';
import { INITIAL_CONVERSATIONS } from '../data/initialData';
import * as api from '../services/api';

export default function MessagesView({ currentUser, onOpenLocketModal, isAuthenticated, onUnreadCountChange }) {
  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // ── Load conversation list ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      // Use mock data in guest/demo mode
      setConversations(INITIAL_CONVERSATIONS);
      if (INITIAL_CONVERSATIONS.length > 0) {
        setActivePartnerId(INITIAL_CONVERSATIONS[0].partnerId);
        setMessages(INITIAL_CONVERSATIONS[0].messages || []);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    api.messages.conversations()
      .then(convs => {
        // normalise backend shape → UI shape
        const normalised = convs.map(c => ({
          id:           `conv_${c.partner_id}`,
          partnerId:    c.partner_id,
          partnerName:  c.partner_name   ?? 'Cultural Connection',
          partnerAvatar: c.partner_avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          lastMessage:  c.last_message   ?? '',
          lastTime:     c.last_time      ?? '',
          unread:       c.unread_count   ?? 0,
        }));
        setConversations(normalised);

        const totalUnread = normalised.reduce((sum, c) => sum + (c.unread || 0), 0);
        onUnreadCountChange?.(totalUnread);

        if (normalised.length > 0 && !activePartnerId) {
          setActivePartnerId(normalised[0].partnerId);
        }
      })
      .catch(() => {
        setConversations(INITIAL_CONVERSATIONS);
        if (INITIAL_CONVERSATIONS.length > 0) {
          setActivePartnerId(INITIAL_CONVERSATIONS[0].partnerId);
          setMessages(INITIAL_CONVERSATIONS[0].messages || []);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Load message thread when partner changes ──────────────────────────────
  useEffect(() => {
    if (!activePartnerId) return;

    if (!isAuthenticated) {
      // Demo mode: find messages in INITIAL_CONVERSATIONS
      const conv = INITIAL_CONVERSATIONS.find(c => c.partnerId === activePartnerId || c.id === `conv_${activePartnerId}`);
      setMessages(conv?.messages || []);
      return;
    }

    api.messages.thread(activePartnerId)
      .then(data => {
        const msgs = (data.messages || []).map(m => ({
          id:     m.id,
          sender: m.sender_id,
          text:   m.text,
          time:   new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(msgs);
        // Mark as read
        api.messages.markRead(activePartnerId).catch(() => {});
        // Update unread
        setConversations(prev =>
          prev.map(c => c.partnerId === activePartnerId ? { ...c, unread: 0 } : c)
        );
      })
      .catch(() => setMessages([]));
  }, [activePartnerId, isAuthenticated]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartnerId) return;

    const text = inputText.trim();
    setInputText('');

    // Optimistic append
    const optimistic = {
      id:     `m_${Date.now()}`,
      sender: currentUser?.id ?? 'usr_rohan',
      text,
      time:   'Just now',
    };
    setMessages(prev => [...prev, optimistic]);

    if (isAuthenticated) {
      setSending(true);
      try {
        await api.messages.send(activePartnerId, text);
      } catch (err) {
        setError('Message failed to send.');
        // Roll back optimistic
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setInputText(text);
      } finally {
        setSending(false);
      }
    } else {
      // Demo mode: fake reply
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id:     `m_${Date.now() + 1}`,
          sender: activePartnerId,
          text:   'Glad we connected on Anvesha! See you at the gathering!',
          time:   'Just now',
        }]);
      }, 1500);
    }

    // Update last message in conversation list
    setConversations(prev =>
      prev.map(c => c.partnerId === activePartnerId
        ? { ...c, lastMessage: text, lastTime: 'Just now' }
        : c
      )
    );
  };

  const activeConv = conversations.find(
    c => c.partnerId === activePartnerId || c.id === `conv_${activePartnerId}`
  ) ?? conversations[0];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-terra-primary animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 text-center space-y-3">
        <p className="font-serif text-xl font-bold text-cocoa-text">No conversations yet</p>
        <p className="text-sm text-cocoa-text/70">
          Connect with someone from the People tab to start a private conversation.
        </p>
      </div>
    );
  }

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
              const isActive = conv.partnerId === activePartnerId;
              return (
                <div
                  key={conv.id ?? conv.partnerId}
                  onClick={() => setActivePartnerId(conv.partnerId)}
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
                      <div className="flex items-center gap-1">
                        {conv.unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-terra-primary text-cream-canvas text-[9px] font-bold flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                        <span className="text-[10px] text-cocoa-text/50">{conv.lastTime}</span>
                      </div>
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
          {activeConv && (
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
          )}

          {/* Messages History */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="text-center my-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-blush-surface/50 text-cocoa-text/70">
                End-to-end private conversation
              </span>
            </div>

            {messages.map(msg => {
              const isMe = msg.sender === (currentUser?.id ?? 'usr_rohan');
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

            <div ref={messagesEndRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
              placeholder={activeConv ? `Message ${activeConv.partnerName?.split(' ')[0] ?? ''}...` : 'Select a conversation'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!activeConv}
              className="flex-1 px-4 py-2.5 rounded-full border border-blush-surface bg-cream-canvas text-xs sm:text-sm text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="w-10 h-10 rounded-full bg-terra-primary text-cream-canvas flex items-center justify-center hover:bg-primary-container shadow-warm transition-all flex-shrink-0 disabled:opacity-50"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

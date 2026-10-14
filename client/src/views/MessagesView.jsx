/**
 * client/src/views/MessagesView.jsx
 *
 * Real-time messaging view powered by Socket.IO.
 * - Subscribes to live `message:new`, `typing`, and `presence:update` events.
 * - Emits `typing` back to the server while the user types.
 * - REST endpoints (/api/messages) stay as the persistence + history layer.
 * - Gracefully degrades when socket is unavailable (polling-only fallback).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { INITIAL_CONVERSATIONS } from '../data/initialData';
import * as api from '../services/api';
import { getSocket } from '../services/socket';

// How long to show the "… is typing" indicator before clearing it automatically
const TYPING_TIMEOUT_MS = 3000;

export default function MessagesView({
  currentUser,
  onOpenLocketModal,
  isAuthenticated,
  onUnreadCountChange,
  authToken,   // passed from App so we know when the socket is ready
}) {
  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId]   = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [inputText, setInputText]               = useState('');
  const [loading, setLoading]                   = useState(true);
  const [sending, setSending]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [typingFrom, setTypingFrom]             = useState(null);   // partnerId who is typing
  const [onlinePartners, setOnlinePartners]     = useState({});     // { [userId]: boolean }
  const [socketConnected, setSocketConnected]   = useState(false);

  const messagesEndRef   = useRef(null);
  const typingTimerRef   = useRef(null);
  const typingEmitTimer  = useRef(null);  // throttle our own typing events

  // ── Scroll to bottom on new message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load conversation list ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
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
        const normalised = convs.map(c => ({
          id:            `conv_${c.partnerId ?? c.partner_id}`,
          partnerId:     c.partnerId  ?? c.partner_id,
          partnerName:   c.partnerName  ?? c.partner_name   ?? 'Cultural Connection',
          partnerAvatar: c.partnerAvatar ?? c.partner_avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          lastMessage:   c.lastMessage  ?? c.last_message   ?? '',
          lastTime:      c.lastTime     ?? c.last_time      ?? '',
          unread:        c.unreadCount  ?? c.unread_count   ?? 0,
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

  // ── Load message thread when active partner changes ───────────────────────
  useEffect(() => {
    if (!activePartnerId) return;

    if (!isAuthenticated) {
      const conv = INITIAL_CONVERSATIONS.find(
        c => c.partnerId === activePartnerId || c.id === `conv_${activePartnerId}`
      );
      setMessages(conv?.messages || []);
      return;
    }

    api.messages.thread(activePartnerId)
      .then(data => {
        const msgs = (data.messages || []).map(normaliseMsg);
        setMessages(msgs);
        api.messages.markRead(activePartnerId).catch(() => {});
        setConversations(prev =>
          prev.map(c => c.partnerId === activePartnerId ? { ...c, unread: 0 } : c)
        );
      })
      .catch(() => setMessages([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartnerId, isAuthenticated]);

  // ── Real-time socket subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    // Socket may connect slightly after mount; poll for it to be ready.
    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 10;

    function attach() {
      const socket = getSocket();
      if (!socket) {
        if (retries++ < MAX_RETRIES) {
          setTimeout(attach, 400);
        }
        return;
      }

      if (cancelled) return;
      setSocketConnected(socket.connected);

      socket.on('connect',    () => !cancelled && setSocketConnected(true));
      socket.on('disconnect', () => !cancelled && setSocketConnected(false));

      // ── Incoming message ────────────────────────────────────────────────
      socket.on('message:new', (msg) => {
        if (cancelled) return;
        const normalised = normaliseMsg(msg);

        // Only append to the active thread — other threads get their
        // unread counter bumped and conversation list updated.
        setMessages(prev => {
          // Deduplicate: the sender already optimistically appended their own msg
          if (prev.some(m => m.id === normalised.id)) return prev;
          if (msg.sender_id !== activePartnerIdRef.current && msg.receiver_id !== activePartnerIdRef.current) {
            return prev;
          }
          return [...prev, normalised];
        });

        // Update conversations list
        setConversations(prev =>
          prev.map(c => {
            if (c.partnerId !== msg.sender_id && c.partnerId !== msg.receiver_id) return c;
            const isActiveThread = activePartnerIdRef.current === c.partnerId;
            return {
              ...c,
              lastMessage: msg.text,
              lastTime:    'Just now',
              unread:      isActiveThread ? 0 : (c.unread || 0) + 1,
            };
          })
        );

        // Mark as read immediately if the thread is open
        if (msg.sender_id !== currentUser?.id && activePartnerIdRef.current === msg.sender_id) {
          api.messages.markRead(msg.sender_id).catch(() => {});
        }
      });

      // ── Typing indicator ────────────────────────────────────────────────
      socket.on('typing', ({ from }) => {
        if (cancelled) return;
        if (from !== activePartnerIdRef.current) return;
        setTypingFrom(from);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(
          () => setTypingFrom(null),
          TYPING_TIMEOUT_MS
        );
      });

      // ── Presence / online status ────────────────────────────────────────
      socket.on('presence:update', ({ userId, online }) => {
        if (cancelled) return;
        setOnlinePartners(prev => ({ ...prev, [userId]: online }));
      });

      // ── Read receipts ────────────────────────────────────────────────────
      socket.on('message:read', ({ by }) => {
        if (cancelled) return;
        // Mark all messages we sent to this person as "delivered+read"
        setMessages(prev =>
          prev.map(m => m.sender === currentUser?.id && m.partnerId === by
            ? { ...m, isRead: true }
            : m
          )
        );
      });
    }

    attach();

    return () => {
      cancelled = true;
      const socket = getSocket();
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('message:new');
        socket.off('typing');
        socket.off('presence:update');
        socket.off('message:read');
      }
      clearTimeout(typingTimerRef.current);
      clearTimeout(typingEmitTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authToken]);

  // We need a ref so socket handlers (which close over the initial value) can
  // always see the current activePartnerId without re-subscribing every time.
  const activePartnerIdRef = useRef(activePartnerId);
  useEffect(() => { activePartnerIdRef.current = activePartnerId; }, [activePartnerId]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartnerId) return;

    const text = inputText.trim();
    setInputText('');

    // Optimistic append
    const optimistic = {
      id:     `opt_${Date.now()}`,
      sender: currentUser?.id ?? 'usr_rohan',
      text,
      time:   'Just now',
    };
    setMessages(prev => [...prev, optimistic]);

    // Update conversations list preview immediately
    setConversations(prev =>
      prev.map(c => c.partnerId === activePartnerId
        ? { ...c, lastMessage: text, lastTime: 'Just now' }
        : c
      )
    );

    if (isAuthenticated) {
      setSending(true);
      try {
        const saved = await api.messages.send(activePartnerId, text);
        // Replace the optimistic message with the persisted one (has a real id)
        setMessages(prev =>
          prev.map(m => m.id === optimistic.id ? normaliseMsg(saved) : m)
        );
      } catch {
        setError('Message failed to send.');
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setInputText(text);
      } finally {
        setSending(false);
      }
    } else {
      // Demo mode: simulate a reply
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id:     `demo_${Date.now()}`,
          sender: activePartnerId,
          text:   'Glad we connected on Anvesha! See you at the gathering!',
          time:   'Just now',
        }]);
      }, 1500);
    }
  };

  // ── Emit typing indicator (throttled) ────────────────────────────────────
  const handleInput = useCallback((e) => {
    setInputText(e.target.value);
    if (!isAuthenticated || !activePartnerId) return;
    clearTimeout(typingEmitTimer.current);
    typingEmitTimer.current = setTimeout(() => {
      getSocket()?.emit('typing', { to: activePartnerId });
    }, 300);
  }, [isAuthenticated, activePartnerId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const activeConv = conversations.find(
    c => c.partnerId === activePartnerId || c.id === `conv_${activePartnerId}`
  ) ?? conversations[0];

  const isPartnerOnline = (partnerId) => onlinePartners[partnerId] ?? false;

  // ── Loading state ─────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Real-time status pill */}
      {isAuthenticated && (
        <div className="flex justify-end mb-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
            socketConnected
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-amber-700 bg-amber-50 border-amber-200'
          }`}>
            {socketConnected
              ? <><Wifi className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> Polling</>}
          </span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface shadow-warm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] h-[calc(100vh-14rem)]">

        {/* ── Left: Conversations List ───────────────────────────────────── */}
        <div className="md:col-span-4 border-r border-blush-surface flex flex-col bg-surface-container/30">
          <div className="p-4 border-b border-blush-surface">
            <h2 className="font-serif text-xl font-bold text-cocoa-text">Connected Circles</h2>
            <p className="text-xs text-cocoa-text/60 mt-0.5">Private conversations with accepted connections</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-blush-surface/50">
            {conversations.map(conv => {
              const isActive = conv.partnerId === activePartnerId;
              const online   = isPartnerOnline(conv.partnerId);
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
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.partnerAvatar}
                      alt={conv.partnerName}
                      className="w-12 h-12 rounded-full object-cover border border-terra-primary/30"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-cream-canvas transition-colors ${
                      online ? 'bg-emerald-500' : 'bg-slate-300'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-bold text-cocoa-text truncate">
                        {conv.partnerName}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
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

        {/* ── Right: Chat Window ─────────────────────────────────────────── */}
        <div className="md:col-span-8 flex flex-col bg-cream-canvas">

          {/* Active Conversation Header */}
          {activeConv && (
            <div className="p-4 border-b border-blush-surface flex items-center justify-between bg-surface-container/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activeConv.partnerAvatar}
                    alt={activeConv.partnerName}
                    className="w-10 h-10 rounded-full object-cover border border-terra-primary/30"
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-cream-canvas ${
                    isPartnerOnline(activeConv.partnerId) ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-cocoa-text">{activeConv.partnerName}</h3>
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${
                    isPartnerOnline(activeConv.partnerId) ? 'text-emerald-700' : 'text-cocoa-text/50'
                  }`}>
                    {isPartnerOnline(activeConv.partnerId)
                      ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" /> Online</>
                      : 'Offline · Paired Culture Connection'}
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
                  <span className="text-[10px] text-cocoa-text/50 mt-1 px-1">{msg.time}</span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingFrom === activePartnerId && (
              <div className="flex items-start">
                <div className="bg-surface-container-high border border-blush-surface rounded-2xl rounded-bl-none px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cocoa-text/40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cocoa-text/40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cocoa-text/40 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
              <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-blush-surface bg-surface-container-lowest flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenLocketModal}
              className="p-2 rounded-full text-terra-primary hover:bg-blush-surface/50 transition-colors flex-shrink-0"
              title="Record voice pulse"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder={activeConv ? `Message ${activeConv.partnerName?.split(' ')[0] ?? ''}…` : 'Select a conversation'}
              value={inputText}
              onChange={handleInput}
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

// ── Private helpers ──────────────────────────────────────────────────────────

function normaliseMsg(m) {
  if (!m) return null;
  return {
    id:     m.id,
    sender: m.sender_id ?? m.sender,
    text:   m.text,
    time:   m.sent_at
      ? new Date(m.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : (m.time ?? 'Just now'),
    isRead: Boolean(m.is_read),
  };
}

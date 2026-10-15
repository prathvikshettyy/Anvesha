/**
 * client/src/views/MessagesView.jsx
 *
 * Real-time messaging view powered by Socket.IO.
 * - Subscribes to live `message:new`, `typing`, and `presence:update` events.
 * - Emits `typing` back to the server while the user types.
 * - REST endpoints (/api/messages) stay as the persistence + history layer.
 * - Gracefully degrades when socket is unavailable (polling-only fallback).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send,
  Mic,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Music,
  Palette,
  MapPin,
  Compass
} from 'lucide-react';
import { INITIAL_CONVERSATIONS, INITIAL_COMMUNITIES } from '../data/initialData';
import * as api from '../services/api';
import { getSocket } from '../services/socket';
import CommunitiesView from './CommunitiesView';

// How long to show the "… is typing" indicator before clearing it automatically
const TYPING_TIMEOUT_MS = 3000;

export default function MessagesView({
  currentUser,
  onOpenLocketModal,
  isAuthenticated,
  onUnreadCountChange,
  authToken,   // passed from App so we know when the socket is ready
  initialPartner,
  initialTab = 'messages',
  initialCommunityId = null,
  onSelectEvent
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'messages');
  const [targetCommunityId, setTargetCommunityId] = useState(initialCommunityId || null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialCommunityId) {
      setTargetCommunityId(initialCommunityId);
      setActiveTab('communities');
    }
  }, [initialTab, initialCommunityId]);

  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId]   = useState(initialPartner ? (initialPartner.id || initialPartner.partnerId) : null);
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

  // Pre-select thread and add conversation entry if initialPartner changed
  useEffect(() => {
    if (initialPartner) {
      const pid = initialPartner.id || initialPartner.partnerId;
      if (pid) {
        setActivePartnerId(pid);
        setConversations(prev => {
          if (prev.some(c => c.partnerId === pid)) return prev;
          const newEntry = {
            id: `conv_${pid}`,
            partnerId: pid,
            partnerName: initialPartner.name || initialPartner.partnerName || 'Cultural Connection',
            partnerAvatar: initialPartner.avatar || initialPartner.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            lastMessage: '',
            lastTime: 'Now',
            unread: 0,
          };
          return [newEntry, ...prev];
        });
      }
    }
  }, [initialPartner]);

  // ── Scroll to bottom on new message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load conversation list ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setConversations(INITIAL_CONVERSATIONS);
      if (initialPartner) {
        const pid = initialPartner.id || initialPartner.partnerId;
        setActivePartnerId(pid);
        const conv = INITIAL_CONVERSATIONS.find(c => c.partnerId === pid);
        if (conv) setMessages(conv.messages || []);
      } else if (INITIAL_CONVERSATIONS.length > 0) {
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

        if (initialPartner) {
          const pid = initialPartner.id || initialPartner.partnerId;
          setActivePartnerId(pid);
          if (!normalised.some(c => c.partnerId === pid)) {
            normalised.unshift({
              id: `conv_${pid}`,
              partnerId: pid,
              partnerName: initialPartner.name || initialPartner.partnerName || 'Cultural Connection',
              partnerAvatar: initialPartner.avatar || initialPartner.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
              lastMessage: '',
              lastTime: 'Now',
              unread: 0,
            });
          }
        } else if (normalised.length > 0 && !activePartnerId) {
          setActivePartnerId(normalised[0].partnerId);
        }

        setConversations(normalised);

        const totalUnread = normalised.reduce((sum, c) => sum + (c.unread || 0), 0);
        onUnreadCountChange?.(totalUnread);
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
      socket.off('message:new');
      socket.on('message:new', (msg) => {
        if (cancelled) return;
        const normalised = normaliseMsg(msg);

        // Only append to the active thread — other threads get their
        // unread counter bumped and conversation list updated.
        setMessages(prev => {
          // 1. Deduplicate: if already in list by exact ID, do not duplicate
          if (prev.some(m => m.id === normalised.id)) return prev;

          // 2. Only update if relevant to current partner thread
          const currentPartner = activePartnerIdRef.current;
          if (msg.sender_id !== currentPartner && msg.receiver_id !== currentPartner) {
            return prev;
          }

          // 3. If current user sent this, reconcile with in-flight optimistic message
          const myId = currentUser?.id ?? 'usr_rohan';
          if (msg.sender_id === myId) {
            const optIdx = prev.findIndex(m => String(m.id).startsWith('opt_') && m.text === normalised.text);
            if (optIdx !== -1) {
              const next = [...prev];
              next[optIdx] = normalised;
              return next;
            }
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
        const normSaved = normaliseMsg(saved);

        // Reconcile optimistic message with persisted message
        setMessages(prev => {
          // If the socket already replaced or added this saved message, drop optimistic message
          if (prev.some(m => m.id === normSaved.id)) {
            return prev.filter(m => m.id !== optimistic.id);
          }
          return prev.map(m => m.id === optimistic.id ? normSaved : m);
        });
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

  const unreadTotal = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unread || c.unreadCount || 0), 0);
  }, [conversations]);

  // Clean deduplication for rendered messages
  const displayedMessages = useMemo(() => {
    const seenIds = new Set();
    const result = [];
    for (const m of messages) {
      if (!m || !m.id) continue;
      if (seenIds.has(m.id)) continue;

      // Drop in-flight optimistic copy if a persisted message with identical text already exists
      const isDuplicatePending = String(m.id).startsWith('opt_') && result.some(
        existing => existing.sender === m.sender && existing.text === m.text
      );
      if (isDuplicatePending) continue;

      seenIds.add(m.id);
      result.push(m);
    }
    return result;
  }, [messages]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && conversations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-terra-primary animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-5">
      {/* ── 1. Connect Top Navigation & Tab Switcher ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush-surface/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">Connect</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary border border-terra-primary/20">
              Community & Chat
            </span>
          </div>
          <p className="text-xs sm:text-sm text-cocoa-text/70 mt-0.5">
            Meet people through shared interests, cultural experiences, and communities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time status pill */}
          {isAuthenticated && (
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
              socketConnected
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              {socketConnected
                ? <><Wifi className="w-3 h-3" /> Live</>
                : <><WifiOff className="w-3 h-3" /> Polling</>}
            </span>
          )}

          {/* Clear Tabs: Messages vs Communities */}
          <div className="flex items-center bg-surface-container p-1 rounded-2xl border border-blush-surface shadow-xs">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-cocoa-text text-cream-canvas shadow-warm'
                  : 'text-cocoa-text/70 hover:text-cocoa-text hover:bg-blush-surface/40'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'messages' ? 'text-ochre-accent' : 'text-terra-primary'}`} />
              <span>Messages</span>
              {unreadTotal > 0 && (
                <span className="w-4 h-4 rounded-full bg-terra-primary text-cream-canvas text-[9px] font-bold flex items-center justify-center">
                  {unreadTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('communities')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'communities'
                  ? 'bg-cocoa-text text-cream-canvas shadow-warm'
                  : 'text-cocoa-text/70 hover:text-cocoa-text hover:bg-blush-surface/40'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'communities' ? 'text-ochre-accent' : 'text-terra-primary'}`} />
              <span>Communities</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Tab Content: Communities View ────────────────────────────── */}
      {activeTab === 'communities' ? (
        <CommunitiesView
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onSelectEvent={onSelectEvent}
          initialActiveCommunityId={targetCommunityId}
        />
      ) : (
        /* ── 3. Tab Content: Messages View (1-on-1 private messaging) ───── */
        <div className="bg-surface-container-lowest rounded-3xl border-2 border-blush-surface shadow-warm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] h-[calc(100vh-14rem)]">

          {/* ── Left: Connections & Suggested Communities ────────────────── */}
          <div className="md:col-span-4 border-r border-blush-surface flex flex-col bg-surface-container/30 justify-between">
            {/* Header: YOUR CONNECTIONS */}
            <div className="p-3.5 sm:p-4 border-b border-blush-surface">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cocoa-text/60">
                Your Connections
              </span>
              <p className="text-xs text-cocoa-text/80 font-medium mt-0.5">
                Private conversations and shared words
              </p>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-blush-surface/50">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-cocoa-text/60 space-y-2">
                  <p className="font-bold">No active private conversations yet.</p>
                  <p>Discover people from the Find People tab or connect in community circles.</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const isActive = conv.partnerId === activePartnerId;
                  const online   = isPartnerOnline(conv.partnerId);
                  return (
                    <div
                      key={conv.id ?? conv.partnerId}
                      onClick={() => setActivePartnerId(conv.partnerId)}
                      className={`p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-cream-canvas border-l-4 border-terra-primary shadow-xs'
                          : 'hover:bg-blush-surface/30'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={conv.partnerAvatar}
                          alt={conv.partnerName}
                          className="w-11 h-11 rounded-full object-cover border border-terra-primary/30"
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
                        <p className="text-xs text-cocoa-text/70 truncate mt-0.5">{conv.lastMessage || 'Say namaskara...'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: Chat Window ───────────────────────────────────────── */}
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

            {displayedMessages.map(msg => {
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
      )}
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

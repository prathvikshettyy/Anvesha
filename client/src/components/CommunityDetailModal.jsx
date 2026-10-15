import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  Send,
  Flag,
  Check,
  LogOut,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as api from '../services/api';
import { getSocket } from '../services/socket';

export default function CommunityDetailModal({
  community,
  isOpen,
  onClose,
  currentUser,
  isAuthenticated,
  onJoinToggle,
  onSelectEvent
}) {
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate discussion');
  const [reportStatus, setReportStatus] = useState('');
  const [members, setMembers] = useState(community?.members || []);

  const messagesEndRef = useRef(null);

  // Clean deduplication for rendered messages
  const displayedMessages = useMemo(() => {
    const seenIds = new Set();
    const result = [];
    for (const m of messages) {
      if (!m || !m.id) continue;
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      result.push(m);
    }
    return result;
  }, [messages]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  // Load discussion messages from backend API
  useEffect(() => {
    if (!community || !isOpen) return;

    setLoadingMsgs(true);
    api.communities.messages(community.id)
      .then(msgs => {
        setMessages(msgs);
      })
      .catch(() => {
        // Fallback to embedded community messages if available
        setMessages(community.messages || []);
      })
      .finally(() => setLoadingMsgs(false));

    // Also fetch full community details (including active members list)
    api.communities.get(community.id)
      .then(det => {
        if (det.members) setMembers(det.members);
      })
      .catch(() => {
        setMembers(community.members || []);
      });
  }, [community?.id, isOpen]);

  // Listen for real-time live community messages via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !community) return;

    const handleNewCommMsg = (data) => {
      if (data && (data.communityId === community.id || data.community_id === community.id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on('community:message:new', handleNewCommMsg);
    return () => {
      socket.off('community:message:new', handleNewCommMsg);
    };
  }, [community?.id]);

  if (!isOpen || !community) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    if (isAuthenticated) {
      setSending(true);
      try {
        const newMsg = await api.communities.sendMessage(community.id, textToSend);
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch (err) {
        alert(err.message || 'Failed to send message. Please ensure you have joined the community.');
        setInputText(textToSend);
      } finally {
        setSending(false);
      }
    } else {
      // Demo unauthenticated simulation
      const optimistic = {
        id: `demo_${Date.now()}`,
        communityId: community.id,
        senderId: currentUser?.id || 'usr_guest',
        senderName: currentUser?.name || 'Guest Culturalist',
        senderHandle: currentUser?.handle || '@guest',
        senderAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        text: textToSend,
        sentAt: 'Just now'
      };
      setMessages(prev => [...prev, optimistic]);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isAuthenticated) {
        await api.communities.report(community.id, { reason: reportReason });
      }
      setReportStatus('Report submitted. Thank you for protecting community safety.');
      setTimeout(() => {
        setReportOpen(false);
        setReportStatus('');
      }, 2000);
    } catch (_) {
      setReportStatus('Thank you for notifying us.');
      setTimeout(() => {
        setReportOpen(false);
        setReportStatus('');
      }, 1500);
    }
  };

  const handleJoinToggleClick = () => {
    if (!community.isMember) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
    }
    onJoinToggle?.(community);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-cocoa-text/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-canvas w-full max-w-3xl rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[94vh] h-[94vh]">
        
        {/* Header Artwork Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-blush-surface/40 flex-shrink-0">
          <img
            src={community.image || '/images/cinematic_india_hero.jpg'}
            alt={community.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/cinematic_india_hero.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/85 via-cocoa-text/35 to-transparent" />

          {/* Top Back & Close Buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-canvas/90 hover:bg-cream-canvas text-cocoa-text text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Communities</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportOpen(true)}
                title="Report Community"
                className="w-8 h-8 rounded-full bg-cream-canvas/80 hover:bg-cream-canvas text-cocoa-text/80 hover:text-red-600 flex items-center justify-center shadow-md transition-all cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-cream-canvas/80 hover:bg-cream-canvas text-cocoa-text flex items-center justify-center shadow-md transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner Meta details */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cream-canvas text-cocoa-text shadow-xs border border-blush-surface">
                  {community.categoryLabel || community.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-terra-primary/90 text-cream-canvas">
                  {community.type === 'EVENT' ? 'Event Circle' : community.type === 'LOCATION' ? 'Local Hub' : 'Interest Circle'}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cream-canvas leading-tight drop-shadow-md">
                {community.name}
              </h2>
            </div>

            {/* Join / Leave Action Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleJoinToggleClick}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  community.isMember
                    ? 'bg-cream-canvas text-cocoa-text hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-blush-surface'
                    : 'bg-terra-primary hover:bg-primary-container text-cream-canvas hover:scale-105'
                }`}
              >
                {community.isMember ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Member · Leave</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
                    <span>Join Community</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Community Info Bar */}
        <div className="bg-surface-container/60 border-b border-blush-surface px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-cocoa-text/80">
            <div className="flex items-center gap-1.5 font-semibold">
              <Users className="w-4 h-4 text-terra-primary" />
              <span>{community.memberCount || members.length || 0} Members</span>
            </div>

            {community.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-terra-primary" />
                <span>{community.location}</span>
              </div>
            )}
          </div>

          {/* Member Avatars Stack */}
          {members && members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-cocoa-text/60">Active:</span>
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 5).map((m, idx) => (
                  <img
                    key={m.id || idx}
                    src={m.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.name}`}
                    alt={m.name}
                    title={`${m.name} (${m.role || 'Member'})`}
                    className="w-6 h-6 rounded-full border-2 border-cream-canvas object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Linked Cultural Event Callout (if event-based) */}
        {community.event && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 sm:p-3.5 rounded-2xl bg-ochre-accent/10 border border-ochre-accent/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                <img
                  src={community.event.image || community.image}
                  alt={community.event.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ochre-accent block">
                  Connected Gathering
                </span>
                <h4 className="font-serif font-bold text-cocoa-text text-xs sm:text-sm">
                  {community.event.title}
                </h4>
                <p className="text-[11px] text-cocoa-text/70">{community.event.date} · {community.event.venue}</p>
              </div>
            </div>

            <button
              onClick={() => onSelectEvent?.(community.event)}
              className="px-3 py-1.5 rounded-full bg-cream-canvas border border-blush-surface hover:bg-blush-surface/50 text-cocoa-text text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <span>View Gathering</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Main Content: Description + Group Discussion */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Description Callout */}
          <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl border border-blush-surface/80 space-y-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-cocoa-text/60">
              About This Circle
            </h4>
            <p className="text-xs sm:text-sm text-cocoa-text/85 leading-relaxed">
              {community.description}
            </p>
          </div>

          {/* Group Discussion Header */}
          <div className="flex items-center justify-between border-b border-blush-surface/60 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base sm:text-lg font-bold text-cocoa-text">
                Group Discussion & Experience Sharing
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blush-surface/60 text-cocoa-text/70">
                {messages.length} notes
              </span>
            </div>
            <span className="text-[11px] text-cocoa-text/60">Cultural safe space</span>
          </div>

          {/* Messages Stream */}
          <div className="space-y-3 min-h-[160px]">
            {loadingMsgs ? (
              <div className="py-12 flex items-center justify-center text-terra-primary">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : displayedMessages.length === 0 ? (
              <div className="py-8 text-center text-xs text-cocoa-text/60 space-y-1">
                <p className="font-bold">No discussion notes yet.</p>
                <p>Be the first member to start the conversation!</p>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isCurrentUser = (currentUser?.id && msg.senderId === currentUser.id) || (currentUser?.name && msg.senderName === currentUser.name);
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={msg.senderAvatar || msg.sender_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.senderName || 'user'}`}
                      alt={msg.senderName || 'Member'}
                      className="w-8 h-8 rounded-full border border-blush-surface object-cover flex-shrink-0"
                    />
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs space-y-1 ${
                        isCurrentUser
                          ? 'bg-terra-primary text-cream-canvas rounded-tr-none'
                          : 'bg-surface-container-lowest text-cocoa-text border border-blush-surface rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] opacity-75">
                        <span className="font-bold">{msg.senderName || 'Community Member'}</span>
                        {msg.senderHandle && <span>{msg.senderHandle}</span>}
                        <span>· {msg.sentAt || 'Recently'}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Footer Area: Message Input or Join Callout */}
        <div className="p-3 sm:p-4 bg-surface-container/60 border-t border-blush-surface flex-shrink-0">
          {community.isMember ? (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Share a note, ask a question, or coordinate with the circle...`}
                className="flex-1 px-4 py-2.5 rounded-full border border-blush-surface bg-surface-container-lowest text-cocoa-text text-xs focus:outline-none focus:ring-2 focus:ring-terra-primary/40 shadow-xs"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas flex items-center justify-center shadow-warm transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-cream-canvas border border-terra-primary/30 text-xs">
              <div className="flex items-center gap-2.5 text-cocoa-text">
                <ShieldCheck className="w-4 h-4 text-terra-primary flex-shrink-0" />
                <span>
                  Discussion is open to members. Join this circle to participate, ask questions, and share cultural experiences.
                </span>
              </div>
              <button
                onClick={handleJoinToggleClick}
                className="px-4 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
                <span>Join to Discuss</span>
              </button>
            </div>
          )}
        </div>

        {/* Report Moderation Modal */}
        {reportOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-cocoa-text/70 backdrop-blur-sm">
            <div className="bg-cream-canvas p-6 rounded-3xl border-2 border-blush-surface shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg font-bold text-cocoa-text">
                  Report Community to Guardians
                </h4>
                <button
                  onClick={() => setReportOpen(false)}
                  className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-cocoa-text/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-cocoa-text/70">
                Help us keep Anvesha respectful and culturally authentic. Please tell us why you are flagging this community:
              </p>

              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                {['Inappropriate discussion', 'Spam or irrelevant advertisements', 'Harassment or hate speech', 'Incorrect gathering details'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 p-2 rounded-xl hover:bg-blush-surface/30 cursor-pointer">
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt}
                      checked={reportReason === opt}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="accent-terra-primary"
                    />
                    <span className="font-medium text-cocoa-text">{opt}</span>
                  </label>
                ))}

                {reportStatus && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {reportStatus}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2 rounded-full border border-blush-surface text-cocoa-text font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-terra-primary text-cream-canvas font-bold shadow-xs hover:bg-primary-container"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Calendar, MapPin, CheckCircle, ExternalLink, Bookmark, Users,
  Heart, Share2, Loader2, ArrowRight, Star, MessageSquare, Edit3,
  Trash2, AlertCircle, CheckCircle2, ThumbsUp, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getEventImage, handleEventImageError } from '../utils/eventPlaceholder';
import { generateIdenticon } from '../utils/identicon';
import * as api from '../services/api';
import { EVENT_ORGANIZER_MAP, INITIAL_PEOPLE } from '../data/initialData';

const RATING_LABELS = {
  1: 'Disappointing',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional',
};

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onOpenCommunity,
  onJoinCommunity,
  communities = [],
  currentUser = null,
  isAuthenticated = false,
  onEventUpdated = null,
  people = [],
  onContactOrganiser = null,
}) {
  // Find linked community for this event if one exists
  const matchedCommunity = communities.find(c => c.eventId === event?.id || c.event_id === event?.id)
    || (event?.id === 'evt_1' ? { id: 'comm_evt_manipal_fest', name: 'Manipal Cultural Fest 2026', memberCount: 38 }
    : event?.id === 'evt_2' ? { id: 'comm_evt_dasara', name: 'Mysuru Dasara Cultural Circle', memberCount: 42 }
    : event?.id === 'evt_3' || event?.id === 'evt_k1' ? { id: 'comm_evt_hackathon', name: 'Bengaluru Culture Tech Hackers', memberCount: 54 }
    : event?.id === 'evt_6' ? { id: 'comm_dialects_lit', name: 'Tulu & Konkani Dialect Circle', memberCount: 22 }
    : null);

  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [memberCount, setMemberCount] = useState(42);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: null, reviewCount: 0, distribution: {} });
  const [userReview, setUserReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formFeedback, setFormFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  useEffect(() => {
    if (matchedCommunity) {
      setIsJoined(Boolean(matchedCommunity.isMember));
      setMemberCount(matchedCommunity.memberCount || 42);
    }
  }, [matchedCommunity?.id, matchedCommunity?.isMember, matchedCommunity?.memberCount]);

  // Helper to refresh reviews after submit/delete
  const loadReviewsData = async (eventId) => {
    if (!eventId) return;
    try {
      const data = await api.events.reviews(eventId);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { averageRating: null, reviewCount: 0, distribution: {} });
      setUserReview(data.userReview || null);

      if (data.userReview) {
        setFormRating(data.userReview.rating);
        setFormFeedback(data.userReview.feedback || '');
      } else {
        setFormRating(5);
        setFormFeedback('');
        setIsEditing(false);
      }
    } catch (err) {
      console.warn('Could not load reviews for event:', err);
      setReviews([]);
    }
  };

  const eventId = event?.id;

  // Fetch reviews whenever the modal opens or the active event ID changes
  useEffect(() => {
    if (!isOpen || !eventId) return;

    let isMounted = true;
    setLoadingReviews(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    setIsEditing(false);

    api.events.reviews(eventId)
      .then((data) => {
        if (!isMounted) return;
        setReviews(data.reviews || []);
        setReviewStats(data.stats || { averageRating: null, reviewCount: 0, distribution: {} });
        setUserReview(data.userReview || null);

        if (data.userReview) {
          setFormRating(data.userReview.rating);
          setFormFeedback(data.userReview.feedback || '');
        } else {
          setFormRating(5);
          setFormFeedback('');
          setIsEditing(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not load reviews for event:', err);
        setReviews([]);
      })
      .finally(() => {
        if (isMounted) setLoadingReviews(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, eventId]);

  if (!isOpen || !event) return null;

  const handleJoinClick = async () => {
    if (!matchedCommunity || joining) return;
    setJoining(true);
    try {
      if (onJoinCommunity) {
        await onJoinCommunity(matchedCommunity);
      }
      setIsJoined(true);
      setMemberCount(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
    } catch (err) {
      console.error('Failed to join community:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleRsvp = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C56E50', '#D9A441', '#E9CDB8']
    });
    alert(`🎉 RSVP Confirmed for "${event.title}"! Added to your calendar.`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setSubmitError('Please sign in to rate this event and share your feedback.');
      return;
    }
    if (!formRating || formRating < 1 || formRating > 5) {
      setSubmitError('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmittingReview(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await api.events.submitReview(event.id, {
        rating: formRating,
        feedback: formFeedback.trim()
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });

      setSubmitSuccess(res.message || 'Review submitted successfully!');
      setIsEditing(false);
      await loadReviewsData(event.id);

      if (onEventUpdated && res.stats) {
        onEventUpdated({
          id: event.id,
          averageRating: res.stats.averageRating,
          reviewCount: res.stats.reviewCount,
        });
      }

      setTimeout(() => {
        setSubmitSuccess(null);
      }, 4000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm('Are you sure you want to remove your rating and review?')) return;
    setDeletingReview(true);
    setSubmitError(null);
    try {
      const res = await api.events.deleteReview(event.id);
      setUserReview(null);
      setFormRating(5);
      setFormFeedback('');
      setIsEditing(false);
      await loadReviewsData(event.id);

      if (onEventUpdated && res.stats) {
        onEventUpdated({
          id: event.id,
          averageRating: res.stats.averageRating,
          reviewCount: res.stats.reviewCount,
        });
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setSubmitError(err.message || 'Failed to delete review.');
    } finally {
      setDeletingReview(false);
    }
  };

  const avgRatingDisplay = reviewStats.averageRating != null
    ? Number(reviewStats.averageRating).toFixed(1)
    : (event.averageRating != null ? Number(event.averageRating).toFixed(1) : null);

  const reviewCountDisplay = reviewStats.reviewCount || event.reviewCount || 0;

  // Resolve organizer user from event data, people list, or default directory
  const organizerId = event?.submitted_by || event?.submittedBy || (event?.id ? EVENT_ORGANIZER_MAP[event.id] : null);

  const organizerUser = event?.organizerUser
    || (organizerId ? (people.find(p => p.id === organizerId) || INITIAL_PEOPLE.find(p => p.id === organizerId)) : null)
    || (event?.organizer && (people.find(p => p.name?.toLowerCase() === event.organizer?.toLowerCase() || p.handle?.toLowerCase() === event.organizer?.toLowerCase()) || INITIAL_PEOPLE.find(p => p.name?.toLowerCase() === event.organizer?.toLowerCase() || p.handle?.toLowerCase() === event.organizer?.toLowerCase())))
    || null;

  const organizerName = organizerUser?.name || event?.organizer || 'Community Organiser';
  const organizerRole = organizerUser?.role || 'Event Host & Cultural Lead';
  const organizerHandle = organizerUser?.handle || (organizerUser?.username ? `@${organizerUser.username}` : null);
  const organizerAvatar = organizerUser?.avatar || organizerUser?.avatarUrl || (organizerName ? generateIdenticon(organizerName) : null);
  const isSelf = Boolean(currentUser && organizerUser && (currentUser.id === organizerUser.id));

  const handleContactOrganiserClick = () => {
    if (isSelf) return;
    if (!organizerUser) {
      alert('This event organiser does not have an active chat profile on Anvesha. Please consult the official source link.');
      return;
    }
    onClose();
    if (onContactOrganiser) {
      onContactOrganiser(organizerUser, event);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-canvas w-full max-w-2xl rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Banner with Close button */}
        <div className="relative h-52 sm:h-60 w-full bg-blush-surface/30 flex-shrink-0">
          <img
            src={getEventImage(event)}
            alt={event.title}
            onError={(e) => handleEventImageError(e, event?.category)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/80 via-cocoa-text/25 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-cream-canvas/80 hover:bg-cream-canvas text-cocoa-text flex items-center justify-center shadow-md transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Rating Pill Tag */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cream-canvas text-cocoa-text shadow-sm border border-blush-surface">
                {event.categoryLabel}
              </span>

              {avgRatingDisplay && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-white font-bold text-xs shadow-sm backdrop-blur-sm">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>{avgRatingDisplay}</span>
                  <span className="text-white/80 font-normal">({reviewCountDisplay})</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-canvas/90 text-xs font-semibold text-cocoa-text backdrop-blur-sm">
              <CheckCircle className="w-3.5 h-3.5 text-terra-primary" />
              <span>{event.sourceLabel}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text leading-tight">
              {event.title}
            </h2>
            <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
              <p className="text-xs sm:text-sm text-cocoa-text/70 font-medium">
                Organized by <strong className="text-cocoa-text">{event.organizer}</strong>
              </p>
              {avgRatingDisplay && (
                <div className="flex items-center gap-1 text-xs text-cocoa-text/75 font-semibold">
                  <span className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(Number(avgRatingDisplay))
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-cocoa-text/20'
                        }`}
                      />
                    ))}
                  </span>
                  <span className="font-bold text-cocoa-text">{avgRatingDisplay}</span>
                  <span className="text-cocoa-text/50">({reviewCountDisplay} {reviewCountDisplay === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Location Pill Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-container/60 border border-blush-surface text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-cocoa-text/60 font-medium">Date & Time</span>
                <p className="font-bold text-cocoa-text">{event.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-cocoa-text/60 font-medium">Location</span>
                <p className="font-bold text-cocoa-text">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-cocoa-text/60 mb-2">
              About This Cultural Gathering
            </h4>
            <p className="text-sm text-cocoa-text/85 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* EVENT ORGANISER & DIRECT CONTACT SECTION                          */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container/60 border border-blush-surface space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary flex items-center gap-1.5 font-mono">
                <Users className="w-3.5 h-3.5" /> Event Host & Organiser
              </span>
              {organizerHandle && (
                <span className="text-[11px] font-medium text-cocoa-text/60 bg-cream-canvas px-2.5 py-0.5 rounded-full border border-blush-surface font-mono">
                  {organizerHandle}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  {organizerAvatar ? (
                    <img
                      src={organizerAvatar}
                      alt={organizerName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-terra-primary/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary font-bold text-sm border border-terra-primary/20">
                      {organizerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-cream-canvas" title="Verified Host" />
                </div>

                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-cocoa-text text-base sm:text-lg leading-tight truncate">
                    {organizerName}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-cocoa-text/70 mt-0.5">
                    <span className="font-semibold text-terra-primary">{organizerRole}</span>
                    {event.organizer && event.organizer !== organizerName && (
                      <>
                        <span>•</span>
                        <span className="truncate">{event.organizer}</span>
                      </>
                    )}
                    {(organizerUser?.city || event.city) && (
                      <>
                        <span>•</span>
                        <span>{organizerUser?.city || event.city}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action button inside organiser card */}
              {!isSelf && (
                <button
                  onClick={handleContactOrganiserClick}
                  className="px-4 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer flex-shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Organiser</span>
                </button>
              )}
            </div>

            {organizerUser?.bio && (
              <p className="text-xs text-cocoa-text/80 leading-relaxed italic bg-cream-canvas/70 p-3 rounded-xl border border-blush-surface/60">
                "{organizerUser.bio}"
              </p>
            )}

            {/* Configured Contact Info & Privacy Notice */}
            <div className="p-3 rounded-xl bg-cream-canvas/90 border border-blush-surface text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-cocoa-text flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-terra-primary" />
                  Available Contact Information:
                </span>
                {event.sourceUrl && (
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-terra-primary hover:underline"
                  >
                    <span>{event.sourceLabel || 'Official Event Link'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-cocoa-text/70 leading-relaxed">
                {organizerUser
                  ? "Direct phone number and personal email are not publicly listed by the organiser to safeguard privacy. You can reach out directly and securely via Anvesha Chat using the Contact button."
                  : "No direct personal phone or email details have been configured by the organiser for this listing. Official platform links and updates are available above."}
              </p>
            </div>
          </div>

          {/* Event-based Community Entry Point */}
          {matchedCommunity && (
            <div className="p-4 rounded-2xl bg-terra-primary/5 border border-terra-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-terra-primary">
                      Event Community Circle
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-canvas text-cocoa-text/70 border border-blush-surface font-semibold">
                      {memberCount}+ members
                    </span>
                    {isJoined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Joined
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-cocoa-text text-sm sm:text-base">
                    {matchedCommunity.name}
                  </h4>
                  <p className="text-xs text-cocoa-text/70">
                    Connect with attendees, coordinate arrival, and share live discussions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isJoined ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCommunity?.(matchedCommunity);
                    }}
                    className="px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-cream-canvas text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Open Circle Discussion</span>
                  </button>
                ) : (
                  <button
                    disabled={joining}
                    onClick={handleJoinClick}
                    className="px-4 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-75"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Community</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}


          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* RATINGS & ATTENDEE FEEDBACK SECTION                               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="pt-2 border-t border-blush-surface/80">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-cocoa-text">
                    Ratings & Attendee Feedback
                  </h3>
                  <p className="text-xs text-cocoa-text/60">
                    Authentic perspectives from community members who attended
                  </p>
                </div>
              </div>

              {avgRatingDisplay && (
                <div className="flex items-center gap-2 bg-surface-container/80 px-3 py-1.5 rounded-2xl border border-blush-surface">
                  <span className="font-serif font-bold text-lg text-cocoa-text">{avgRatingDisplay}</span>
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(Number(avgRatingDisplay))
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-cocoa-text/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-cocoa-text/60">({reviewCountDisplay})</span>
                </div>
              )}
            </div>

            {/* Submission Alerts */}
            {submitSuccess && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* User Review Box (if already reviewed and not currently editing) */}
            {isAuthenticated && userReview && !isEditing && (
              <div className="mb-5 p-4 rounded-2xl bg-terra-primary/5 border-2 border-terra-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-terra-primary bg-terra-primary/10 px-2.5 py-0.5 rounded-full">
                      Your Review
                    </span>
                    <div className="flex text-amber-500 ml-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= userReview.rating ? 'fill-amber-500 text-amber-500' : 'text-cocoa-text/20'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-cocoa-text ml-1">
                      {RATING_LABELS[userReview.rating]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setFormRating(userReview.rating);
                        setFormFeedback(userReview.feedback || '');
                        setIsEditing(true);
                      }}
                      className="px-2.5 py-1 rounded-full bg-cream-canvas hover:bg-blush-surface text-cocoa-text text-xs font-semibold flex items-center gap-1 border border-blush-surface transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-terra-primary" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDeleteReview}
                      disabled={deletingReview}
                      className="px-2.5 py-1 rounded-full bg-cream-canvas hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 border border-blush-surface transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingReview ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {userReview.feedback ? (
                  <p className="text-xs sm:text-sm text-cocoa-text/90 italic leading-relaxed">
                    "{userReview.feedback}"
                  </p>
                ) : (
                  <p className="text-xs text-cocoa-text/50 italic">
                    (No written feedback provided)
                  </p>
                )}

                <p className="text-[10px] text-cocoa-text/50 mt-2">
                  Reviewed on {new Date(userReview.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {userReview.updatedAt && userReview.updatedAt !== userReview.createdAt && ' • Edited'}
                </p>
              </div>
            )}

            {/* Rating Submission / Edit Form */}
            {isAuthenticated && (!userReview || isEditing) && (
              <form onSubmit={handleSubmitReview} className="mb-5 p-4 sm:p-5 rounded-2xl bg-surface-container/60 border border-blush-surface space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-cocoa-text">
                    {isEditing ? 'Edit Your Cultural Review' : 'Rate Your Experience'}
                  </h4>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-cocoa-text/60 hover:text-cocoa-text underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* 1-5 Star Picker */}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeLevel = hoverRating || formRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-cocoa-text/20 hover:scale-115 transition-transform cursor-pointer"
                            aria-label={`Rate ${star} star`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                star <= activeLevel
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-cocoa-text/25'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-cocoa-text ml-1">
                      {RATING_LABELS[hoverRating || formRating]} ({hoverRating || formRating}/5)
                    </span>
                  </div>
                </div>

                {/* Written Feedback Field */}
                <div>
                  <label htmlFor="review-feedback" className="block text-xs font-medium text-cocoa-text/70 mb-1">
                    Written Feedback <span className="text-cocoa-text/40">(Optional)</span>
                  </label>
                  <textarea
                    id="review-feedback"
                    value={formFeedback}
                    onChange={(e) => setFormFeedback(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Share what made this gathering memorable, highlights of the tradition, organization, or tips for attendees..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blush-surface bg-cream-canvas text-xs text-cocoa-text placeholder-cocoa-text/40 focus:outline-hidden focus:ring-2 focus:ring-terra-primary/30 leading-relaxed resize-none"
                  />
                  <div className="flex justify-end text-[10px] text-cocoa-text/50 mt-1">
                    {formFeedback.length} / 2000
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-1">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-full border border-blush-surface text-cocoa-text hover:bg-blush-surface text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-warm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Save Changes' : 'Submit Review'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Unauthenticated Guest Callout */}
            {!isAuthenticated && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Star className="w-5 h-5 text-amber-600 fill-amber-500 flex-shrink-0" />
                  <p className="text-cocoa-text/80">
                    Did you attend this cultural event? <strong>Log in</strong> to leave your 1-5 star rating and written review!
                  </p>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-cocoa-text/60">
                Community Reviews ({reviews.length})
              </h4>

              {loadingReviews ? (
                <div className="py-8 flex flex-col items-center justify-center text-xs text-cocoa-text/60 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-terra-primary" />
                  <span>Loading authentic attendee reviews...</span>
                </div>
              ) : reviews.length === 0 ? (
                /* Empty state */
                <div className="py-8 px-4 rounded-2xl bg-surface-container/40 border border-blush-surface/60 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-blush-surface/50 flex items-center justify-center text-terra-primary/70 mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h5 className="font-serif font-bold text-sm text-cocoa-text">
                    No reviews yet for this gathering
                  </h5>
                  <p className="text-xs text-cocoa-text/65 max-w-sm mt-1 leading-relaxed">
                    Be the first cultural seeker to share an honest rating and experience from this gathering.
                  </p>
                </div>
              ) : (
                /* List of reviews */
                <div className="space-y-3">
                  {reviews.map((rev) => {
                    const isSelf = currentUser && rev.userId === currentUser.id;
                    const avatarUrl = rev.user?.avatar || (rev.user?.username ? generateIdenticon(rev.user.username) : null);
                    const formattedDate = rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recently';

                    return (
                      <div
                        key={rev.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          isSelf
                            ? 'bg-terra-primary/5 border-terra-primary/30 shadow-xs'
                            : 'bg-surface-container-lowest border-blush-surface/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-blush-surface flex-shrink-0 border border-blush-surface">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={rev.user?.name || 'Reviewer'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = generateIdenticon(rev.user?.username || 'user');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-terra-primary">
                                  {(rev.user?.name || 'U')[0]}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-cocoa-text">
                                  {rev.user?.name || 'Community Member'}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-terra-primary text-cream-canvas">
                                    You
                                  </span>
                                )}
                                {rev.user?.city && (
                                  <span className="text-[10px] text-cocoa-text/50">
                                    • {rev.user.city}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-cocoa-text/50">
                                {formattedDate}
                                {rev.updatedAt && rev.updatedAt !== rev.createdAt && ' (edited)'}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating Badge */}
                          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-xs">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span className="font-bold text-cocoa-text text-[11px]">{rev.rating}</span>
                          </div>
                        </div>

                        {rev.feedback && (
                          <p className="text-xs text-cocoa-text/85 mt-2.5 leading-relaxed pl-10">
                            {rev.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Source Attribution Box */}
          <div className="p-3.5 rounded-2xl bg-cream-canvas border border-blush-surface flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-cocoa-text">Source Lead:</span>
              <p className="text-cocoa-text/70 mt-0.5">{event.sourceLabel}</p>
            </div>
            {event.sourceUrl && (/^https?:\/\//i.test(event.sourceUrl) || event.sourceUrl.startsWith('/')) && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blush-surface/50 hover:bg-blush-surface text-cocoa-text font-bold transition-all"
              >
                <span>View Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-surface-container/60 border-t border-blush-surface flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
          <button
            onClick={() => onToggleSave(event.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${isSaved
                ? 'bg-blush-surface border-terra-primary text-terra-primary'
                : 'border-blush-surface text-cocoa-text hover:bg-blush-surface/40'
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-terra-primary' : ''}`} />
            <span>{isSaved ? 'Saved to Calendar' : 'Save Event'}</span>
          </button>

          {!isSelf && (
            <button
              onClick={handleContactOrganiserClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-terra-primary/40 bg-terra-primary/10 hover:bg-terra-primary hover:text-cream-canvas text-terra-primary text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title={`Message ${organizerName}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Organiser</span>
            </button>
          )}

          <button
            onClick={handleRsvp}
            className="flex-1 min-w-[140px] px-5 py-2.5 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>RSVP & Attend</span>
          </button>
        </div>
      </div>
    </div>
  );
}

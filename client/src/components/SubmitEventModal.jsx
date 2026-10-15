import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Link2, Sparkles, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import * as api from '../services/api';
import { getCategoryPlaceholder } from '../utils/eventPlaceholder';

function formatEventDateTime(dateStr, timeStr) {
  if (!dateStr) return { label: 'Upcoming Weekend', iso: new Date().toISOString() };
  try {
    const parts = dateStr.split('-').map(Number);
    let hours = 10;
    let minutes = 0;
    if (timeStr) {
      const t = timeStr.split(':').map(Number);
      if (!isNaN(t[0])) hours = t[0];
      if (!isNaN(t[1])) minutes = t[1];
    }
    const dt = new Date(parts[0], parts[1] - 1, parts[2], hours, minutes);
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = dt.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = dt.getDate();

    let formattedTime = '';
    if (timeStr) {
      const tempDate = new Date();
      tempDate.setHours(hours, minutes);
      formattedTime = tempDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    const label = formattedTime ? `${dayName}, ${monthName} ${dateNum} • ${formattedTime}` : `${dayName}, ${monthName} ${dateNum}`;
    return { label, iso: dt.toISOString() };
  } catch {
    return { label: dateStr + (timeStr ? ` ${timeStr}` : ''), iso: new Date().toISOString() };
  }
}

export default function SubmitEventModal({ isOpen, onClose, onAddEvent, isAuthenticated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('culture');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('17:00');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !venue) return;
    setSubmitError('');
    setSubmitting(true);

    const { label: dateLabel, iso: datetimeIso } = formatEventDateTime(eventDate, eventTime);

    try {
      let newEvt;
      if (isAuthenticated && api.token.get()) {
        newEvt = await api.events.submit({
          title,
          category,
          date_label:  dateLabel,
          datetime_iso: datetimeIso,
          venue,
          organizer:   organizer || 'Community Organizer',
          description,
          source_url:  sourceUrl || '',
        });
        // normalise backend response
        newEvt = {
          ...newEvt,
          date:         newEvt.date_label   ?? newEvt.date   ?? dateLabel,
          datetime:     newEvt.datetime_iso ?? newEvt.datetime ?? datetimeIso,
          image:        newEvt.image_url    ?? newEvt.image   ?? getCategoryPlaceholder(category),
          categoryLabel: newEvt.category_label ?? newEvt.categoryLabel ?? category,
          isSaved:      false,
        };
      } else {
        // Demo mode — local only
        const categoryLabels = {
          culture: 'Culture & Heritage', festivals: 'Festivals & Celebrations',
          technology: 'Technology & Hackathons', music: 'Folk & Classical Music',
          art: 'Art & Traditional Crafts', film: 'Film & Theatre',
          literature: 'Books & Literature', science: 'Science & Discovery',
          workshops: 'Hands-on Workshops', community: 'Dialect & Community Circles',
        };
        newEvt = {
          id: `evt_${Date.now()}`,
          title,
          category,
          categoryLabel: categoryLabels[category] || 'Culture & Heritage',
          date: dateLabel,
          datetime: datetimeIso,
          venue,
          neighborhood: 'Karnataka',
          lat: 15.3173 + (Math.random() - 0.5) * 1.5,
          lng: 75.7139 + (Math.random() - 0.5) * 1.5,
          isOnline: false,
          organizer: organizer || 'Community Organizer',
          image: getCategoryPlaceholder(category),
          description,
          sourceUrl: sourceUrl || '',
          sourceLabel: 'Community Submitted',
          verificationStatus: 'COMMUNITY_REPORTED',
          attendeeCount: 1,
          isSaved: false
        };
      }

      onAddEvent(newEvt);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C56E50', '#D9A441', '#E9CDB8']
      });
      setTitle('');
      setCategory('culture');
      setEventDate('');
      setEventTime('17:00');
      setVenue('');
      setOrganizer('');
      setDescription('');
      setSourceUrl('');
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-canvas w-full max-w-lg rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-surface-container/60 border-b border-blush-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-terra-primary" />
            <h3 className="font-serif text-lg font-bold text-cocoa-text">Submit a Cultural Gathering</h3>
          </div>
          <button onClick={onClose} className="text-cocoa-text/60 hover:text-cocoa-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Coastal Folk Singing Circle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            >
              <option value="culture">Culture & Heritage</option>
              <option value="festivals">Festivals & Celebrations</option>
              <option value="technology">Technology & Hackathons</option>
              <option value="music">Folk & Classical Music</option>
              <option value="art">Art & Traditional Crafts</option>
              <option value="film">Film & Theatre</option>
              <option value="literature">Books & Literature</option>
              <option value="science">Science & Discovery</option>
              <option value="workshops">Hands-on Workshops</option>
              <option value="community">Dialect & Community Circles</option>
            </select>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-cocoa-text text-xs mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-terra-primary" />
                <span>Date (Calendar)</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                onClick={(e) => {
                  try { e.target.showPicker?.(); } catch (err) {}
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30 text-xs sm:text-sm cursor-pointer"
                title="Choose event date from calendar"
              />
            </div>

            <div>
              <label className="block font-bold text-cocoa-text text-xs mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-terra-primary" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                onClick={(e) => {
                  try { e.target.showPicker?.(); } catch (err) {}
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30 text-xs sm:text-sm cursor-pointer"
                title="Select event start time"
              />
            </div>
          </div>

          {eventDate && (
            <div className="flex items-center gap-2 text-xs text-terra-primary font-medium px-3.5 py-2 rounded-xl bg-terra-primary/10 border border-terra-primary/20">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Event Date: <strong>{formatEventDateTime(eventDate, eventTime).label}</strong></span>
            </div>
          )}

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Venue / Meeting Point *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cubbon Park, Bengaluru"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Organizer / Host</label>
            <input
              type="text"
              placeholder="e.g. Bengaluru Cultural Collective"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="What will participants experience or learn?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Source URL (Reddit / Notice link)</label>
            <input
              type="url"
              placeholder="https://reddit.com/r/bangalore/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-cocoa-text hover:bg-blush-surface/50 rounded-full">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Submitting...' : 'Submit Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Calendar, MapPin, Link2, Sparkles, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SubmitEventModal({ isOpen, onClose, onAddEvent }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('culture');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !venue) return;

    const newEvt = {
      id: `evt_${Date.now()}`,
      title,
      category,
      categoryLabel: category === 'languages' ? 'Dialects & Languages' :
                     category === 'crafts' ? 'Traditional Crafts' :
                     category === 'music' ? 'Folk & Classical Music' : 'Culture & Heritage',
      date: date || 'Upcoming Weekend',
      datetime: new Date().toISOString(),
      venue,
      neighborhood: 'Manipal Hub',
      lat: 13.3530 + (Math.random() - 0.5) * 0.01,
      lng: 74.7920 + (Math.random() - 0.5) * 0.01,
      isOnline: false,
      organizer: organizer || 'Campus Cultural Collective',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      description,
      sourceUrl: sourceUrl || 'https://reddit.com/r/manipal',
      sourceLabel: 'Community Submitted',
      verificationStatus: 'COMMUNITY_REPORTED',
      attendeeCount: 1,
      isSaved: false
    };

    onAddEvent(newEvt);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#C56E50', '#D9A441', '#E9CDB8']
    });
    onClose();
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-cocoa-text text-xs mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
              >
                <option value="culture">Culture & Heritage</option>
                <option value="languages">Dialects & Languages</option>
                <option value="crafts">Traditional Crafts</option>
                <option value="music">Music & Jams</option>
                <option value="food">Culinary Heritage</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-cocoa-text text-xs mb-1">Date & Time</label>
              <input
                type="text"
                placeholder="e.g. Sunday 5:00 PM"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Venue / Meeting Point *</label>
            <input
              type="text"
              required
              placeholder="e.g. KMC Greens or Amphitheatre"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Organizer / Host</label>
            <input
              type="text"
              placeholder="e.g. Student Cultural Collective"
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
              placeholder="https://reddit.com/r/manipal/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-cocoa-text hover:bg-blush-surface/50 rounded-full">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm">
              Submit Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

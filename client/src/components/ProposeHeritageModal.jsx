import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Landmark,
  ShieldCheck,
  Sparkles,
  Check,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Shirt,
  Footprints,
  Info
} from 'lucide-react';
import * as api from '../services/api';

const CATEGORIES = [
  { id: 'TEMPLES_RELIGIOUS', label: 'Temples & Religious Heritage Sites' },
  { id: 'CHURCHES_CATHEDRALS', label: 'Churches & Cathedrals' },
  { id: 'MOSQUES_ISLAMIC', label: 'Mosques & Islamic Heritage' },
  { id: 'MONASTERIES_SPIRITUAL', label: 'Monasteries & Other Spiritual Heritage' },
  { id: 'MONUMENTS_WALKS', label: 'Historic Monuments & Heritage Walks' },
  { id: 'PERFORMANCES_CRAFTS', label: 'Traditional Performances, Festivals & Crafts' },
  { id: 'HIDDEN_VILLAGES', label: 'Hidden Villages & Lesser-Known Destinations' },
];

const STATES_LIST = [
  { id: 'karnataka', label: 'Karnataka (ಕರ್ನಾಟಕ)' },
  { id: 'tamil-nadu', label: 'Tamil Nadu (தமிழ்நாடு)' },
  { id: 'kerala', label: 'Kerala (കേരളം)' },
  { id: 'delhi', label: 'Delhi (दिल्ली)' },
  { id: 'goa', label: 'Goa (गोंय)' },
  { id: 'maharashtra', label: 'Maharashtra (महाराष्ट्र)' },
  { id: 'rajasthan', label: 'Rajasthan (राजस्थान)' },
  { id: 'odisha', label: 'Odisha (ଓଡ଼ିଶା)' },
  { id: 'meghalaya', label: 'Meghalaya' },
  { id: 'ladakh', label: 'Ladakh (ལ་དྭགས)' },
  { id: 'telangana', label: 'Telangana (తెలంగాణ)' },
  { id: 'himachal-pradesh', label: 'Himachal Pradesh (हिमाचल प्रदेश)' },
  { id: 'west-bengal', label: 'West Bengal (পশ্চিমবঙ্গ)' },
  { id: 'uttar-pradesh', label: 'Uttar Pradesh (उत्तर प्रदेश)' },
  { id: 'gujarat', label: 'Gujarat (ગુજરાત)' },
  { id: 'punjab', label: 'Punjab (ਪੰਜਾਬ)' },
  { id: 'andhra-pradesh', label: 'Andhra Pradesh (ఆంధ్ర ప్రదేశ్)' },
  { id: 'assam', label: 'Assam (অসম)' },
];

export default function ProposeHeritageModal({
  isOpen,
  onClose,
  onHeritageAdded,
  currentUser = null
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('TEMPLES_RELIGIOUS');
  const [isPermanent, setIsPermanent] = useState(true);
  const [stateId, setStateId] = useState('karnataka');
  const [city, setCity] = useState('');
  const [locationSummary, setLocationSummary] = useState('');
  const [description, setDescription] = useState('');
  const [culturalSignificance, setCulturalSignificance] = useState('');
  const [visitingHours, setVisitingHours] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [dressGuidelines, setDressGuidelines] = useState('');
  const [photographyRules, setPhotographyRules] = useState('');
  const [customsEtiquette, setCustomsEtiquette] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide a landmark or experience name (at least 2 characters).');
      return;
    }
    if (!city.trim()) {
      setError('Please provide the city or town.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a descriptive explanation (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);

      const stateObj = STATES_LIST.find((s) => s.id === stateId);
      const stateName = stateObj ? stateObj.label.split(' (')[0] : 'Karnataka';
      const catObj = CATEGORIES.find((c) => c.id === category);

      const payload = {
        name: name.trim(),
        category,
        category_label: catObj?.label || 'Cultural Heritage',
        is_permanent_place: isPermanent ? 1 : 0,
        state: stateName,
        state_id: stateId,
        city: city.trim(),
        location_summary: locationSummary.trim(),
        description: description.trim(),
        cultural_significance: culturalSignificance.trim(),
        image_url: imageUrl.trim() || undefined,
        visiting_hours: isPermanent ? visitingHours.trim() : undefined,
        event_date: !isPermanent ? eventDate.trim() : undefined,
        dress_guidelines: dressGuidelines.trim() || 'Modest attire respectfully advised.',
        photography_rules: photographyRules.trim() || 'Please check signs on premises.',
        customs_etiquette: customsEtiquette.trim() || 'Maintain sacred silence and respect local customs.',
        organizer_name: organizerName.trim() || 'Community Curated',
        contact_info: contactInfo.trim() || undefined,
        source_label: sourceLabel.trim() || 'Community Cultural Archive',
        source_url: sourceUrl.trim() || undefined,
      };

      const result = await api.heritage.submit(payload);

      setSuccess(true);
      setTimeout(() => {
        if (onHeritageAdded) onHeritageAdded(result);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to propose heritage landmark:', err);
      setError(err?.message || 'Could not submit proposal. Please ensure you are signed in.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] bg-cream-canvas rounded-3xl border border-blush-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-blush-surface/70 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-terra-primary/10 text-terra-primary flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-cocoa-text">
                Propose a Culture & Heritage Landmark
              </h2>
              <p className="text-xs text-cocoa-text/70">
                Contribute an authentic sacred site, living tradition, or historic monument to the National Atlas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-canvas border border-blush-surface flex items-center justify-center text-cocoa-text hover:bg-terra-primary hover:text-cream-canvas transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Heritage landmark submitted successfully to the curated archive!</span>
            </div>
          )}

          {/* Place / Event Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-cocoa-text">
                Landmark or Event Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chennakeshava Temple or Yakshagana Festival"
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">Heritage Type *</label>
              <div className="flex rounded-xl border border-blush-surface overflow-hidden p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsPermanent(true)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    isPermanent
                      ? 'bg-terra-primary text-cream-canvas shadow-xs'
                      : 'text-cocoa-text/70 hover:bg-blush-surface/30'
                  }`}
                >
                  Permanent Site
                </button>
                <button
                  type="button"
                  onClick={() => setIsPermanent(false)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    !isPermanent
                      ? 'bg-terra-primary text-cream-canvas shadow-xs'
                      : 'text-cocoa-text/70 hover:bg-blush-surface/30'
                  }`}
                >
                  Event
                </button>
              </div>
            </div>
          </div>

          {/* Category & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">State / Territory *</label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              >
                {STATES_LIST.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City & Location Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">City / District / Village *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Belur, Hassan District"
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">Location Landmark / Setting</label>
              <input
                type="text"
                value={locationSummary}
                onChange={(e) => setLocationSummary(e.target.value)}
                placeholder="e.g. Banks of Yagachi River"
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
          </div>

          {/* Timing / Dates */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-cocoa-text">
              {isPermanent ? 'Visiting Hours & Access Guidelines' : 'Event Schedule & Season'}
            </label>
            <input
              type="text"
              value={isPermanent ? visitingHours : eventDate}
              onChange={(e) =>
                isPermanent ? setVisitingHours(e.target.value) : setEventDate(e.target.value)
              }
              placeholder={
                isPermanent
                  ? 'e.g. Open daily from 6:30 AM to 8:30 PM'
                  : 'e.g. November to April during traditional winter festivals'
              }
              className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          {/* Description & Cultural Significance */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-cocoa-text">
              Description & Architecture *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the architectural style, origins, sanctum, or experience..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-cocoa-text">
              Cultural & Living Significance
            </label>
            <input
              type="text"
              value={culturalSignificance}
              onChange={(e) => setCulturalSignificance(e.target.value)}
              placeholder="e.g. Masterpiece of 12th-century Hoysala soapstone carving and living ritual worship"
              className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          {/* Visitor Customs & Guidelines (Dress, Photography, Footwear) */}
          <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-blush-surface/80 space-y-3">
            <p className="text-xs font-bold text-cocoa-text flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Visitor Guidelines & Respectful Access Restrictions</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-cocoa-text/80 flex items-center gap-1">
                  <Shirt className="w-3 h-3 text-terra-primary" />
                  <span>Dress Code</span>
                </label>
                <input
                  type="text"
                  value={dressGuidelines}
                  onChange={(e) => setDressGuidelines(e.target.value)}
                  placeholder="e.g. Modest clothing covering shoulders & knees"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-cocoa-text/80 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-ochre-accent" />
                  <span>Photography</span>
                </label>
                <input
                  type="text"
                  value={photographyRules}
                  onChange={(e) => setPhotographyRules(e.target.value)}
                  placeholder="e.g. Outdoor allowed; no flash inside sanctum"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-cocoa-text/80 flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-cocoa-text" />
                  <span>Footwear / Customs</span>
                </label>
                <input
                  type="text"
                  value={customsEtiquette}
                  onChange={(e) => setCustomsEtiquette(e.target.value)}
                  placeholder="e.g. Footwear removed at entrance counter"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
                />
              </div>
            </div>
          </div>

          {/* Organizer / Contact / Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">
                Preservation Authority / Organizer
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g. Archaeological Survey of India (ASI) or Temple Trust"
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-cocoa-text">
                Official Contact / Helpline
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. Official Visitor Facilitation Desk"
                className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-cocoa-text">Image URL (Optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (Leave blank to use authentic heritage art fallback)"
              className="w-full px-3 py-2 rounded-xl bg-white border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-3 border-t border-blush-surface/70 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-blush-surface text-xs font-semibold text-cocoa-text hover:bg-blush-surface/40 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container shadow-warm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Landmark</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

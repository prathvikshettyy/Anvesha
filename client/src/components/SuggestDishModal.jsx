import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Utensils, AlertTriangle, Sparkles, Check, Loader2 } from 'lucide-react';
import * as api from '../services/api';

const STATES_LIST = [
  { id: 'karnataka', label: 'Karnataka (ಕರ್ನಾಟಕ)' },
  { id: 'kerala', label: 'Kerala (കേരളം)' },
  { id: 'tamil-nadu', label: 'Tamil Nadu (தமிழ்நாடு)' },
  { id: 'maharashtra', label: 'Maharashtra (महाराष्ट्र)' },
  { id: 'rajasthan', label: 'Rajasthan (राजस्थान)' },
  { id: 'west-bengal', label: 'West Bengal (পশ্চিমবঙ্গ)' },
  { id: 'delhi', label: 'Delhi (दिल्ली)' },
  { id: 'punjab', label: 'Punjab (ਪੰਜਾਬ)' },
  { id: 'gujarat', label: 'Gujarat (ગુજરાત)' },
  { id: 'andhra-pradesh', label: 'Andhra Pradesh (ఆంధ్ర ప్రదేశ్)' },
  { id: 'goa', label: 'Goa (गोंय)' },
];

const COMMON_ALLERGENS = ['Gluten', 'Dairy', 'Tree Nuts', 'Peanuts', 'Soy', 'Mustard', 'Sesame'];

export default function SuggestDishModal({
  isOpen,
  onClose,
  onDishAdded,
  initialStateId = 'karnataka',
}) {
  const [name, setName] = useState('');
  const [regionalName, setRegionalName] = useState('');
  const [region, setRegion] = useState('');
  const [stateId, setStateId] = useState(initialStateId || 'karnataka');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('TRADITIONAL_DISH');
  const [categoryLabel, setCategoryLabel] = useState('Traditional Delicacy');
  const [dietaryType, setDietaryType] = useState('VEGETARIAN');
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [description, setDescription] = useState('');
  const [culturalTradition, setCulturalTradition] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleAllergen = (item) => {
    setSelectedAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide a valid dish name (min 2 characters).');
      return;
    }
    if (!region.trim()) {
      setError('Please specify the cultural region or tradition (e.g. Coastal Karnataka, Malabar).');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a short description (min 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        regionalName: regionalName.trim(),
        region: region.trim(),
        stateId,
        city: city.trim(),
        category,
        categoryLabel: categoryLabel.trim() || 'Heirloom Delicacy',
        dietaryType,
        allergens: selectedAllergens,
        description: description.trim(),
        culturalTradition: culturalTradition.trim(),
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
      };

      const res = await api.food.suggest(payload);
      setSuccess(true);
      if (onDishAdded && res.dish) {
        onDishAdded(res.dish);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Could not submit traditional dish. Please try again.');
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
        className="relative w-full max-w-xl max-h-[90vh] bg-cream-canvas rounded-3xl border border-blush-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-blush-surface flex items-center justify-between bg-surface-container/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-cocoa-text">
                Contribute a Regional Traditional Dish
              </h3>
              <p className="text-xs text-cocoa-text/70">
                Help fellow travelers discover heirloom recipes & cultural foodways
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-cocoa-text/70 hover:bg-blush-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Traditional dish added to the local food discovery archive!</span>
            </div>
          )}

          {/* Dish Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cocoa-text mb-1">
                Dish Name in English *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goli Baje, Mysore Pak"
                className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-cocoa-text mb-1">
                Regional Script Name
              </label>
              <input
                type="text"
                value={regionalName}
                onChange={(e) => setRegionalName(e.target.value)}
                placeholder="e.g. ಗೋಳಿ ಬಜೆ, മൈസൂർ പാക്ക്"
                className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
          </div>

          {/* State & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cocoa-text mb-1">
                State *
              </label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              >
                {STATES_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-cocoa-text mb-1">
                Cultural Region / Micro-locality *
              </label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Coastal Karnataka / Tulu Nadu"
                className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
          </div>

          {/* City & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-cocoa-text mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mangalore, Udupi"
                className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-cocoa-text mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const labels = {
                    BREAKFAST: 'Heirloom Breakfast',
                    TRADITIONAL_DISH: 'Heritage Main Dish',
                    SNACKS_STREET: 'Iconic Street Snack',
                    SWEETS_DESSERTS: 'Festive Sweet',
                    BEVERAGES: 'Traditional Beverage',
                  };
                  setCategoryLabel(labels[e.target.value] || 'Heirloom Delicacy');
                }}
                className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
              >
                <option value="BREAKFAST">Breakfast / Tiffin</option>
                <option value="TRADITIONAL_DISH">Traditional Main Dish</option>
                <option value="SNACKS_STREET">Street Food & Evening Snacks</option>
                <option value="SWEETS_DESSERTS">Festive Sweets & Desserts</option>
                <option value="BEVERAGES">Heritage Beverages</option>
              </select>
            </div>
          </div>

          {/* Dietary Type */}
          <div>
            <label className="block text-xs font-bold text-cocoa-text mb-1.5">
              Dietary Classification *
            </label>
            <div className="flex gap-2">
              {[
                { id: 'VEGETARIAN', label: '🥬 Vegetarian' },
                { id: 'VEGAN', label: '🌱 Vegan' },
                { id: 'NON_VEGETARIAN', label: '🍗 Non-Vegetarian' },
              ].map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDietaryType(d.id)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    dietaryType === d.id
                      ? 'bg-terra-primary text-cream-canvas border-terra-primary shadow-xs'
                      : 'bg-surface-container text-cocoa-text/80 border-blush-surface hover:bg-blush-surface/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Allergens (Strictly explicit) */}
          <div>
            <label className="block text-xs font-bold text-cocoa-text mb-1">
              Known Allergens (Select only if verified)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGENS.map((allergen) => (
                <button
                  type="button"
                  key={allergen}
                  onClick={() => toggleAllergen(allergen)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    selectedAllergens.includes(allergen)
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                      : 'bg-cream-canvas text-cocoa-text/60 border-blush-surface hover:bg-blush-surface/50'
                  }`}
                >
                  {allergen}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-cocoa-text mb-1">
              Short Description & Flavours *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Crisp exterior with soft spiced curd center, served with fresh coconut chutney..."
              className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          {/* Living Cultural Heritage Story */}
          <div>
            <label className="block text-xs font-bold text-cocoa-text mb-1">
              Cultural Heritage & Tradition Story
            </label>
            <textarea
              rows={2}
              value={culturalTradition}
              onChange={(e) => setCulturalTradition(e.target.value)}
              placeholder="Evolved in local temple kitchens during harvest festivals or monsoon gatherings..."
              className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-cocoa-text mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (leave blank for curated photo)"
              className="w-full px-3 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text focus:outline-none focus:border-terra-primary"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-blush-surface flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-cocoa-text/70 hover:bg-blush-surface/50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container shadow-warm disabled:opacity-50 cursor-pointer transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Traditional Dish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

import React, { useState, useEffect } from 'react';
import { Utensils, Info, Leaf, AlertTriangle, Sparkles, Loader2, Compass, ChevronDown, ChevronUp, Bookmark, Search, Check, ChevronRight } from 'lucide-react';
import * as api from '../services/api';
import DishDetailModal from './DishDetailModal';

const DIETARY_LABELS = {
  VEGAN: { label: 'Vegan', symbol: '🌱', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  VEGETARIAN: { label: 'Vegetarian', symbol: '🥬', badgeClass: 'bg-green-100 text-green-800 border-green-300' },
  NON_VEGETARIAN: { label: 'Non-Veg', symbol: '🍗', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
};

const WISHLIST_STORAGE_KEY = 'anvesha_food_wishlist';
const TASTED_STORAGE_KEY = 'anvesha_food_tasted';

export default function LocalFoodFlavours({
  eventId = null,
  stateId = null,
  cityName = null,
  contextTitle = 'Local Traditions',
  onSelectEvent = null,
  events = [],
}) {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState('ALL'); // 'ALL' | 'VEGETARIAN' | 'VEGAN' | 'NON_VEGETARIAN'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSampleDataNote, setShowSampleDataNote] = useState(false);
  const [expandedTraditionId, setExpandedTraditionId] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);

  // Workable Wishlist & Tasted tracking with localStorage persistence
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const [tastedIds, setTastedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(TASTED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const toggleWishlist = (dishId) => {
    setWishlistIds((prev) => {
      const next = prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId];
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const toggleTasted = (dishId) => {
    setTastedIds((prev) => {
      const next = prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId];
      try {
        localStorage.setItem(TASTED_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchDishes = async () => {
      try {
        let result = [];
        if (eventId) {
          const res = await api.food.byEvent(eventId);
          result = Array.isArray(res) ? res : (res?.dishes || []);
        } else if (stateId) {
          result = await api.food.byState(stateId);
        } else {
          result = await api.food.list();
        }
        if (isMounted) setDishes(Array.isArray(result) ? result : []);
      } catch (err) {
        console.warn('Could not load local dishes:', err);
        if (isMounted) setDishes([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDishes();

    return () => {
      isMounted = false;
    };
  }, [eventId, stateId]);

  const filteredDishes = dishes.filter((d) => {
    // Dietary filter
    if (dietaryFilter === 'VEGAN' && d.dietaryType !== 'VEGAN') return false;
    if (dietaryFilter === 'VEGETARIAN' && d.dietaryType !== 'VEGETARIAN' && d.dietaryType !== 'VEGAN') return false;
    if (dietaryFilter === 'NON_VEGETARIAN' && d.dietaryType !== 'NON_VEGETARIAN') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = d.name?.toLowerCase().includes(q);
      const matchReg = d.regionalName?.toLowerCase().includes(q);
      const matchDesc = d.description?.toLowerCase().includes(q);
      const matchTrad = d.culturalTradition?.toLowerCase().includes(q);
      const matchLoc = d.region?.toLowerCase().includes(q) || d.city?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchDesc && !matchTrad && !matchLoc) return false;
    }

    return true;
  });

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-surface-container/60 border border-blush-surface p-4 sm:p-5 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-base sm:text-lg text-cocoa-text">
                Taste the Local Flavours
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-terra-primary/10 text-terra-primary">
                Food Discovery
              </span>
            </div>
            <p className="text-xs text-cocoa-text/70 mt-0.5">
              Iconic culinary heritage and regional delicacies to try in {cityName || contextTitle}
            </p>
          </div>
        </div>

        {/* Development Sample Data Transparency Pill */}
        <button
          type="button"
          onClick={() => setShowSampleDataNote(!showSampleDataNote)}
          className="self-start sm:self-center flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-canvas hover:bg-blush-surface text-cocoa-text/75 text-[11px] font-semibold border border-blush-surface transition-all cursor-pointer"
          title="Click to view dataset information"
        >
          <Info className="w-3.5 h-3.5 text-terra-primary" />
          <span>Curated Sample Archive</span>
          {showSampleDataNote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Dataset Transparency Notice (Explaining verified data integration) */}
      {showSampleDataNote && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-cocoa-text/85 space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-cocoa-text">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Culinary Discovery Note</span>
          </div>
          <p className="text-[11px] leading-relaxed text-cocoa-text/75">
            These traditional dishes are curated cultural samples for regional food exploration. In accordance with platform integrity guidelines, we never guess dietary information or invent unverified restaurant addresses and ratings. In production, this connects to verified Geographical Indication (GI) culinary registries and verified local vendor partnerships.
          </p>
        </div>
      )}

      {/* Interactive Controls: Search & Dietary Filter */}
      {dishes.length > 0 && (
        <div className="space-y-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-cocoa-text/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search dishes, flavours, traditions in ${cityName || contextTitle}...`}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-cream-canvas border border-blush-surface text-xs text-cocoa-text placeholder:text-cocoa-text/40 focus:outline-none focus:border-terra-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-cocoa-text/50 hover:text-cocoa-text cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-cocoa-text/60 mr-1 flex-shrink-0">
              Dietary:
            </span>
            {[
              { id: 'ALL', label: 'All Dishes' },
              { id: 'VEGETARIAN', label: '🥬 Vegetarian' },
              { id: 'VEGAN', label: '🌱 Vegan' },
              { id: 'NON_VEGETARIAN', label: '🍗 Non-Veg' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDietaryFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  dietaryFilter === f.id
                    ? 'bg-terra-primary text-cream-canvas shadow-xs'
                    : 'bg-cream-canvas text-cocoa-text/70 border border-blush-surface hover:bg-blush-surface/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-xs text-cocoa-text/60 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-terra-primary" />
          <span>Discovering local flavours...</span>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="py-6 px-4 rounded-2xl bg-cream-canvas border border-blush-surface text-center">
          <p className="text-xs text-cocoa-text/70">
            {searchQuery
              ? `No dishes found matching "${searchQuery}".`
              : 'No dishes matching the selected dietary filter in this region.'}
          </p>
          <button
            onClick={() => {
              setDietaryFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-2 text-xs text-terra-primary font-bold hover:underline cursor-pointer"
          >
            Reset filters & show all dishes
          </button>
        </div>
      ) : (
        /* Dishes Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredDishes.map((dish) => {
            const dietary = DIETARY_LABELS[dish.dietaryType] || null;
            const hasAllergens = Array.isArray(dish.allergens) && dish.allergens.length > 0;
            const isTraditionOpen = expandedTraditionId === dish.id;
            const isWishlisted = wishlistIds.includes(dish.id);
            const isTasted = tastedIds.includes(dish.id);

            return (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group rounded-2xl bg-cream-canvas border border-blush-surface hover:border-terra-primary/40 overflow-hidden shadow-xs hover:shadow-warm transition-all flex flex-col justify-between cursor-pointer"
              >
                {/* Dish Header Image & Badges */}
                <div className="relative h-36 w-full bg-blush-surface/30 overflow-hidden">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/kadak_chai.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/75 via-transparent to-transparent opacity-70" />

                  {/* Category Pill Tag */}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-cream-canvas/90 backdrop-blur-sm text-cocoa-text shadow-sm border border-blush-surface">
                    {dish.categoryLabel}
                  </span>

                  {/* Dietary & Wishlist Badges Top-Right */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {dietary && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${dietary.badgeClass}`}>
                        {dietary.symbol} {dietary.label}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(dish.id);
                      }}
                      title={isWishlisted ? 'Remove from wishlist' : 'Save to Want to Try wishlist'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isWishlisted
                          ? 'bg-terra-primary text-cream-canvas shadow-xs'
                          : 'bg-cream-canvas/90 text-cocoa-text/60 hover:text-terra-primary'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-cream-canvas' : ''}`} />
                    </button>
                  </div>

                  {/* Region pill */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-cream-canvas text-[11px] font-medium">
                    <span className="truncate drop-shadow-xs">{dish.region}</span>
                    {isTasted && (
                      <span className="text-[10px] bg-emerald-600/90 text-cream-canvas px-2 py-0.5 rounded-full font-bold">
                        Tasted ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Dish Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-cocoa-text leading-tight group-hover:text-terra-primary transition-colors">
                        {dish.name}
                      </h4>
                    </div>

                    {dish.regionalName && (
                      <span className="text-xs text-terra-primary font-serif font-medium mt-0.5 block">
                        {dish.regionalName}
                      </span>
                    )}

                    <p className="text-xs text-cocoa-text/75 mt-1.5 line-clamp-3 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Cultural Tradition Accordion */}
                  <div className="pt-2 border-t border-blush-surface/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTraditionId(isTraditionOpen ? null : dish.id);
                      }}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-terra-primary hover:text-primary-container transition-colors cursor-pointer py-0.5"
                    >
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3" />
                        <span>Living Cultural Heritage</span>
                      </span>
                      {isTraditionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isTraditionOpen && (
                      <div className="mt-2 p-2.5 rounded-xl bg-surface-container/60 border border-blush-surface text-[11px] text-cocoa-text/80 leading-relaxed animate-fadeIn">
                        {dish.culturalTradition}
                      </div>
                    )}
                  </div>

                  {/* Allergens & Details CTA Footer */}
                  <div className="pt-1 flex items-center justify-between gap-1 flex-wrap text-[10px]">
                    {hasAllergens ? (
                      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Contains: {dish.allergens.join(', ')}</span>
                      </span>
                    ) : (
                      <span className="text-cocoa-text/45">No common allergens listed</span>
                    )}

                    <span className="font-bold text-terra-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Dish Detail Modal */}
      <DishDetailModal
        dish={selectedDish}
        isOpen={!!selectedDish}
        onClose={() => setSelectedDish(null)}
        isWishlisted={selectedDish ? wishlistIds.includes(selectedDish.id) : false}
        onToggleWishlist={toggleWishlist}
        isTasted={selectedDish ? tastedIds.includes(selectedDish.id) : false}
        onToggleTasted={toggleTasted}
        onSelectEvent={onSelectEvent}
        relatedEvent={selectedDish?.eventId ? events.find((e) => e.id === selectedDish.eventId) : null}
      />
    </div>
  );
}

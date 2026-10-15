import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Search,
  MapPin,
  Bookmark,
  Check,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import * as api from '../services/api';
import DishDetailModal from '../components/DishDetailModal';
import SuggestDishModal from '../components/SuggestDishModal';

const DIETARY_LABELS = {
  VEGAN: { label: 'Vegan', symbol: '🌱', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  VEGETARIAN: { label: 'Vegetarian', symbol: '🥬', badgeClass: 'bg-green-100 text-green-800 border-green-300' },
  NON_VEGETARIAN: { label: 'Non-Veg', symbol: '🍗', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
};

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'BREAKFAST', label: 'Breakfast / Tiffin' },
  { id: 'TRADITIONAL_DISH', label: 'Heritage Main Dishes' },
  { id: 'SNACKS_STREET', label: 'Street Food & Snacks' },
  { id: 'SWEETS_DESSERTS', label: 'Festive Sweets' },
  { id: 'BEVERAGES', label: 'Traditional Drinks' },
];

const STATES_FILTER = [
  { id: 'ALL', label: 'All India (National Archive)' },
  { id: 'karnataka', label: 'Karnataka (ಕರ್ನಾಟಕ)' },
  { id: 'kerala', label: 'Kerala (കേരളം)' },
  { id: 'tamil-nadu', label: 'Tamil Nadu (தமிழ்நாடு)' },
  { id: 'maharashtra', label: 'Maharashtra (महाराष्ट्र)' },
  { id: 'rajasthan', label: 'Rajasthan (राजस्थान)' },
  { id: 'west-bengal', label: 'West Bengal (পশ্চিমবঙ্গ)' },
];

const STATE_CULINARY_NOTES = {
  karnataka: {
    title: 'Karnataka Culinary Heritage',
    summary: 'Spanning delicate coconut-rich coastal Tulu Nadu breakfast crepes, pure vegetarian Udupi temple saaru, regal Mysore royal confectionaries, and fragrant Bisi Bele Bath.',
  },
  kerala: {
    title: 'Kerala Culinary Heritage',
    summary: 'Celebrated for fermented rice appams, aromatic coconut milk stews, spiced banana chips, and grand Onam Sadya banquets served on fresh plantain leaves.',
  },
  'tamil-nadu': {
    title: 'Tamil Nadu Culinary Heritage',
    summary: 'Ancient Sangam traditions of Chettinad spice mastery, cooling Madurai Jigarthanda almond-gum coolers, and temple prasadam traditions.',
  },
  maharashtra: {
    title: 'Maharashtra Culinary Heritage',
    summary: 'Vibrant blend of hearty jowar bhakris, sweet festive saffron Puran Poli for Gudi Padwa, and coastal Malvani spice blends.',
  },
  rajasthan: {
    title: 'Rajasthan Culinary Heritage',
    summary: 'Desert resilience reflected in ghee-baked Dal Baati Churma, Ker Sangri arid forage delicacies, and slow-tempered royal delicacies.',
  },
  'west-bengal': {
    title: 'West Bengal Culinary Heritage',
    summary: 'Revered culinary artistry of mustard-tempered Shorshe fish curries, monsoon Hilsa feasts, and delicate chhena confections like Sandesh and Rosogolla.',
  },
};

const WISHLIST_STORAGE_KEY = 'anvesha_food_wishlist';
const TASTED_STORAGE_KEY = 'anvesha_food_tasted';

export default function FoodDiscoveryView({
  events = [],
  onSelectEvent = null,
  initialStateId = 'ALL',
}) {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(initialStateId || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dietaryFilter, setDietaryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'WISHLIST' | 'TASTED'
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Modals
  const [selectedDish, setSelectedDish] = useState(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Persisted Wishlist & Tasted tracking
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

  // Fetch dishes
  const loadDishes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedState && selectedState !== 'ALL') params.stateId = selectedState;
      if (selectedCategory && selectedCategory !== 'ALL') params.category = selectedCategory;
      if (dietaryFilter && dietaryFilter !== 'ALL') params.dietary = dietaryFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await api.food.list(params);
      setDishes(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Error fetching food archive:', err);
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, [selectedState, selectedCategory, dietaryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDishes();
  };

  // Filter based on active tab (Wishlist / Tasted)
  const displayedDishes = dishes.filter((d) => {
    if (activeTab === 'WISHLIST') return wishlistIds.includes(d.id);
    if (activeTab === 'TASTED') return tastedIds.includes(d.id);
    return true;
  });

  const currentCulinaryNote = STATE_CULINARY_NOTES[selectedState] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* View Hero Header */}
      <div className="relative rounded-3xl bg-surface-container/80 border border-blush-surface p-6 sm:p-8 overflow-hidden shadow-warm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-terra-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-terra-primary flex items-center justify-center text-cream-canvas shadow-warm">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-terra-primary">
                Living Culinary Heritage
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-cocoa-text tracking-tight">
              Taste the Local Flavours
            </h1>

            <p className="text-xs sm:text-sm text-cocoa-text/75 max-w-2xl leading-relaxed">
              Explore traditional recipes, micro-regional foodways, and living kitchen traditions across India. Discover which authentic dishes to try when attending regional cultural gatherings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-terra-primary text-cream-canvas text-xs sm:text-sm font-bold shadow-warm hover:bg-primary-container transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Contribute Local Dish</span>
            </button>

            <button
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-cream-canvas border border-blush-surface text-cocoa-text/75 text-xs font-semibold hover:bg-blush-surface/50 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-terra-primary" />
              <span>Curated Sample Archive</span>
              {showDisclaimer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Dataset Transparency Notice */}
        {showDisclaimer && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-cocoa-text/85 space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Culinary Discovery & Data Integrity</span>
            </div>
            <p className="text-xs leading-relaxed text-cocoa-text/80">
              In strict accordance with platform standards, all dishes currently showcased are curated developmental samples highlighting indigenous foodways. We never invent commercial restaurant addresses, fake telephone numbers, or artificial ratings. In production environments, this connects to verified GI-registry culinary databases and authorized cultural tourism directories.
            </p>
          </div>
        )}
      </div>

      {/* Regional Culinary Spotlight Banner (When state is selected) */}
      {currentCulinaryNote && (
        <div className="p-4 sm:p-5 rounded-2xl bg-cream-canvas border border-terra-primary/20 flex items-start gap-3.5 shadow-xs animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-cocoa-text">
              {currentCulinaryNote.title}
            </h4>
            <p className="text-xs text-cocoa-text/75 mt-0.5 leading-relaxed">
              {currentCulinaryNote.summary}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Controls Bar: Search, State, Tabs */}
      <div className="space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-cocoa-text/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients, traditions (e.g. Dosa, Saaru, Puran Poli)..."
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-cream-canvas border border-blush-surface text-xs sm:text-sm text-cocoa-text placeholder:text-cocoa-text/40 focus:outline-none focus:border-terra-primary shadow-xs transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeout(loadDishes, 50);
                  }}
                  className="text-[11px] font-medium text-cocoa-text/50 hover:text-cocoa-text px-1.5"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1 rounded-xl bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container cursor-pointer transition-all"
              >
                Search
              </button>
            </div>
          </form>

          {/* State / Region Dropdown */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terra-primary flex-shrink-0" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-cream-canvas border border-blush-surface text-xs sm:text-sm font-semibold text-cocoa-text focus:outline-none focus:border-terra-primary shadow-xs cursor-pointer"
            >
              {STATES_FILTER.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Tabs & Dietary Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blush-surface pb-3">
          {/* Main Tabs (All vs Wishlist vs Tasted) */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: `All Regional Dishes (${dishes.length})` },
              { id: 'WISHLIST', label: `Want to Try ⭐ (${wishlistIds.length})` },
              { id: 'TASTED', label: `Tasted ✓ (${tastedIds.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-terra-primary text-cream-canvas shadow-xs'
                    : 'bg-surface-container text-cocoa-text/70 hover:bg-blush-surface/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-cocoa-text/60 mr-1 flex-shrink-0">
              Dietary:
            </span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'VEGETARIAN', label: '🥬 Vegetarian' },
              { id: 'VEGAN', label: '🌱 Vegan' },
              { id: 'NON_VEGETARIAN', label: '🍗 Non-Veg' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDietaryFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-cocoa-text text-cream-canvas font-bold'
                  : 'bg-cream-canvas text-cocoa-text/70 border border-blush-surface hover:bg-blush-surface/40'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-xs text-cocoa-text/60 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-terra-primary" />
          <span className="text-sm font-medium">Discovering traditional flavours across India...</span>
        </div>
      ) : displayedDishes.length === 0 ? (
        <div className="py-16 px-4 rounded-3xl bg-cream-canvas border border-blush-surface text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary mx-auto">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-cocoa-text">
            {activeTab === 'WISHLIST'
              ? 'Your Wishlist is Empty'
              : activeTab === 'TASTED'
              ? 'No Dishes Marked as Tasted Yet'
              : 'No Traditional Dishes Found'}
          </h3>
          <p className="text-xs text-cocoa-text/70 max-w-md mx-auto leading-relaxed">
            {activeTab === 'WISHLIST'
              ? 'Click the bookmark icon on any dish card to save traditional foods you would love to try!'
              : activeTab === 'TASTED'
              ? 'Mark heirloom recipes you have tasted during cultural journeys to build your culinary passport.'
              : 'Try selecting "All India" or clearing your dietary / search filters.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedState('ALL');
                setSelectedCategory('ALL');
                setDietaryFilter('ALL');
                setSearchQuery('');
                setActiveTab('ALL');
                setTimeout(loadDishes, 50);
              }}
              className="px-4 py-2 rounded-xl bg-terra-primary text-cream-canvas text-xs font-bold hover:bg-primary-container transition-all cursor-pointer shadow-xs"
            >
              Reset All Filters
            </button>
            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cream-canvas border border-blush-surface text-cocoa-text text-xs font-bold hover:bg-blush-surface/50 transition-all cursor-pointer"
            >
              Contribute a Dish
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedDishes.map((dish) => {
            const dietary = DIETARY_LABELS[dish.dietaryType] || null;
            const hasAllergens = Array.isArray(dish.allergens) && dish.allergens.length > 0;
            const isWishlisted = wishlistIds.includes(dish.id);
            const isTasted = tastedIds.includes(dish.id);
            const relatedEvent = dish.eventId ? events.find((e) => e.id === dish.eventId) : null;

            return (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group rounded-3xl bg-cream-canvas border border-blush-surface hover:border-terra-primary/40 overflow-hidden shadow-xs hover:shadow-warm transition-all flex flex-col justify-between cursor-pointer"
              >
                {/* Hero Dish Image */}
                <div className="relative h-44 w-full bg-blush-surface/40 overflow-hidden">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/kadak_chai.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/80 via-transparent to-transparent opacity-80" />

                  {/* Category Pill Tag */}
                  <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-cream-canvas/90 backdrop-blur-sm text-cocoa-text shadow-sm border border-blush-surface">
                    {dish.categoryLabel || dish.category}
                  </span>

                  {/* Dietary & Wishlist Controls */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {dietary && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${dietary.badgeClass}`}>
                        {dietary.symbol} {dietary.label}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(dish.id);
                      }}
                      title={isWishlisted ? 'Remove from wishlist' : 'Want to Try'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isWishlisted
                          ? 'bg-terra-primary text-cream-canvas shadow-xs'
                          : 'bg-cream-canvas/90 text-cocoa-text/60 hover:text-terra-primary'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-cream-canvas' : ''}`} />
                    </button>
                  </div>

                  {/* Region badge bottom */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-cream-canvas text-[11px] font-medium">
                    <span className="truncate drop-shadow-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-terra-primary flex-shrink-0" />
                      <span>{dish.region}</span>
                    </span>
                    {isTasted && (
                      <span className="text-[10px] bg-emerald-600/90 text-cream-canvas px-2 py-0.5 rounded-full font-bold">
                        Tasted ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-cocoa-text group-hover:text-terra-primary transition-colors leading-snug">
                      {dish.name}
                    </h3>

                    {dish.regionalName && (
                      <span className="text-xs text-terra-primary font-serif font-medium mt-0.5 block">
                        {dish.regionalName}
                      </span>
                    )}

                    <p className="text-xs text-cocoa-text/75 mt-2 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Related Gathering Tag (if linked) */}
                  {relatedEvent && (
                    <div className="p-2 rounded-xl bg-surface-container/60 border border-blush-surface text-[11px] text-cocoa-text/80 flex items-center justify-between gap-1">
                      <span className="truncate flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-terra-primary flex-shrink-0" />
                        <span className="truncate">{relatedEvent.title}</span>
                      </span>
                      <span className="text-[10px] font-bold text-terra-primary whitespace-nowrap">
                        Gathering
                      </span>
                    </div>
                  )}

                  {/* Footer with Allergens & Details CTA */}
                  <div className="pt-2 border-t border-blush-surface/60 flex items-center justify-between text-[11px]">
                    {hasAllergens ? (
                      <span className="flex items-center gap-1 text-amber-800 text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        <span className="truncate">{dish.allergens.join(', ')}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-cocoa-text/45">Verified Traditional</span>
                    )}

                    <span className="font-bold text-terra-primary flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dish Detail Modal */}
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

      {/* Suggest Dish Modal */}
      <SuggestDishModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        initialStateId={selectedState !== 'ALL' ? selectedState : 'karnataka'}
        onDishAdded={(newDish) => {
          setDishes((prev) => [newDish, ...prev]);
        }}
      />
    </div>
  );
}

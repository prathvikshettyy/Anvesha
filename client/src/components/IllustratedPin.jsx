import React from 'react';

export const PIN_CATEGORIES = {
  culture: {
    label: 'Culture & Heritage',
    color: '#C56E50', // Terracotta
    bgClass: 'bg-terra-primary',
    icon: 'account_balance',
    symbol: '🪷'
  },
  festivals: {
    label: 'Festivals & Celebrations',
    color: '#A9332A', // Sindoor Crimson
    bgClass: 'bg-sindoor-red',
    icon: 'celebration',
    symbol: '✨'
  },
  technology: {
    label: 'Technology & Hackathons',
    color: '#283D70', // Royal Indigo
    bgClass: 'bg-royal-indigo',
    icon: 'terminal',
    symbol: '⚡'
  },
  music: {
    label: 'Folk & Classical Music',
    color: '#E09F3E', // Marigold Gold
    bgClass: 'bg-marigold-gold',
    icon: 'music_note',
    symbol: '🪕'
  },
  art: {
    label: 'Art & Traditional Crafts',
    color: '#1A5B66', // Peacock Teal
    bgClass: 'bg-peacock-teal',
    icon: 'palette',
    symbol: '🎨'
  },
  film: {
    label: 'Film & Theatre',
    color: '#6B2D5C', // Plum
    bgClass: 'bg-[#6B2D5C]',
    icon: 'movie',
    symbol: '🎭'
  },
  literature: {
    label: 'Books & Literature',
    color: '#5B332C', // Deep Cocoa
    bgClass: 'bg-cocoa-text',
    icon: 'menu_book',
    symbol: '📜'
  },
  science: {
    label: 'Science & Discovery',
    color: '#2D5F3E', // Forest Mehndi
    bgClass: 'bg-forest-mehndi',
    icon: 'science',
    symbol: '⚛️'
  },
  workshops: {
    label: 'Hands-on Workshops',
    color: '#D9A441', // Ochre
    bgClass: 'bg-ochre-accent',
    icon: 'psychology',
    symbol: '💡'
  },
  community: {
    label: 'Dialect & Community Circles',
    color: '#8B4513', // Warm Cinnamon
    bgClass: 'bg-[#8B4513]',
    icon: 'groups',
    symbol: '🤝'
  }
};

export default function IllustratedPin({ event, isSelected, onClick }) {
  const cat = PIN_CATEGORIES[event.category] || PIN_CATEGORIES.culture;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={`group cursor-pointer transition-all duration-300 relative flex flex-col items-center ${
        isSelected ? 'scale-125 z-40' : 'hover:scale-115 hover:z-30'
      }`}
      title={`${event.title} (${event.city || event.venue})`}
    >
      {/* Category Pill Tag on Hover */}
      <div className="absolute -top-7 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-cocoa-text text-cream-canvas text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap z-50">
        {cat.symbol} {event.city || event.state} · {event.title.slice(0, 24)}...
      </div>

      {/* Illustrated Ornamental Pin Silhouette */}
      <div className="relative flex items-center justify-center">
        {/* Outer Glow Halo */}
        <div
          className="absolute -inset-1 rounded-full opacity-30 group-hover:opacity-60 transition-opacity blur-xs animate-pulse"
          style={{ backgroundColor: cat.color }}
        />

        {/* Pin Body */}
        <div
          className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-cream-canvas shadow-lg border-2 border-cream-canvas transition-transform"
          style={{ backgroundColor: cat.color }}
        >
          <span className="material-symbols-outlined text-sm sm:text-base">
            {cat.icon}
          </span>
        </div>
      </div>

      {/* Pin Needle Stem */}
      <div
        className="w-0.5 h-2 -mt-0.5"
        style={{ backgroundColor: cat.color }}
      />
      <div className="w-1.5 h-1 rounded-full bg-cocoa-text/40 -mt-0.5" />
    </div>
  );
}

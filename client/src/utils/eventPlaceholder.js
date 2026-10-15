// client/src/utils/eventPlaceholder.js
// Culturally authentic category-specific fallback placeholders for Anvesha events.

export const CATEGORY_CONFIGS = {
  culture: {
    label: 'Culture & Heritage',
    symbol: '🪷',
    colors: ['#8A3820', '#C56E50'],
    textColor: '#FFF8F0',
    curatedImage: '/images/yakshagana-art-bg.png',
  },
  festivals: {
    label: 'Festivals & Celebrations',
    symbol: '✨',
    colors: ['#6E1E18', '#A9332A'],
    textColor: '#FFF8F0',
    curatedImage: 'https://images.unsplash.com/photo-1600100397608-f70cff5a2e09?w=800&auto=format&fit=crop&q=80',
  },
  technology: {
    label: 'Technology & Hackathons',
    symbol: '⚡',
    colors: ['#18264A', '#283D70'],
    textColor: '#EEF3FF',
    curatedImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
  },
  music: {
    label: 'Folk & Classical Music',
    symbol: '🪕',
    colors: ['#8F5E16', '#E09F3E'],
    textColor: '#FFFDF0',
    curatedImage: '/images/folk_musician.jpg',
  },
  art: {
    label: 'Art & Traditional Crafts',
    symbol: '🎨',
    colors: ['#0E383F', '#1A5B66'],
    textColor: '#F0FDFF',
    curatedImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
  },
  film: {
    label: 'Film & Theatre',
    symbol: '🎭',
    colors: ['#421738', '#6B2D5C'],
    textColor: '#FFF2FB',
    curatedImage: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=800&auto=format&fit=crop&q=80',
  },
  literature: {
    label: 'Books & Literature',
    symbol: '📜',
    colors: ['#361B16', '#5B332C'],
    textColor: '#FAF5EE',
    curatedImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
  },
  food: {
    label: 'Food & Culinary Traditions',
    symbol: '🍲',
    colors: ['#873E18', '#C86428'],
    textColor: '#FFF6EE',
    curatedImage: '/images/kadak_chai.jpg',
  },
  community: {
    label: 'Dialect & Community Circles',
    symbol: '🤝',
    colors: ['#542B0D', '#8B4513'],
    textColor: '#FFF5EA',
    curatedImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
  },
  workshops: {
    label: 'Hands-on Workshops',
    symbol: '💡',
    colors: ['#8A6518', '#D9A441'],
    textColor: '#FFFDEE',
    curatedImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  },
  science: {
    label: 'Science & Discovery',
    symbol: '⚛️',
    colors: ['#183D24', '#2D5F3E'],
    textColor: '#F0FFF4',
    curatedImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
  },
};

// Aliases
CATEGORY_CONFIGS.heritage = CATEGORY_CONFIGS.culture;
CATEGORY_CONFIGS.celebrations = CATEGORY_CONFIGS.festivals;
CATEGORY_CONFIGS.utsavs = CATEGORY_CONFIGS.festivals;
CATEGORY_CONFIGS.hackathons = CATEGORY_CONFIGS.technology;
CATEGORY_CONFIGS.folk = CATEGORY_CONFIGS.music;
CATEGORY_CONFIGS.classical = CATEGORY_CONFIGS.music;
CATEGORY_CONFIGS.crafts = CATEGORY_CONFIGS.art;
CATEGORY_CONFIGS.theatre = CATEGORY_CONFIGS.film;
CATEGORY_CONFIGS.cinema = CATEGORY_CONFIGS.film;
CATEGORY_CONFIGS.books = CATEGORY_CONFIGS.literature;
CATEGORY_CONFIGS.culinary = CATEGORY_CONFIGS.food;
CATEGORY_CONFIGS.dialects = CATEGORY_CONFIGS.community;
CATEGORY_CONFIGS.languages = CATEGORY_CONFIGS.community;
CATEGORY_CONFIGS.mentorship = CATEGORY_CONFIGS.workshops;
CATEGORY_CONFIGS.discovery = CATEGORY_CONFIGS.science;

/**
 * Returns a self-contained, zero-latency vector SVG banner data-URI for an event category.
 */
export function getCategorySvgPlaceholder(category) {
  const catKey = String(category || '').toLowerCase().trim();
  const config = CATEGORY_CONFIGS[catKey] || CATEGORY_CONFIGS.culture;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="grad_${catKey}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${config.colors[0]}"/>
        <stop offset="100%" stop-color="${config.colors[1]}"/>
      </linearGradient>
      <radialGradient id="glow_${catKey}" cx="50%" cy="38%" r="52%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
      </radialGradient>
      <pattern id="pat_${catKey}" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r="1.5" fill="#ffffff" fill-opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="800" height="450" fill="url(#grad_${catKey})"/>
    <rect width="800" height="450" fill="url(#glow_${catKey})"/>
    <rect width="800" height="450" fill="url(#pat_${catKey})"/>
    <circle cx="400" cy="175" r="95" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.22" stroke-width="2"/>
    <circle cx="400" cy="175" r="70" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="6 6"/>
    <circle cx="400" cy="175" r="48" fill="#ffffff" fill-opacity="0.12"/>
    <text x="400" y="193" font-size="52" text-anchor="middle" dominant-baseline="middle">${config.symbol}</text>
    <text x="400" y="315" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="24" font-weight="bold" fill="${config.textColor}" text-anchor="middle" letter-spacing="2">${config.label.toUpperCase()}</text>
    <text x="400" y="352" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#E8DBCE" fill-opacity="0.85" text-anchor="middle" letter-spacing="2.5">ANVESHA • LIVING INDIA</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a high-res curated photograph or local asset for the given category.
 */
export function getCategoryPlaceholder(category) {
  const catKey = String(category || '').toLowerCase().trim();
  const config = CATEGORY_CONFIGS[catKey] || CATEGORY_CONFIGS.culture;
  return config.curatedImage || getCategorySvgPlaceholder(category);
}

/**
 * Resolves the display image for any event object, falling back to category placeholders.
 */
export function getEventImage(event) {
  if (!event) return getCategoryPlaceholder('culture');
  const img = event.image ?? event.image_url ?? event.imageUrl;
  if (typeof img === 'string' && img.trim() !== '') {
    return img.trim();
  }
  return getCategoryPlaceholder(event.category);
}

/**
 * OnError handler for <img> tags to swap broken URLs with the guaranteed SVG banner.
 */
export function handleEventImageError(e, category) {
  if (!e || !e.currentTarget) return;
  e.currentTarget.onerror = null;
  e.currentTarget.src = getCategorySvgPlaceholder(category);
}

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
    curatedImage: '/images/taj_sunset.jpg',
  },
  technology: {
    label: 'Technology & Hackathons',
    symbol: '⚡',
    colors: ['#18264A', '#283D70'],
    textColor: '#EEF3FF',
    curatedImage: '/images/cinematic_india_hero.jpg',
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
    curatedImage: '/images/heritage-tapestry-bg.png',
  },
  film: {
    label: 'Film & Theatre',
    symbol: '🎭',
    colors: ['#421738', '#6B2D5C'],
    textColor: '#FFF2FB',
    curatedImage: '/images/visite_reference.jpg',
  },
  literature: {
    label: 'Books & Literature',
    symbol: '📜',
    colors: ['#361B16', '#5B332C'],
    textColor: '#FAF5EE',
    curatedImage: '/images/himalaya_buddha.jpg',
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
    curatedImage: '/images/cultural_atlas_ref.jpg',
  },
  workshops: {
    label: 'Hands-on Workshops',
    symbol: '💡',
    colors: ['#8A6518', '#D9A441'],
    textColor: '#FFFDEE',
    curatedImage: '/images/heritage-tapestry-bg.png',
  },
  science: {
    label: 'Science & Discovery',
    symbol: '⚛️',
    colors: ['#183D24', '#2D5F3E'],
    textColor: '#F0FFF4',
    curatedImage: '/images/cinematic_india_hero.jpg',
  },
};

// Aliases and alternative spellings / labels
CATEGORY_CONFIGS.heritage = CATEGORY_CONFIGS.culture;
CATEGORY_CONFIGS.celebrations = CATEGORY_CONFIGS.festivals;
CATEGORY_CONFIGS.utsavs = CATEGORY_CONFIGS.festivals;
CATEGORY_CONFIGS.hackathons = CATEGORY_CONFIGS.technology;
CATEGORY_CONFIGS.tech = CATEGORY_CONFIGS.technology;
CATEGORY_CONFIGS.folk = CATEGORY_CONFIGS.music;
CATEGORY_CONFIGS.classical = CATEGORY_CONFIGS.music;
CATEGORY_CONFIGS.crafts = CATEGORY_CONFIGS.art;
CATEGORY_CONFIGS.craft = CATEGORY_CONFIGS.art;
CATEGORY_CONFIGS.theatre = CATEGORY_CONFIGS.film;
CATEGORY_CONFIGS.theater = CATEGORY_CONFIGS.film;
CATEGORY_CONFIGS.cinema = CATEGORY_CONFIGS.film;
CATEGORY_CONFIGS.books = CATEGORY_CONFIGS.literature;
CATEGORY_CONFIGS.culinary = CATEGORY_CONFIGS.food;
CATEGORY_CONFIGS.dialects = CATEGORY_CONFIGS.community;
CATEGORY_CONFIGS.languages = CATEGORY_CONFIGS.community;
CATEGORY_CONFIGS.mentorship = CATEGORY_CONFIGS.workshops;
CATEGORY_CONFIGS.discovery = CATEGORY_CONFIGS.science;

/**
 * Normalizes any category string (ID, slug, or full display label) into a canonical key.
 */
export function resolveCategoryKey(category) {
  if (!category) return 'culture';
  const raw = String(category).toLowerCase().trim();
  if (CATEGORY_CONFIGS[raw]) return raw;

  const clean = raw.replace(/[^a-z0-9]/g, '');
  if (clean.includes('craft') || clean.includes('art')) return 'art';
  if (clean.includes('culture') || clean.includes('heritage')) return 'culture';
  if (clean.includes('festival') || clean.includes('celebrat') || clean.includes('utsav')) return 'festivals';
  if (clean.includes('tech') || clean.includes('hack')) return 'technology';
  if (clean.includes('music') || clean.includes('folk') || clean.includes('classical') || clean.includes('sing')) return 'music';
  if (clean.includes('film') || clean.includes('theatre') || clean.includes('theater') || clean.includes('cinema') || clean.includes('play')) return 'film';
  if (clean.includes('book') || clean.includes('literat') || clean.includes('poem') || clean.includes('poetry') || clean.includes('author')) return 'literature';
  if (clean.includes('food') || clean.includes('culinary') || clean.includes('chai') || clean.includes('tradition')) return 'food';
  if (clean.includes('dialect') || clean.includes('communit') || clean.includes('language') || clean.includes('circle')) return 'community';
  if (clean.includes('workshop') || clean.includes('mentor') || clean.includes('learn') || clean.includes('guild')) return 'workshops';
  if (clean.includes('science') || clean.includes('discover') || clean.includes('gallery')) return 'science';

  return 'culture';
}

export function getCategoryConfig(category) {
  const key = resolveCategoryKey(category);
  return CATEGORY_CONFIGS[key] || CATEGORY_CONFIGS.culture;
}

/**
 * Escapes special XML characters so SVG markup is valid.
 */
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts an SVG string into a bulletproof Data-URI (base64 in browser/node with utf-8 support).
 */
function svgToDataUri(svgString) {
  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      const encoded = window.btoa(unescape(encodeURIComponent(svgString)));
      return `data:image/svg+xml;base64,${encoded}`;
    }
  } catch {
    // fallback if btoa throws
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

/**
 * Returns a self-contained, zero-latency vector SVG banner data-URI for an event category.
 */
export function getCategorySvgPlaceholder(category) {
  const catKey = resolveCategoryKey(category);
  const config = CATEGORY_CONFIGS[catKey] || CATEGORY_CONFIGS.culture;
  const labelEscaped = escapeXml(config.label.toUpperCase());
  const symbolEscaped = escapeXml(config.symbol);

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
    <text x="400" y="193" font-size="52" text-anchor="middle" dominant-baseline="middle">${symbolEscaped}</text>
    <text x="400" y="315" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="24" font-weight="bold" fill="${config.textColor}" text-anchor="middle" letter-spacing="2">${labelEscaped}</text>
    <text x="400" y="352" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#E8DBCE" fill-opacity="0.85" text-anchor="middle" letter-spacing="2.5">ANVESHA • LIVING INDIA</text>
  </svg>`;

  return svgToDataUri(svg);
}

/**
 * Returns a high-res curated photograph or local asset for the given category.
 */
export function getCategoryPlaceholder(category) {
  const config = getCategoryConfig(category);
  return config.curatedImage || getCategorySvgPlaceholder(category);
}

// Known expired/broken Unsplash links that return 404
const KNOWN_BROKEN_PATTERNS = [
  'photo-1579783902614-a3fb3927b675',
  'photo-1600100397608-f70cff5a2e09',
  'photo-1609137144822-0d1279a099f6',
  'photo-1601925268312-2e6d1a3e1f5f',
];

export function isBrokenImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  return KNOWN_BROKEN_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Resolves the display image for any event object, falling back to category placeholders.
 */
export function getEventImage(event) {
  if (!event) return getCategoryPlaceholder('culture');
  const img = event.image ?? event.image_url ?? event.imageUrl;
  if (typeof img === 'string' && img.trim() !== '' && !isBrokenImageUrl(img)) {
    return img.trim();
  }
  return getCategoryPlaceholder(event.category || event.categoryLabel);
}

/**
 * OnError handler for <img> tags to swap broken URLs with a guaranteed local photo or SVG banner.
 */
export function handleEventImageError(e, category) {
  if (!e || !e.currentTarget) return;
  e.currentTarget.onerror = null;

  const config = getCategoryConfig(category);
  const currentSrc = e.currentTarget.src || '';

  // If not already showing the curated local image, try that first
  if (config.curatedImage && !currentSrc.includes(config.curatedImage)) {
    e.currentTarget.onerror = () => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = getCategorySvgPlaceholder(category);
    };
    e.currentTarget.src = config.curatedImage;
    return;
  }

  // Otherwise, fallback directly to the guaranteed zero-latency vector SVG banner
  e.currentTarget.src = getCategorySvgPlaceholder(category);
}

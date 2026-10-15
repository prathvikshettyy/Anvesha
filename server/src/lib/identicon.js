// server/src/lib/identicon.js
// Generates GitHub-style deterministic symmetric 5x5 identicons as SVG data URIs

export function generateIdenticon(seed = 'user') {
  const str = String(seed || 'user').trim().toLowerCase();
  
  // Deterministic 32-bit FNV-1a hash
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const h1 = Math.abs(hash);
  
  // Secondary hash
  let h2 = 0;
  for (let i = 0; i < str.length; i++) {
    h2 = ((h2 << 5) - h2) + str.charCodeAt(i);
    h2 |= 0;
  }
  const absH2 = Math.abs(h2);

  const hue = h1 % 360;
  const fg = `hsl(${hue}, 68%, 46%)`;
  const bg = '#f1f5f9';

  const size = 5;
  const padding = 20;
  const cellSize = 40;
  const totalSize = size * cellSize + padding * 2; // 240x240

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < 3; c++) {
      const bitIndex = r * 3 + c;
      const bit = ((absH2 >> bitIndex) ^ (h1 >> (bitIndex * 2))) & 1;
      if (bit === 1) {
        const x1 = padding + c * cellSize;
        const x2 = padding + (size - 1 - c) * cellSize;
        const y = padding + r * cellSize;
        rects += `<rect x="${x1}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fg}" rx="4"/>`;
        if (c < 2) {
          rects += `<rect x="${x2}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fg}" rx="4"/>`;
        }
      }
    }
  }

  if (!rects) {
    rects = `<rect x="${padding + 2 * cellSize}" y="${padding + 2 * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fg}" rx="4"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}"><rect width="${totalSize}" height="${totalSize}" fill="${bg}" rx="32"/>${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

import React from 'react';

/**
 * AestheticMandalaBg
 * Renders an ethereal, transparent heritage backdrop blending:
 * 1. Vintage Persian / Indian floral arch tapestry artwork (with lowered transparency: 5%-9%)
 * 2. Hand-painted Alpona / Kolam sacred mandala linework rotating slowly
 * 3. Faint coastal Yakshagana / Kathakali theatrical contour in the corner
 * 4. Ambient warm terracotta and golden ochre light diffusion.
 */
export default function AestheticMandalaBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
      
      {/* ── 1. Full-Viewport Heirloom Tapestry Repeat Texture (Subtle & Tactile) ── */}
      <div 
        className="absolute inset-0 bg-repeat opacity-[0.045] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: 'url(/images/heritage-tapestry-bg.png)',
          backgroundSize: '380px auto',
          backgroundPosition: 'top left',
          filter: 'sepia(0.25) saturate(1.1)'
        }}
      />

      {/* ── 2. Top-Right Vintage Floral Tapestry Arch Vignette (Lowered Transparency) ── */}
      <div 
        className="absolute -top-16 -right-16 w-[480px] h-[720px] opacity-[0.085] pointer-events-none transition-all duration-1000"
        style={{
          backgroundImage: 'url(/images/heritage-tapestry-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse at 75% 25%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 75% 25%, black 30%, transparent 75%)',
          filter: 'sepia(0.18) contrast(1.05)'
        }}
      />

      {/* ── 3. Bottom-Left Floral Arch Tapestry Vignette (Lowered Transparency) ── */}
      <div 
        className="hidden md:block absolute -bottom-24 -left-20 w-[420px] h-[640px] opacity-[0.07] pointer-events-none transition-all duration-1000"
        style={{
          backgroundImage: 'url(/images/heritage-tapestry-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          maskImage: 'radial-gradient(ellipse at 25% 75%, black 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 25% 75%, black 25%, transparent 75%)',
          filter: 'sepia(0.2)'
        }}
      />

      {/* ── 4. Subtle Coastal Yakshagana / Kathakali Art Contour (Faint in Bottom-Right) ── */}
      <div 
        className="hidden xl:block absolute bottom-0 right-10 w-[300px] h-[460px] opacity-[0.04] pointer-events-none transition-all"
        style={{
          backgroundImage: 'url(/images/yakshagana-art-bg.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          maskImage: 'linear-gradient(to top, black 25%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to top, black 25%, transparent 90%)',
          filter: 'sepia(0.2) contrast(1.1)'
        }}
      />

      {/* ── 5. Ambient Soft Diffusion Orbs ────────────────────────────────────────── */}
      <div 
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(197, 110, 80, 0.28) 0%, rgba(217, 164, 65, 0.12) 50%, transparent 75%)',
          transform: 'translate(30%, -30%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full blur-3xl opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(217, 164, 65, 0.22) 0%, rgba(197, 110, 80, 0.12) 50%, transparent 75%)',
          transform: 'translate(-35%, 35%)'
        }}
      />

      {/* ── 6. Top-Right Rotating Alpona / Kolam Sacred Mandala ──────────────────── */}
      <div className="absolute -top-32 -right-32 w-[540px] h-[540px] opacity-[0.11] transition-opacity duration-1000">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full animate-mandala-slow"
          fill="none"
          stroke="#C56E50"
          strokeWidth="1.2"
        >
          <circle cx="300" cy="300" r="14" fill="#C56E50" fillOpacity="0.2" />
          <circle cx="300" cy="300" r="32" strokeDasharray="3 3" />
          <circle cx="300" cy="300" r="60" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="85" strokeDasharray="6 4" />
          
          {/* 8-Petal Inner Lotus */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <g key={`inner-petal-${i}`} transform={`rotate(${angle} 300 300)`}>
              <path d="M 300 240 C 285 270, 285 285, 300 300 C 315 285, 315 270, 300 240 Z" fill="#D9A441" fillOpacity="0.08" />
              <circle cx="300" cy="225" r="4" fill="#C56E50" fillOpacity="0.4" />
            </g>
          ))}

          {/* 16-Petal Mid Ring */}
          <circle cx="300" cy="300" r="140" strokeWidth="1" />
          <circle cx="300" cy="300" r="165" strokeDasharray="4 6" />
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={`mid-petal-${i}`} transform={`rotate(${i * 22.5} 300 300)`}>
              <path d="M 300 135 C 275 180, 275 220, 300 240 C 325 220, 325 180, 300 135 Z" fill="#C56E50" fillOpacity="0.05" />
              <line x1="300" y1="135" x2="300" y2="165" stroke="#D9A441" strokeWidth="1" />
              <circle cx="300" cy="125" r="3.5" fill="#D9A441" fillOpacity="0.5" />
            </g>
          ))}

          {/* Outer Filigree Ring */}
          <circle cx="300" cy="300" r="220" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="240" strokeDasharray="2 4" />
          <circle cx="300" cy="300" r="260" strokeWidth="1.2" />
          {Array.from({ length: 24 }).map((_, i) => (
            <g key={`outer-arch-${i}`} transform={`rotate(${i * 15} 300 300)`}>
              <path d="M 285 40 Q 300 15, 315 40" strokeWidth="1.5" />
              <circle cx="300" cy="28" r="3" fill="#C56E50" fillOpacity="0.35" />
              <path d="M 300 60 C 270 120, 270 180, 300 220 C 330 180, 330 120, 300 60 Z" fill="#D9A441" fillOpacity="0.03" />
            </g>
          ))}
          <circle cx="300" cy="300" r="285" strokeWidth="0.8" strokeDasharray="8 8" />
        </svg>
      </div>

      {/* ── 7. Bottom-Left Rotating Sacred Sun Wheel Mandala ───────────────────── */}
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] opacity-[0.09] transition-opacity duration-1000">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full animate-mandala-slow-reverse"
          fill="none"
          stroke="#D9A441"
          strokeWidth="1.2"
        >
          <circle cx="300" cy="300" r="18" fill="#D9A441" fillOpacity="0.2" />
          <circle cx="300" cy="300" r="45" stroke="#C56E50" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="80" strokeDasharray="4 4" />
          <circle cx="300" cy="300" r="110" strokeWidth="1.2" />

          {/* 12 Sun Rays */}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={`sun-spoke-${i}`} transform={`rotate(${i * 30} 300 300)`}>
              <line x1="300" y1="45" x2="300" y2="110" stroke="#C56E50" strokeWidth="1.5" />
              <path d="M 300 110 C 280 160, 280 220, 300 250 C 320 220, 320 160, 300 110 Z" fill="#C56E50" fillOpacity="0.06" />
              <circle cx="300" cy="95" r="4" fill="#D9A441" fillOpacity="0.5" />
            </g>
          ))}

          <circle cx="300" cy="300" r="170" strokeWidth="1.2" strokeDasharray="6 4" />
          <circle cx="300" cy="300" r="210" strokeWidth="1.5" stroke="#C56E50" />
          {Array.from({ length: 24 }).map((_, i) => (
            <g key={`bottom-arch-${i}`} transform={`rotate(${i * 15} 300 300)`}>
              <path d="M 290 90 Q 300 65, 310 90" strokeWidth="1.2" stroke="#C56E50" />
              <circle cx="300" cy="78" r="2.5" fill="#C56E50" fillOpacity="0.4" />
            </g>
          ))}
          <circle cx="300" cy="300" r="260" strokeWidth="0.8" strokeDasharray="5 10" />
          <circle cx="300" cy="300" r="285" strokeWidth="1.4" stroke="#D9A441" />
        </svg>
      </div>

    </div>
  );
}

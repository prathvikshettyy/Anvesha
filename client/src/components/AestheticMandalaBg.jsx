import React from 'react';

/**
 * AestheticMandalaBg
 * Renders an ethereal, transparent Indian Alpona / Kolam / Mandala background
 * with sacred lotus geometry, golden ochre and terracotta linework,
 * inspired by traditional hand-painted floor rituals and temple architecture.
 */
export default function AestheticMandalaBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
      
      {/* ── Ambient Soft Glow Gradients ────────────────────────────────────────── */}
      <div 
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(197, 110, 80, 0.3) 0%, rgba(217, 164, 65, 0.15) 50%, transparent 75%)',
          transform: 'translate(30%, -30%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(217, 164, 65, 0.25) 0%, rgba(197, 110, 80, 0.15) 50%, transparent 75%)',
          transform: 'translate(-35%, 35%)'
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(197, 110, 80, 0.2) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* ── Top-Right Floating Mandala Flower (Alpona / Kolam Geometry) ────────── */}
      <div className="absolute -top-36 -right-36 w-[560px] h-[560px] opacity-[0.14] transition-opacity duration-1000">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full animate-mandala-slow"
          fill="none"
          stroke="#C56E50"
          strokeWidth="1.2"
        >
          {/* Central Bindu & Core Lotus */}
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

          {/* 16-Petal Mid Ring with Sacred Arches */}
          <circle cx="300" cy="300" r="140" strokeWidth="1" />
          <circle cx="300" cy="300" r="165" strokeDasharray="4 6" />
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={`mid-petal-${i}`} transform={`rotate(${i * 22.5} 300 300)`}>
              <path d="M 300 135 C 275 180, 275 220, 300 240 C 325 220, 325 180, 300 135 Z" fill="#C56E50" fillOpacity="0.05" />
              <line x1="300" y1="135" x2="300" y2="165" stroke="#D9A441" strokeWidth="1" />
              <circle cx="300" cy="125" r="3.5" fill="#D9A441" fillOpacity="0.5" />
            </g>
          ))}

          {/* 32-Petal Outer Filigree Ring */}
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

      {/* ── Bottom-Left Large Ambient Mandala Halo ─────────────────────────────── */}
      <div className="absolute -bottom-48 -left-48 w-[640px] h-[640px] opacity-[0.12] transition-opacity duration-1000">
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full animate-mandala-slow-reverse"
          fill="none"
          stroke="#D9A441"
          strokeWidth="1.2"
        >
          {/* Core Sacred Wheel */}
          <circle cx="300" cy="300" r="18" fill="#D9A441" fillOpacity="0.2" />
          <circle cx="300" cy="300" r="45" stroke="#C56E50" strokeWidth="1.5" />
          <circle cx="300" cy="300" r="80" strokeDasharray="4 4" />
          <circle cx="300" cy="300" r="110" strokeWidth="1.2" />

          {/* 12 Sun Rays / Solar Spokes */}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={`sun-spoke-${i}`} transform={`rotate(${i * 30} 300 300)`}>
              <line x1="300" y1="45" x2="300" y2="110" stroke="#C56E50" strokeWidth="1.5" />
              <path d="M 300 110 C 280 160, 280 220, 300 250 C 320 220, 320 160, 300 110 Z" fill="#C56E50" fillOpacity="0.06" />
              <circle cx="300" cy="95" r="4" fill="#D9A441" fillOpacity="0.5" />
            </g>
          ))}

          {/* Outer Alpona Waves */}
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

      {/* ── Center Subtle Decorative Flourish (Very Faint) ─────────────────────── */}
      <div className="hidden lg:block absolute top-1/3 right-1/4 w-[340px] h-[340px] opacity-[0.06] transition-opacity duration-1000">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full animate-mandala-slow"
          fill="none"
          stroke="#C56E50"
          strokeWidth="1"
        >
          <circle cx="200" cy="200" r="30" strokeDasharray="3 3" />
          <circle cx="200" cy="200" r="70" />
          <circle cx="200" cy="200" r="120" strokeDasharray="5 5" />
          <circle cx="200" cy="200" r="170" />
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={`center-star-${i}`} transform={`rotate(${i * 45} 200 200)`}>
              <path d="M 200 80 Q 220 140, 200 170 Q 180 140, 200 80 Z" fill="#C56E50" fillOpacity="0.08" />
              <circle cx="200" cy="65" r="3" fill="#D9A441" fillOpacity="0.4" />
            </g>
          ))}
        </svg>
      </div>

    </div>
  );
}

import React from 'react';
import { Compass, Sparkles, MapPin, Mic, Users, HeartHandshake, ArrowRight, ShieldCheck } from 'lucide-react';

export default function WelcomeView({ onGetStarted, onExploreDemo }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Editorial Hero Header */}
      <div className="pt-6 sm:pt-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blush-surface/70 border border-terra-primary/30 text-xs font-bold text-cocoa-text mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-ochre-accent" />
          <span>M# 2026 Hackathon · Culture & Community Track</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-cocoa-text leading-[1.1]">
          Discover something new. <br />
          <span className="text-terra-primary italic font-normal">Find your people.</span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-cocoa-text/80 max-w-2xl mx-auto leading-relaxed">
          The Lost Connection brings scattered cultural circles together. Connect with students and mentors who speak your native dialect, practice regional folk arts, and organize meetups around campus.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-terra-primary text-cream-canvas font-bold text-base hover:bg-primary-container shadow-warm hover:shadow-warm-hover hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
          >
            <span>Get Started & Pick Interests</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-terra-primary/40 text-terra-primary hover:bg-blush-surface/50 font-bold text-base transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Demo Directly</span>
          </button>
        </div>

        {/* Privacy Note */}
        <p className="mt-4 text-xs text-cocoa-text/60 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-terra-primary" />
          <span>No exact GPS tracking. Opt-in discovery only. Built for real human connection.</span>
        </p>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="mt-14 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pillar 1 */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-blush-surface shadow-warm hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-terra-primary/10 flex items-center justify-center text-terra-primary mb-4">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-cocoa-text">
            Culture Locket
          </h3>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-2 leading-relaxed">
            A quiet daily ritual to stay close to your roots. Send a 5-second dialect audio clip, a family proverb, or a craft photo directly to your paired buddy.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-blush-surface shadow-warm hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#996C04]/10 flex items-center justify-center text-[#996C04] mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-cocoa-text">
            Living Cultural Map
          </h3>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-2 leading-relaxed">
            Find student workshops, dialect practice circles, and folk performances across Manipal without exposing your exact room or street address.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-blush-surface shadow-warm hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#7A5500]/10 flex items-center justify-center text-[#7A5500] mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-cocoa-text">
            Transparent Matching
          </h3>
          <p className="text-xs sm:text-sm text-cocoa-text/75 mt-2 leading-relaxed">
            See clear reasons for every connection: like matching a beginner wanting to learn Tulu with a native speaker ready to practice over chai.
          </p>
        </div>
      </div>

      {/* Footer credits */}
      <div className="mt-12 text-center text-xs text-cocoa-text/50">
        ShareSpot Community Platform · Modern Terracotta Design · TEAMAPPEX
      </div>
    </div>
  );
}

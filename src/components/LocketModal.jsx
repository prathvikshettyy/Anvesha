import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Sparkles, Send, X, Volume2, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LocketModal({ isOpen, onClose, onSendMoment, defaultRecipient }) {
  const [momentType, setMomentType] = useState('WORD_OF_DAY');
  const [vernacularText, setVernacularText] = useState('');
  const [phoneticText, setPhoneticText] = useState('');
  const [meaning, setMeaning] = useState('');
  const [provenance, setProvenance] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorded, setAudioRecorded] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const timerRef = useRef(null);

  if (!isOpen) return null;

  const startRecording = () => {
    setIsRecording(true);
    setAudioRecorded(false);
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= 6) {
          stopRecording();
          return 6;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioRecorded(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vernacularText || !meaning) return;

    const newMoment = {
      id: `lok_${Date.now()}`,
      senderId: 'usr_rohan',
      senderName: 'Rohan Shenoy',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      momentType,
      title: momentType === 'WORD_OF_DAY' ? 'Dialect Word of the Day' : 'Cultural Moment',
      vernacularText,
      phoneticText: phoneticText || `/${vernacularText.toLowerCase().replace(/\s+/g, '-')}/`,
      meaning,
      provenance: provenance || 'Preserved from coastal family traditions',
      audioDuration: `0:0${recordingDuration || 4}`,
      timestamp: 'Just now',
      reactions: []
    };

    onSendMoment(newMoment);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C56E50', '#D9A441', '#E9CDB8']
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-canvas w-full max-w-lg rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-surface-container/60 border-b border-blush-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-terra-primary flex items-center justify-center text-cream-canvas shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-cocoa-text">
                Send a Culture Locket Pulse
              </h3>
              <p className="text-xs text-cocoa-text/60">
                To: {defaultRecipient?.name || 'Your Paired Culture Circle'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-cocoa-text/60 hover:text-cocoa-text hover:bg-blush-surface/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Moment Type Switcher */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs uppercase tracking-wider mb-2">
              Moment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMomentType('WORD_OF_DAY')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  momentType === 'WORD_OF_DAY'
                    ? 'border-terra-primary bg-terra-primary/10 text-terra-primary font-bold shadow-sm'
                    : 'border-blush-surface bg-surface-container-lowest text-cocoa-text'
                }`}
              >
                <div className="font-serif text-sm">🗣️ Dialect Word</div>
                <div className="text-[11px] text-cocoa-text/70 mt-0.5">Word, pronunciation audio & meaning</div>
              </button>

              <button
                type="button"
                onClick={() => setMomentType('CRAFT_STEP')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  momentType === 'CRAFT_STEP'
                    ? 'border-terra-primary bg-terra-primary/10 text-terra-primary font-bold shadow-sm'
                    : 'border-blush-surface bg-surface-container-lowest text-cocoa-text'
                }`}
              >
                <div className="font-serif text-sm">🏺 Craft / Recipe Step</div>
                <div className="text-[11px] text-cocoa-text/70 mt-0.5">Hands-on technique or family secret</div>
              </button>
            </div>
          </div>

          {/* Audio Snippet Recorder */}
          <div className="p-4 rounded-2xl bg-surface-container/60 border border-blush-surface">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-terra-primary">
                5-Second Dialect Audio Clip
              </span>
              <span className="text-xs text-cocoa-text/60">
                {isRecording ? `0:0${recordingDuration} / 0:06` : audioRecorded ? 'Audio Ready ✓' : 'Optional'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-sm transition-all"
                >
                  <Mic className="w-4 h-4" />
                  <span>{audioRecorded ? 'Re-record Voice Clip' : 'Record Native Pronunciation'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white font-bold text-xs animate-pulse shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop Recording (0:0{recordingDuration})</span>
                </button>
              )}

              {/* Waveform graphic */}
              <div className="flex-1 flex items-center gap-1 h-6">
                <span className={`w-1 rounded-full ${isRecording ? 'bg-terra-primary wave-bar-1' : 'bg-blush-surface h-2'}`} />
                <span className={`w-1 rounded-full ${isRecording ? 'bg-terra-primary wave-bar-2' : 'bg-blush-surface h-3'}`} />
                <span className={`w-1 rounded-full ${isRecording ? 'bg-terra-primary wave-bar-3' : 'bg-blush-surface h-5'}`} />
                <span className={`w-1 rounded-full ${isRecording ? 'bg-terra-primary wave-bar-4' : 'bg-blush-surface h-3'}`} />
                <span className={`w-1 rounded-full ${isRecording ? 'bg-terra-primary wave-bar-5' : 'bg-blush-surface h-2'}`} />
              </div>
            </div>
          </div>

          {/* Vernacular Phrase Input */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">
              Vernacular Text / Word <span className="text-terra-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., ಸೊಲ್ಮೆಲು (Solmelu) or Encha Uller"
              value={vernacularText}
              onChange={(e) => setVernacularText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          {/* Phonetic Pronunciation */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">
              Phonetic Reading (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., /sol-me-lu/"
              value={phoneticText}
              onChange={(e) => setPhoneticText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30 font-mono text-xs"
            />
          </div>

          {/* English Meaning / Story */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">
              Meaning & Cultural Context <span className="text-terra-primary">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Explain what it means and how it is customarily spoken..."
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          {/* Provenance / Attribution */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">
              Cultural Provenance / Attribution
            </label>
            <input
              type="text"
              placeholder="e.g., Learned from grandmother in Kundapura"
              value={provenance}
              onChange={(e) => setProvenance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30"
            />
          </div>

          {/* Privacy footnote */}
          <div className="flex items-center gap-1.5 text-xs text-cocoa-text/60 italic">
            <Shield className="w-3.5 h-3.5 text-terra-primary" />
            <span>Shared privately with your chosen connection. No public popularity metrics.</span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-cocoa-text hover:bg-blush-surface/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:bg-primary-container shadow-warm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Locket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

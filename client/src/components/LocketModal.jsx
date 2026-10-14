import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, Send, X, Shield, Loader2, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import * as api from '../services/api';

const BAR_COUNT = 40;
const MAX_REC_SECONDS = 15;

// ─── MIME probe — pick best format this browser supports ──────────────────────
function getBestMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return '';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4', // iOS Safari 14.1+
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/aac',
    '',
  ];
  for (const m of candidates) {
    try {
      if (!m || MediaRecorder.isTypeSupported(m)) return m;
    } catch (_) {}
  }
  return '';
}

export default function LocketModal({ isOpen, onClose, onSendMoment, defaultRecipient, currentUser, isAuthenticated }) {
  const [momentType, setMomentType]         = useState('WORD_OF_DAY');
  const [vernacularText, setVernacularText]  = useState('');
  const [phoneticText, setPhoneticText]      = useState('');
  const [meaning, setMeaning]               = useState('');
  const [provenance, setProvenance]          = useState('');
  const [submitting, setSubmitting]          = useState(false);
  const [submitError, setSubmitError]        = useState('');

  // ── Recording state machine ──────────────────────────────────────────────────
  // 'idle' | 'requesting' | 'denied' | 'recording' | 'recorded'
  const [recState, setRecState]          = useState('idle');
  const [deniedReason, setDeniedReason]  = useState(''); // 'insecure' | 'permission' | 'no_device' | 'in_use' | 'unsupported' | 'generic'
  const [recSeconds, setRecSeconds]      = useState(0);
  const [isPlaying, setIsPlaying]        = useState(false);
  const [bars, setBars]                  = useState(Array(BAR_COUNT).fill(2));

  // Clip state
  const [audioBlob, setAudioBlob]            = useState(null);
  const [audioBlobUrl, setAudioBlobUrl]      = useState('');   // object URL for local preview
  const [uploadedUrl, setUploadedUrl]        = useState('');   // server path after upload
  const [uploadedDuration, setUploadedDuration] = useState('');
  const [uploading, setUploading]            = useState(false);
  const [uploadError, setUploadError]        = useState('');

  // Refs (never trigger re-renders)
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const rafRef           = useRef(null);
  const timerRef         = useRef(null);
  const startTimeRef     = useRef(0);
  const previewAudioRef  = useRef(null);  // HTMLAudioElement for preview playback

  // ── Cleanup helper ───────────────────────────────────────────────────────────
  const stopEverything = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current?.state !== 'closed') {
      try { audioCtxRef.current?.close(); } catch (_) {}
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setBars(Array(BAR_COUNT).fill(2));
  }, []);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopEverything();
      previewAudioRef.current?.pause();
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
      // Reset all state for next open
      setRecState('idle');
      setDeniedReason('');
      setRecSeconds(0);
      setIsPlaying(false);
      setAudioBlob(null);
      setAudioBlobUrl('');
      setUploadedUrl('');
      setUploadedDuration('');
      setUploading(false);
      setUploadError('');
      setSubmitError('');
      setVernacularText('');
      setPhoneticText('');
      setMeaning('');
      setProvenance('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Waveform RAF loop ────────────────────────────────────────────────────────
  const drawBars = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
    const next = Array.from({ length: BAR_COUNT }, (_, i) => {
      const val = data[i * step] ?? 0;
      return Math.max(2, Math.round((val / 255) * 32));
    });
    setBars(next);
    rafRef.current = requestAnimationFrame(drawBars);
  }, []);

  // ── Upload clip to server ────────────────────────────────────────────────────
  const uploadClip = async (blob, seconds) => {
    if (!blob) return { url: '', duration: '' };
    setUploading(true);
    setUploadError('');
    try {
      const result = await api.locket.uploadAudio(blob, seconds);
      setUploadedUrl(result.url);
      setUploadedDuration(result.duration);
      return result;
    } catch (err) {
      const msg = err.message || 'Upload failed — audio will not be saved on server.';
      setUploadError(msg);
      return { url: '', duration: '' };
    } finally {
      setUploading(false);
    }
  };

  // ── Start recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    setSubmitError('');
    setUploadError('');
    setDeniedReason('');
    setRecState('requesting');

    // 1. Check secure context (HTTPS is mandatory on non-localhost / mobile origins)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocalhost) {
      setDeniedReason('insecure');
      setRecState('denied');
      return;
    }

    // 2. Check navigator.mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setDeniedReason('unsupported');
      setRecState('denied');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setDeniedReason('permission');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setDeniedReason('no_device');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setDeniedReason('in_use');
      } else {
        setDeniedReason('generic');
      }
      setRecState('denied');
      return;
    }

    streamRef.current = stream;

    // AudioContext waveform with mobile suspended-resume handling
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        drawBars();
      }
    } catch (_) {
      // No Web Audio API — waveform won't animate, recording still works
    }

    const mime = getBestMime();
    let recorder;
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (_) {
      try {
        recorder = new MediaRecorder(stream);
      } catch (recErr) {
        setDeniedReason('recorder_failed');
        setRecState('denied');
        return;
      }
    }

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const mimeType = recorder.mimeType || chunksRef.current[0]?.type || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });

      if (blob.size === 0) {
        setUploadError('No audio captured. Check microphone volume and try again.');
        setRecState('idle');
        return;
      }

      const url = URL.createObjectURL(blob);
      // Build a fresh HTMLAudioElement for in-modal preview
      const el = new Audio(url);
      el.onended = () => setIsPlaying(false);
      el.onerror = () => setIsPlaying(false);
      previewAudioRef.current = el;
      setAudioBlob(blob);
      setAudioBlobUrl(url);
      setRecState('recorded');

      // Auto-upload immediately to server disk so it is guaranteed saved!
      uploadClip(blob, elapsed);
    };

    recorder.start(250);
    startTimeRef.current = Date.now();
    setRecSeconds(0);
    setRecState('recording');

    // Auto-stop at MAX_REC_SECONDS
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setRecSeconds(elapsed);
      if (elapsed >= MAX_REC_SECONDS) stopRecording();
    }, 250);
  };

  // ── Stop recording ───────────────────────────────────────────────────────────
  const stopRecording = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    setBars(Array(BAR_COUNT).fill(2));

    // Stop mic tracks (closes mic indicator light)
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    // Close AudioContext
    if (audioCtxRef.current?.state !== 'closed') {
      try { audioCtxRef.current?.close(); } catch (_) {}
    }
    audioCtxRef.current = null;
    analyserRef.current = null;

    // Flush & stop recorder — triggers onstop which sets blob + url + initiates server save
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function' && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      } catch (_) {}
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
  };

  // ── Discard & re-record ──────────────────────────────────────────────────────
  const discardRecording = () => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlob(null);
    setAudioBlobUrl('');
    setUploadedUrl('');
    setUploadedDuration('');
    setUploadError('');
    setIsPlaying(false);
    setRecState('idle');
    setDeniedReason('');
    setRecSeconds(0);
    setBars(Array(BAR_COUNT).fill(2));
  };

  // ── Preview playback ─────────────────────────────────────────────────────────
  const togglePreview = () => {
    const el = previewAudioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      el.currentTime = 0;
      setIsPlaying(false);
    } else {
      el.currentTime = 0;
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // ── Form submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vernacularText.trim() || !meaning.trim()) return;
    setSubmitError('');

    // Auto-upload clip if not done yet
    let finalAudioUrl = uploadedUrl;
    let finalDuration = uploadedDuration;
    if (audioBlob && !uploadedUrl) {
      const result = await uploadClip(audioBlob, recSeconds);
      finalAudioUrl = result.url;
      finalDuration = result.duration;
    }

    const payload = {
      moment_type:     momentType,
      vernacular_text: vernacularText.trim(),
      meaning:         meaning.trim(),
      phonetic_text:   phoneticText.trim() || `/${vernacularText.trim().toLowerCase().replace(/\s+/g, '-')}/`,
      provenance:      provenance.trim() || 'Preserved from coastal family traditions',
      audio_url:       finalAudioUrl || '',
      audio_duration:  finalDuration || (recSeconds > 0 ? `0:${String(recSeconds).padStart(2, '0')}` : ''),
      recipient_id:    defaultRecipient?.id ?? null,
    };

    setSubmitting(true);
    let newMoment;
    try {
      newMoment = await api.locket.create(payload);
    } catch (err) {
      console.warn('Locket save fallback:', err);
      // Fallback if network or server is temporarily unreachable
      newMoment = {
        id:             `lok_${Date.now()}`,
        senderId:       currentUser?.id ?? 'usr_rohan',
        senderName:     currentUser?.name ?? 'You',
        senderAvatar:   currentUser?.avatar ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        momentType,
        title:          momentType === 'WORD_OF_DAY' ? 'Dialect Word of the Day' : 'Cultural Moment',
        vernacularText:  payload.vernacular_text,
        phoneticText:    payload.phonetic_text,
        meaning:         payload.meaning,
        provenance:      payload.provenance,
        audioUrl:        finalAudioUrl || audioBlobUrl, // server URL or local fallback
        audioDuration:   payload.audio_duration,
        timestamp:       'Just now',
        reactions:       [],
      };
    } finally {
      setSubmitting(false);
    }

    onSendMoment(newMoment);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 }, colors: ['#C56E50', '#D9A441', '#E9CDB8'] });
    onClose();
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isBusy  = submitting || uploading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa-text/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cream-canvas w-full max-w-lg rounded-3xl border-2 border-blush-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 sm:p-6 bg-surface-container/60 border-b border-blush-surface flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-terra-primary flex items-center justify-center text-cream-canvas shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-cocoa-text">Send a Culture Locket Pulse</h3>
              <p className="text-xs text-cocoa-text/60">To: {defaultRecipient?.name || 'Your Paired Culture Circle'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-cocoa-text/60 hover:text-cocoa-text hover:bg-blush-surface/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">

          {/* Moment Type */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs uppercase tracking-wider mb-2">Moment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'WORD_OF_DAY', icon: '🗣️', label: 'Dialect Word', sub: 'Word, pronunciation audio & meaning' },
                { val: 'CRAFT_STEP',  icon: '🏺', label: 'Craft / Recipe Step', sub: 'Hands-on technique or family secret' },
              ].map(({ val, icon, label, sub }) => (
                <button key={val} type="button" onClick={() => setMomentType(val)}
                  className={`p-3 rounded-2xl border text-left transition-all ${momentType === val ? 'border-terra-primary bg-terra-primary/10 text-terra-primary font-bold shadow-sm' : 'border-blush-surface bg-surface-container-lowest text-cocoa-text'}`}>
                  <div className="font-serif text-sm">{icon} {label}</div>
                  <div className="text-[11px] text-cocoa-text/70 mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Voice Recorder ────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-surface-container/60 border border-blush-surface overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-terra-primary">
                🎙️ Voice Pronunciation Clip
              </span>
              <span className="text-[11px] text-cocoa-text/50">
                {recState === 'recording'   ? `${fmtTime(recSeconds)} / ${fmtTime(MAX_REC_SECONDS)}`
                : recState === 'recorded'   ? uploadedUrl ? '✓ Saved to server' : 'Recorded — preview below'
                : recState === 'requesting' ? 'Waiting for mic…'
                : recState === 'denied'     ? 'Permission denied'
                : 'Optional · up to 15 s'}
              </span>
            </div>

            {/* Waveform bars */}
            <div className="flex items-end gap-px h-10 px-4 pb-2">
              {bars.map((h, i) => (
                <span key={i}
                  className={`flex-1 rounded-full transition-all duration-75
                    ${recState === 'recording' ? 'bg-terra-primary'
                    : recState === 'recorded'  ? 'bg-ochre-accent/60'
                    : 'bg-blush-surface'}`}
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            {/* Permission denied banner with exact diagnostic */}
            {recState === 'denied' && (
              <div className="mx-4 mb-3 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-1">
                  <div className="font-bold">
                    {deniedReason === 'insecure'   ? '🔒 HTTPS Required on Mobile / Network'
                    : deniedReason === 'permission' ? '🚫 Microphone Permission Blocked'
                    : deniedReason === 'no_device'  ? '🎙️ No Microphone Detected'
                    : deniedReason === 'in_use'     ? '⚠️ Microphone In Use'
                    : '⚠️ Microphone Access Denied'}
                  </div>
                  {deniedReason === 'insecure' ? (
                    <p className="leading-relaxed">
                      Mobile browsers only permit microphone access over <strong>HTTPS</strong>.
                      Please use the <code>https://</code> address shown in your terminal (tap <em>Advanced → Proceed</em> on self-signed cert warning).
                    </p>
                  ) : deniedReason === 'permission' ? (
                    <p className="leading-relaxed">
                      Tap the permissions / lock icon in your browser's address bar, set <strong>Microphone</strong> to <strong>Allow</strong>, then tap <em>Try Again</em> below.
                    </p>
                  ) : deniedReason === 'no_device' ? (
                    <p className="leading-relaxed">No microphone hardware detected. Please attach a mic or headset.</p>
                  ) : deniedReason === 'in_use' ? (
                    <p className="leading-relaxed">Your microphone is currently in use by another app or call.</p>
                  ) : (
                    <p className="leading-relaxed">Microphone access could not be started. Check your browser permissions and try again.</p>
                  )}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
              {(recState === 'idle' || recState === 'denied') && (
                <button type="button" onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:brightness-110 shadow-sm transition-all active:scale-95">
                  <Mic className="w-3.5 h-3.5" />
                  {recState === 'denied' ? 'Try Again' : 'Record Native Pronunciation'}
                </button>
              )}

              {recState === 'requesting' && (
                <span className="flex items-center gap-2 text-xs text-cocoa-text/60">
                  <Loader2 className="w-4 h-4 animate-spin" /> Allow mic access…
                </span>
              )}

              {recState === 'recording' && (
                <button type="button" onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 text-white font-bold text-xs shadow-sm animate-pulse active:scale-95">
                  <Square className="w-3 h-3 fill-white" />
                  Stop · {fmtTime(recSeconds)}
                </button>
              )}

              {recState === 'recorded' && (
                <>
                  <button type="button" onClick={togglePreview}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-blush-surface hover:bg-terra-primary hover:text-cream-canvas text-terra-primary font-bold text-xs transition-all active:scale-95">
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlaying ? 'Pause' : 'Preview'}
                  </button>

                  <button type="button" onClick={discardRecording}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-blush-surface hover:bg-blush-surface/50 text-cocoa-text/70 font-semibold text-xs transition-all active:scale-95">
                    <RotateCcw className="w-3 h-3" />
                    Re-record
                  </button>

                  {!uploadedUrl && !uploading && (
                    <button type="button" onClick={() => uploadClip(audioBlob, recSeconds)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-ochre-accent/20 hover:bg-ochre-accent/30 text-ochre-accent font-bold text-xs transition-all active:scale-95">
                      ↑ Save Clip Now
                    </button>
                  )}

                  {uploading && (
                    <span className="flex items-center gap-1.5 text-xs text-cocoa-text/50">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                    </span>
                  )}

                  {uploadedUrl && !uploading && (
                    <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </>
              )}
            </div>

            {uploadError && (
              <p className="px-4 pb-3 text-xs text-red-600">{uploadError} (clip will still attach locally)</p>
            )}
          </div>

          {/* Vernacular */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">
              Vernacular Text / Word <span className="text-terra-primary">*</span>
            </label>
            <input type="text" required
              placeholder="e.g., ಸೊಲ್ಮೆಲು (Solmelu) or Encha Uller"
              value={vernacularText} onChange={e => setVernacularText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30" />
          </div>

          {/* Phonetic */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Phonetic Reading (Optional)</label>
            <input type="text" placeholder="e.g., /sol-me-lu/"
              value={phoneticText} onChange={e => setPhoneticText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30 font-mono text-xs" />
          </div>

          {/* Meaning */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">
              Meaning &amp; Cultural Context <span className="text-terra-primary">*</span>
            </label>
            <textarea required rows={2}
              placeholder="Explain what it means and how it is customarily spoken…"
              value={meaning} onChange={e => setMeaning(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30" />
          </div>

          {/* Provenance */}
          <div>
            <label className="block font-bold text-cocoa-text text-xs mb-1">Cultural Provenance / Attribution</label>
            <input type="text" placeholder="e.g., Learned from grandmother in Kundapura"
              value={provenance} onChange={e => setProvenance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush-surface bg-surface-container-lowest text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:ring-2 focus:ring-terra-primary/30" />
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-1.5 text-xs text-cocoa-text/60 italic">
            <Shield className="w-3.5 h-3.5 text-terra-primary flex-shrink-0" />
            <span>Shared privately with your chosen connection. No public popularity metrics.</span>
          </div>

          {submitError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-cocoa-text hover:bg-blush-surface/50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isBusy}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-terra-primary text-cream-canvas font-bold text-xs hover:brightness-110 shadow-warm transition-all disabled:opacity-60 active:scale-95">
              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? 'Sending…' : uploading ? 'Uploading…' : 'Send to Locket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

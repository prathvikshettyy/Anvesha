import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Bookmark,
  Heart,
  Shield,
  Settings,
  Sparkles,
  MapPin,
  CheckCircle,
  ExternalLink,
  Camera,
  Upload,
  Shuffle,
  X,
  Check,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_INTERESTS } from '../data/initialData';
import EventCard from '../components/EventCard';
import * as api from '../services/api';
import { generateIdenticon, PRESET_AVATARS } from '../utils/identicon';

export default function ProfileView({
  user,
  events,
  savedEvents,
  onToggleSave,
  onSelectEvent,
  onUpdateUser,
  onResetDemo,
  onSaveProfile,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState('SAVED'); // 'SAVED', 'INTERESTS', 'PRIVACY'
  const [isDiscoverable, setIsDiscoverable] = useState(user.isDiscoverable);
  const [fuzzedLocation, setFuzzedLocation] = useState(user.fuzzedLocation ?? true);
  const [dbSavedEvents, setDbSavedEvents] = useState(null);

  // Avatar edit modal state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(user.avatar || '');
  const [avatarTab, setAvatarTab] = useState('PRESETS'); // 'PRESETS', 'UPLOAD', 'IDENTICON', 'URL'
  const [customUrl, setCustomUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Keep tempAvatar synced when user prop updates
  useEffect(() => {
    if (user?.avatar) {
      setTempAvatar(user.avatar);
    }
  }, [user?.avatar]);

  // Handle local image file upload & client-side compression
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setTempAvatar(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!tempAvatar) return;
    setIsSavingAvatar(true);
    try {
      onUpdateUser?.(prev => ({ ...prev, avatar: tempAvatar }));
      if (onSaveProfile) {
        await onSaveProfile({ avatar_url: tempAvatar });
      }
      setIsAvatarModalOpen(false);
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}
    } catch (err) {
      console.warn('Failed to save profile picture:', err);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Sync saved events directly from DB if authenticated
  useEffect(() => {
    if (api.token.get()) {
      api.events.saved()
        .then(data => {
          if (Array.isArray(data)) setDbSavedEvents(data);
        })
        .catch(() => {});
    }
  }, [savedEvents]);

  const bookmarkedEvents = useMemo(() => {
    if (dbSavedEvents) {
      return dbSavedEvents.filter(e => savedEvents.includes(e.id));
    }
    return events.filter(e => savedEvents.includes(e.id));
  }, [dbSavedEvents, events, savedEvents]);

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-8">
      
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border-2 border-blush-surface shadow-warm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group flex-shrink-0">
          <img
            src={user.avatar}
            alt={user.name}
            onError={(e) => {
              e.currentTarget.src = generateIdenticon(user.username || user.handle || 'user');
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-terra-primary/40 shadow-md transition-all group-hover:brightness-95"
          />
          <button
            onClick={() => {
              setTempAvatar(user.avatar);
              setIsAvatarModalOpen(true);
            }}
            className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 text-center"
            title="Change Profile Photo"
            aria-label="Change Profile Photo"
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Change</span>
          </button>
          <button
            onClick={() => {
              setTempAvatar(user.avatar);
              setIsAvatarModalOpen(true);
            }}
            className="absolute -bottom-1 -right-1 bg-terra-primary hover:bg-terra-primary/90 text-white p-2 rounded-full shadow-md border-2 border-surface-container-lowest transition-transform hover:scale-110 cursor-pointer"
            title="Change Profile Photo"
            aria-label="Change Profile Photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-text">
                {user.name}
              </h1>
              <p className="text-xs text-cocoa-text/60 mt-0.5">{user.handle}</p>
            </div>

            <div className="flex items-center gap-2 self-center sm:self-auto">
              <button
                onClick={() => {
                  setTempAvatar(user.avatar);
                  setIsAvatarModalOpen(true);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-terra-primary/10 text-terra-primary hover:bg-terra-primary/20 transition-all flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Photo</span>
              </button>
              {Boolean(user?.isAdmin || user?.is_admin) && (
                <button
                  onClick={() => onNavigate?.('admin_ads')}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-terra-primary text-cream-canvas hover:bg-primary-container shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ad Revenue Ops</span>
                </button>
              )}
              <button
                onClick={onResetDemo}
                className="text-xs font-semibold px-4 py-1.5 rounded-full border border-blush-surface text-cocoa-text hover:bg-blush-surface/50 transition-all"
              >
                Reset Demo Session
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-cocoa-text/80 mt-3 max-w-2xl leading-relaxed">
            {user.bio}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-cocoa-text/75">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-terra-primary" />
              <span>{user.neighborhood}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active Culture Circle Member</span>
            </span>
            {Boolean(user?.isAdmin || user?.is_admin) && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-terra-primary px-2 py-0.5 rounded-full bg-terra-primary/10">
                  <span>Authorized Administrator</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-blush-surface flex flex-wrap items-center gap-6">
        <button
          onClick={() => setActiveTab('SAVED')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'SAVED'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Gatherings ({bookmarkedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INTERESTS')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'INTERESTS'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Cultural Interests ({user.interests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRIVACY')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PRIVACY'
              ? 'border-terra-primary text-terra-primary'
              : 'border-transparent text-cocoa-text/60 hover:text-cocoa-text'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & Discovery</span>
        </button>

        {Boolean(user?.isAdmin || user?.is_admin) && (
          <button
            onClick={() => onNavigate?.('admin_ads')}
            className="pb-3 text-sm font-bold border-b-2 border-transparent text-terra-primary hover:text-primary-container transition-all flex items-center gap-1.5 cursor-pointer sm:ml-auto"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ad Revenue Control Center →</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'SAVED' && (
        <div>
          {bookmarkedEvents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container/60 border border-blush-surface">
              <p className="text-sm text-cocoa-text/70">You haven't saved any gatherings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedEvents.map(evt => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  isSaved={true}
                  onToggleSave={onToggleSave}
                  onSelect={onSelectEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'INTERESTS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-blush-surface space-y-4">
          <h3 className="font-serif text-xl font-bold text-cocoa-text">Active Cultural Domains</h3>
          <p className="text-xs text-cocoa-text/70">These determine your explainable match scores with peers and events.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {INITIAL_INTERESTS.filter(i => user.interests.includes(i.id)).map(item => (
              <div key={item.id} className="p-3.5 rounded-2xl bg-surface-container/60 border border-blush-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-terra-primary text-xl">{item.icon}</span>
                <div>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-cocoa-text">{item.name}</h4>
                  <span className="text-[10px] text-terra-primary font-bold">Active Interest</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PRIVACY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-blush-surface space-y-6">
          <h3 className="font-serif text-xl font-bold text-cocoa-text">Privacy by Design Settings</h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/60 border border-blush-surface">
              <div>
                <h4 className="font-bold text-cocoa-text">Public Discoverability</h4>
                <p className="text-xs text-cocoa-text/70 mt-0.5">Allow other students and elders to find your profile based on shared dialects</p>
              </div>
              <input
                type="checkbox"
                checked={isDiscoverable}
                onChange={() => {
                  const next = !isDiscoverable;
                  setIsDiscoverable(next);
                  onSaveProfile?.({ is_discoverable: next ? 1 : 0 });
                }}
                className="w-5 h-5 accent-terra-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container/60 border border-blush-surface">
              <div>
                <h4 className="font-bold text-cocoa-text">Neighborhood Geohashing Halo</h4>
                <p className="text-xs text-cocoa-text/70 mt-0.5">Fuzz your location into a broad 500m zone. Exact dorm numbers and hostel rooms are never shared.</p>
              </div>
              <input
                type="checkbox"
                checked={fuzzedLocation}
                onChange={() => {
                  const next = !fuzzedLocation;
                  setFuzzedLocation(next);
                  onSaveProfile?.({ fuzzed_location: next ? 1 : 0 });
                }}
                className="w-5 h-5 accent-terra-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Change Profile Photo Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-blush-surface shadow-2xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-blush-surface">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-terra-primary" />
                <h3 className="font-serif text-xl font-bold text-cocoa-text">Change Profile Photo</h3>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-cocoa-text/60 hover:text-cocoa-text p-1.5 rounded-full hover:bg-blush-surface/50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current / Selected Preview */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container/60 border border-blush-surface">
              <img
                src={tempAvatar}
                alt="Selected avatar preview"
                onError={(e) => {
                  e.currentTarget.src = generateIdenticon(user.username || 'user');
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-terra-primary shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-terra-primary">Avatar Preview</span>
                <h4 className="font-serif text-base font-bold text-cocoa-text truncate">{user.name}</h4>
                <p className="text-xs text-cocoa-text/60 truncate">{user.handle}</p>
              </div>
            </div>

            {/* Options Tabs */}
            <div className="flex gap-2 p-1 bg-surface-container/60 rounded-xl border border-blush-surface text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAvatarTab('PRESETS')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'PRESETS' ? 'bg-surface-container-lowest text-terra-primary shadow-sm' : 'text-cocoa-text/70 hover:text-cocoa-text'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Cultural</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('IDENTICON')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'IDENTICON' ? 'bg-surface-container-lowest text-terra-primary shadow-sm' : 'text-cocoa-text/70 hover:text-cocoa-text'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Identicon</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('UPLOAD')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'UPLOAD' ? 'bg-surface-container-lowest text-terra-primary shadow-sm' : 'text-cocoa-text/70 hover:text-cocoa-text'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarTab('URL')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'URL' ? 'bg-surface-container-lowest text-terra-primary shadow-sm' : 'text-cocoa-text/70 hover:text-cocoa-text'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
            </div>

            {/* Tab: Cultural Presets */}
            {avatarTab === 'PRESETS' && (
              <div className="space-y-2">
                <p className="text-xs text-cocoa-text/70">Select an authentic cultural avatar matching your region & background:</p>
                <div className="grid grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = tempAvatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setTempAvatar(preset.url)}
                        className={`group p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-terra-primary bg-terra-primary/10 ring-2 ring-terra-primary/30'
                            : 'border-blush-surface bg-surface-container/40 hover:bg-surface-container/80'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-14 h-14 rounded-full object-cover shadow-sm"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-terra-primary text-white rounded-full p-0.5 shadow">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-cocoa-text line-clamp-1">{preset.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: GitHub Identicon */}
            {avatarTab === 'IDENTICON' && (
              <div className="p-4 rounded-2xl bg-surface-container/40 border border-blush-surface space-y-4 text-center">
                <p className="text-xs text-cocoa-text/70">
                  Generate a unique geometric 5x5 pattern like GitHub does. Every random generation creates a new symmetrical signature.
                </p>
                <div className="flex justify-center">
                  <img
                    src={tempAvatar.startsWith('data:image/svg+xml') ? tempAvatar : generateIdenticon(user.username || 'user')}
                    alt="Identicon preview"
                    className="w-24 h-24 rounded-2xl border-2 border-terra-primary/40 shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSeed = (user.username || 'user') + '_' + Math.random().toString(36).slice(2, 8);
                    const newIdenticon = generateIdenticon(newSeed);
                    setTempAvatar(newIdenticon);
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-terra-primary/15 text-terra-primary hover:bg-terra-primary/25 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Generate New Random Identicon</span>
                </button>
              </div>
            )}

            {/* Tab: Upload File */}
            {avatarTab === 'UPLOAD' && (
              <div className="p-6 rounded-2xl bg-surface-container/40 border-2 border-dashed border-blush-surface text-center space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-terra-primary/10 flex items-center justify-center text-terra-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cocoa-text">Upload from your computer or phone</h4>
                  <p className="text-xs text-cocoa-text/60 mt-0.5">JPG, PNG, WebP (auto-scaled square)</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-full bg-terra-primary text-white text-xs font-semibold hover:bg-terra-primary/90 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo File</span>
                </button>
              </div>
            )}

            {/* Tab: Image URL */}
            {avatarTab === 'URL' && (
              <div className="space-y-3">
                <p className="text-xs text-cocoa-text/70">Paste any direct image URL (HTTPS):</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-surface-container/60 border border-blush-surface text-cocoa-text placeholder-cocoa-text/40 focus:outline-none focus:border-terra-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrl.trim()) {
                        setTempAvatar(customUrl.trim());
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-terra-primary text-white text-xs font-semibold hover:bg-terra-primary/90 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-blush-surface">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 rounded-full border border-blush-surface text-cocoa-text/70 hover:text-cocoa-text hover:bg-blush-surface/50 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingAvatar || !tempAvatar}
                onClick={handleSaveAvatar}
                className="px-5 py-2 rounded-full bg-terra-primary text-white text-xs font-bold hover:bg-terra-primary/90 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isSavingAvatar ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Users, Calendar, MapPin, Sparkles, ArrowRight, Check, Heart, MessageCircle, Shield } from 'lucide-react';
import { COMMUNITY_ORGANIZER_MAP, INITIAL_PEOPLE } from '../data/initialData';

export default function CommunityCard({ community, onSelect, onJoinToggle, onContactOrganiser, people = [] }) {
  const getTypeBadge = (type) => {
    switch (type) {
      case 'EVENT':
        return {
          label: 'Event Circle',
          icon: Calendar,
          cls: 'bg-ochre-accent/15 text-ochre-accent border-ochre-accent/30'
        };
      case 'LOCATION':
        return {
          label: 'Local Hub',
          icon: MapPin,
          cls: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
        };
      case 'INTEREST':
      default:
        return {
          label: 'Cultural Interest',
          icon: Sparkles,
          cls: 'bg-terra-primary/10 text-terra-primary border-terra-primary/20'
        };
    }
  };

  const typeInfo = getTypeBadge(community.type);
  const TypeIcon = typeInfo.icon;

  const handleJoinClick = (e) => {
    e.stopPropagation();
    onJoinToggle?.(community);
  };

  // Resolve circle organiser user from backend data, people directory, or community members
  const organizerId = community?.createdBy || community?.created_by || (community?.id ? COMMUNITY_ORGANIZER_MAP[community.id] : null);
  const adminMember = community?.members?.find(m => m.role === 'ADMIN');
  const resolvedOrganizerId = organizerId || adminMember?.id;

  const organizerUser = community?.organizerUser
    || (resolvedOrganizerId ? (people.find(p => p.id === resolvedOrganizerId) || INITIAL_PEOPLE.find(p => p.id === resolvedOrganizerId)) : null)
    || (adminMember ? {
        id: adminMember.id,
        name: adminMember.name,
        handle: adminMember.handle,
        avatar: adminMember.avatar || adminMember.avatar_url,
        city: adminMember.city || community.location,
        role: 'Circle Organiser & Lead Admin',
      } : null);

  return (
    <div
      onClick={() => onSelect?.(community)}
      className="group bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-blush-surface overflow-hidden shadow-warm hover:shadow-warm-hover hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Banner Artwork */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-blush-surface/30">
        <img
          src={community.image || '/images/cinematic_india_hero.jpg'}
          alt={community.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/cinematic_india_hero.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-text/75 via-cocoa-text/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Category Pill */}
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cream-canvas/90 backdrop-blur-sm text-cocoa-text shadow-xs border border-blush-surface">
            {community.categoryLabel || community.category}
          </span>

          {/* Type Pill */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm bg-cream-canvas/90 ${typeInfo.cls}`}>
            <TypeIcon className="w-3 h-3" />
            <span>{typeInfo.label}</span>
          </span>
        </div>

        {/* Bottom Info: Location / Member count */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-cream-canvas text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] drop-shadow-sm">
            <Users className="w-3.5 h-3.5 text-ochre-accent" />
            <span>{community.memberCount || 0} members</span>
          </div>

          {community.location && (
            <div className="flex items-center gap-1 text-[11px] text-cream-canvas/90 drop-shadow-sm">
              <MapPin className="w-3 h-3 text-cream-canvas/70" />
              <span className="truncate max-w-[140px]">{community.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-cocoa-text leading-tight group-hover:text-terra-primary transition-colors">
            {community.name}
          </h3>
          <p className="text-xs text-cocoa-text/75 line-clamp-2 leading-relaxed">
            {community.description}
          </p>

          {/* Linked Event Pill if applicable */}
          {community.event && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-ochre-accent/10 border border-ochre-accent/25 text-[11px] text-cocoa-text">
              <Calendar className="w-3 h-3 text-ochre-accent flex-shrink-0" />
              <span className="truncate">
                Gathering: <strong>{community.event.title}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-2 border-t border-blush-surface/50 flex items-center justify-between gap-2">
          {community.isMember ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Joined</span>
            </span>
          ) : (
            <button
              onClick={handleJoinClick}
              className="px-3.5 py-1.5 rounded-full bg-terra-primary hover:bg-primary-container text-cream-canvas text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Join Circle</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            {organizerUser && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onContactOrganiser?.(organizerUser, community);
                }}
                className="px-2.5 py-1 rounded-full bg-terra-primary/10 hover:bg-terra-primary text-terra-primary hover:text-cream-canvas text-xs font-bold border border-terra-primary/25 transition-all flex items-center gap-1 cursor-pointer"
                title={`Contact Organiser (${organizerUser.name})`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Contact Organiser</span>
                <span className="sm:hidden">Organiser</span>
              </button>
            )}

            <button
              onClick={() => onSelect?.(community)}
              className="flex items-center gap-1 text-xs font-bold text-cocoa-text/80 hover:text-terra-primary transition-colors py-1 px-1.5"
            >
              <span>{community.isMember ? 'Open Discussion' : 'Explore'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

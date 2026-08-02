import React from 'react';
import { MapPin, ChevronLeft, Check, Sparkles, User as UserIcon } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';
import { PRESET_AVATARS, getInitials, getUsernameColor } from '../../utils/avatarUtils';

export default function ProfileView({
  username,
  profile,
  setProfile,
  onSaveProfile,
  isSaving,
  saveStatus,
  onBackToChats
}) {
  const colorPresets = [
    "#6366f1", "#a855f7", "#ec4899", "#ef4444",
    "#f59e0b", "#10b981", "#3b82f6", "#06b6d4"
  ];

  return (
    <main className="flex-1 h-full glass-panel flex flex-col overflow-y-auto chat-scroll p-4 sm:p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChats}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold shadow-sm transition-all active:scale-95 group"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transform group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Chat</span>
          </button>
          <h2 className="font-bold text-lg text-zinc-100">User Profile</h2>
        </div>
        <StatusBadge isOnline={true} label="Online" />
      </div>

      {/* Main Content */}
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header Preview Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Sparkles className="w-24 h-24 text-indigo-400" />
          </div>
          <Avatar
            name={username}
            customColor={profile.avatarColor}
            avatarUrl={profile.avatarUrl}
            size="xl"
            isOnline={true}
            showBadge={true}
          />
          <div>
            <h3 className="font-bold text-xl text-zinc-100">{username}</h3>
            <p className="text-xs text-indigo-400 font-medium mb-1">{profile.status}</p>
            <p className="text-xs text-zinc-400">{profile.bio}</p>
            {profile.location && (
              <p className="text-[11px] text-zinc-500 mt-2 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span>{profile.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={onSaveProfile} className="space-y-5">
          {/* Custom Avatar Picker */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Choose Custom Avatar
              </label>
              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, avatarUrl: "" })}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Use Initials Instead
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-3 glass-card rounded-2xl border border-white/10 max-h-56 overflow-y-auto chat-scroll">
              {/* Default Initials Option */}
              <button
                type="button"
                onClick={() => setProfile({ ...profile, avatarUrl: "" })}
                className={`relative group rounded-full aspect-square flex flex-col items-center justify-center border-2 transition-all duration-200 ${
                  !profile.avatarUrl
                    ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-105"
                    : "border-white/10 hover:border-white/30 hover:scale-105"
                }`}
                style={{ backgroundColor: getUsernameColor(username, profile.avatarColor) }}
                title="Default (Initials)"
              >
                <span className="font-bold text-xs text-white">
                  {getInitials(username)}
                </span>
                {!profile.avatarUrl && (
                  <div className="absolute inset-0 bg-indigo-600/40 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                )}
              </button>

              {/* Preset Avatar Options */}
              {PRESET_AVATARS.map((avatar, idx) => {
                const isSelected = profile.avatarUrl === avatar;
                return (
                  <button
                    type="button"
                    key={avatar}
                    onClick={() => setProfile({ ...profile, avatarUrl: avatar })}
                    className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all duration-200 group ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-105 shadow-lg shadow-indigo-500/30"
                        : "border-transparent hover:border-white/40 hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/40 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Status Tag
            </label>
            <input
              type="text"
              value={profile.status}
              onChange={(e) => setProfile({ ...profile, status: e.target.value })}
              placeholder="e.g. Available, Coding, In a meeting..."
              className="w-full glass-input px-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell others a bit about yourself..."
              className="w-full glass-input px-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="e.g. San Francisco, CA"
              className="w-full glass-input px-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Avatar Accent Color (For Initials)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPresets.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setProfile({ ...profile, avatarColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform duration-150 ${
                    profile.avatarColor === color ? "scale-110 border-white shadow-lg" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {saveStatus && (
              <span className={`text-xs font-medium ${saveStatus.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {saveStatus}
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

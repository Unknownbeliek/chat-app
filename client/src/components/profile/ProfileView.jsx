import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronLeft, Check, Sparkles, Camera, Edit3, Save, X, User as UserIcon } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState({ ...profile });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Sync draft profile whenever profile prop changes from server/parent
  useEffect(() => {
    setDraftProfile({ ...profile });
    if (profile.avatarUrl) {
      setAvatarPreview(profile.avatarUrl);
    }
  }, [profile]);

  const colorPresets = [
    "#6366f1", "#a855f7", "#ec4899", "#ef4444",
    "#f59e0b", "#10b981", "#3b82f6", "#06b6d4"
  ];

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately preview client-side
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Convert to base64 for persistent saving
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setDraftProfile((prev) => ({ ...prev, avatarUrl: base64Data }));
      setIsEditing(true); // Automatically enter edit mode when avatar is updated
    };
    reader.readAsDataURL(file);
  };

  const handleStartEdit = () => {
    setDraftProfile({ ...profile });
    setAvatarPreview(profile.avatarUrl || null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftProfile({ ...profile });
    setAvatarPreview(profile.avatarUrl || null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const success = await onSaveProfile(draftProfile);
    if (success !== false) {
      setIsEditing(false);
    }
  };

  const activeAvatarUrl = avatarPreview || draftProfile.avatarUrl || profile.avatarUrl;

  return (
    <main className="flex-1 h-full glass-panel flex flex-col overflow-y-auto chat-scroll p-4 sm:p-6 select-none">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChats}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold shadow-sm transition-all active:scale-95 group cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transform group-hover:-translate-x-0.5 transition-transform pointer-events-none" />
            <span className="pointer-events-none">Back to Chat</span>
          </button>
          <h2 className="font-bold text-lg text-zinc-100">User Profile</h2>
        </div>
        <StatusBadge isOnline={true} label="Online" />
      </div>

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Redesigned Profile Card: Avatar on Left side, Info & Actions on Right side */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative overflow-hidden border border-white/10 shadow-xl">
          <div className="absolute -top-6 -right-6 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-indigo-400" />
          </div>

          {/* LEFT SIDE: Avatar with interactive click-to-change overlay */}
          <div className="relative group flex-shrink-0 cursor-pointer" onClick={handleAvatarClick}>
            <Avatar
              name={username}
              customColor={draftProfile.avatarColor}
              avatarUrl={activeAvatarUrl}
              size="xl"
              isOnline={true}
              showBadge={true}
            />
            {/* Click to Change Avatar Overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-[2px] pointer-events-none">
              <Camera className="w-6 h-6 text-white drop-shadow" />
              <span className="text-[10px] font-bold text-zinc-200 mt-1 uppercase tracking-wider">Change</span>
            </div>
          </div>

          {/* RIGHT SIDE: Name, Location, Status, Bio & Edit Mode Trigger */}
          <div className="flex-1 min-w-0 space-y-2.5 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {/* Large Bold Name */}
                <h3 className="font-bold text-2xl sm:text-3xl text-zinc-100 tracking-tight">{username}</h3>
                {/* Location directly below name in smaller muted style */}
                <p className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>{draftProfile.location || (isEditing ? "Add location below..." : "No location specified")}</span>
                </p>
              </div>

              {/* Edit Profile Button / Edit Mode Indicator */}
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer self-center sm:self-start"
                >
                  <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                  <span className="pointer-events-none">Edit Profile</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 self-center sm:self-start">
                  Editing Profile...
                </span>
              )}
            </div>

            {/* Status & Bio Badges */}
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-indigo-300 font-medium">{draftProfile.status || "Available"}</span>
              </div>
              {draftProfile.bio && (
                <p className="text-xs text-zinc-300 leading-relaxed italic max-w-md">
                  "{draftProfile.bio}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Read-Only State Info Banner or Editable Form */}
        {!isEditing ? (
          <div className="glass-card p-6 rounded-2xl border border-white/10 text-center space-y-3">
            <p className="text-xs text-zinc-400">
              Click <strong className="text-zinc-200">"Edit Profile"</strong> or tap your avatar image above to make changes to your profile info, custom avatar, status tag, or location.
            </p>
            {saveStatus && (
              <p className={`text-xs font-medium ${saveStatus.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {saveStatus}
              </p>
            )}
          </div>
        ) : (
          /* Editable Form */
          <form onSubmit={handleSubmit} className="space-y-5 glass-card p-6 sm:p-7 rounded-3xl border border-indigo-500/30 shadow-2xl animate-fade-in">
            <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              Edit Profile Details
            </h4>

            {/* Custom Avatar Picker & Presets */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Avatar Options
                </label>
                {draftProfile.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftProfile({ ...draftProfile, avatarUrl: "" });
                      setAvatarPreview(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  >
                    Use Initials Instead
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 p-3 glass-card rounded-2xl border border-white/10 max-h-56 overflow-y-auto chat-scroll">
                {/* Default Initials Option */}
                <button
                  type="button"
                  onClick={() => {
                    setDraftProfile({ ...draftProfile, avatarUrl: "" });
                    setAvatarPreview(null);
                  }}
                  className={`relative group rounded-full aspect-square flex flex-col items-center justify-center border-2 transition-all duration-200 cursor-pointer ${
                    !draftProfile.avatarUrl
                      ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-105"
                      : "border-white/10 hover:border-white/30 hover:scale-105"
                  }`}
                  style={{ backgroundColor: getUsernameColor(username, draftProfile.avatarColor) }}
                  title="Default (Initials)"
                >
                  <span className="font-bold text-xs text-white pointer-events-none">
                    {getInitials(username)}
                  </span>
                  {!draftProfile.avatarUrl && (
                    <div className="absolute inset-0 bg-indigo-600/40 rounded-full flex items-center justify-center pointer-events-none">
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>

                {/* Preset Avatar Options */}
                {PRESET_AVATARS.map((avatar, idx) => {
                  const isSelected = draftProfile.avatarUrl === avatar;
                  return (
                    <button
                      type="button"
                      key={avatar}
                      onClick={() => {
                        setDraftProfile({ ...draftProfile, avatarUrl: avatar });
                        setAvatarPreview(avatar);
                      }}
                      className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all duration-200 group cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 ring-2 ring-indigo-500/40 scale-105 shadow-lg shadow-indigo-500/30"
                          : "border-transparent hover:border-white/40 hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${idx + 1}`}
                        className="w-full h-full object-cover rounded-full pointer-events-none"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/40 rounded-full flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Status Tag */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Status Tag
              </label>
              <input
                type="text"
                value={draftProfile.status}
                onChange={(e) => setDraftProfile({ ...draftProfile, status: e.target.value })}
                placeholder="e.g. Available, Coding, In a meeting..."
                className="w-full glass-input px-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Editable Bio */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <textarea
                rows={3}
                value={draftProfile.bio}
                onChange={(e) => setDraftProfile({ ...draftProfile, bio: e.target.value })}
                placeholder="Tell others a bit about yourself..."
                className="w-full glass-input px-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Editable Location */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={draftProfile.location}
                onChange={(e) => setDraftProfile({ ...draftProfile, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                className="w-full glass-input px-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Avatar Accent Color (For Initials) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Avatar Accent Color (For Initials)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setDraftProfile({ ...draftProfile, avatarColor: color })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform duration-150 cursor-pointer ${
                      draftProfile.avatarColor === color ? "scale-110 border-white shadow-lg" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Form Action Controls: Save Profile & Subtle Cancel */}
            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-xs font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {saveStatus && (
                  <span className={`text-xs font-medium ${saveStatus.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
                    {saveStatus}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4 pointer-events-none" />
                  <span>{isSaving ? "Saving Profile..." : "Save Profile"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

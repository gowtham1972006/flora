import React, { useState } from 'react';
import { UserProfile, ScreenType } from '../types';
import { updateProfile } from '../lib/profile';
import type { Translations } from '../lib/i18n';
import {
  User,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  Heart,
  Sprout,
  Check,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ProfileScreenProps {
  profile: UserProfile;
  favoritesCount: number;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenCareSchedule: () => void;
  onLogout: () => void;
  setScreen: (screen: ScreenType) => void;
  userId?: string | null;
  onProfileUpdated?: () => void;
  T: Translations;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  favoritesCount,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenCareSchedule,
  onLogout,
  setScreen,
  userId,
  onProfileUpdated,
  T,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(profile.name);
  const [userRole, setUserRole] = useState(profile.role);
  const [showHelpToast, setShowHelpToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!userId) {
      // Not authenticated — save locally only
      setIsEditing(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile(userId, { name: userName, role: userRole });
      onProfileUpdated?.();
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-28 md:pb-12 animate-fade-in text-[#191c1b]">
      {/* Profile Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#e1e3e0] flex flex-col sm:flex-row items-center sm:items-center gap-6 relative overflow-hidden">
        {/* Ambient Botanical Decorative Blur */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#cdecae]/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#f2f4f1] shadow-md bg-[#eceeeb]">
            <img
              src={profile.avatar}
              alt={userName}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={saving}
            className="absolute bottom-1 right-1 bg-[#4c6635] text-white rounded-full p-2.5 shadow-md hover:bg-[#354e1f] active:scale-95 transition-all cursor-pointer border-2 border-white disabled:opacity-60"
            aria-label={isEditing ? 'Save profile' : 'Edit profile'}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <Check className="w-4 h-4" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
          {isEditing ? (
            <div className="space-y-3 w-full">
              {saveError && (
                <p className="text-xs text-[#93000a] bg-[#ffdad6] px-3 py-2 rounded-lg">{saveError}</p>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[#74796d] uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full font-bold text-lg text-[#191c1b] border border-[#c4c8ba] rounded-xl px-3 py-2 bg-[#f8faf7] focus:outline-none focus:ring-2 focus:ring-[#4c6635]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#74796d] uppercase tracking-wider mb-1">
                  Gardening Title
                </label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full text-xs text-[#44483e] border border-[#c4c8ba] rounded-xl px-3 py-2 bg-[#f8faf7] focus:outline-none focus:ring-2 focus:ring-[#4c6635]"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#cdecae]/50 text-[#354e1f] text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Certified Plant Enthusiast</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1b] tracking-tight">
                {userName}
              </h2>
              <p className="text-sm text-[#44483e] font-medium">{userRole}</p>
            </>
          )}
        </div>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div
          onClick={onOpenCareSchedule}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#e1e3e0] flex flex-col items-center justify-center hover:bg-[#f2f4f1] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-[#cdecae]/50 flex items-center justify-center text-[#4c6635] mb-2 group-hover:scale-110 transition-transform">
            <Sprout className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-[#191c1b]">{profile.plantsCount}</span>
          <span className="text-[11px] sm:text-xs text-[#74796d] font-semibold uppercase tracking-wider mt-0.5 text-center">
            Plants in Care
          </span>
        </div>

        <div
          onClick={() => setScreen('category_flowers')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#e1e3e0] flex flex-col items-center justify-center hover:bg-[#f2f4f1] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a] mb-2 group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-bold text-[#191c1b]">{favoritesCount}</span>
          <span className="text-[11px] sm:text-xs text-[#74796d] font-semibold uppercase tracking-wider mt-0.5 text-center">
            Favorites
          </span>
        </div>

        <div
          onClick={onOpenCareSchedule}
          className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-5 shadow-sm border border-[#e1e3e0] flex flex-col items-center justify-center hover:bg-[#f2f4f1] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-[#8ba870]/20 flex items-center justify-center text-[#4c6635] mb-2 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-[#191c1b]">100%</span>
          <span className="text-[11px] sm:text-xs text-[#74796d] font-semibold uppercase tracking-wider mt-0.5 text-center">
            Care Health Rate
          </span>
        </div>
      </section>

      {/* Menu List Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-[#e1e3e0] overflow-hidden divide-y divide-[#e1e3e0]/60">
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="w-full flex items-center px-5 py-4 hover:bg-[#f8faf7] transition-colors group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#f2f4f1] text-[#44483e] group-hover:text-[#4c6635] group-hover:bg-[#cdecae] transition-colors flex items-center justify-center mr-4 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm text-[#191c1b] block">Edit Profile Info</span>
            <span className="text-xs text-[#74796d] block truncate">Update your name, bio, and avatar</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#74796d] shrink-0 ml-2" />
        </button>

        <button
          onClick={() => setScreen('settings')}
          className="w-full flex items-center px-5 py-4 hover:bg-[#f8faf7] transition-colors group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#f2f4f1] text-[#44483e] group-hover:text-[#4c6635] group-hover:bg-[#cdecae] transition-colors flex items-center justify-center mr-4 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm text-[#191c1b] block">{T.profile_settings}</span>
            <span className="text-xs text-[#74796d] block truncate">{T.profile_settingsSub}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#74796d] shrink-0 ml-2" />
        </button>

        <button
          onClick={onOpenNotifications}
          className="w-full flex items-center px-5 py-4 hover:bg-[#f8faf7] transition-colors group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#f2f4f1] text-[#44483e] group-hover:text-[#4c6635] group-hover:bg-[#cdecae] transition-colors flex items-center justify-center mr-4 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm text-[#191c1b] block">Plant Health Alerts</span>
            <span className="text-xs text-[#74796d] block truncate">Review disease alerts and care tasks</span>
          </div>
          {unreadNotifsCount > 0 && (
            <span className="bg-[#ba1a1a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full mr-2 shrink-0">
              {unreadNotifsCount} new
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-[#74796d] shrink-0" />
        </button>

        <button
          onClick={() => setShowHelpToast(true)}
          className="w-full flex items-center px-5 py-4 hover:bg-[#f8faf7] transition-colors group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#f2f4f1] text-[#44483e] group-hover:text-[#4c6635] group-hover:bg-[#cdecae] transition-colors flex items-center justify-center mr-4 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm text-[#191c1b] block">Doctor Plant Help Center</span>
            <span className="text-xs text-[#74796d] block truncate">Plant disease guides and botanical advice</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#74796d] shrink-0 ml-2" />
        </button>
      </section>

      {/* Help Toast Dialog */}
      {showHelpToast && (
        <div className="bg-[#cdecae]/30 border border-[#8ba870]/40 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-[#354e1f]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#4c6635] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#191c1b]">Doctor Plant Guidance</p>
              <p className="text-xs text-[#44483e] mt-0.5">
                Flora automatically synchronizes with botanical treatment libraries. For urgent pest issues, use the AI Plant Scanner.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHelpToast(false)}
            className="text-[#4c6635] font-bold hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Log Out Button */}
      <section className="pt-2">
        <button
          onClick={onLogout}
          className="w-full bg-[#ffdad6] hover:bg-[#ba1a1a] hover:text-white text-[#93000a] font-semibold text-sm sm:text-base py-3.5 sm:py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all duration-150 shadow-sm cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>{T.profile_logout}</span>
        </button>
      </section>
    </div>
  );
};

import React from 'react';
import { ScreenType } from '../types';
import type { UserProfile } from '../types';
import {
  ArrowLeft,
  Bell,
  Home,
  Scan,
  User,
  Sprout,
  Droplets,
  HelpCircle,
} from 'lucide-react';

interface NavigationProps {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenCareSchedule: () => void;
  profile?: UserProfile | null;
}

export const TopAppBar: React.FC<{
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotif?: boolean;
  unreadCount?: number;
  onOpenNotifications?: () => void;   // fixed: was onOpenNotif
}> = ({
  title = 'FloraVeda',
  showBack = false,
  onBack,
  showNotif = true,
  unreadCount = 0,
  onOpenNotifications,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#f8faf7]/95 backdrop-blur-md border-b border-[#e1e3e0]/60 h-16 flex items-center justify-between px-4 sm:px-6 transition-all duration-200">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e7e9e6] hover:bg-[#e1e3e0] text-[#191c1b] active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#4c6635]" />
          </button>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8ba870]/20 text-[#4c6635]">
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.5 9.5 0 0 0 17 8M3.27 3L2 4.27l4.08 4.08C4.5 10.9 3.5 13.8 3.5 17c0 1.25.21 2.45.58 3.57L6 20.35A9.45 9.45 0 0 1 5.5 17c0-2.6 1-5 2.72-6.72L12 14v1.5a5.5 5.5 0 0 0 5.5 5.5h1.5v-1.5a5.5 5.5 0 0 0-5.5-5.5H12V12l3.28-3.28C14.1 8.28 13.07 8 12 8c-.68 0-1.34.12-1.95.34L3.27 3z" />
            </svg>
          </div>
        )}
      </div>

      <h1 className="font-bold text-lg sm:text-xl md:text-2xl text-[#4c6635] tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md text-center">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {showNotif ? (
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-[#4c6635] hover:bg-[#e7e9e6] active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
    </header>
  );
};

export const BottomNavBar: React.FC<{
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  unreadCount?: number;
}> = ({ currentScreen, setScreen }) => {
  const isHome = currentScreen === 'home' || currentScreen.startsWith('category_');
  const isScan = currentScreen === 'scan';
  const isProfile = currentScreen === 'profile';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f2f4f1]/95 backdrop-blur-md border-t border-[#e1e3e0]/60 shadow-[0_-4px_20px_rgba(76,102,53,0.06)] rounded-t-2xl py-2 px-6 flex justify-around items-center">
      {/* Home Tab */}
      <button
        onClick={() => setScreen('home')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
          isHome
            ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
            : 'text-[#44483e] hover:text-[#4c6635]'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-xs">Home</span>
      </button>

      {/* Scan Tab */}
      <button
        onClick={() => setScreen('scan')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
          isScan
            ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
            : 'text-[#44483e] hover:text-[#4c6635]'
        }`}
      >
        <Scan className="w-5 h-5 mb-0.5" />
        <span className="text-xs">Scan</span>
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => setScreen('profile')}
        className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
          isProfile
            ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
            : 'text-[#44483e] hover:text-[#4c6635]'
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-xs">Profile</span>
      </button>
    </nav>
  );
};

export const DesktopSidebar: React.FC<NavigationProps> = ({
  currentScreen,
  setScreen,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenCareSchedule,
  profile,
}) => {
  const displayName = profile?.name ?? 'Plant Lover';
  const displayRole = profile?.role ?? 'Plant Enthusiast';
  const displayAvatar = profile?.avatar ?? `https://api.dicebear.com/7.x/thumbs/svg?seed=default`;
  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen w-72 bg-[#ffffff] border-r border-[#e1e3e0] p-6 z-30 shadow-sm shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setScreen('home')}>
        <div className="w-10 h-10 rounded-2xl bg-[#4c6635] text-white flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.5 9.5 0 0 0 17 8M3.27 3L2 4.27l4.08 4.08C4.5 10.9 3.5 13.8 3.5 17c0 1.25.21 2.45.58 3.57L6 20.35A9.45 9.45 0 0 1 5.5 17c0-2.6 1-5 2.72-6.72L12 14v1.5a5.5 5.5 0 0 0 5.5 5.5h1.5v-1.5a5.5 5.5 0 0 0-5.5-5.5H12V12l3.28-3.28C14.1 8.28 13.07 8 12 8c-.68 0-1.34.12-1.95.34L3.27 3z" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-xl text-[#4c6635]">FloraVeda</h2>
          <p className="text-xs text-[#50634e]">Botanical Health System</p>
        </div>
      </div>

      {/* User Card */}
      <div
        onClick={() => setScreen('profile')}
        className="flex items-center gap-3 p-3 mb-6 bg-[#f2f4f1] hover:bg-[#e7e9e6] rounded-2xl cursor-pointer transition-colors"
      >
        <img
          src={displayAvatar}
          alt={displayName}
          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#191c1b] truncate">{displayName}</p>
          <p className="text-xs text-[#4c6635] font-medium">{displayRole}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5 space-y-1 overflow-y-auto">
        <button
          onClick={() => setScreen('home')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentScreen === 'home'
              ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
              : 'text-[#44483e] hover:bg-[#f2f4f1] hover:text-[#191c1b]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setScreen('scan')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentScreen === 'scan'
              ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
              : 'text-[#44483e] hover:bg-[#f2f4f1] hover:text-[#191c1b]'
          }`}
        >
          <Scan className="w-5 h-5" />
          <span>Plant Scanner</span>
        </button>

        <button
          onClick={() => setScreen('category_flowers')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentScreen.startsWith('category_') || currentScreen === 'plant_detail'
              ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
              : 'text-[#44483e] hover:bg-[#f2f4f1] hover:text-[#191c1b]'
          }`}
        >
          <Sprout className="w-5 h-5" />
          <span>Plant Catalog</span>
        </button>

        <button
          onClick={onOpenCareSchedule}
          className="flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium text-[#44483e] hover:bg-[#f2f4f1] hover:text-[#191c1b] transition-all cursor-pointer"
        >
          <Droplets className="w-5 h-5" />
          <span>Watering Schedule</span>
        </button>

        <button
          onClick={onOpenNotifications}
          className="flex items-center justify-between w-full p-3 rounded-xl text-sm font-medium text-[#44483e] hover:bg-[#f2f4f1] hover:text-[#191c1b] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </div>
          {unreadNotifsCount > 0 && (
            <span className="bg-[#ba1a1a] text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setScreen('profile')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentScreen === 'profile'
              ? 'bg-[#8ba870] text-[#0d2000] font-semibold shadow-sm'
              : 'text-[#44483e] hover:bg-[#f2f4f1] hover:text-[#191c1b]'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile & Stats</span>
        </button>
      </nav>

      {/* Footer Support */}
      <div className="pt-4 border-t border-[#e1e3e0]">
        <div className="bg-[#cdecae]/30 rounded-xl p-3.5 border border-[#8ba870]/30 text-xs text-[#354e1f] space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Doctor Plant AI
          </p>
          <p className="text-[11px] opacity-80">
            Instant leaf diagnostics and care tracking powered by botanical science.
          </p>
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import { IconDashboard, IconChefPan, IconBell, IconFoodReady, IconLock } from './Icons';
import { sounds } from '../utils/audio';

export const FloatingStaffDock = ({
  activeSection = 'main',
  onNavigate,
  activeCallsCount = 0,
  activeOrdersCount = 0,
  onOpenNotifications,
  isNotificationOpen = false,
  onLogout,
}) => {
  const totalNotifications = activeCallsCount + activeOrdersCount;

  return (
    <nav
      aria-label="Staff Floating Operations Bar"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto"
    >
      <div className="bg-[#140e0a]/94 backdrop-blur-2xl border-2 border-amber-400/40 rounded-full p-2 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset] flex items-center gap-1.5 sm:gap-3">
        {/* ========================================================= */}
        {/* 1. ROUTE BUTTON 1: MAIN DASHBOARD                         */}
        {/* ========================================================= */}
        <button
          onClick={() => {
            sounds.playTick();
            onNavigate('main');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-full font-ui font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeSection === 'main'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-[#140e0a] shadow-[0_4px_15px_rgba(245,158,11,0.5)] scale-105'
              : 'text-amber-100/90 hover:text-white hover:bg-white/10 active:scale-95'
          }`}
        >
          <IconDashboard className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === 'main' ? 'text-black' : 'text-amber-300'}`} />
          <span>Dashboard</span>
        </button>

        {/* ========================================================= */}
        {/* 2. ROUTE BUTTON 2: FOOD CONTROL (KITCHEN DISPATCH)        */}
        {/* ========================================================= */}
        <button
          onClick={() => {
            sounds.playTick();
            onNavigate('kitchen');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-full font-ui font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeSection === 'kitchen'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-[#140e0a] shadow-[0_4px_15px_rgba(245,158,11,0.5)] scale-105'
              : 'text-amber-100/90 hover:text-white hover:bg-white/10 active:scale-95'
          }`}
        >
          <IconChefPan className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === 'kitchen' ? 'text-black' : 'text-amber-300'}`} />
          <span>Food Control</span>
          {activeOrdersCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-numbers font-black ${
              activeSection === 'kitchen' ? 'bg-[#140e0a] text-amber-300' : 'bg-amber-400 text-black'
            }`}>
              {activeOrdersCount}
            </span>
          )}
        </button>

        {/* ========================================================= */}
        {/* 2B. ROUTE BUTTON 3: COUPONS & PROMO MANAGER               */}
        {/* ========================================================= */}
        <button
          onClick={() => {
            sounds.playTick();
            onNavigate('coupons');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full font-ui font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeSection === 'coupons'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-[#140e0a] shadow-[0_4px_15px_rgba(245,158,11,0.5)] scale-105'
              : 'text-amber-100/90 hover:text-white hover:bg-white/10 active:scale-95'
          }`}
        >
          <span className="text-base sm:text-lg">🎟️</span>
          <span>Coupons</span>
        </button>

        {/* Subtle Vertical Divider */}
        <div className="h-6 w-px bg-amber-400/25 mx-0.5"></div>

        {/* ========================================================= */}
        {/* 3. NOTIFICATION HUB TRIGGER BUTTON                        */}
        {/* ========================================================= */}
        <button
          onClick={() => {
            sounds.playTick();
            if (onOpenNotifications) onOpenNotifications();
          }}
          title="Open Live Notifications Hub"
          className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full font-ui font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
            isNotificationOpen
              ? 'bg-amber-400 text-black shadow-md'
              : activeCallsCount > 0
              ? 'bg-rose-900/90 hover:bg-rose-800 text-white border border-rose-400/60 shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse'
              : 'text-amber-100/90 hover:text-white hover:bg-white/10'
          }`}
        >
          <IconBell
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              isNotificationOpen
                ? 'text-black'
                : activeCallsCount > 0
                ? 'text-yellow-300'
                : 'text-amber-300'
            }`}
            animate={activeCallsCount > 0}
          />
          <span className="hidden sm:inline">Notifications</span>
          {totalNotifications > 0 && (
            <span className={`text-[10px] font-numbers font-black px-1.5 py-0.2 rounded-full ${
              activeCallsCount > 0 ? 'bg-yellow-300 text-black' : 'bg-amber-400 text-black'
            }`}>
              {totalNotifications}
            </span>
          )}
        </button>

        {/* ========================================================= */}
        {/* 4. LOGOUT / LOCK BUTTON (RIGHT BESIDE THEM)               */}
        {/* ========================================================= */}
        <button
          onClick={() => {
            sounds.playTick();
            if (onLogout) onLogout();
          }}
          title="Lock Terminal & Return to PIN Screen"
          className="flex items-center gap-1.5 bg-rose-950/70 hover:bg-rose-900 active:scale-95 text-rose-200 hover:text-white border border-rose-500/40 px-3.5 sm:px-4 py-2.5 rounded-full font-ui font-extrabold text-xs uppercase tracking-wide transition-all cursor-pointer shadow-xs"
        >
          <IconLock className="w-4 h-4 text-rose-300" />
          <span className="hidden sm:inline">Lock / Exit</span>
        </button>
      </div>
    </nav>
  );
};

export default FloatingStaffDock;

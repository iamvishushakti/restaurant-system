import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../context/StaffAuthContext';
import { resetStaffPinApi } from '../api/staffApi';
import {
  IconLock,
  IconKeypad,
  IconMail,
  IconBell,
  IconFoodReady,
  IconChefPan,
  IconDashboard,
  IconCheck,
} from './Icons';
import logoImg from '../assets/logo.png';
import { sounds } from '../utils/audio';

export const StaffLogin = ({
  orders = [],
  waiterCalls = [],
  pendingCalls = [],
  readyOrders = [],
}) => {
  const { loginStaff, loading } = useStaffAuth();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetNotice, setResetNotice] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter useful lock screen notification items
  const activeOrders = orders.filter((o) => o.status !== 'Completed');
  const cookingOrders = orders.filter((o) => o.status === 'In Preparation' || o.status === 'Pending');
  const activeTablesCount = new Set(
    orders.filter((o) => o.paymentStatus !== 'PAID').map((o) => o.tableNo)
  ).size;

  // Keypad click handler
  const handleKeypadPress = (val) => {
    setErrorMessage('');
    if (val === 'clear') {
      sounds.playTick();
      setPin('');
    } else if (val === 'backspace') {
      sounds.playTick();
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 6) {
      sounds.playTick();
      const newPin = pin + String(val);
      setPin(newPin);
      if (newPin.length === 4) {
        executeLogin(newPin);
      }
    }
  };

  const executeLogin = async (pinToSubmit) => {
    const code = pinToSubmit || pin;
    if (!code || code.length < 4) {
      setErrorMessage('Please enter your 4-digit staff PIN.');
      return;
    }

    setErrorMessage('');
    const res = await loginStaff({ passcode: code });
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid PIN code. Access denied.');
      setPin('');
    }
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    executeLogin(pin);
  };

  // Reset PIN Handler
  const handleResetPin = async () => {
    setErrorMessage('');
    setResetNotice(null);
    try {
      setIsResetting(true);
      const res = await resetStaffPinApi();
      if (res?.success) {
        sounds.playTick();
        setResetNotice({
          message: '✓ New 4-digit PIN generated and dispatched!',
          targetEmail: res.targetEmail || 'vkshakti.office@gmail.com',
          maskedEmail: res.maskedEmail || 'vkshakti.office@gmail.com',
        });
        if (res.demoPin) {
          setPin(res.demoPin);
        }
      } else {
        setErrorMessage(res?.message || 'Failed to dispatch new PIN to email.');
      }
    } catch (err) {
      setErrorMessage('Could not connect to email service. Default PIN is 1234.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="h-screen max-h-screen overflow-hidden bg-cover bg-center bg-fixed flex flex-col justify-center items-center px-3 sm:px-6 py-2 selection:bg-[#1a1612] selection:text-[#f7f3eb] relative"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 35%, rgba(255, 252, 245, 0.94) 0%, rgba(245, 237, 222, 0.85) 50%, rgba(35, 25, 18, 0.70) 100%), url('/newspaper-bg.jpg')",
      }}
    >
      {/* 1. FLOATING TOP STATUS TICKER (Luxury Glass Pill) */}
      <div className="w-full max-w-5xl flex items-center justify-between text-xs font-ui bg-white/85 backdrop-blur-xl border border-amber-900/15 shadow-sm rounded-2xl px-4 py-2 mb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <span className="font-bold text-[#1a1612] uppercase tracking-wider text-[11px] font-numbers">
            ● LIVE RESTAURANT BROADCAST STATION
          </span>
          <span className="hidden md:inline text-zinc-500 text-[11px] font-ui">
            • Real-Time Floor Operations & Service Radar
          </span>
        </div>

        <div className="flex items-center gap-3 text-zinc-700 text-xs font-medium">
          <span className="font-numbers font-semibold">
            🕒 {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => sounds.playWaiterBell()}
            title="Sound Test"
            className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold px-2.5 py-0.5 rounded-lg border border-amber-300 text-[10.5px] cursor-pointer transition shadow-xs active:scale-95"
          >
            🔔 Test Bell
          </button>
        </div>
      </div>

      {/* 2. MASTER DUAL-WING STATION CARD (Ultra-Luxury Elevated Glass) */}
      <div className="w-full max-w-5xl bg-white/94 backdrop-blur-2xl border-2 border-[#1a1612]/80 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(20,15,10,0.35),0_0_0_1px_rgba(217,119,6,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center flex-shrink min-h-0 relative overflow-hidden">
        {/* Subtle Top Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600"></div>

        {/* ======================================================== */}
        {/* LEFT WING (Col 1-5): PIN ENTRY & TERMINAL UNLOCK         */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-amber-900/15 pb-4 lg:pb-0 lg:pr-6 space-y-3">
          {/* Header & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-[#2a221b] to-[#140e0a] p-1 flex items-center justify-center flex-shrink-0 shadow-md">
              <img
                src={logoImg}
                alt="Restaurant Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#1a1612] text-amber-300 font-ui text-[9px] font-extrabold tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                <IconLock className="w-2.5 h-2.5 text-amber-400" />
                <span>EXECUTIVE DUTY LOCK</span>
              </div>
              <h2 className="font-cinzel text-lg sm:text-xl font-black uppercase text-[#1a1612] tracking-wide mt-0.5 leading-tight">
                The Daily Chronicle
              </h2>
              <p className="font-ui text-[11px] text-zinc-500 font-medium">
                Enter 4-Digit PIN to Access Station
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl font-ui text-xs text-rose-900 font-semibold flex items-start gap-2 shadow-xs">
              <span className="text-sm">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Reset PIN Notice */}
          {resetNotice && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-ui text-xs text-amber-950 space-y-1 shadow-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <IconMail className="w-3.5 h-3.5 text-amber-800" />
                <span>{resetNotice.message}</span>
              </div>
              <div className="text-[11px] text-zinc-600">
                Dispatched to:{' '}
                <strong className="text-black bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                  {resetNotice.targetEmail}
                </strong>
              </div>
            </div>
          )}

          {/* 4-Digit PIN Display Capsules */}
          <form onSubmit={handleFormSubmit} className="space-y-2.5">
            <div>
              <div className="flex justify-center items-center gap-2.5 mb-2">
                {[0, 1, 2, 3].map((idx) => {
                  const hasChar = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 sm:w-12 sm:h-13 rounded-2xl flex items-center justify-center font-numbers text-2xl font-black transition-all duration-150 ${
                        hasChar
                          ? 'bg-gradient-to-b from-[#2b2118] to-[#120c08] text-amber-300 border-2 border-amber-400 shadow-md ring-4 ring-amber-400/20 scale-105'
                          : 'bg-[#f8f5ee] border-2 border-[#ded5c4] text-transparent shadow-inner'
                      }`}
                    >
                      {hasChar ? (
                        <span className="inline-block w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-sm animate-pulse"></span>
                      ) : (
                        <span className="text-zinc-300 text-sm">●</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Physical keyboard hidden input */}
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  if (val.length === 4) executeLogin(val);
                }}
                autoFocus
                className="opacity-0 absolute -z-10"
              />
            </div>

            {/* LUXURY TACTILE NUMERIC KEYPAD */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 font-numbers font-bold text-lg">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-1.5 sm:py-2 bg-gradient-to-b from-white to-[#f7f2e7] hover:from-white hover:to-[#eee3ce] active:bg-[#1a1612] active:text-amber-300 border border-[#dfd5c2] hover:border-amber-500/60 rounded-xl text-[#1a1612] cursor-pointer transition shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-md text-base sm:text-lg active:scale-95 flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-1.5 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-[10px] font-ui font-extrabold uppercase cursor-pointer transition shadow-xs active:scale-95"
              >
                CLEAR
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress(0)}
                className="py-1.5 sm:py-2 bg-gradient-to-b from-white to-[#f7f2e7] hover:from-white hover:to-[#eee3ce] active:bg-[#1a1612] active:text-amber-300 border border-[#dfd5c2] hover:border-amber-500/60 rounded-xl text-[#1a1612] cursor-pointer transition shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-md text-base sm:text-lg active:scale-95 flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-1.5 sm:py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-base cursor-pointer transition shadow-xs active:scale-95 flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* MAGNETIC GOLD UNLOCK BUTTON */}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-amber-400 hover:to-yellow-400 text-[#1a1208] font-ui font-black py-2.5 sm:py-3 px-4 text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_8px_20px_rgba(217,119,6,0.35)] hover:shadow-[0_12px_28px_rgba(217,119,6,0.45)] border border-yellow-200/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying PIN...</span>
                </span>
              ) : (
                <>
                  <span className="text-base">🔓</span>
                  <span>UNLOCK RESTAURANT STATION</span>
                  <span className="text-base font-bold">➔</span>
                </>
              )}
            </button>
          </form>

          {/* Reset PIN footer */}
          <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between font-ui text-[11px]">
            <button
              type="button"
              onClick={handleResetPin}
              disabled={isResetting}
              className="text-amber-950 font-bold underline hover:text-amber-700 cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <IconMail className="w-3 h-3 text-amber-800" />
              <span>{isResetting ? 'Dispatching PIN...' : 'Forgot PIN? Reset to Email'}</span>
            </button>

            <span className="text-zinc-500 bg-[#f7f2e7] px-2 py-0.5 rounded-lg border border-[#e4dac5] font-numbers">
              Default: <strong className="text-[#1a1612]">1234</strong>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT WING (Col 6-12): LIVE NOTIFICATIONS & FLOOR RADAR  */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          {/* Section Header */}
          <div className="border-b border-amber-900/15 pb-2.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#1a1612] text-amber-300 font-ui text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  ● LIVE FLOOR RADAR
                </span>
                <span className="text-[11px] font-ui text-zinc-500 font-medium">
                  Real-time table calls & kitchen hotplate
                </span>
              </div>
              <h3 className="font-cinzel text-base sm:text-lg font-black uppercase text-[#1a1612] mt-0.5">
                Lock-Screen Activity & Notifications
              </h3>
            </div>

            <span className="font-ui text-[11px] bg-amber-100 text-amber-950 font-bold px-2.5 py-1 rounded-xl border border-amber-300 shadow-xs">
              {activeOrders.length} Orders • {pendingCalls.length} Bells
            </span>
          </div>

          {/* 3 DYNAMIC KPI SNAPSHOT CARDS */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 font-ui">
            {/* 1. Occupied Tables */}
            <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border border-emerald-200/80 p-2.5 rounded-2xl text-center shadow-xs">
              <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block">
                Occupied Tables
              </span>
              <span className="font-numbers font-black text-xl sm:text-2xl text-emerald-950 mt-0.5 block">
                {activeTablesCount} <span className="text-sm font-semibold text-emerald-700">/ 12</span>
              </span>
            </div>

            {/* 2. Kitchen Cooking */}
            <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/80 border border-amber-200/80 p-2.5 rounded-2xl text-center shadow-xs">
              <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wider block">
                Cooking in Kitchen
              </span>
              <span className="font-numbers font-black text-xl sm:text-2xl text-amber-950 mt-0.5 block">
                {cookingOrders.length}
              </span>
            </div>

            {/* 3. Service Bells */}
            <div
              className={`border p-2.5 rounded-2xl text-center shadow-xs transition-all ${
                pendingCalls.length > 0
                  ? 'bg-gradient-to-br from-rose-100 to-red-100 border-rose-400 text-rose-950 animate-pulse ring-2 ring-rose-400/30'
                  : 'bg-gradient-to-br from-zinc-50 to-[#f7f2e7] border-zinc-200 text-zinc-700'
              }`}
            >
              <span className="text-[9.5px] font-bold uppercase tracking-wider block">
                Service Bells
              </span>
              <span className="font-numbers font-black text-xl sm:text-2xl text-[#1a1612] mt-0.5 block">
                {pendingCalls.length}
              </span>
            </div>
          </div>

          {/* LIVE FEED 1: PENDING WAITER SERVICE CALLS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-ui font-black text-[11px] uppercase text-rose-950 flex items-center gap-1.5">
                <IconBell className="w-3.5 h-3.5 text-rose-700" animate={pendingCalls.length > 0} />
                <span>Customer Assistance Bells ({pendingCalls.length})</span>
              </span>
            </div>

            {pendingCalls.length === 0 ? (
              <div className="p-2.5 bg-emerald-50/70 border border-dashed border-emerald-200 rounded-xl font-ui text-[11px] text-emerald-900 flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>All dining tables currently attended. Floor is calm.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {pendingCalls.map((call) => (
                  <div
                    key={call.callId}
                    className="p-2 bg-rose-50 border border-rose-300 rounded-xl font-ui flex items-center justify-between text-xs animate-pulse shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-800 text-white font-black text-[10px] px-2 py-0.5 rounded-lg uppercase">
                        TABLE #{call.tableNo}
                      </span>
                      <div>
                        <span className="font-bold text-rose-950 block text-[11.5px]">
                          {call.requestLabel}
                        </span>
                        {call.note && (
                          <span className="text-[10px] text-zinc-600 italic block">
                            "{call.note}"
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md font-numbers">
                      {new Date(call.requestedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LIVE FEED 2: KITCHEN COOKING & FOOD READY DISPATCH */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-ui font-black text-[11px] uppercase text-[#1a1612] flex items-center gap-1.5">
                <IconFoodReady className="w-3.5 h-3.5 text-amber-700" />
                <span>Kitchen Cooking Pipeline & Hotplate ({activeOrders.length})</span>
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <div className="p-2.5 bg-amber-50/60 border border-dashed border-amber-200 rounded-xl font-ui text-[11px] text-amber-900 flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Kitchen queue is clear. Awaiting next table order.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {activeOrders.slice(0, 3).map((ord) => {
                  const isReady = ord.status === 'Ready to Serve';
                  const isCooking = ord.status === 'In Preparation';

                  return (
                    <div
                      key={ord.orderId}
                      className={`p-2 rounded-xl border font-ui flex items-center justify-between text-xs shadow-xs transition-all ${
                        isReady
                          ? 'bg-rose-900 text-white border-rose-950 animate-pulse'
                          : isCooking
                          ? 'bg-amber-50/90 text-amber-950 border-amber-200'
                          : 'bg-[#f7f2e7] text-[#1a1612] border-[#e2d7c2]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-[10px] px-2 py-0.5 rounded-lg uppercase ${
                            isReady
                              ? 'bg-yellow-300 text-black'
                              : 'bg-[#1a1612] text-amber-300'
                          }`}
                        >
                          T-#{ord.tableNo}
                        </span>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11.5px]">
                              #{ord.orderId}
                            </span>
                            <span className="text-[10px] opacity-80">
                              ({ord.totalCount || ord.items?.length || 1} items)
                            </span>
                          </div>

                          <div className="text-[10px] opacity-75 truncate max-w-[180px] sm:max-w-xs">
                            {ord.items?.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase block ${
                            isReady
                              ? 'bg-white text-rose-950'
                              : isCooking
                              ? 'bg-amber-400 text-black'
                              : 'bg-zinc-800 text-white'
                          }`}
                        >
                          {isReady ? '🍲 READY' : isCooking ? '🔥 COOKING' : '⏳ QUEUED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-2 bg-[#f8f4ec] border border-amber-900/15 rounded-xl font-ui text-[11px] text-zinc-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Auto-locks after 5 mins of idle time.</span>
            </span>
            <span className="font-bold text-[#1a1612] bg-white px-2 py-0.5 rounded-md border border-amber-900/10 text-[10px]">
              Restaurant OS V2.0
            </span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM VINTAGE BRAND STRIP */}
      <footer className="w-full max-w-5xl text-center font-ui text-[11px] text-zinc-500 mt-2 flex-shrink-0">
        <p className="font-bold text-[#1a1612] uppercase tracking-wider font-cinzel">
          ★ The Daily Culinary Chronicle • Internal Restaurant Operating System ★
        </p>
      </footer>
    </div>
  );
};

export default StaffLogin;

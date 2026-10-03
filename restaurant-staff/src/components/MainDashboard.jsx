import React, { useState, useEffect } from 'react';
import CashierBillingMachine from './CashierBillingMachine';
import {
  updateCallStatus,
  clearTableApi,
  getTableStatusApi,
  attendWaterApi,
  checkInTableApi,
  getUserProfile,
} from '../api/staffApi';
import { sounds } from '../utils/audio';
import { IconBell, IconFoodReady, IconChefPan, IconCheck, IconLock } from './Icons';

const TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const MainDashboard = ({
  orders = [],
  waiterCalls = [],
  tableSessions = [],
  onSelectTable,
  onSwitchSection,
  onOpenNotifications,
  onRefreshTables,
}) => {
  const [selectedTable, setSelectedTable] = useState('4');
  const [respondingId, setRespondingId] = useState(null);
  const [clearingTableNo, setClearingTableNo] = useState(null);
  const [attendingWaterTableNo, setAttendingWaterTableNo] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Direct Table Seating & Guest Assignment Modal State
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [seatTableNo, setSeatTableNo] = useState('1');
  const [seatGuestEmail, setSeatGuestEmail] = useState('');
  const [seatGuestName, setSeatGuestName] = useState('');
  const [seatGuestPhone, setSeatGuestPhone] = useState('');
  const [seatGuestCoins, setSeatGuestCoins] = useState(0);
  const [lookingUpEmail, setLookingUpEmail] = useState(false);
  const [savingSeatSession, setSavingSeatSession] = useState(false);
  const [seatNotification, setSeatNotification] = useState({ type: '', text: '' });

  // Update live clock every 5 seconds for accurate sitting duration minutes
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'Completed');
  const cookingOrders = orders.filter((o) => o.status === 'In Preparation' || o.status === 'Pending');
  const readyOrders = orders.filter((o) => o.status === 'Ready to Serve');
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== 'PAID');
  const pendingCalls = waiterCalls.filter((c) => c.status === 'PENDING');

  // Compute detailed status for each of the 12 tables
  const tableStatusMap = {};
  TABLES.forEach((t) => {
    const serverSession = (tableSessions || []).find((s) => String(s.tableNo) === String(t));
    const tableOrders = orders.filter((o) => String(o.tableNo) === String(t) && o.paymentStatus !== 'PAID');
    
    const hasOrders = tableOrders.length > 0;
    const isReady = tableOrders.some((o) => o.status === 'Ready to Serve');
    const isCooking = tableOrders.some((o) => o.status === 'In Preparation' || o.status === 'Pending');
    const billTotal = tableOrders.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
    const orderItemsCount = tableOrders.reduce((sum, o) => sum + (o.totalCount || o.items?.length || 1), 0);

    const isOccupied = Boolean(serverSession?.isOccupied || hasOrders);
    const customerName = serverSession?.customerName || tableOrders[0]?.customerName || (serverSession?.customerEmail ? serverSession.customerEmail.split('@')[0] : (isOccupied ? 'Guest' : ''));
    const customerEmail = serverSession?.customerEmail || tableOrders[0]?.customerEmail || '';
    const seatedAt = serverSession?.seatedAt || (tableOrders[0]?.createdAt || (isOccupied ? new Date().toISOString() : null));

    let sittingMinutes = 0;
    if (seatedAt) {
      sittingMinutes = Math.max(0, Math.floor((now - new Date(seatedAt).getTime()) / 60000));
    }

    const hasOrdered = hasOrders || Boolean(serverSession?.hasOrdered);
    const isWaterAttended = Boolean(serverSession?.isWaterAttended);
    const isIdleOver5Min = isOccupied && !hasOrdered && sittingMinutes >= 5 && !isWaterAttended;

    let stage = serverSession?.stage || 'AVAILABLE';
    if (isReady) stage = 'READY';
    else if (isCooking) stage = 'COOKING';
    else if (hasOrders) stage = 'ORDERED';
    else if (isIdleOver5Min) stage = 'IDLE_ALERT';
    else if (isWaterAttended && !hasOrdered) stage = 'WATER_ATTENDED';
    else if (isOccupied) stage = 'SEATED_IDLE';
    else stage = 'AVAILABLE';

    tableStatusMap[t] = {
      tableNo: t,
      isOccupied,
      stage,
      customerName,
      customerEmail,
      seatedAt,
      sittingMinutes,
      hasOrders,
      hasOrdered,
      isCooking,
      isReady,
      isIdleOver5Min,
      isWaterAttended,
      waterAttendedBy: serverSession?.waterAttendedBy || '',
      waterAlertSent: Boolean(serverSession?.waterAlertSent),
      orderCount: tableOrders.length,
      orderItemsCount,
      billTotal,
      tableOrders,
    };
  });

  const occupiedTablesList = Object.values(tableStatusMap).filter((s) => s.isOccupied);
  const idleTablesList = Object.values(tableStatusMap).filter((s) => s.isOccupied && !s.hasOrdered);
  const totalUnpaidRevenue = unpaidOrders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);

  const handleTableClick = (t) => {
    sounds.playTick();
    setSelectedTable(String(t));
    if (onSelectTable) onSelectTable(String(t));
  };

  const handleClearTable = async (e, t) => {
    e.stopPropagation();
    try {
      setClearingTableNo(t);
      sounds.playTick();
      await clearTableApi(t);
      if (onRefreshTables) await onRefreshTables();
    } catch (err) {
      console.error(err);
    } finally {
      setClearingTableNo(null);
    }
  };

  const handleAttendWater = async (e, t) => {
    e.stopPropagation();
    try {
      setAttendingWaterTableNo(t);
      sounds.playTick();
      await attendWaterApi(t, 'Floor Attendant');
      if (onRefreshTables) await onRefreshTables();
    } catch (err) {
      console.error('Failed to attend water:', err);
    } finally {
      setAttendingWaterTableNo(null);
    }
  };

  // Direct Table Seating Modal Handlers
  const handleOpenSeatModal = (tNo = '1', currentCustomer = null) => {
    sounds.playTick();
    setSeatTableNo(String(tNo));
    if (currentCustomer && currentCustomer.isOccupied) {
      setSeatGuestEmail(currentCustomer.customerEmail || '');
      setSeatGuestName(currentCustomer.customerName || '');
      setSeatGuestPhone(currentCustomer.customerPhone || '');
    } else {
      setSeatGuestEmail('');
      setSeatGuestName('');
      setSeatGuestPhone('');
      setSeatGuestCoins(0);
    }
    setSeatNotification({ type: '', text: '' });
    setShowSeatModal(true);
  };

  const handleLookupSeatEmail = async () => {
    if (!seatGuestEmail.trim()) {
      setSeatNotification({ type: 'error', text: 'Enter email first to lookup account & check coins.' });
      return;
    }
    try {
      setLookingUpEmail(true);
      sounds.playTick();
      const res = await getUserProfile(seatGuestEmail.trim());
      if (res?.user) {
        setSeatGuestName(res.user.name || '');
        setSeatGuestPhone(res.user.phone || '');
        const coins = Number(res.user.walletBalance) || 0;
        setSeatGuestCoins(coins);
        setSeatNotification({
          type: 'success',
          text: `✓ Found account for ${res.user.name || res.user.email}! 🪙 ${coins} Coins Available (₹${coins} Value).`,
        });
      } else {
        setSeatGuestCoins(0);
        setSeatNotification({
          type: 'info',
          text: 'No existing account found. New patron profile will be registered upon seating.',
        });
      }
    } catch (e) {
      setSeatNotification({ type: 'error', text: 'Failed to lookup user profile.' });
    } finally {
      setLookingUpEmail(false);
    }
  };

  const handleConfirmSeatGuest = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingSeatSession(true);
      sounds.playTick();
      const email = seatGuestEmail.trim();
      const name = seatGuestName.trim() || (email ? email.split('@')[0] : 'Seated Guest');
      const phone = seatGuestPhone.trim();

      const res = await checkInTableApi({
        tableNo: String(seatTableNo),
        customerEmail: email,
        customerName: name,
        customerPhone: phone,
      });

      if (res?.success) {
        sounds.playBell();
        setShowSeatModal(false);
        setSelectedTable(String(seatTableNo));
        if (onSelectTable) onSelectTable(String(seatTableNo));
        if (onRefreshTables) await onRefreshTables();
      }
    } catch (err) {
      setSeatNotification({ type: 'error', text: 'Failed to assign table. Please retry.' });
    } finally {
      setSavingSeatSession(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ========================================================= */}
      {/* 1. TOP METRIC TILES (Live Sitting & Floor Operations)     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 font-ui">
        {/* Metric 1: Occupied Tables */}
        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612]/80 p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06),0_0_0_1px_rgba(217,119,6,0.15)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-ui font-extrabold uppercase text-zinc-500 tracking-wider block">
              Occupied Tables
            </span>
            <span className="font-numbers font-black text-2xl sm:text-3xl text-[#1a1612] mt-0.5 block">
              {occupiedTablesList.length} <span className="text-base text-zinc-400 font-normal">/ 12</span>
            </span>
            <span className="text-[11px] text-zinc-600 font-medium block mt-0.5">
              🟢 {occupiedTablesList.length - idleTablesList.length} ordered • 🟡 {idleTablesList.length} idle
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
            🪑
          </div>
        </div>

        {/* Metric 2: Active Orders & Kitchen State */}
        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612]/80 p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06),0_0_0_1px_rgba(217,119,6,0.15)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-ui font-extrabold uppercase text-zinc-500 tracking-wider block">
              Kitchen Orders
            </span>
            <span className="font-numbers font-black text-2xl sm:text-3xl text-[#1a1612] mt-0.5 block">
              {activeOrders.length}
            </span>
            <span className="text-[11px] text-zinc-600 font-medium block mt-0.5">
              🔥 {cookingOrders.length} cooking • 🍲 {readyOrders.length} ready
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
            🍳
          </div>
        </div>

        {/* Metric 3: Service Bells & 5-Min Water Alerts */}
        <div
          onClick={onOpenNotifications}
          className={`bg-white/94 backdrop-blur-xl border-2 p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex items-center justify-between cursor-pointer transition hover:scale-[1.02] ${
            pendingCalls.length > 0
              ? 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-400/30 animate-pulse'
              : 'border-[#1a1612]/80'
          }`}
        >
          <div>
            <span className="text-[10px] font-ui font-extrabold uppercase text-zinc-500 tracking-wider block">
              Service Bells
            </span>
            <span className={`font-numbers font-black text-2xl sm:text-3xl mt-0.5 block ${
              pendingCalls.length > 0 ? 'text-rose-950' : 'text-[#1a1612]'
            }`}>
              {pendingCalls.length}
            </span>
            <span className="text-[11px] text-zinc-600 font-medium block mt-0.5">
              {pendingCalls.length > 0 ? '⚠️ Floor alert active!' : '✓ All tables attended'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xs ${
            pendingCalls.length > 0 ? 'bg-rose-200 border border-rose-400' : 'bg-rose-50 border border-rose-200'
          }`}>
            🛎️
          </div>
        </div>

        {/* Metric 4: Unpaid Collections */}
        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612]/80 p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.06),0_0_0_1px_rgba(217,119,6,0.15)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-ui font-extrabold uppercase text-zinc-500 tracking-wider block">
              Unpaid Collections
            </span>
            <span className="font-numbers font-black text-2xl sm:text-3xl text-emerald-950 mt-0.5 block">
              ₹{totalUnpaidRevenue}
            </span>
            <span className="text-[11px] text-zinc-600 font-medium block mt-0.5">
              Across {occupiedTablesList.length} seated table(s)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
            💰
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TABLE ASSIGNMENT & LIVE SITTING RADAR (12 Tables)       */}
      {/* ========================================================= */}
      <div className="bg-white/94 backdrop-blur-2xl border-2 border-[#1a1612]/80 p-5 sm:p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08),0_0_0_1px_rgba(217,119,6,0.15)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-900/15 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-ui font-black bg-[#1a1612] text-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                ● LIVE SEATING & SITTING RADAR
              </span>
              <span className="text-xs font-ui text-zinc-500 font-medium">
                Real-time Occupancy • Order Placed vs Idle Time • 5-Min Water Bell Service
              </span>
            </div>
            <h3 className="font-cinzel text-xl sm:text-2xl font-black uppercase text-[#1a1612] mt-1">
              Table Assignment & Seating Activity Grid
            </h3>
          </div>

          {/* Quick Direct Seat Action & Filters */}
          <div className="flex items-center gap-2 sm:gap-3 font-ui text-xs font-semibold flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenSeatModal('1')}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-ui font-black text-xs uppercase py-2 px-3.5 rounded-2xl shadow-sm border border-amber-950/20 cursor-pointer flex items-center gap-1.5 transition"
            >
              <span>🪑</span>
              <span>Direct Seat Guest / Assign Table</span>
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-emerald-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Available
              </span>
              <span className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 text-amber-950">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Seated
              </span>
              <span className="flex items-center gap-1.5 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300 text-rose-950">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse"></span> 5m+ Idle
              </span>
            </div>
          </div>
        </div>

        {/* 12 Tables Grid with Time Seated & Order State */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {TABLES.map((t) => {
            const status = tableStatusMap[t];
            const isSelected = String(selectedTable) === String(t);

            return (
              <div
                key={t}
                onClick={() => handleTableClick(t)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between min-h-[148px] ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/90 ring-4 ring-amber-400/30 shadow-md scale-102'
                    : status.isIdleOver5Min
                    ? 'border-rose-500 bg-rose-50/95 ring-2 ring-rose-400/50 shadow-sm animate-pulse'
                    : status.stage === 'WATER_ATTENDED'
                    ? 'border-emerald-500/70 bg-emerald-50/60 hover:bg-emerald-50/90 shadow-xs'
                    : status.isReady
                    ? 'border-rose-400 bg-rose-50/60 hover:bg-rose-50'
                    : status.isCooking
                    ? 'border-amber-400 bg-amber-50/60 hover:bg-amber-50'
                    : status.isOccupied
                    ? 'border-amber-900/30 bg-[#fbf7ee] hover:bg-[#f5ebd6]'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
              >
                {/* Table Header with Number and Status Pill */}
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-sm sm:text-base font-black text-[#1a1612]">
                    Table #{t}
                  </span>
                  <span
                    className={`text-[8.5px] font-ui font-black px-2 py-0.5 rounded-full uppercase shadow-xs ${
                      status.isReady
                        ? 'bg-rose-800 text-white animate-pulse'
                        : status.isCooking
                        ? 'bg-amber-500 text-black'
                        : status.isIdleOver5Min
                        ? 'bg-rose-900 text-white animate-bounce'
                        : status.stage === 'WATER_ATTENDED'
                        ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                        : status.isOccupied
                        ? 'bg-amber-900 text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {status.isReady
                      ? '🍲 READY'
                      : status.isCooking
                      ? '🔥 COOKING'
                      : status.isIdleOver5Min
                      ? '💧 WATER ALERT'
                      : status.stage === 'WATER_ATTENDED'
                      ? '💧 WATER SERVED'
                      : status.isOccupied
                      ? '🪑 SEATED'
                      : 'AVAILABLE'}
                  </span>
                </div>

                {/* Table Body: Guest Name, Sitting Duration & Order Placed Status */}
                <div className="my-1.5 space-y-1">
                  {status.isOccupied ? (
                    <div className="font-ui text-[11px] space-y-0.5">
                      {/* Patron Name */}
                      <div className="font-bold text-zinc-900 truncate flex items-center gap-1">
                        <span>👤 {status.customerName}</span>
                      </div>

                      {/* Sitting Duration Timer */}
                      <div className="text-[10px] text-zinc-600 font-numbers flex items-center gap-1">
                        <span>⏱️ Seated:</span>
                        <strong className="text-black bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                          {status.sittingMinutes}m ago
                        </strong>
                      </div>

                      {/* Order Placed vs Water Attended vs Idle State */}
                      <div className="text-[10px]">
                        {status.hasOrdered ? (
                          <span className="text-emerald-800 font-extrabold bg-emerald-100/90 px-1.5 py-0.5 rounded inline-block">
                            ✓ {status.orderCount} Order(s) Placed
                          </span>
                        ) : status.stage === 'WATER_ATTENDED' ? (
                          <span className="text-emerald-900 font-extrabold bg-emerald-200/80 px-1.5 py-0.5 rounded inline-flex items-center gap-1 border border-emerald-300">
                            <span>💧 Attended & Served</span>
                          </span>
                        ) : (
                          <span className="text-rose-900 font-extrabold bg-rose-100 px-1.5 py-0.5 rounded inline-block">
                            ⚠️ No Order Yet (Idle)
                          </span>
                        )}
                      </div>

                      {/* 5-Min Water Alert Notice + One-Click Attend Action */}
                      {status.isIdleOver5Min && (
                        <div className="space-y-1 pt-0.5">
                          <div className="text-[9.5px] font-black text-rose-900 bg-rose-200/90 px-1.5 py-0.5 rounded">
                            💧 Auto Water Bell Sent!
                          </div>
                          <button
                            onClick={(e) => handleAttendWater(e, t)}
                            disabled={attendingWaterTableNo === t}
                            className="w-full bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-ui font-black text-[9.5px] uppercase py-1 px-1.5 rounded shadow-xs cursor-pointer flex items-center justify-center gap-1 transition"
                          >
                            {attendingWaterTableNo === t ? 'Updating...' : '🏃 Attend Water / Served'}
                          </button>
                        </div>
                      )}

                      {/* Water Attended Info */}
                      {status.stage === 'WATER_ATTENDED' && (
                        <div className="text-[9px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded truncate">
                          ✓ Handled by {status.waterAttendedBy || 'Staff'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-1.5 space-y-1">
                      <span className="text-[10.5px] text-zinc-400 font-ui italic block">
                        ○ Table Available
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSeatModal(t);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-ui font-extrabold text-[9.5px] uppercase py-1 px-2.5 rounded-lg shadow-xs cursor-pointer transition flex items-center justify-center gap-1 mx-auto"
                      >
                        <span>🪑</span>
                        <span>Seat Guest</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Table Footer: Bill & Quick Clear Button */}
                <div className="pt-1.5 border-t border-black/5 flex items-center justify-between font-ui text-xs">
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {status.hasOrders ? 'Bill:' : 'Status:'}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <span className={`font-numbers font-black ${status.billTotal > 0 ? 'text-rose-950 text-xs' : 'text-zinc-400 text-[10px]'}`}>
                      {status.billTotal > 0 ? `₹${status.billTotal}` : (status.isOccupied ? 'No Bill' : 'Ready')}
                    </span>

                    {status.isOccupied ? (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSeatModal(t, status);
                          }}
                          title="Edit or Reassign Patron"
                          className="text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-1 py-0.5 rounded border border-amber-300 cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleClearTable(e, t)}
                          disabled={clearingTableNo === t}
                          title="Clear and free table"
                          className="text-[9px] font-bold bg-zinc-100 hover:bg-rose-100 text-zinc-600 hover:text-rose-900 px-1 py-0.5 rounded border border-zinc-300 cursor-pointer"
                        >
                          {clearingTableNo === t ? '...' : 'Free'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DIRECT SEAT GUEST & LINK COINS MODAL                      */}
      {/* ========================================================= */}
      {showSeatModal && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-3xl p-6 max-w-md w-full newspaper-shadow space-y-4 font-typewriter animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-[#1a1612] pb-3">
              <div>
                <span className="bg-[#1a1612] text-amber-300 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  DIRECT TABLE ASSIGNMENT
                </span>
                <h3 className="font-headline text-xl font-black uppercase text-[#1a1612] mt-0.5">
                  Seat Guest & Link Coins
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSeatModal(false)}
                className="text-zinc-500 hover:text-zinc-900 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notification alert */}
            {seatNotification.text && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-bold ${
                  seatNotification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                    : seatNotification.type === 'info'
                    ? 'bg-amber-50 text-amber-950 border-amber-400'
                    : 'bg-rose-50 text-rose-950 border-rose-400'
                }`}
              >
                {seatNotification.text}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConfirmSeatGuest} className="space-y-3.5 text-xs">
              {/* Select Table */}
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  1. Select Dining Table:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TABLES.map((t) => {
                    const isOcc = tableStatusMap[t]?.isOccupied;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSeatTableNo(t)}
                        className={`py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                          String(seatTableNo) === String(t)
                            ? 'bg-[#1a1612] text-amber-300 border-amber-400 font-black shadow-sm'
                            : isOcc
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-[#eee7d7] text-[#1a1612] border-zinc-300 hover:bg-[#ded4be]'
                        }`}
                      >
                        T-{t} {isOcc ? '(Occ)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guest Email Lookup */}
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  2. Guest Email (Lookup & Use Coins):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={seatGuestEmail}
                    onChange={(e) => setSeatGuestEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookupSeatEmail();
                      }
                    }}
                    placeholder="guest@example.com"
                    className="flex-1 bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-1.5 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleLookupSeatEmail}
                    disabled={lookingUpEmail}
                    className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-400 cursor-pointer flex items-center gap-1"
                  >
                    <span>🔍</span>
                    <span>{lookingUpEmail ? 'Checking...' : 'Check'}</span>
                  </button>
                </div>
              </div>

              {/* Coins & Account Preview */}
              {seatGuestCoins > 0 && (
                <div className="p-2.5 bg-amber-100 border-2 border-amber-400 rounded-xl flex items-center justify-between text-xs font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🪙</span>
                    <span>Patron has <strong>{seatGuestCoins} Loyalty Coins</strong> ready to use!</span>
                  </span>
                  <span className="bg-amber-400 text-black px-2 py-0.5 rounded font-black">
                    ₹{seatGuestCoins}
                  </span>
                </div>
              )}

              {/* Guest Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold uppercase text-[#1a1612] block mb-0.5 text-[11px]">
                    Guest Name:
                  </label>
                  <input
                    type="text"
                    value={seatGuestName}
                    onChange={(e) => setSeatGuestName(e.target.value)}
                    placeholder="Guest Name"
                    className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-1.5 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[#1a1612] block mb-0.5 text-[11px]">
                    Phone (Optional):
                  </label>
                  <input
                    type="tel"
                    value={seatGuestPhone}
                    onChange={(e) => setSeatGuestPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-1.5 text-xs font-semibold rounded focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#1a1612]/20">
                <button
                  type="button"
                  onClick={() => setShowSeatModal(false)}
                  className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold py-2.5 rounded-xl uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSeatSession}
                  className="flex-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-black py-2.5 rounded-xl uppercase text-xs border-2 border-amber-950 cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
                >
                  <span>🪑</span>
                  <span>{savingSeatSession ? 'SEATING GUEST...' : `CONFIRM SEATING TABLE #${seatTableNo}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CASHIER BILLING & FISCAL MACHINE WORKSPACE              */}
      {/* ========================================================= */}
      <CashierBillingMachine
        selectedTable={selectedTable}
        onTableChanged={(t) => setSelectedTable(String(t))}
        onPaymentSettled={() => {
          sounds.playCashRegister();
          if (onRefreshTables) onRefreshTables();
        }}
      />
    </div>
  );
};

export default MainDashboard;

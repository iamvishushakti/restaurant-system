import React, { useState } from 'react';
import { IconBell, IconFoodReady, IconChefPan, IconCheck, IconDashboard } from './Icons';
import { sounds } from '../utils/audio';

export const NotificationHubModal = ({
  isOpen = false,
  onClose,
  waiterCalls = [],
  orders = [],
  onAttendCall,
  onResolveCall,
  onNavigateKitchen,
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'waiter', 'food'
  const [actingId, setActingId] = useState(null);

  if (!isOpen) return null;

  const pendingCalls = waiterCalls.filter((c) => c.status === 'PENDING');
  const attendingCalls = waiterCalls.filter((c) => c.status === 'ATTENDING');
  const allActiveCalls = [...pendingCalls, ...attendingCalls];

  const readyOrders = orders.filter((o) => o.status === 'Ready to Serve');
  const cookingOrders = orders.filter((o) => o.status === 'In Preparation');
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const activeOrders = [...readyOrders, ...cookingOrders, ...pendingOrders];

  const totalCount = allActiveCalls.length + activeOrders.length;

  const handleAttend = async (call) => {
    try {
      setActingId(call.callId);
      sounds.playTick();
      if (onAttendCall) await onAttendCall(call);
    } finally {
      setActingId(null);
    }
  };

  const handleResolve = async (call) => {
    try {
      setActingId(call.callId);
      sounds.playTick();
      if (onResolveCall) await onResolveCall(call);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Main Elevated Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border-2 border-[#1a1612] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(217,119,6,0.3)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Gold Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600"></div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-amber-900/15 flex items-center justify-between bg-[#fffcf5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a1612] text-amber-300 flex items-center justify-center shadow-md">
              <IconBell className="w-5 h-5 text-amber-400" animate={pendingCalls.length > 0} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-black font-ui font-black text-[9.5px] px-2 py-0.2 rounded-full uppercase">
                  LIVE OPERATIONS RADAR
                </span>
                <span className="text-zinc-500 font-ui text-xs">
                  {totalCount} Active Notice{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
              <h3 className="font-cinzel text-lg sm:text-xl font-black uppercase text-[#1a1612] leading-tight mt-0.5">
                Notifications & Service Feed
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => sounds.playWaiterBell()}
              title="Test Sound"
              className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-ui font-bold text-xs px-2.5 py-1.5 rounded-xl border border-amber-300 cursor-pointer"
            >
              🔔 Ring Bell
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#fbf7ee] border-b border-amber-900/10 flex items-center gap-2 overflow-x-auto font-ui text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1a1612] text-amber-300 shadow-xs'
                : 'bg-white hover:bg-amber-50 text-zinc-700 border border-zinc-200'
            }`}
          >
            All Activity ({totalCount})
          </button>
          <button
            onClick={() => setFilter('waiter')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'waiter'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'bg-white hover:bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <span>🛎️ Waiter Bells</span>
            <span className="font-numbers font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-950 text-[10px]">
              {allActiveCalls.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('food')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase transition cursor-pointer flex items-center gap-1.5 ${
              filter === 'food'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            <span>🍳 Kitchen & Food</span>
            <span className="font-numbers font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-950 text-[10px]">
              {activeOrders.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 font-ui text-xs">
          {/* ======================================================== */}
          {/* SECTION A: WAITER ASSISTANCE CALLS                       */}
          {/* ======================================================== */}
          {(filter === 'all' || filter === 'waiter') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-ui font-black uppercase text-[11px] text-rose-950 tracking-wider flex items-center gap-1.5">
                  <IconBell className="w-3.5 h-3.5 text-rose-700" animate={pendingCalls.length > 0} />
                  <span>Customer Assistance Calls ({allActiveCalls.length})</span>
                </h4>
              </div>

              {allActiveCalls.length === 0 ? (
                <div className="p-3 bg-emerald-50/70 border border-dashed border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>All customer tables currently attended. No pending rings.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {allActiveCalls.map((call) => {
                    const isPending = call.status === 'PENDING';
                    return (
                      <div
                        key={call.callId}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPending
                            ? 'bg-rose-50/95 border-rose-300 shadow-sm animate-pulse ring-1 ring-rose-400/30'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="bg-rose-900 text-white font-black text-xs px-2.5 py-1 rounded-xl uppercase flex-shrink-0">
                            Table #{call.tableNo}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-rose-950">
                                {call.requestLabel}
                              </span>
                              <span className="font-numbers text-[10px] text-zinc-500 font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-zinc-200">
                                🕒 {new Date(call.requestedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {call.note && (
                              <p className="text-xs text-zinc-700 italic mt-0.5">
                                "{call.note}"
                              </p>
                            )}
                            <span className="text-[10px] text-zinc-500 block mt-1">
                              Status: <strong>{call.status}</strong> {call.attendant ? `• Attending: ${call.attendant}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          {isPending && (
                            <button
                              onClick={() => handleAttend(call)}
                              disabled={actingId === call.callId}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-xl uppercase text-xs cursor-pointer shadow-xs transition active:scale-95 disabled:opacity-50"
                            >
                              {actingId === call.callId ? 'Updating...' : '🏃 Attend (Coming)'}
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(call)}
                            disabled={actingId === call.callId}
                            className="bg-[#1a1612] hover:bg-zinc-800 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-xs transition active:scale-95 disabled:opacity-50"
                          >
                            ✓ Resolve
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION B: KITCHEN PREPARATION & FOOD READY STREAM       */}
          {/* ======================================================== */}
          {(filter === 'all' || filter === 'food') && (
            <div className="space-y-2 pt-2 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <h4 className="font-ui font-black uppercase text-[11px] text-[#1a1612] tracking-wider flex items-center gap-1.5">
                  <IconFoodReady className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kitchen Cooking Pipeline & Food Ready Dispatch ({activeOrders.length})</span>
                </h4>

                {onNavigateKitchen && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateKitchen();
                    }}
                    className="text-amber-800 hover:text-amber-950 font-bold underline text-[11px] cursor-pointer"
                  >
                    Open Food Control ➔
                  </button>
                )}
              </div>

              {activeOrders.length === 0 ? (
                <div className="p-3 bg-amber-50/60 border border-dashed border-amber-200 rounded-2xl text-amber-900 flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Kitchen pipeline is clear. All dishes cooked and delivered.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeOrders.map((ord) => {
                    const isReady = ord.status === 'Ready to Serve';
                    const isCooking = ord.status === 'In Preparation';

                    return (
                      <div
                        key={ord.orderId}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isReady
                            ? 'bg-rose-900 text-white border-rose-950 shadow-md animate-pulse'
                            : isCooking
                            ? 'bg-amber-50/90 text-amber-950 border-amber-200'
                            : 'bg-[#f8f5ee] text-[#1a1612] border-[#ded5c4]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-xl uppercase flex-shrink-0 ${
                              isReady
                                ? 'bg-yellow-300 text-black'
                                : 'bg-[#1a1612] text-amber-300'
                            }`}
                          >
                            Table #{ord.tableNo}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm">
                                #{ord.orderId}
                              </span>
                              <span className="text-xs opacity-90 font-medium">
                                ({ord.totalCount || ord.items?.length || 1} item{ord.items?.length !== 1 ? 's' : ''})
                              </span>
                            </div>

                            <div className="text-xs opacity-85 mt-0.5 max-w-md">
                              {ord.items?.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ')}
                            </div>

                            {isReady && (
                              <div className="mt-1 text-xs font-black text-yellow-300 flex items-center gap-1">
                                <span>🍲 Food Cooked by Chef! Server please deliver to Table #{ord.tableNo}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Stage Pill */}
                        <div className="flex-shrink-0 self-end sm:self-center">
                          <span
                            className={`text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider block shadow-xs ${
                              isReady
                                ? 'bg-white text-rose-950 ring-2 ring-yellow-300'
                                : isCooking
                                ? 'bg-amber-400 text-black'
                                : 'bg-zinc-800 text-white'
                            }`}
                          >
                            {isReady ? '🍲 READY TO SERVE' : isCooking ? '🔥 IN PREPARATION' : '⏳ QUEUED'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#fffcf5] border-t border-amber-900/15 flex items-center justify-between text-xs font-ui">
          <span className="text-zinc-500">
            Real-time synchronization active • Updates automatically
          </span>
          <button
            onClick={onClose}
            className="bg-[#1a1612] hover:bg-zinc-800 text-amber-300 font-bold px-4 py-1.5 rounded-xl uppercase cursor-pointer"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationHubModal;

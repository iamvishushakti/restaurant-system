import React, { useState } from 'react';
import { updateOrderStatus } from '../api/staffApi';
import { sounds } from '../utils/audio';

export const FoodControl = ({ orders = [], onOrderUpdated }) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'cooking', 'ready', 'completed'
  const [tableFilter, setTableFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Status Filter Lists
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const cookingOrders = orders.filter((o) => o.status === 'In Preparation');
  const readyOrders = orders.filter((o) => o.status === 'Ready to Serve');
  const completedOrders = orders.filter((o) => o.status === 'Completed');

  let filteredOrders = orders;
  if (activeTab === 'active') {
    filteredOrders = orders.filter((o) => o.status !== 'Completed');
  } else if (activeTab === 'pending') {
    filteredOrders = pendingOrders;
  } else if (activeTab === 'cooking') {
    filteredOrders = cookingOrders;
  } else if (activeTab === 'ready') {
    filteredOrders = readyOrders;
  } else if (activeTab === 'completed') {
    filteredOrders = completedOrders;
  }

  if (tableFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o) => String(o.tableNo) === String(tableFilter));
  }

  // Handle Status Update Flow
  const handleSetStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      if (newStatus === 'Ready to Serve') {
        sounds.playFoodReady();
      } else {
        sounds.playTick();
      }

      await updateOrderStatus(orderId, newStatus, 'Executive Chef');
      if (onOrderUpdated) await onOrderUpdated();
    } catch (e) {
      console.error('Failed to update order status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KITCHEN PIPELINE SUMMARY BANNER */}
      <div className="bg-[#fffdf9]/90 backdrop-blur-md border-4 border-[#1a1612] p-5 sm:p-6 rounded-2xl newspaper-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-typewriter font-bold uppercase tracking-wider bg-red-800 text-white px-2 py-0.5 rounded border border-red-950">
              CHEF & KITCHEN BRIGADE
            </span>
            <span className="text-xs font-typewriter text-[#71695f]">
              Real-Time Cooking Pipeline • Distinct Order IDs • Instant Waiter Call
            </span>
          </div>
          <h2 className="font-headline text-2xl sm:text-3xl font-black uppercase text-[#1a1612] mt-1">
            Food Control & Kitchen Dispatch
          </h2>
        </div>

        {/* Quick Pipeline Badges */}
        <div className="flex items-center gap-2.5 font-typewriter text-xs flex-wrap">
          <div className="bg-amber-100/90 border-2 border-amber-900 px-3 py-1.5 rounded-xl font-bold text-amber-950">
            ⏳ {pendingOrders.length} New Orders
          </div>
          <div className="bg-amber-400 border-2 border-black px-3 py-1.5 rounded-xl font-black text-black">
            🔥 {cookingOrders.length} In Cooking
          </div>
          <div className="bg-red-800 border-2 border-black px-3 py-1.5 rounded-xl font-black text-white animate-pulse">
            🍲 {readyOrders.length} Ready for Server
          </div>
        </div>
      </div>

      {/* 2. FILTER CONTROLS */}
      <div className="bg-[#fffdf9]/90 backdrop-blur-md border-3 border-[#1a1612] p-4 rounded-2xl newspaper-shadow flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-typewriter text-xs">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase border-2 transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-[#1a1612] text-amber-300 border-[#1a1612]'
                : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#ded4be]'
            }`}
          >
            🔥 All Active ({orders.filter((o) => o.status !== 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase border-2 transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#1a1612] text-amber-300 border-[#1a1612]'
                : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#ded4be]'
            }`}
          >
            ⏳ New ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('cooking')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase border-2 transition cursor-pointer ${
              activeTab === 'cooking'
                ? 'bg-[#1a1612] text-amber-300 border-[#1a1612]'
                : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#ded4be]'
            }`}
          >
            👨‍🍳 Cooking ({cookingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase border-2 transition cursor-pointer ${
              activeTab === 'ready'
                ? 'bg-[#1a1612] text-amber-300 border-[#1a1612]'
                : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#ded4be]'
            }`}
          >
            🍲 Ready ({readyOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase border-2 transition cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#1a1612] text-amber-300 border-[#1a1612]'
                : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#ded4be]'
            }`}
          >
            ✓ Done ({completedOrders.length})
          </button>
        </div>

        {/* Table Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="font-bold text-[#1a1612] uppercase">Table:</label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="bg-[#eee7d7]/85 border-2 border-[#1a1612] px-3 py-1.5 rounded-xl font-bold text-xs text-[#1a1612] focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="all">All Tables</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((t) => (
              <option key={t} value={t}>
                Table #{t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. ORDER CARDS GRID */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[#fffdf9]/90 backdrop-blur-md border-4 border-dashed border-[#1a1612] rounded-2xl font-typewriter">
          <span className="text-4xl block mb-2">🍽️</span>
          <h3 className="font-headline font-black text-xl uppercase text-[#1a1612]">
            No Orders in this Kitchen Queue
          </h3>
          <p className="text-xs text-[#71695f] mt-1">
            When patrons place orders from table devices, they will instantly appear here with their unique Order ID.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((ord) => {
            const isPending = ord.status === 'Pending';
            const isCooking = ord.status === 'In Preparation';
            const isReady = ord.status === 'Ready to Serve';
            const isCompleted = ord.status === 'Completed';

            let cardBorder = 'border-[#1a1612]';
            let statusBadgeBg = 'bg-amber-100 text-amber-950 border-amber-900';
            let statusText = '⏳ ORDER RECEIVED (PENDING)';

            if (isCooking) {
              cardBorder = 'border-amber-600 ring-2 ring-amber-400';
              statusBadgeBg = 'bg-amber-500 text-black border-black font-black';
              statusText = '🔥 IN PREPARATION (COOKING)';
            } else if (isReady) {
              cardBorder = 'border-red-900 ring-3 ring-red-500 animate-pulse';
              statusBadgeBg = 'bg-red-800 text-white border-black font-black';
              statusText = '🍲 COOKED & READY FOR SERVER';
            } else if (isCompleted) {
              cardBorder = 'border-zinc-400 opacity-75';
              statusBadgeBg = 'bg-zinc-800 text-zinc-200 border-zinc-950';
              statusText = '✓ SERVED TO TABLE';
            }

            return (
              <div
                key={ord.orderId}
                className={`bg-[#fffdf9]/92 backdrop-blur-md border-4 ${cardBorder} p-5 rounded-2xl newspaper-shadow flex flex-col justify-between space-y-4`}
              >
                <div>
                  {/* Card Header: Table # + Order ID */}
                  <div className="border-b-2 border-[#1a1612] pb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#1a1612] text-amber-300 font-headline font-black text-sm px-2.5 py-0.5 rounded uppercase">
                          TABLE #{ord.tableNo}
                        </span>
                        <span className="font-typewriter text-xs font-bold text-[#1a1612]">
                          #{ord.orderId}
                        </span>
                      </div>

                      <p className="font-typewriter text-[11px] text-[#554e45] mt-1">
                        {ord.customerName ? `Patron: ${ord.customerName}` : 'Dine-in Guest'} •{' '}
                        {new Date(ord.orderedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-typewriter text-[10px] font-bold text-[#71695f] block">
                        EST. PREP
                      </span>
                      <span className="font-headline font-black text-base text-[#1a1612]">
                        {ord.prepMinutes || 15} Mins
                      </span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="my-3">
                    <span className={`inline-block w-full text-center py-1 px-2 rounded-lg font-typewriter text-xs border uppercase tracking-wider ${statusBadgeBg}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Special Cooking Note */}
                  {ord.specialNote && (
                    <div className="p-2.5 bg-[#eee7d7] border-2 border-[#1a1612] rounded-xl font-typewriter text-xs text-[#1a1612] mb-3">
                      <span className="font-black uppercase text-red-900 block text-[10px]">
                        📝 Chef Note:
                      </span>
                      <p className="italic font-bold mt-0.5">"{ord.specialNote}"</p>
                    </div>
                  )}

                  {/* Itemized Food List */}
                  <div className="space-y-1.5 font-typewriter text-xs">
                    <span className="font-black uppercase text-[10px] text-[#71695f] block border-b border-black/10 pb-1">
                      Dishes Ordered ({ord.items?.length || 0}):
                    </span>
                    <div className="divide-y divide-black/10">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#1a1612] text-amber-300 font-black text-xs px-1.5 py-0.5 rounded">
                              {item.quantity || 1}x
                            </span>
                            <span className="font-bold text-[#1a1612]">{item.name}</span>
                          </div>
                          <span className="text-[#71695f] font-semibold">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (1-Click Lifecycle Flow) */}
                <div className="pt-3 border-t-2 border-[#1a1612] space-y-2">
                  {isPending && (
                    <button
                      onClick={() => handleSetStatus(ord.orderId, 'In Preparation')}
                      disabled={updatingId === ord.orderId}
                      className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-amber-300 font-headline font-black py-3 px-4 text-xs sm:text-sm uppercase tracking-wider border-2 border-amber-400 rounded-xl newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>🍳</span>
                      <span>{updatingId === ord.orderId ? 'Starting...' : 'START COOKING / PREPARING'}</span>
                    </button>
                  )}

                  {isCooking && (
                    <button
                      onClick={() => handleSetStatus(ord.orderId, 'Ready to Serve')}
                      disabled={updatingId === ord.orderId}
                      className="w-full bg-red-800 hover:bg-red-700 active:scale-95 text-white font-headline font-black py-3 px-4 text-xs sm:text-sm uppercase tracking-wider border-2 border-black rounded-xl newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 animate-bounce"
                    >
                      <span>🍲</span>
                      <span>{updatingId === ord.orderId ? 'Calling Server...' : 'MARK COOKED & READY (CALL WAITER)'}</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleSetStatus(ord.orderId, 'Completed')}
                      disabled={updatingId === ord.orderId}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-headline font-black py-3 px-4 text-xs sm:text-sm uppercase tracking-wider border-2 border-black rounded-xl newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>✓</span>
                      <span>{updatingId === ord.orderId ? 'Completing...' : 'MARK SERVED TO TABLE'}</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="text-center font-typewriter text-[11px] text-[#71695f] py-1 font-bold">
                      ✓ Order successfully served to Table #{ord.tableNo}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FoodControl;

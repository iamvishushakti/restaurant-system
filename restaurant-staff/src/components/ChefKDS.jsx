import React, { useState, useEffect } from 'react';
import { updateOrderStatus } from '../api/staffApi';
import { sounds } from '../utils/audio';

const KDS_TABS = [
  { id: 'ALL', label: '🔥 All Active Tickets' },
  { id: 'Pending', label: '⏳ Pending Confirmation' },
  { id: 'In Preparation', label: '👨‍🍳 In Preparation (Cooking)' },
  { id: 'Ready to Serve', label: '🍲 Ready to Serve' },
  { id: 'Completed', label: '✅ Completed History' },
];

export const ChefKDS = ({ orders = [], onOrderUpdated }) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [chefName, setChefName] = useState('Executive Chef Mario');
  const [updatingId, setUpdatingId] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Refresh clock for elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      if (newStatus === 'Ready to Serve') {
        sounds.playFoodReady();
      } else {
        sounds.playTick();
      }

      await updateOrderStatus(orderId, newStatus, chefName);
      if (onOrderUpdated) onOrderUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders
  let filteredOrders = [...orders];
  if (activeTab === 'ALL') {
    filteredOrders = filteredOrders.filter((o) => o.status !== 'Completed');
  } else {
    filteredOrders = filteredOrders.filter((o) => o.status === activeTab);
  }

  // Calculate elapsed time string
  const getElapsedString = (orderTime) => {
    if (!orderTime) return 'Just now';
    const diffSec = Math.floor((now - new Date(orderTime).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-5 items-start font-editorial w-full">
      {/* Left Sidebar Menu */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4 font-typewriter">
        <div className="bg-[#fffdf9] border-3 border-[#1a1612] p-4 rounded-2xl newspaper-shadow space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#71695f] border-b-2 border-[#1a1612] pb-2 flex items-center justify-between">
            <span>👨‍🍳 KDS TICKETS</span>
            <span className="text-[9px] bg-red-800 text-white px-1.5 py-0.5 rounded font-black">BRIGADE</span>
          </div>

          <nav className="space-y-1.5">
            {KDS_TABS.map((tab) => {
              let count = 0;
              if (tab.id === 'ALL') count = orders.filter((o) => o.status !== 'Completed').length;
              else count = orders.filter((o) => o.status === tab.id).length;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 flex items-center justify-between ${
                    isActive
                      ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow-md scale-[1.01]'
                      : 'bg-[#eee7d7] text-[#1a1612] hover:bg-[#e4dac5] border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? 'bg-amber-400 text-black' : 'bg-[#1a1612] text-white'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Kitchen Sound & Station Master Widget */}
        <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-4 rounded-2xl space-y-3">
          <div className="text-[10px] font-bold uppercase text-[#554e45]">
            ★ STATION SETTINGS
          </div>
          <div>
            <label className="text-[9px] font-typewriter uppercase text-[#71695f] font-bold block mb-1">
              Active Brigade Head:
            </label>
            <input
              type="text"
              value={chefName}
              onChange={(e) => setChefName(e.target.value)}
              className="w-full bg-white font-typewriter text-xs font-bold text-[#1a1612] px-2.5 py-1.5 rounded-lg border border-[#1a1612]"
            />
          </div>
          <button
            onClick={() => sounds.playFoodReady()}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg border border-black cursor-pointer shadow flex items-center justify-center gap-1.5"
          >
            <span>🍲 Test Food Ready Chime</span>
          </button>
        </div>
      </aside>

      {/* Right Ticket Grid Workspace */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Top KDS Header */}
        <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 rounded-2xl newspaper-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-typewriter font-bold uppercase tracking-wider bg-red-900 text-white px-2 py-0.5 rounded">
                KITCHEN DISPLAY SYSTEM (KDS)
              </span>
              <span className="text-xs font-typewriter text-[#71695f]">
                Direct Table-to-Brigade Dispatch
              </span>
            </div>
            <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
              Executive Chef's Kitchen Station
            </h2>
          </div>

          {/* Chef Station Profile */}
          <div className="flex items-center gap-3 bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2 rounded-xl">
            <span className="text-2xl">👨‍🍳</span>
            <div>
              <label className="text-[9px] font-typewriter uppercase text-[#71695f] font-bold block">
                Active Station Master:
              </label>
              <input
                type="text"
                value={chefName}
                onChange={(e) => setChefName(e.target.value)}
                className="bg-white font-typewriter text-xs font-bold text-[#1a1612] px-2 py-1 rounded border border-[#1a1612]"
              />
            </div>
          </div>
        </div>
          {filteredOrders.length === 0 ? (
            <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-12 text-center newspaper-shadow font-typewriter rounded-2xl">
              <span className="text-5xl block mb-2">👨‍🍳</span>
              <h3 className="font-headline text-xl font-bold uppercase text-[#1a1612]">
                No Kitchen Tickets in this view
              </h3>
              <p className="text-xs text-[#71695f] mt-1">
                All current orders are prepped, or no pending dishes in this station tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'Pending';
                const isCooking = order.status === 'In Preparation';
            const isReady = order.status === 'Ready to Serve';
            const isCompleted = order.status === 'Completed';

            return (
              <div
                key={order.orderId}
                className={`bg-[#fffdf9] border-4 border-[#1a1612] rounded-lg p-5 newspaper-shadow relative flex flex-col justify-between ${
                  isReady ? 'ring-4 ring-green-600/60 bg-green-50/20' : ''
                }`}
              >
                {/* Top Ticket Header */}
                <div>
                  <div className="flex items-start justify-between border-b-2 border-[#1a1612] pb-3">
                    <div>
                      <span className="bg-[#1a1612] text-amber-300 font-typewriter text-[11px] font-black px-2 py-0.5 rounded uppercase">
                        TABLE #{order.tableNo}
                      </span>
                      <span className="font-typewriter text-xs text-[#71695f] ml-2 font-bold">
                        Round #{order.roundNumber || 1}
                      </span>
                      <div className="font-typewriter text-[11px] text-[#554e45] mt-1">
                        Folio: <strong className="text-[#1a1612]">#{order.orderId}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block font-typewriter text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          isPending
                            ? 'bg-blue-700 text-white'
                            : isCooking
                            ? 'bg-amber-600 text-white animate-pulse'
                            : isReady
                            ? 'bg-green-700 text-white animate-bounce'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {order.status}
                      </span>
                      <div className="font-typewriter text-[10px] text-[#71695f] mt-1 font-bold">
                        ⏳ {getElapsedString(order.orderedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Cooking Details & Assigned Chefs */}
                  <div className="bg-[#eee7d7]/80 p-2 rounded border border-[#1a1612] my-3 font-typewriter text-[11px] text-[#554e45]">
                    <div className="flex items-center justify-between">
                      <span>⏱️ Est. Prep: <strong>{order.prepMinutes || 15} mins</strong></span>
                      <span>👨‍🍳 {order.chefLabel || 'Master Brigade'}</span>
                    </div>
                    {order.specialNote && (
                      <div className="mt-1 text-red-900 font-bold border-t border-[#d1c7b7] pt-1">
                        ⚠️ Note: "{order.specialNote}"
                      </div>
                    )}
                  </div>

                  {/* Dishes Itemized List */}
                  <div className="space-y-2 my-4">
                    <div className="text-[10px] font-typewriter font-bold uppercase tracking-wider text-[#71695f] border-b border-[#d1c7b7] pb-1">
                      Ordered Dishes ({order.totalCount || order.items?.length} items):
                    </div>
                    <ul className="space-y-1.5 font-typewriter text-xs">
                      {(order.items || []).map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between bg-[#f7f3eb] p-2 rounded border border-[#d1c7b7]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-[#1a1612] text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                              {item.quantity || 1}x
                            </span>
                            <span className="font-bold text-[#1a1612]">
                              {item.name || item.title || 'Special Dish'}
                            </span>
                          </div>
                          <span className="text-[#71695f] text-[11px]">
                            {item.category || 'Kitchen Item'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-4 border-t-2 border-[#1a1612] space-y-2">
                  {isPending && (
                    <button
                      onClick={() => handleStatusChange(order.orderId, 'In Preparation')}
                      disabled={updatingId === order.orderId}
                      className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-typewriter font-extrabold py-3 px-4 rounded text-xs uppercase tracking-wider border-2 border-amber-950 newspaper-shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🔥 CONFIRM PREPARATION & START COOKING</span>
                    </button>
                  )}

                  {isCooking && (
                    <button
                      onClick={() => handleStatusChange(order.orderId, 'Ready to Serve')}
                      disabled={updatingId === order.orderId}
                      className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-typewriter font-extrabold py-3 px-4 rounded text-xs uppercase tracking-wider border-2 border-black newspaper-shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🍲 MARK PREPARED & READY TO SERVE (BELL CHIME)</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(order.orderId, 'Completed')}
                        disabled={updatingId === order.orderId}
                        className="flex-1 bg-[#1a1612] hover:bg-[#332c25] text-white font-typewriter font-bold py-2.5 px-3 rounded text-xs uppercase border border-black cursor-pointer"
                      >
                        ✓ Completed / Handed Over
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.orderId, 'In Preparation')}
                        className="bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-typewriter text-[10px] font-bold py-2.5 px-3 rounded border border-[#1a1612] cursor-pointer"
                      >
                        ↺ Re-cook
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-center font-typewriter text-xs text-green-900 font-bold bg-green-100 p-2 rounded border border-green-300">
                      ✓ Served & Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
        </div>
      </div>
  );
};

export default ChefKDS;

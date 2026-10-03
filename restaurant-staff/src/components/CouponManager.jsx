import React, { useState, useEffect } from 'react';
import { getCouponsApi, createCouponApi, updateCouponApi, deleteCouponApi } from '../api/staffApi';
import { sounds } from '../utils/audio';

export const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });

  // Create Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    title: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    description: '',
    validTill: '2026-12-31',
    badge: 'SPECIAL DEAL ✨',
    isPermanent: false,
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCouponsApi(false);
      if (res?.success && res.coupons) {
        setCoupons(res.coupons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.title || !newCoupon.discountValue) {
      setNotification({ type: 'error', text: 'Please fill in code, title, and discount value.' });
      return;
    }

    try {
      setSubmitting(true);
      sounds.playTick();
      const res = await createCouponApi({
        ...newCoupon,
        code: newCoupon.code.trim().toUpperCase(),
        discountValue: Number(newCoupon.discountValue),
        minOrderAmount: Number(newCoupon.minOrderAmount) || 0,
        maxDiscountAmount: Number(newCoupon.maxDiscountAmount) || 0,
      });

      if (res?.success) {
        setNotification({
          type: 'success',
          text: `✓ Coupon "${res.coupon.code}" created and published to all dining tables & customer devices!`,
        });
        setNewCoupon({
          code: '',
          title: '',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minOrderAmount: 0,
          maxDiscountAmount: 0,
          description: '',
          validTill: '2026-12-31',
          badge: 'SPECIAL DEAL ✨',
          isPermanent: false,
        });
        await loadCoupons();
        setTimeout(() => setNotification({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create coupon. Code might already exist.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    if (coupon.isPermanent) {
      setNotification({
        type: 'error',
        text: 'Permanent 10% and 20% dining offers cannot be deactivated.',
      });
      setTimeout(() => setNotification({ type: '', text: '' }), 3500);
      return;
    }

    try {
      sounds.playTick();
      const nextState = !coupon.isActive;
      await updateCouponApi(coupon.code, { isActive: nextState });
      setNotification({
        type: 'success',
        text: `✓ Coupon "${coupon.code}" is now ${nextState ? 'ACTIVE' : 'INACTIVE'}.`,
      });
      await loadCoupons();
      setTimeout(() => setNotification({ type: '', text: '' }), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (coupon.isPermanent) {
      setNotification({
        type: 'error',
        text: 'Permanent 10% & 20% offers are perpetual and cannot be deleted.',
      });
      setTimeout(() => setNotification({ type: '', text: '' }), 3500);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) {
      return;
    }

    try {
      sounds.playTick();
      await deleteCouponApi(coupon.code);
      setNotification({
        type: 'success',
        text: `✓ Coupon "${coupon.code}" deleted successfully.`,
      });
      await loadCoupons();
      setTimeout(() => setNotification({ type: '', text: '' }), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const activeCouponsCount = coupons.filter((c) => c.isActive !== false).length;
  const permanentCount = coupons.filter((c) => c.isPermanent).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (Number(c.usageCount) || 0), 0);

  return (
    <div className="space-y-6 pb-20 font-editorial">
      {/* Top Banner */}
      <div className="bg-white/94 backdrop-blur-2xl border-4 border-[#1a1612] p-5 sm:p-6 rounded-3xl newspaper-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-ui font-black uppercase tracking-wider bg-amber-400 text-black px-2.5 py-0.5 rounded-full shadow-xs">
              ★ DYNAMIC COUPON & OFFERS ENGINE
            </span>
            <span className="text-xs font-ui text-zinc-500 font-medium">
              Real-time synchronization across Billing Machine & Customer Apps
            </span>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-black uppercase text-[#1a1612] mt-1">
            Coupon & Promotional Voucher Manager
          </h2>
        </div>

        {/* Quick Refresh */}
        <button
          onClick={loadCoupons}
          disabled={loading}
          className="bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-ui font-bold text-xs uppercase px-4 py-2.5 rounded-xl border border-amber-400 newspaper-shadow-sm cursor-pointer transition active:scale-95"
        >
          {loading ? '↻ Refreshing...' : '↻ Refresh Coupons'}
        </button>
      </div>

      {/* Notification Toast */}
      {notification.text && (
        <div
          className={`p-4 rounded-2xl border-2 font-ui text-xs font-bold shadow-md flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-500'
              : 'bg-rose-50 text-rose-950 border-rose-500'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification({ type: '', text: '' })} className="cursor-pointer font-black ml-2">✕</button>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-ui">
        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612] p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Coupons</span>
            <span className="font-numbers font-black text-2xl text-[#1a1612]">{coupons.length}</span>
            <span className="text-[11px] text-zinc-600 block mt-0.5">🟢 {activeCouponsCount} Active Live</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl">🎟️</div>
        </div>

        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612] p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Permanent Offers</span>
            <span className="font-numbers font-black text-2xl text-amber-950">{permanentCount}</span>
            <span className="text-[11px] text-amber-800 font-bold block mt-0.5">10% & 20% Guaranteed</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-400 flex items-center justify-center text-xl">👑</div>
        </div>

        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612] p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Redemptions</span>
            <span className="font-numbers font-black text-2xl text-emerald-950">{totalRedemptions}</span>
            <span className="text-[11px] text-zinc-600 block mt-0.5">Across All Dining Tables</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-xl">💰</div>
        </div>

        <div className="bg-white/94 backdrop-blur-xl border-2 border-[#1a1612] p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Customer App Sync</span>
            <span className="font-numbers font-black text-xl text-emerald-800">LIVE SYNC</span>
            <span className="text-[11px] text-zinc-600 block mt-0.5">Instant WebSockets</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-300 flex items-center justify-center text-xl">⚡</div>
        </div>
      </div>

      {/* Main Grid: Left Form, Right List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Create New Coupon Form */}
        <div className="bg-white/94 backdrop-blur-2xl border-3 border-[#1a1612] p-5 sm:p-6 rounded-3xl newspaper-shadow font-typewriter space-y-4">
          <div className="border-b-2 border-[#1a1612] pb-2 flex items-center justify-between">
            <span className="bg-[#1a1612] text-amber-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">
              ➕ CREATE NEW VOUCHER
            </span>
            <span className="text-[10px] text-zinc-500">Auto-publishes</span>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Coupon Code: <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE15 or FLAT100"
                required
                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-mono font-bold text-[#1a1612] uppercase tracking-wider rounded focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Offer Title: <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                value={newCoupon.title}
                onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                placeholder="e.g. Weekend Family 15% Discount"
                required
                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] rounded focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Discount Type:
                </label>
                <select
                  value={newCoupon.discountType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-2 text-xs font-bold text-[#1a1612] rounded focus:bg-white focus:outline-none"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Discount Value: <span className="text-red-700">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={newCoupon.discountType === 'PERCENTAGE' ? 90 : 5000}
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                  required
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] rounded focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Min Order (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
                  placeholder="0 for none"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] rounded focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-1">
                  Max Cap (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCoupon.maxDiscountAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscountAmount: e.target.value })}
                  placeholder="0 = Unlimited"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] rounded focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Badge / Tag:
              </label>
              <input
                type="text"
                value={newCoupon.badge}
                onChange={(e) => setNewCoupon({ ...newCoupon, badge: e.target.value })}
                placeholder="e.g. HOT DEAL 🔥 or CHEF SPECIAL 👨‍🍳"
                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] rounded focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-[#1a1612] block mb-1">
                Description / Voucher Note:
              </label>
              <textarea
                rows={2}
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                placeholder="Terms and details for diners..."
                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs text-[#1a1612] rounded focus:bg-white focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-amber-300 font-bold py-3 px-4 rounded-xl text-xs uppercase border border-amber-400 newspaper-shadow-sm cursor-pointer disabled:opacity-50 transition"
            >
              {submitting ? 'PUBLISHING...' : '📢 PUBLISH & ACTIVATE VOUCHER'}
            </button>
          </form>
        </div>

        {/* Right: Active & Permanent Coupons Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/94 backdrop-blur-2xl border-3 border-[#1a1612] p-5 sm:p-6 rounded-3xl newspaper-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#1a1612] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-lg sm:text-xl font-black uppercase text-[#1a1612]">
                  Available Coupons & Vouchers ({coupons.length})
                </span>
              </div>
              <span className="text-xs font-ui text-zinc-500 font-semibold">
                Permanent 10% & 20% Guaranteed Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id || coupon.code}
                  className={`p-4 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                    coupon.isPermanent
                      ? 'bg-amber-50/90 border-amber-900 ring-2 ring-amber-400/30'
                      : coupon.isActive !== false
                      ? 'bg-white border-[#1a1612]'
                      : 'bg-zinc-100 border-zinc-300 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-black bg-[#1a1612] text-amber-300 px-2.5 py-0.5 rounded tracking-wider shadow-xs">
                        {coupon.code}
                      </span>
                      <span
                        className={`text-[9px] font-ui font-black px-2 py-0.5 rounded-full uppercase ${
                          coupon.isPermanent
                            ? 'bg-amber-900 text-amber-100'
                            : coupon.isActive !== false
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {coupon.isPermanent ? '👑 PERMANENT' : coupon.isActive !== false ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                      </span>
                    </div>

                    {/* Title & Discount Value */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-cinzel font-black text-base text-[#1a1612] leading-tight">
                        {coupon.title}
                      </h4>
                      <span className="font-numbers font-black text-xl text-red-900 shrink-0">
                        {coupon.discountType === 'FLAT' ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`} OFF
                      </span>
                    </div>

                    <p className="text-xs font-editorial text-zinc-700 mt-1 leading-relaxed">
                      {coupon.description || 'Promotional dining courtesy voucher.'}
                    </p>

                    <div className="mt-2 text-[10.5px] font-ui text-zinc-500 space-y-0.5">
                      <div>
                        • <strong>Min Order:</strong> {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : 'None'}
                        {coupon.maxDiscountAmount > 0 && ` • Max Cap: ₹${coupon.maxDiscountAmount}`}
                      </div>
                      <div>
                        • <strong>Usage Count:</strong> {coupon.usageCount || 0} times
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between gap-2 font-ui text-xs">
                    {coupon.isPermanent ? (
                      <span className="text-[10px] text-amber-900 font-bold italic">
                        ★ Perpetual Royal Discount (Always Active)
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                            coupon.isActive !== false
                              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {coupon.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 px-2.5 py-1 rounded-lg border border-rose-300 cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponManager;

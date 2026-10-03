import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  getTableBill,
  processPayment,
  getUserProfile,
  staffOverrideProfile,
  getCouponsApi,
  checkInTableApi,
} from '../api/staffApi';
import { sounds } from '../utils/audio';
import ReceiptPrintModal from './ReceiptPrintModal';

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const QUICK_MENU_DISHES = [
  { name: 'Butter Garlic Naan', price: 90, category: 'Breads' },
  { name: 'Paneer Butter Masala', price: 340, category: 'Main Course' },
  { name: 'Dal Makhani Heritage', price: 280, category: 'Main Course' },
  { name: 'Royal Dum Biryani', price: 360, category: 'Rice' },
  { name: 'Tandoori Chicken Tikka', price: 380, category: 'Starters' },
  { name: 'Royal Patiala Lassi', price: 140, category: 'Beverages' },
  { name: 'Mineral Spring Water', price: 40, category: 'Beverages' },
  { name: 'Kesari Rasmalai (2 Pcs)', price: 120, category: 'Desserts' },
];

export const CashierBillingMachine = ({
  selectedTable = '4',
  onTableChanged,
  onPaymentSettled,
}) => {
  // Billing Mode: 'TABLE' (Table live sync) vs 'GUEST_GENERATOR' (Custom/Guest Bill Generator)
  const [billingMode, setBillingMode] = useState('TABLE');
  const [tableNo, setTableNo] = useState(String(selectedTable || '4'));
  const [customTableLabel, setCustomTableLabel] = useState('Guest-T4');
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Editable Items List for the Bill
  const [activeItems, setActiveItems] = useState([]);

  // Quick Dish Add State
  const [selectedQuickDish, setSelectedQuickDish] = useState(QUICK_MENU_DISHES[0].name);
  const [customDishName, setCustomDishName] = useState('');
  const [customDishPrice, setCustomDishPrice] = useState('');
  const [customDishQty, setCustomDishQty] = useState(1);
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);

  // Dynamic Coupons State
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [customCouponInput, setCustomCouponInput] = useState('');

  // Extra Custom Cashier Discount
  const [extraDiscountType, setExtraDiscountType] = useState('PERCENTAGE'); // 'PERCENTAGE' or 'FLAT'
  const [extraDiscountValue, setExtraDiscountValue] = useState(0);
  const [extraDiscountReason, setExtraDiscountReason] = useState('Staff Privilege Courtesy');

  // Patron Loyalty Coins / Wallet State
  const [patronCoins, setPatronCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);

  // Payment & Settlement State
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [settledBill, setSettledBill] = useState(null);
  const [notification, setNotification] = useState({ type: '', text: '' });

  // Patron Dossier
  const [patronDossier, setPatronDossier] = useState({
    name: '',
    phone: '',
    dob: '',
    anniversaryDate: '',
    email: '',
  });
  const [savingDossier, setSavingDossier] = useState(false);

  // Load Coupons from backend
  const loadCoupons = async () => {
    try {
      const res = await getCouponsApi(true);
      if (res?.success && res.coupons) {
        setCoupons(res.coupons);
      }
    } catch (e) {
      console.warn('Coupon fetch error:', e.message);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    if (selectedTable && billingMode === 'TABLE') {
      setTableNo(String(selectedTable));
    }
  }, [selectedTable, billingMode]);

  useEffect(() => {
    if (billingMode === 'TABLE') {
      loadBillForTable(tableNo);
    }
  }, [tableNo, billingMode]);

  const loadBillForTable = async (tNo) => {
    try {
      setLoading(true);
      const res = await getTableBill(tNo);
      if (res?.success && res.bill) {
        setBillData(res.bill);
        setActiveItems(res.bill.items || []);

        const isOccupied = Boolean(res.bill.isTableOccupied);
        const userEmail = (isOccupied && res.bill.customerEmail) ? res.bill.customerEmail : '';

        if (isOccupied && userEmail) {
          let walletCoins = res.bill.walletBalance || 0;
          try {
            const uRes = await getUserProfile(userEmail);
            if (uRes?.user) {
              setPatronDossier({
                name: uRes.user.name || res.bill.customerName || '',
                phone: uRes.user.phone || res.bill.customerPhone || '',
                dob: uRes.user.dob ? uRes.user.dob.split('T')[0] : '',
                anniversaryDate: uRes.user.anniversaryDate ? uRes.user.anniversaryDate.split('T')[0] : '',
                email: uRes.user.email || userEmail,
              });
              walletCoins = Number(uRes.user.walletBalance) || walletCoins;
            }
          } catch (err) {
            setPatronDossier({
              name: res.bill.customerName || '',
              phone: res.bill.customerPhone || '',
              dob: res.bill.dob ? String(res.bill.dob).split('T')[0] : '',
              anniversaryDate: res.bill.anniversaryDate ? String(res.bill.anniversaryDate).split('T')[0] : '',
              email: userEmail,
            });
          }

          setPatronCoins(walletCoins);
          setCoinsToRedeem(walletCoins);
        } else {
          // Table has NO orders / is unoccupied: Clean blank slate!
          setPatronDossier({
            name: '',
            phone: '',
            dob: '',
            anniversaryDate: '',
            email: '',
          });
          setPatronCoins(0);
          setCoinsToRedeem(0);
          setUseCoins(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newTable) => {
    setTableNo(String(newTable));
    if (onTableChanged) onTableChanged(String(newTable));
  };

  // Switch between Standard Table mode and Guest Bill Generator mode
  const handleModeSwitch = (mode) => {
    sounds.playTick();
    setBillingMode(mode);
    if (mode === 'GUEST_GENERATOR') {
      setCustomTableLabel(`Guest-T${tableNo}`);
      // Start with completely blank zero items as requested!
      setActiveItems([]);
      // Start with clean blank guest dossier (no pre-selected customer)
      setPatronDossier({
        name: '',
        phone: '',
        dob: '',
        anniversaryDate: '',
        email: '',
      });
      setPatronCoins(0);
      setCoinsToRedeem(0);
      setUseCoins(false);
      setSelectedCouponCode('');
      setCustomCouponInput('');
      setExtraDiscountValue(0);
    } else {
      loadBillForTable(tableNo);
    }
  };

  // Add Item to Bill
  const handleAddQuickDish = (dish) => {
    sounds.playTick();
    setActiveItems((prev) => {
      const idx = prev.findIndex((i) => (i.name || i.title) === dish.name);
      if (idx !== -1) {
        const updated = [...prev];
        const newQty = (Number(updated[idx].quantity) || 1) + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          totalPrice: (Number(updated[idx].price || updated[idx].unitPrice) || dish.price) * newQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          name: dish.name,
          price: dish.price,
          unitPrice: dish.price,
          quantity: 1,
          totalPrice: dish.price,
          category: dish.category,
        },
      ];
    });
  };

  const handleAddCustomDish = (e) => {
    if (e) e.preventDefault();
    if (!customDishName || !customDishPrice) return;
    sounds.playTick();

    const price = parseFloat(customDishPrice) || 0;
    const qty = parseInt(customDishQty, 10) || 1;

    setActiveItems((prev) => [
      ...prev,
      {
        name: customDishName.trim(),
        price,
        unitPrice: price,
        quantity: qty,
        totalPrice: price * qty,
        category: 'Custom Provision',
      },
    ]);

    setCustomDishName('');
    setCustomDishPrice('');
    setCustomDishQty(1);
    setShowCustomItemForm(false);
  };

  // Modify Item Quantity
  const handleUpdateItemQty = (index, delta) => {
    sounds.playTick();
    setActiveItems((prev) => {
      const updated = [...prev];
      const currentQty = Number(updated[index].quantity) || 1;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      const unitPrice = Number(updated[index].price || updated[index].unitPrice) || 0;
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        totalPrice: unitPrice * newQty,
      };
      return updated;
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    sounds.playTick();
    setActiveItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all items
  const handleClearAllItems = () => {
    sounds.playTick();
    setActiveItems([]);
  };

  // Save Patron Dossier (Staff Override)
  const handleSavePatronDossier = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingDossier(true);
      const res = await staffOverrideProfile({
        email: patronDossier.email,
        name: patronDossier.name,
        phone: patronDossier.phone,
        dob: patronDossier.dob || null,
        anniversaryDate: patronDossier.anniversaryDate || null,
        unlockFields: false,
      });

      if (res?.success) {
        setNotification({
          type: 'success',
          text: '✓ Patron Dossier updated by Cashier machine! Privileges & Coins refreshed.',
        });
        if (billingMode === 'TABLE') {
          await loadBillForTable(tableNo);
        }
        setTimeout(() => setNotification({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: 'Failed to update patron dossier from billing machine.',
      });
    } finally {
      setSavingDossier(false);
    }
  };

  // Direct Assign / Seat Table with Patron Profile & Coins
  const handleDirectAssignTable = async (targetTNo = tableNo) => {
    const finalTableNo = String(targetTNo || tableNo);
    const email = patronDossier.email?.trim() || '';
    const name = patronDossier.name?.trim() || (email ? email.split('@')[0] : 'Seated Patron');
    const phone = patronDossier.phone?.trim() || '';

    try {
      sounds.playTick();
      setSavingDossier(true);
      const res = await checkInTableApi({
        tableNo: finalTableNo,
        customerEmail: email,
        customerName: name,
        customerPhone: phone,
      });

      if (res?.success) {
        sounds.playBell();
        setNotification({
          type: 'success',
          text: `✓ Table #${finalTableNo} directly assigned to ${name}! Table is now OCCUPIED & coins linked.`,
        });
        if (billingMode === 'TABLE') {
          setTableNo(finalTableNo);
          await loadBillForTable(finalTableNo);
        }
        setTimeout(() => setNotification({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: 'Failed to assign table. Please retry.',
      });
      setTimeout(() => setNotification({ type: '', text: '' }), 3500);
    } finally {
      setSavingDossier(false);
    }
  };

  // ==========================================
  // FINANCIAL CALCULATIONS & BREAKDOWN
  // ==========================================
  const subtotal = activeItems.reduce((sum, it) => {
    const p = typeof it.price === 'string' ? parseFloat(it.price.replace(/[^\d.]/g, '')) || 0 : Number(it.price) || Number(it.unitPrice) || 0;
    const q = Number(it.quantity) || 1;
    return sum + p * q;
  }, 0);

  // 1. Celebration Discount (20% if Birthday/Anniversary)
  const isCelebration = Boolean(billData?.isBirthday || billData?.isAnniversary);
  const celebrationDiscount = isCelebration ? Math.round(subtotal * 0.20) : 0;
  const celebrationReason = billData?.discountReason || (isCelebration ? 'Birthday / Anniversary Celebration (20% OFF)' : '');

  // 2. Dynamic Coupon Discount
  const appliedCoupon = coupons.find(
    (c) => c.code.toUpperCase() === (selectedCouponCode || customCouponInput).trim().toUpperCase()
  );
  let couponDiscount = 0;
  let couponReason = '';

  if (appliedCoupon && appliedCoupon.isActive !== false) {
    if (appliedCoupon.minOrderAmount === 0 || subtotal >= appliedCoupon.minOrderAmount) {
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        couponDiscount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
        if (appliedCoupon.maxDiscountAmount > 0) {
          couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscountAmount);
        }
      } else {
        couponDiscount = Math.min(subtotal, Number(appliedCoupon.discountValue) || 0);
      }
      couponReason = `Coupon "${appliedCoupon.code}" (${appliedCoupon.discountType === 'FLAT' ? `₹${appliedCoupon.discountValue}` : `${appliedCoupon.discountValue}%`} OFF)`;
    }
  }

  // 3. Extra Cashier / Staff Custom Discount
  let extraDiscountAmount = 0;
  if (Number(extraDiscountValue) > 0) {
    if (extraDiscountType === 'PERCENTAGE') {
      extraDiscountAmount = Math.round((subtotal * Number(extraDiscountValue)) / 100);
    } else {
      extraDiscountAmount = Math.min(subtotal, Number(extraDiscountValue));
    }
  }

  // Combined Total Discounts
  const totalDiscountAmount = celebrationDiscount + couponDiscount + extraDiscountAmount;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscountAmount);

  // 4. Tax (5% GST)
  const tax = Math.round(discountedSubtotal * 0.05);

  // 5. Grand Total Before Coins
  const grandTotalBeforeCoins = discountedSubtotal + tax;

  // 6. Loyalty Coins Usage (1 Coin = ₹1)
  const availableCoins = Math.max(0, Number(patronCoins) || 0);
  const actualCoinsUsed = useCoins
    ? Math.min(availableCoins, Math.min(Number(coinsToRedeem) || availableCoins, grandTotalBeforeCoins))
    : 0;

  // 7. Final Net Payable Amount
  const finalPayable = Math.max(0, grandTotalBeforeCoins - actualCoinsUsed);
  const estimatedCashback = Math.round(finalPayable * 0.10); // 10%

  // Combined Discount Reason for Receipt
  const combinedDiscountReason = [
    celebrationReason,
    couponReason,
    extraDiscountAmount > 0 ? `${extraDiscountReason} (-₹${extraDiscountAmount})` : '',
  ]
    .filter(Boolean)
    .join(' + ');

  // Settle Payment
  const handleSettlePayment = async () => {
    if (activeItems.length === 0) {
      setNotification({ type: 'error', text: 'Please add at least 1 dish item to bill.' });
      return;
    }

    try {
      setProcessing(true);
      setNotification({ type: '', text: '' });

      const targetTableNo = billingMode === 'GUEST_GENERATOR' ? customTableLabel : tableNo;

      const payload = {
        tableNo: targetTableNo,
        customerEmail: patronDossier.email || 'vkshakti.office@gmail.com',
        customerName: patronDossier.name || 'Esteemed Patron',
        paymentMethod,
        transactionId: transactionId.trim() || '',
        redeemWalletAmount: actualCoinsUsed,
        items: activeItems,
        subtotal,
        discountAmount: totalDiscountAmount,
        discountReason: combinedDiscountReason || 'Promotional Courtesy',
        tax,
        finalPaid: finalPayable,
        staffCashier: 'Front Desk Master Cashier',
      };

      const res = await processPayment(payload);

      if (res?.success) {
        sounds.playCashRegister();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Attach rich details for receipt printing
        setSettledBill({
          ...res.bill,
          couponCode: appliedCoupon?.code || '',
          couponDiscount,
          extraDiscount: extraDiscountAmount,
          coinsUsed: actualCoinsUsed,
        });

        setTransactionId('');
        setNotification({
          type: 'success',
          text: `🎉 Bill Settled! Ref #${res.bill.transactionId || 'TXN'} • ${actualCoinsUsed > 0 ? `Used ${actualCoinsUsed} Coins (-₹${actualCoinsUsed}) • ` : ''}₹${res.wallet.cashbackEarned} (10% Cashback) credited to patron wallet!`,
        });

        if (onPaymentSettled) onPaymentSettled();
        if (billingMode === 'TABLE') {
          await loadBillForTable(tableNo);
        }
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        text: 'Failed to process payment settlement. Please retry.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleLookupPatron = async () => {
    if (!patronDossier.email) {
      setNotification({ type: 'error', text: 'Enter an email first to lookup account.' });
      setTimeout(() => setNotification({ type: '', text: '' }), 3000);
      return;
    }
    try {
      sounds.playTick();
      const uRes = await getUserProfile(patronDossier.email.trim());
      if (uRes?.user) {
        setPatronDossier({
          name: uRes.user.name || '',
          phone: uRes.user.phone || '',
          dob: uRes.user.dob ? uRes.user.dob.split('T')[0] : '',
          anniversaryDate: uRes.user.anniversaryDate ? uRes.user.anniversaryDate.split('T')[0] : '',
          email: uRes.user.email,
        });
        const coins = Number(uRes.user.walletBalance) || 0;
        setPatronCoins(coins);
        setCoinsToRedeem(coins);
        setNotification({
          type: 'success',
          text: `✓ Found patron account for ${uRes.user.name || uRes.user.email}! Available Coins: ${coins}.`,
        });
        setTimeout(() => setNotification({ type: '', text: '' }), 3500);
      } else {
        setNotification({
          type: 'error',
          text: 'No existing registered account found for this email. New dossier will be saved on billing.',
        });
        setTimeout(() => setNotification({ type: '', text: '' }), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearPatron = () => {
    sounds.playTick();
    setPatronDossier({
      name: '',
      phone: '',
      dob: '',
      anniversaryDate: '',
      email: '',
    });
    setPatronCoins(0);
    setCoinsToRedeem(0);
    setUseCoins(false);
  };

  return (
    <div className="font-editorial">
      <div className="flex flex-col md:flex-row gap-5 items-start w-full">
        {/* Left Sidebar Menu Column */}
        <aside className="w-full md:w-64 lg:w-80 shrink-0 space-y-4 font-typewriter">
          {/* Mode Selector & Table / Guest Picker */}
          <div className="bg-[#fffdf9]/95 backdrop-blur-md border-3 border-[#1a1612] p-4 rounded-2xl newspaper-shadow space-y-3">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eee7d7] rounded-xl border border-[#1a1612]">
              <button
                type="button"
                onClick={() => handleModeSwitch('TABLE')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer ${
                  billingMode === 'TABLE'
                    ? 'bg-[#1a1612] text-amber-300 shadow-sm'
                    : 'text-[#1a1612] hover:bg-[#ded4be]'
                }`}
              >
                🧾 Table Bill
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('GUEST_GENERATOR')}
                className={`py-1.5 px-2 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer flex items-center justify-center gap-1 ${
                  billingMode === 'GUEST_GENERATOR'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-[#1a1612] hover:bg-[#ded4be]'
                }`}
              >
                <span>✨ Guest Generator</span>
              </button>
            </div>

            {billingMode === 'TABLE' ? (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#71695f] border-b border-[#1a1612]/30 pb-2 mb-2 flex items-center justify-between">
                  <span>SELECT TABLE</span>
                  <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black">12 TABLES</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TABLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTableChange(t)}
                      className={`py-2 px-1 rounded-xl font-typewriter text-xs font-bold transition cursor-pointer border-2 text-center flex flex-col items-center justify-center ${
                        String(tableNo) === String(t)
                          ? 'bg-[#1a1612] text-amber-300 border-amber-400 font-black shadow-md scale-105'
                          : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#e4dac5]'
                      }`}
                    >
                      <span className="text-[10px] text-zinc-500 font-normal">T-</span>
                      <span className="text-sm font-black">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-950 border-b border-amber-900/30 pb-1.5 flex items-center justify-between">
                  <span>GUEST / TAKEAWAY IDENTIFIER</span>
                  <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">CUSTOM</span>
                </div>
                <input
                  type="text"
                  value={customTableLabel}
                  onChange={(e) => setCustomTableLabel(e.target.value)}
                  placeholder="e.g. VIP-Table-4 or Takeaway #102"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-1.5 text-xs text-[#1a1612] font-bold rounded focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Patron Dossier Card (Profile, Birthday, Loyalty Coins) */}
          <div className="bg-[#fffdf9]/95 backdrop-blur-md border-3 border-[#1a1612] p-4 rounded-2xl newspaper-shadow space-y-3">
            <div className="border-b-2 border-[#1a1612] pb-2 flex items-center justify-between">
              <span className="bg-[#1a1612] text-amber-300 font-typewriter text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                PATRON DOSSIER & COINS
              </span>
              <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                <span>🪙</span>
                <span>{patronCoins} Coins</span>
              </span>
            </div>

            <form onSubmit={handleSavePatronDossier} className="space-y-2.5 font-typewriter text-xs">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="font-bold uppercase text-[#1a1612] text-[10.5px]">
                    Patron Email (Account Lookup):
                  </label>
                  {patronDossier.email && (
                    <button
                      type="button"
                      onClick={handleClearPatron}
                      className="text-[9.5px] text-red-800 hover:text-red-950 font-bold underline cursor-pointer"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  <input
                    type="email"
                    value={patronDossier.email}
                    onChange={(e) => setPatronDossier({ ...patronDossier, email: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookupPatron();
                      }
                    }}
                    placeholder="patron@example.com (Check Coins)"
                    className="flex-1 bg-[#eee7d7] border-2 border-[#1a1612] px-2 py-1.5 text-xs text-[#1a1612] font-semibold focus:outline-none focus:bg-white rounded"
                  />
                  <button
                    type="button"
                    onClick={handleLookupPatron}
                    title="Check Patron Account & Coins"
                    className="bg-[#1a1612] text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer hover:bg-[#332c25] flex items-center gap-1"
                  >
                    <span>🔍</span>
                    <span>Check</span>
                  </button>
                </div>
              </div>

              {/* Account Found & Coin Balance Badge */}
              {patronCoins > 0 && (
                <div className="p-2 bg-amber-100 border border-amber-400 rounded-lg flex items-center justify-between text-[11px] font-bold text-amber-950">
                  <span className="flex items-center gap-1">
                    <span>🪙</span>
                    <span><strong>{patronCoins} Coins</strong> Available</span>
                  </span>
                  <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded text-[10px] font-black">
                    ₹{patronCoins} Value
                  </span>
                </div>
              )}

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-0.5 text-[10.5px]">
                  Patron Name:
                </label>
                <input
                  type="text"
                  value={patronDossier.name}
                  onChange={(e) => setPatronDossier({ ...patronDossier, name: e.target.value })}
                  placeholder="Enter guest name"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-1.5 text-xs text-[#1a1612] font-semibold focus:outline-none focus:bg-white rounded"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-[#1a1612] block mb-0.5 text-[10.5px]">
                  Telephone:
                </label>
                <input
                  type="tel"
                  value={patronDossier.phone}
                  onChange={(e) => setPatronDossier({ ...patronDossier, phone: e.target.value })}
                  placeholder="Enter mobile number"
                  className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-2.5 py-1.5 text-xs text-[#1a1612] font-semibold focus:outline-none focus:bg-white rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="font-bold uppercase text-[#1a1612] block text-[10px] mb-0.5">
                    🎂 Birthday:
                  </label>
                  <input
                    type="date"
                    value={patronDossier.dob}
                    onChange={(e) => setPatronDossier({ ...patronDossier, dob: e.target.value })}
                    className="w-full bg-[#eee7d7] border border-[#1a1612] px-1.5 py-1 text-[11px] text-[#1a1612] font-semibold rounded focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[#1a1612] block text-[10px] mb-0.5">
                    💍 Anniversary:
                  </label>
                  <input
                    type="date"
                    value={patronDossier.anniversaryDate}
                    onChange={(e) => setPatronDossier({ ...patronDossier, anniversaryDate: e.target.value })}
                    className="w-full bg-[#eee7d7] border border-[#1a1612] px-1.5 py-1 text-[11px] text-[#1a1612] font-semibold rounded focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons: Direct Assign Table & Save Profile */}
              <div className="space-y-1.5 pt-1">
                {billingMode === 'TABLE' ? (
                  <button
                    type="button"
                    onClick={() => handleDirectAssignTable(tableNo)}
                    disabled={savingDossier}
                    className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-typewriter font-black py-2 px-3 text-xs uppercase border-2 border-amber-950 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                  >
                    <span>🪑</span>
                    <span>{savingDossier ? 'ASSIGNING...' : `SEAT & ASSIGN TABLE #${tableNo}`}</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-600 block uppercase">Assign to Dining Table:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {TABLES.slice(0, 8).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleDirectAssignTable(t)}
                          disabled={savingDossier}
                          className="bg-[#eee7d7] hover:bg-amber-300 text-[#1a1612] font-bold text-[10px] py-1 rounded border border-[#1a1612] cursor-pointer"
                        >
                          Seat T-{t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingDossier}
                  className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-amber-300 font-typewriter font-bold py-1.5 px-3 text-[11px] uppercase border border-amber-400 rounded-lg cursor-pointer disabled:opacity-50 transition"
                >
                  {savingDossier ? 'SAVING...' : '💾 SAVE PROFILE & OVERRIDE'}
                </button>
              </div>
            </form>
          </div>
        </aside>

        {/* Right Main Billing Workspace Column */}
        <div className="flex-1 min-w-0 space-y-5 font-typewriter">
          {/* Top Banner with Notification */}
          <div className="bg-[#fffdf9]/95 backdrop-blur-md border-4 border-[#1a1612] p-5 rounded-2xl newspaper-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                  billingMode === 'GUEST_GENERATOR'
                    ? 'bg-amber-600 text-white border-amber-800'
                    : 'bg-amber-400 text-black border-amber-950'
                }`}>
                  {billingMode === 'GUEST_GENERATOR' ? '✨ GUEST BILL GENERATOR' : 'FISCAL CASHIER MACHINE'}
                </span>
                <span className="text-xs text-[#71695f]">
                  Editable Items • Dynamic Coupons • 🪙 Coins Redemption • 10% Cashback
                </span>
              </div>
              <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612] mt-1">
                {billingMode === 'GUEST_GENERATOR'
                  ? `Manual Guest Bill Builder (${customTableLabel})`
                  : `Front Desk Billing Counter (Table #${tableNo})`}
              </h2>
            </div>

            {billingMode === 'TABLE' && (
              <button
                onClick={() => loadBillForTable(tableNo)}
                disabled={loading}
                className="bg-[#1a1612] text-amber-300 hover:bg-[#332c25] text-xs font-bold uppercase px-3 py-2 rounded-lg border border-amber-400 cursor-pointer"
              >
                {loading ? '↻ Syncing...' : '↻ Refresh Table'}
              </button>
            )}
          </div>

          {notification.text && (
            <div
              className={`p-3.5 rounded-xl border-2 text-xs font-bold ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-500'
                  : 'bg-rose-50 text-rose-950 border-rose-500'
              }`}
            >
              {notification.text}
            </div>
          )}

          {/* Main Bill Container */}
          <div className="bg-[#fffdf9]/95 backdrop-blur-md border-4 border-[#1a1612] p-5 sm:p-6 newspaper-shadow rounded-2xl space-y-4">
            {/* Header / Table Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#1a1612] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#1a1612] text-amber-300 text-xs font-bold px-2.5 py-1 rounded uppercase">
                  {billingMode === 'GUEST_GENERATOR' ? customTableLabel : `TABLE #${tableNo}`}
                </span>
                <span className="text-xs text-[#554e45]">
                  ({activeItems.length} active dish entries)
                </span>
              </div>

              {/* Quick Preset Dish Add Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-zinc-600">Quick Add:</span>
                {QUICK_MENU_DISHES.slice(0, 4).map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => handleAddQuickDish(d)}
                    className="bg-[#eee7d7] hover:bg-amber-200 text-[#1a1612] font-bold text-[10px] px-2 py-1 rounded border border-[#1a1612] cursor-pointer transition active:scale-95"
                  >
                    + {d.name.split(' ')[0]} (₹{d.price})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                  className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-[10px] uppercase px-2 py-1 rounded border border-amber-950 cursor-pointer"
                >
                  {showCustomItemForm ? '✕ Close' : '+ Custom Dish'}
                </button>
              </div>
            </div>

            {/* Custom Item Form */}
            {showCustomItemForm && (
              <form
                onSubmit={handleAddCustomDish}
                className="p-3 bg-amber-50 border-2 border-amber-900 rounded-xl space-y-2 animate-fadeIn"
              >
                <div className="text-[10px] font-black uppercase text-amber-950 flex justify-between">
                  <span>➕ ADD CUSTOM DISH / PROVISION TO BILL</span>
                  <span className="text-zinc-500">Live Item Addition</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={customDishName}
                    onChange={(e) => setCustomDishName(e.target.value)}
                    placeholder="Dish / Provision Name (e.g. Extra Roti)"
                    required
                    className="sm:col-span-2 bg-white border border-[#1a1612] px-2.5 py-1.5 text-xs font-bold rounded"
                  />
                  <input
                    type="number"
                    min="1"
                    value={customDishPrice}
                    onChange={(e) => setCustomDishPrice(e.target.value)}
                    placeholder="Price (₹)"
                    required
                    className="bg-white border border-[#1a1612] px-2.5 py-1.5 text-xs font-bold rounded"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={customDishQty}
                      onChange={(e) => setCustomDishQty(e.target.value)}
                      placeholder="Qty"
                      className="w-16 bg-white border border-[#1a1612] px-2 py-1.5 text-xs font-bold rounded text-center"
                    />
                    <button
                      type="submit"
                      className="flex-1 bg-[#1a1612] hover:bg-[#332c25] text-amber-300 font-bold text-xs uppercase py-1.5 px-2 rounded cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Celebration Banner (If Birthday or Anniversary) */}
            {isCelebration && (
              <div className="p-3 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border-2 border-amber-900 rounded-lg flex items-center justify-between newspaper-shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <div className="font-headline font-black text-xs uppercase text-red-950">
                      {celebrationReason}
                    </div>
                    <div className="text-[11px] text-[#554e45]">
                      Patron qualifies for <strong>20% OFF</strong> celebration courtesy deduction!
                    </div>
                  </div>
                </div>
                <span className="bg-red-900 text-white text-xs font-bold px-2.5 py-1 rounded uppercase">
                  -20% OFF (-₹{celebrationDiscount})
                </span>
              </div>
            )}

            {/* Editable Itemized Table */}
            {activeItems.length === 0 ? (
              <div className="p-8 text-center bg-[#eee7d7]/40 border-2 border-dashed border-[#1a1612] rounded-lg my-3">
                <span className="text-3xl block mb-2">🍽️</span>
                <h4 className="font-headline font-bold text-base uppercase text-[#1a1612]">
                  No Items on Bill
                </h4>
                <p className="text-xs text-[#71695f] mt-1">
                  Use "Quick Add" buttons above or custom dish form to add items.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#1a1612] text-[#1a1612] text-[11px]">
                      <th className="py-2 uppercase">Dish / Item</th>
                      <th className="py-2 text-center uppercase">Qty (Edit)</th>
                      <th className="py-2 text-right uppercase">Unit Price</th>
                      <th className="py-2 text-right uppercase">Total</th>
                      <th className="py-2 text-center uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1c7b7]">
                    {activeItems.map((item, idx) => {
                      const itemUnitPrice = Number(item.price || item.unitPrice) || 0;
                      const itemQty = Number(item.quantity) || 1;
                      const itemTotal = itemUnitPrice * itemQty;

                      return (
                        <tr key={idx} className="hover:bg-[#f7f3eb]">
                          <td className="py-2.5 font-bold text-[#1a1612]">
                            {item.name || item.title || 'Special Dish'}
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-[#eee7d7] px-2 py-0.5 rounded border border-[#1a1612]">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, -1)}
                                className="font-black text-xs text-red-900 hover:text-red-700 px-1 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-bold text-xs min-w-[16px] text-center">{itemQty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, 1)}
                                className="font-black text-xs text-emerald-900 hover:text-emerald-700 px-1 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 text-right text-[#554e45]">₹{itemUnitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-bold text-[#1a1612]">
                            ₹{itemTotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Delete Item"
                              className="text-red-800 hover:text-red-950 font-bold text-xs p-1 cursor-pointer"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ========================================================= */}
            {/* DYNAMIC COUPON & EXTRA DISCOUNT & COIN REDEMPTION PANEL */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t-2 border-[#1a1612]/30">
              {/* Box 1: Dynamic Coupon Selector */}
              <div className="bg-[#eee7d7]/70 border-2 border-[#1a1612] p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-[#1a1612] flex items-center gap-1">
                    <span>🎟️ Apply Dynamic Coupon:</span>
                  </label>
                  <span className="text-[9px] bg-[#1a1612] text-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">
                    10% & 20% Permanent
                  </span>
                </div>

                <div className="space-y-1.5">
                  <select
                    value={selectedCouponCode}
                    onChange={(e) => {
                      sounds.playTick();
                      setSelectedCouponCode(e.target.value);
                      if (e.target.value) setCustomCouponInput('');
                    }}
                    className="w-full bg-white border-2 border-[#1a1612] px-2.5 py-1.5 text-xs font-bold text-[#1a1612] rounded focus:outline-none"
                  >
                    <option value="">-- Select Active Coupon / Offer --</option>
                    {coupons.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.title} ({c.discountType === 'FLAT' ? `₹${c.discountValue} Flat` : `${c.discountValue}%`} OFF)
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customCouponInput}
                      onChange={(e) => {
                        setCustomCouponInput(e.target.value.toUpperCase());
                        if (e.target.value) setSelectedCouponCode('');
                      }}
                      placeholder="Or enter promo code..."
                      className="flex-1 bg-white border border-[#1a1612] px-2.5 py-1 text-xs uppercase font-mono font-bold rounded"
                    />
                    {(selectedCouponCode || customCouponInput) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCouponCode('');
                          setCustomCouponInput('');
                        }}
                        className="bg-zinc-200 text-zinc-800 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {couponDiscount > 0 && (
                    <div className="text-[11px] font-bold text-emerald-900 bg-emerald-100 p-1.5 rounded border border-emerald-300 flex justify-between items-center">
                      <span>✓ {couponReason}</span>
                      <span className="text-sm font-black text-emerald-950">-₹{couponDiscount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Extra Cashier Custom Discount */}
              <div className="bg-[#eee7d7]/70 border-2 border-[#1a1612] p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-[#1a1612]">
                    <span>🏷️ Cashier Extra Discount:</span>
                  </label>
                  <span className="text-[9px] text-zinc-500 font-bold">Staff Courtesy</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={extraDiscountType}
                    onChange={(e) => setExtraDiscountType(e.target.value)}
                    className="bg-white border-2 border-[#1a1612] px-1.5 py-1 text-xs font-bold rounded"
                  >
                    <option value="PERCENTAGE">% Percent</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={extraDiscountType === 'PERCENTAGE' ? 100 : subtotal}
                    value={extraDiscountValue}
                    onChange={(e) => setExtraDiscountValue(e.target.value)}
                    placeholder="0"
                    className="bg-white border-2 border-[#1a1612] px-2 py-1 text-xs font-bold rounded text-center"
                  />
                  <input
                    type="text"
                    value={extraDiscountReason}
                    onChange={(e) => setExtraDiscountReason(e.target.value)}
                    placeholder="Reason..."
                    className="bg-white border border-[#1a1612] px-2 py-1 text-[11px] rounded"
                  />
                </div>

                {extraDiscountAmount > 0 && (
                  <div className="text-[11px] font-bold text-red-900 bg-red-100 p-1.5 rounded border border-red-300 flex justify-between items-center">
                    <span>- {extraDiscountReason} ({extraDiscountType === 'PERCENTAGE' ? `${extraDiscountValue}%` : `₹${extraDiscountValue}`}):</span>
                    <span className="text-sm font-black">-₹{extraDiscountAmount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* LOYALTY COINS REDEMPTION WIDGET (🪙 Use 200 Coins)        */}
            {/* ========================================================= */}
            <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-2 border-amber-900 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 newspaper-shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1a1612] text-amber-300 border border-amber-400 flex items-center justify-center text-2xl shadow-sm">
                  🪙
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-black text-sm uppercase text-[#1a1612]">
                      Patron Loyalty Coins Balance:
                    </span>
                    <span className="font-numbers font-black text-base bg-amber-400 text-black px-2 py-0.2 rounded-full shadow-xs">
                      {patronCoins} Coins (₹{patronCoins})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#554e45] mt-0.5">
                    1 Coin = ₹1.00 • 10% Cashback automatically reloads coins on every settlement!
                  </div>
                </div>
              </div>

              {/* Coin Usage Controls */}
              {patronCoins > 0 ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {patronCoins >= 200 && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playTick();
                          setUseCoins(true);
                          setCoinsToRedeem(200);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          useCoins && Number(coinsToRedeem) === 200
                            ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm'
                            : 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-100'
                        }`}
                      >
                        🪙 Use 200
                      </button>
                    )}
                    {patronCoins >= 500 && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playTick();
                          setUseCoins(true);
                          setCoinsToRedeem(500);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          useCoins && Number(coinsToRedeem) === 500
                            ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm'
                            : 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-100'
                        }`}
                      >
                        🪙 Use 500
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTick();
                        setUseCoins(true);
                        setCoinsToRedeem(Math.min(patronCoins, grandTotalBeforeCoins));
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        useCoins && Number(coinsToRedeem) >= Math.min(patronCoins, grandTotalBeforeCoins)
                          ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm'
                          : 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-100'
                      }`}
                    >
                      🪙 Use Max ({Math.min(patronCoins, grandTotalBeforeCoins)})
                    </button>
                  </div>

                  {/* Custom Coin Input & Clear */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={patronCoins}
                      value={useCoins ? coinsToRedeem : ''}
                      onChange={(e) => {
                        const val = Math.min(patronCoins, Math.max(0, parseInt(e.target.value, 10) || 0));
                        setCoinsToRedeem(val);
                        setUseCoins(val > 0);
                      }}
                      placeholder="Custom Coins..."
                      className="w-28 bg-white border-2 border-[#1a1612] px-2 py-1 text-xs font-bold text-center rounded focus:outline-none"
                    />
                    {useCoins && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playTick();
                          setUseCoins(false);
                          setCoinsToRedeem(0);
                        }}
                        title="Remove coins from bill"
                        className="bg-red-100 text-red-900 text-xs font-black px-2 py-1 rounded border border-red-300 hover:bg-red-200 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 italic">No coins on account yet</span>
                  {patronDossier.email && (
                    <button
                      type="button"
                      onClick={handleLookupPatron}
                      className="text-[10px] font-bold bg-[#1a1612] text-amber-300 px-2 py-1 rounded cursor-pointer"
                    >
                      🔍 Check Email Coins
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Financial Summary Breakdown */}
            <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-4 rounded-lg space-y-2 text-xs my-4">
              <div className="flex justify-between text-[#554e45]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[#1a1612]">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Celebration Discount Line */}
              {celebrationDiscount > 0 && (
                <div className="flex justify-between text-red-900 font-bold">
                  <span>🎂 Celebration Courtesy (20% OFF):</span>
                  <span>-₹{celebrationDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Coupon Discount Line */}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-900 font-bold">
                  <span>🎟️ Coupon Discount ({appliedCoupon?.code}):</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Extra Cashier Discount Line */}
              {extraDiscountAmount > 0 && (
                <div className="flex justify-between text-red-900 font-bold">
                  <span>🏷️ Staff Extra Discount ({extraDiscountReason}):</span>
                  <span>-₹{extraDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* GST Tax Line */}
              <div className="flex justify-between text-[#554e45]">
                <span>GST Tax (5%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>

              {/* Loyalty Coins Deduction Line (Clearly Visible) */}
              {actualCoinsUsed > 0 && (
                <div className="flex justify-between text-emerald-950 font-black bg-amber-100 p-2 rounded border border-amber-300">
                  <span className="flex items-center gap-1">
                    <span>🪙 Loyalty Coins Redeemed:</span>
                    <strong className="underline">(Used {actualCoinsUsed} Coins)</strong>
                  </span>
                  <span className="text-sm">-₹{actualCoinsUsed.toFixed(2)}</span>
                </div>
              )}

              {/* Final Payable Amount */}
              <div className="flex justify-between text-lg font-headline font-black text-[#1a1612] border-t-2 border-[#1a1612] pt-2">
                <span>FINAL PAYABLE AMOUNT:</span>
                <span className="text-xl text-red-950">₹{finalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* 10% Cashback Reward Engine Preview */}
            <div className="bg-[#fff4d4] border-2 border-dashed border-[#b45309] rounded-lg p-3 text-center text-xs">
              <span className="font-bold text-[#92400e] uppercase block">
                ★ 10% CASHBACK REWARD ENGINE ★
              </span>
              <span className="text-base font-black text-[#78350f]">
                +₹{estimatedCashback} (10% / {estimatedCashback} Coins) will be automatically credited to patron wallet upon payment!
              </span>
            </div>

            {/* Payment Method Selector & Finalize Settlement */}
            <div className="pt-3 border-t-2 border-[#1a1612] space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-[#1a1612] block mb-1">
                  Tender Payment Method:
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {['UPI', 'Cash', 'Credit Card', 'Debit Card'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded font-bold transition cursor-pointer border-2 ${
                        paymentMethod === m
                          ? 'bg-[#1a1612] text-amber-300 border-[#1a1612] shadow'
                          : 'bg-[#eee7d7]/85 text-[#1a1612] border-[#1a1612] hover:bg-[#ded4be]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Ref Field */}
              <div className="space-y-1 bg-[#fffdf9] border-2 border-[#1a1612] p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-[#1a1612] flex items-center gap-1.5">
                    <span>📝 Transaction ID / UTR / Reference No.</span>
                    <span className="text-[10px] text-zinc-500 font-normal">(Audit Trail)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTick();
                      const prefix = paymentMethod.split(' ')[0].toUpperCase();
                      setTransactionId(`${prefix}-${Date.now().toString().slice(-8)}`);
                    }}
                    className="text-[10px] text-amber-900 hover:text-black font-extrabold underline cursor-pointer"
                  >
                    ⚡ Auto-Gen Ref ID
                  </button>
                </div>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  placeholder={`e.g. ${paymentMethod === 'UPI' ? 'UPI-984210482 or UTR No.' : paymentMethod === 'Cash' ? 'CASH-REC-001' : 'CARD-AUTH-9042'}`}
                  className="w-full bg-[#eee7d7]/85 border border-[#1a1612] px-3 py-2 text-xs text-[#1a1612] font-mono font-bold rounded-lg focus:outline-none focus:bg-white uppercase tracking-wider"
                />
              </div>

              {/* Settle Button */}
              <button
                onClick={handleSettlePayment}
                disabled={processing || activeItems.length === 0}
                className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-amber-300 font-extrabold py-4 px-6 rounded-xl text-sm uppercase tracking-wider border-2 border-amber-400 newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span>SETTLING FISCAL TRANSACTION & DISPATCHING RECEIPT...</span>
                ) : (
                  <>
                    <span>💵 SETTLE ₹{finalPayable.toFixed(2)} {actualCoinsUsed > 0 ? `(Used ${actualCoinsUsed} Coins)` : ''} & CREDIT 10% CASHBACK</span>
                    <span className="text-lg">➔</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {settledBill && (
        <ReceiptPrintModal
          bill={settledBill}
          onClose={() => setSettledBill(null)}
        />
      )}
    </div>
  );
};

export default CashierBillingMachine;

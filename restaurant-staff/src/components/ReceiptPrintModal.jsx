import React from 'react';

export const ReceiptPrintModal = ({ bill, onClose }) => {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group duplicate items by name for clean itemized invoice
  const groupedItems = [];
  (bill.items || []).forEach((item) => {
    const name = item.name || item.title || 'Dish Item';
    const qty = Number(item.quantity) || 1;
    const unitPrice = typeof item.price === 'string'
      ? parseFloat(item.price.replace(/[^\d.]/g, '')) || 0
      : Number(item.price) || Number(item.unitPrice) || 0;

    const existing = groupedItems.find((g) => g.name === name && g.unitPrice === unitPrice);
    if (existing) {
      existing.quantity += qty;
      existing.totalPrice += unitPrice * qty;
    } else {
      groupedItems.push({
        name,
        unitPrice,
        quantity: qty,
        totalPrice: unitPrice * qty,
      });
    }
  });

  const coinsDeduction = Number(bill.coinsUsed || bill.redeemWalletAmount || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn font-editorial overflow-y-auto">
      <div className="bg-[#fffdf9] border-4 border-[#1a1612] max-w-lg w-full p-5 sm:p-8 newspaper-shadow-lg relative max-h-[92vh] overflow-y-auto my-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#1a1612] text-white hover:bg-red-800 w-8 h-8 rounded-full flex items-center justify-center font-bold font-typewriter cursor-pointer shadow-md"
        >
          ✕
        </button>

        {/* Newspaper Receipt Folio Header */}
        <div className="text-center border-b-2 border-[#1a1612] pb-4 mb-4">
          <div className="font-typewriter text-[10px] uppercase font-bold tracking-widest text-[#554e45]">
            ★ OFFICIAL DINING FOLIO ★
          </div>
          <h2 className="font-headline text-2xl font-black uppercase text-[#1a1612]">
            The Daily Culinary Chronicle
          </h2>
          <p className="font-typewriter text-[11px] text-[#71695f] mt-0.5">
            Heritage Dining Room • Connaught Place, New Delhi
          </p>
          <div className="bg-[#1a1612] text-amber-300 font-typewriter text-xs font-bold py-1 px-3 mt-2 inline-block">
            INVOICE FOLIO #{bill.billId || 'CHRONICLE-RECEIPT'}
          </div>
        </div>

        {/* Meta Info */}
        <div className="font-typewriter text-xs space-y-1.5 pb-3 border-b border-[#1a1612] text-[#554e45]">
          <div className="flex justify-between">
            <span>Patron:</span>
            <strong className="text-[#1a1612]">{bill.customerName || 'Esteemed Guest'}</strong>
          </div>
          <div className="flex justify-between">
            <span>Email:</span>
            <span className="text-[#1a1612]">{bill.customerEmail || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Table Number:</span>
            <strong className="text-[#1a1612]">Table #{bill.tableNo}</strong>
          </div>
          {bill.transactionId && (
            <div className="flex justify-between text-amber-950 font-bold">
              <span>Transaction Ref / UTR:</span>
              <span className="font-mono bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 text-[11px]">
                #{bill.transactionId}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="text-[#1a1612] font-semibold">{bill.paymentMethod || 'UPI / Card'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>{bill.settledAt ? new Date(bill.settledAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left font-typewriter text-xs my-4 border-collapse">
          <thead>
            <tr className="border-b-2 border-[#1a1612] text-[11px] text-[#1a1612]">
              <th className="py-1.5 uppercase">Dish Item</th>
              <th className="py-1.5 text-center uppercase">Qty</th>
              <th className="py-1.5 text-right uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d1c7b7]">
            {groupedItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 text-[#1a1612] font-semibold">{item.name}</td>
                <td className="py-2 text-center text-[#554e45]">{item.quantity}</td>
                <td className="py-2 text-right font-bold text-[#1a1612] font-mono">
                  ₹{Number(item.totalPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div className="font-typewriter text-xs space-y-1.5 border-t-2 border-[#1a1612] pt-3 text-[#554e45]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-bold text-[#1a1612] font-mono">₹{Number(bill.subtotal || 0).toFixed(2)}</span>
          </div>

          {Number(bill.discountAmount) > 0 && (
            <div className="flex justify-between text-red-900 font-bold">
              <span>Discount ({bill.discountReason || (bill.couponCode ? `Coupon ${bill.couponCode}` : 'Promotional')}):</span>
              <span className="font-mono">-₹{Number(bill.discountAmount).toFixed(2)}</span>
            </div>
          )}

          {coinsDeduction > 0 && (
            <div className="flex justify-between text-emerald-950 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-300">
              <span className="flex items-center gap-1">
                <span>🪙 Loyalty Coins:</span>
                <strong>(Used {coinsDeduction} Coins)</strong>
              </span>
              <span className="font-mono text-emerald-900">-₹{coinsDeduction.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>GST Tax (5%):</span>
            <span className="font-mono">₹{Number(bill.tax || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-base font-black text-[#1a1612] border-t-2 border-[#1a1612] pt-2">
            <span className="font-headline uppercase">TOTAL AMOUNT PAID:</span>
            <span className="text-xl font-mono font-black text-red-950">
              ₹{Number(bill.finalPaid || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* 10% Cashback / Loyalty Banner */}
        <div className="bg-[#fff4d4] border-2 border-dashed border-[#b45309] rounded-lg p-3.5 my-4 text-center font-typewriter">
          <div className="text-[11px] font-bold text-[#92400e] uppercase">
            ✨ 10% DINING CASHBACK CREDITED! ✨
          </div>
          <div className="text-xl font-black text-[#78350f] mt-0.5 font-mono">
            +₹{bill.cashbackEarned || 0} Added to Patron Wallet
          </div>
          <div className="bg-[#1a1612] text-amber-300 text-[11px] font-bold py-1 px-3 mt-1.5 inline-block rounded font-mono">
            CURRENT WALLET BALANCE: ₹{bill.patronWalletBalanceAfter || 0}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[#d1c7b7]">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-amber-300 font-typewriter font-bold py-3 px-4 rounded text-xs uppercase border border-amber-400 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <span>🖨️ PRINT OFFICIAL FOLIO</span>
          </button>
          <button
            onClick={onClose}
            className="bg-[#eee7d7] hover:bg-[#e4dac5] active:scale-95 text-[#1a1612] font-typewriter font-bold py-3 px-5 rounded text-xs uppercase border border-[#1a1612] cursor-pointer shadow-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrintModal;

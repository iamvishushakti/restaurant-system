import { useState, useEffect } from "react";
import { getCouponsApi } from "../api/auth";

const DEFAULT_OFFERS = [
    {
        id: "offer-p10",
        code: "ROYAL10",
        discount: "10% OFF",
        title: "Royal 10% All-Round Dining Offer",
        desc: "Flat 10% discount on all culinary orders across all dining tables. Always active!",
        badge: "PERMANENT 10% 🌟",
        minOrder: "No Minimum Order",
    },
    {
        id: "offer-p20",
        code: "FEAST20",
        discount: "20% OFF",
        title: "Grand Feast 20% Royal Courtesy",
        desc: "Special 20% discount for grand family feasts & dining orders above ₹899.",
        badge: "PERMANENT 20% 👑",
        minOrder: "Min Order ₹899",
    },
    {
        id: "offer-1",
        code: "NEWS40",
        discount: "40% OFF",
        title: "Front Page Headline Discount",
        desc: "Enjoy flat 40% discount on all Tandoori, Kebab & Biryani dispatches on orders above ₹399.",
        badge: "HOT DEAL 🔥",
        minOrder: "Min Order ₹399",
    },
    {
        id: "offer-2",
        code: "ROYAL150",
        discount: "₹150 OFF",
        title: "The Nawab's Imperial Voucher",
        desc: "Direct ₹150 cash deduction on total bill for family feasts & multi-course dinners.",
        badge: "FEAST 💵",
        minOrder: "Min Order ₹699",
    },
];

const OfferSection = () => {
    // Initial state: true (shown on first page load)
    const [isOpen, setIsOpen] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [copiedCode, setCopiedCode] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const [offersList, setOffersList] = useState(DEFAULT_OFFERS);

    useEffect(() => {
        const loadDynamicCoupons = async () => {
            try {
                const res = await getCouponsApi();
                if (res?.success && res.coupons && res.coupons.length > 0) {
                    const formatted = res.coupons.map((c) => ({
                        id: c.id || c.code,
                        code: c.code,
                        discount: c.discountType === 'FLAT' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`,
                        title: c.title,
                        desc: c.description || `Enjoy ${c.discountValue}${c.discountType === 'FLAT' ? ' Flat OFF' : '% OFF'} on your dining order.`,
                        badge: c.badge || (c.isPermanent ? 'PERMANENT OFFER 🌟' : 'SPECIAL DEAL ✨'),
                        minOrder: c.minOrderAmount > 0 ? `Min Order ₹${c.minOrderAmount}` : 'No Min Order',
                    }));
                    setOffersList(formatted);
                }
            } catch (e) {
                console.warn('Using default offers fallback:', e.message);
            }
        };
        loadDynamicCoupons();
    }, []);


    // Smooth closing animation handler
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 350);
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsClosing(false);
    };

    const handleCopy = (code) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(""), 2500);
    };

    return (
        <>
            {/* ========================================================= */}
            {/* 1. EXPANDED OFFER VOUCHER MODAL (WITH SMOOTH SLIDE ANIM)  */}
            {/* ========================================================= */}
            {isOpen && (
                <div
                    className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
                        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                    onClick={handleClose}
                >
                    <div
                        className={`bg-[#f7f3eb] text-[#1a1612] border-4 border-[#1a1612] max-w-lg w-full newspaper-shadow-lg p-5 sm:p-6 relative font-editorial ${
                            isClosing ? "" : ""
                        }`}
                        style={{
                            animation: isClosing
                                ? "slideDownToMiddle 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards"
                                : "newspaperSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cut Line / Scissor Header */}
                        <div className="flex items-center justify-between text-[11px] font-typewriter text-[#6b5f50] border-b-2 border-dashed border-[#1a1612] pb-2 mb-3">
                            <span className="flex items-center gap-1 font-bold">
                                ✂️ CUT ALONG DOTTED LINE
                            </span>
                            <span className="uppercase font-bold tracking-widest text-red-900">
                                ★ SPECIAL PRESS VOUCHER ★
                            </span>
                        </div>

                        {/* Top Close / Cut Action Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 font-typewriter font-bold text-xs bg-[#1a1612] text-[#f7f3eb] px-2.5 py-1 border border-black hover:bg-red-900 transition cursor-pointer flex items-center gap-1 newspaper-shadow-sm active:scale-95"
                            title="Cut and slide down"
                        >
                            <span>[✕ CUT]</span>
                        </button>

                        {/* Masthead Banner */}
                        <div className="text-center mt-1 mb-4">
                            <div className="inline-block bg-[#1a1612] text-amber-300 font-typewriter text-[10px] uppercase font-bold px-2.5 py-0.5 mb-1.5 border border-black">
                                🗞️ DAILY EDITION EXCLUSIVE
                            </div>
                            <h3 className="font-masthead text-2xl sm:text-3xl font-black text-[#1a1612] tracking-tight leading-tight">
                                Special Culinary Dispatches
                            </h3>
                            <p className="font-typewriter text-xs text-[#5c5346] mt-0.5">
                                Flash this press voucher at dining table or kitchen checkout
                            </p>
                        </div>

                        {/* Offer Selector Tabs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3 font-typewriter text-xs">
                            {offersList.map((off, idx) => (
                                <button
                                    key={off.id || idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`py-1.5 px-2 border-2 text-center font-bold uppercase text-[10px] sm:text-xs transition cursor-pointer ${
                                        activeTab === idx
                                            ? "bg-[#1a1612] text-[#f7f3eb] border-[#1a1612] newspaper-shadow-sm"
                                            : "bg-[#eee7d7] text-[#1a1612] border-[#1a1612]/50 hover:bg-[#e4dbca]"
                                    }`}
                                >
                                    {off.discount}
                                </button>
                            ))}
                        </div>

                        {/* Active Offer Details Card */}
                        {offersList[activeTab] && (
                            <div className="bg-[#fffdf9] border-2 border-[#1a1612] p-4 relative newspaper-shadow-sm">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div>
                                        <span className="font-typewriter text-[10px] font-bold text-red-900 bg-red-100 px-2 py-0.5 border border-red-900 inline-block mb-1">
                                            {offersList[activeTab].badge}
                                        </span>
                                        <h4 className="font-headline text-lg sm:text-xl font-black uppercase text-[#1a1612]">
                                            {offersList[activeTab].title}
                                        </h4>
                                    </div>
                                    <span className="font-headline font-black text-2xl sm:text-3xl text-red-900 leading-none">
                                        {offersList[activeTab].discount}
                                    </span>
                                </div>

                                <p className="font-editorial text-xs sm:text-sm text-[#3a3229] leading-relaxed mb-3">
                                    {offersList[activeTab].desc}
                                </p>

                                {/* Coupon Code Strip */}
                                <div className="flex items-center justify-between bg-[#eee7d7] border-2 border-dashed border-[#1a1612] p-2.5 font-typewriter">
                                    <div>
                                        <span className="text-[10px] text-[#6b5f50] block uppercase font-bold">
                                            Press Promo Code:
                                        </span>
                                        <span className="font-headline font-black text-base sm:text-lg tracking-widest text-[#1a1612]">
                                            {offersList[activeTab].code}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleCopy(offersList[activeTab].code)}
                                        className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold text-xs uppercase px-3.5 py-1.5 border border-black transition cursor-pointer flex items-center gap-1.5"
                                    >
                                        {copiedCode === offersList[activeTab].code ? (
                                            <span>✅ COPIED!</span>
                                        ) : (
                                            <span>📋 CLIP CODE</span>
                                        )}
                                    </button>
                                </div>

                                <div className="mt-2 flex justify-between items-center text-[10px] font-typewriter text-[#6b5f50]">
                                    <span>• {offersList[activeTab].minOrder}</span>
                                    <span>• Valid for Today's Edition</span>
                                </div>
                            </div>
                        )}


                        {/* Bottom Slide-Down Dismiss Button */}
                        <div className="mt-4 flex items-center justify-between border-t-2 border-[#1a1612]/30 pt-3">
                            <span className="font-typewriter text-[11px] text-[#5c5346] italic">
                                Click anywhere or cut voucher to minimize
                            </span>
                            <button
                                onClick={handleClose}
                                className="font-typewriter font-bold text-xs uppercase text-[#1a1612] hover:text-red-900 underline cursor-pointer flex items-center gap-1"
                            >
                                <span>Slide Down to Center</span>
                                <span>↓</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 2. FLOATING OFFER ICON - POSITIONED IN THE MIDDLE / CENTER */}
            {/* ========================================================= */}
            {!isOpen && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                    <button
                        onClick={handleOpen}
                        className="bg-[#1a1612] hover:bg-[#2b251f] active:scale-95 text-[#f7f3eb] font-typewriter font-bold px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-amber-400 rounded-full newspaper-shadow-lg flex items-center gap-2 transition duration-200 cursor-pointer group shadow-2xl relative animate-gentle-bounce"
                        title="Open Press Offers & Vouchers"
                    >
                        {/* Flashing Gold Dot */}
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-black"></span>
                        </span>

                        <span className="text-base sm:text-lg group-hover:rotate-12 transition-transform">
                            🎟️
                        </span>

                        <div className="text-left leading-tight pr-1">
                            <span className="text-[9px] text-amber-300 block font-bold uppercase tracking-wider">
                                SPECIAL DEALS
                            </span>
                            <span className="text-[11px] sm:text-xs font-black uppercase text-[#f7f3eb]">
                                40% OFF OFFERS
                            </span>
                        </div>

                        <span className="text-[10px] text-amber-300 group-hover:-translate-y-0.5 transition-transform font-bold">
                            ▲
                        </span>
                    </button>
                </div>
            )}
        </>
    );
};

export default OfferSection;

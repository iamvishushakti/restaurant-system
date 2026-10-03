import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile, getUserProfile } from "../../api";
import Header from "../Header";
import BottomBar from "../../components/BottomBar";
import { getSocket } from "../../utils/socket";

const Profile = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, updateUser, logout } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        dob: "",
        anniversaryDate: "",
    });

    const [dobLocked, setDobLocked] = useState(false);
    const [anniversaryLocked, setAnniversaryLocked] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isBirthdayToday, setIsBirthdayToday] = useState(false);
    const [isAnniversaryToday, setIsAnniversaryToday] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

    // Initialize from existing AuthContext user
    useEffect(() => {
        if (!isAuthenticated && !user) {
            navigate("/user-login", { replace: true });
            return;
        }

        if (user) {
            setFormData({
                name: user.name || "",
                phone: user.phone || user.phoneNumber || "",
                dob: user.dob ? user.dob.split("T")[0] : "",
                anniversaryDate: user.anniversaryDate ? user.anniversaryDate.split("T")[0] : "",
            });
            setDobLocked(!!user.dobLocked || !!user.dob);
            setAnniversaryLocked(!!user.anniversaryLocked || !!user.anniversaryDate);
            setWalletBalance(Number(user.walletBalance) || 0);
            setIsBirthdayToday(!!user.isBirthdayToday);
            setIsAnniversaryToday(!!user.isAnniversaryToday);
        }

        // Fetch latest profile from backend
        let isMounted = true;
        const emailToFetch = user?.email || localStorage.getItem("user_email") || "";
        
        getUserProfile(emailToFetch)
            .then((res) => {
                if (isMounted && res?.user) {
                    const u = res.user;
                    setFormData({
                        name: u.name || "",
                        phone: u.phone || u.phoneNumber || "",
                        dob: u.dob ? u.dob.split("T")[0] : "",
                        anniversaryDate: u.anniversaryDate ? u.anniversaryDate.split("T")[0] : "",
                    });
                    setDobLocked(!!u.dobLocked || !!u.dob);
                    setAnniversaryLocked(!!u.anniversaryLocked || !!u.anniversaryDate);
                    setWalletBalance(Number(u.walletBalance) || 0);
                    setIsBirthdayToday(!!u.isBirthdayToday);
                    setIsAnniversaryToday(!!u.isAnniversaryToday);
                    updateUser(u);
                }
            })
            .catch(() => {
                // Local fallback
            });

        // Listen for Real-time Socket profile refreshes
        const socket = getSocket();
        if (socket) {
            socket.on("patron_profile_refreshed", (updatedPatron) => {
                if (isMounted && updatedPatron && (!emailToFetch || updatedPatron.email === emailToFetch)) {
                    setFormData({
                        name: updatedPatron.name || "",
                        phone: updatedPatron.phone || "",
                        dob: updatedPatron.dob ? updatedPatron.dob.split("T")[0] : "",
                        anniversaryDate: updatedPatron.anniversaryDate ? updatedPatron.anniversaryDate.split("T")[0] : "",
                    });
                    setDobLocked(!!updatedPatron.dobLocked || !!updatedPatron.dob);
                    setAnniversaryLocked(!!updatedPatron.anniversaryLocked || !!updatedPatron.anniversaryDate);
                    setWalletBalance(Number(updatedPatron.walletBalance) || 0);
                    setIsBirthdayToday(!!updatedPatron.isBirthdayToday);
                    setIsAnniversaryToday(!!updatedPatron.isAnniversaryToday);
                    updateUser(updatedPatron);
                }
            });
        }

        return () => {
            isMounted = false;
        };
    }, [user, isAuthenticated, navigate, updateUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Save/Update Profile Handler (Client 1-time lock rule)
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            setSaving(true);
            setStatusMessage({ type: "", text: "" });

            const payload = {
                email: user?.email || localStorage.getItem("user_email") || "",
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                dob: formData.dob || null,
                anniversaryDate: formData.anniversaryDate || null,
            };

            const res = await updateUserProfile(payload);
            if (res?.user) {
                updateUser(res.user);
                setDobLocked(!!res.user.dobLocked || !!res.user.dob);
                setAnniversaryLocked(!!res.user.anniversaryLocked || !!res.user.anniversaryDate);
                setWalletBalance(Number(res.user.walletBalance) || 0);
            }

            setStatusMessage({
                type: "success",
                text: "✨ Profile Record saved! Special dates locked for anniversary/birthday rewards.",
            });

            setTimeout(() => {
                setStatusMessage({ type: "", text: "" });
            }, 4000);
        } catch (error) {
            console.error("Failed to update profile:", error);
            const errDetail = error?.response?.data?.message || "⚠️ Failed to save record. Locked fields can only be modified at the Billing Counter.";
            setStatusMessage({
                type: "error",
                text: errDetail,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/user-login", { replace: true });
    };

    const displayEmail = user?.email || (typeof user === "string" ? user : "patron@newspaper.com");
    const userInitials = formData.name
        ? formData.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : displayEmail.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-[#f7f3eb] text-[#1a1612] flex flex-col font-editorial selection:bg-[#1a1612] selection:text-[#f7f3eb]">
            <Header />

            <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28">
                {/* Unified Profile Card & Form */}
                <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 sm:p-8 newspaper-shadow-lg relative">
                    {/* Top Archival Ribbon Stamp */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1a1612] text-amber-300 font-typewriter text-[10px] sm:text-xs uppercase font-bold px-4 py-1 border-2 border-amber-400 tracking-widest whitespace-nowrap shadow">
                        ★ PATRON REWARDS & DOSSIER ★
                    </div>

                    {/* Header Avatar & Identity Bar */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b-2 border-[#1a1612] mt-2 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-full border-3 border-[#1a1612] bg-[#eee7d7] flex items-center justify-center font-headline text-2xl font-black text-[#1a1612] newspaper-shadow-sm flex-shrink-0">
                            {userInitials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <h1 className="font-headline text-2xl sm:text-3xl font-black uppercase text-[#1a1612] leading-tight">
                                    {formData.name || "Esteemed Patron"}
                                </h1>
                                <span className="bg-green-900 text-white font-typewriter text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                                    VERIFIED PATRON
                                </span>
                            </div>

                            <div className="flex items-center justify-center sm:justify-start gap-1.5 font-typewriter text-xs text-[#5c5346] mt-1 font-semibold">
                                <span>📧</span>
                                <span className="text-[#1a1612] font-bold">{displayEmail}</span>
                            </div>

                            <p className="font-typewriter text-[10px] text-[#6b5f50] mt-1">
                                Press Pass ID: <span className="font-bold text-[#1a1612]">FOLIO-#{displayEmail.slice(0, 4).toUpperCase()}</span> • Table #{localStorage.getItem("restaurant_table_no") || "4"}
                            </p>
                        </div>

                        {/* 10% Cash Balance Badge */}
                        <div className="bg-[#1a1612] text-amber-300 border-2 border-amber-400 p-3 rounded-xl text-center min-w-[140px] newspaper-shadow">
                            <span className="text-[10px] uppercase tracking-wider font-typewriter block text-amber-200/80 font-bold">
                                💰 WALLET REWARDS
                            </span>
                            <span className="text-2xl font-headline font-black text-amber-300">
                                ₹{walletBalance.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-typewriter block text-amber-400/90 mt-0.5">
                                ★ 10% Cashback on Payments
                            </span>
                        </div>
                    </div>

                    {/* Celebration / 20% Discount Banner */}
                    {(isBirthdayToday || isAnniversaryToday) ? (
                        <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border-2 border-amber-800 rounded-xl flex items-center gap-3 text-[#1a1612] newspaper-shadow animate-pulse">
                            <span className="text-3xl">🎉</span>
                            <div>
                                <div className="font-headline font-black text-sm uppercase text-red-950">
                                    {isBirthdayToday && isAnniversaryToday
                                        ? "DOUBLE CELEBRATION: BIRTHDAY & ANNIVERSARY TODAY! (20% OFF)"
                                        : isBirthdayToday
                                        ? "HAPPY BIRTHDAY! 20% OFF ON YOUR BILL TODAY!"
                                        : "HAPPY ANNIVERSARY! 20% OFF ON YOUR BILL TODAY!"}
                                </div>
                                <div className="font-typewriter text-xs text-[#5c5346]">
                                    Special celebration privilege active! 20% will be deducted automatically at the cashier desk.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 p-3 bg-[#fdf5e6] border border-[#d1c7b7] rounded-lg flex items-center justify-between font-typewriter text-xs text-[#5c5346]">
                            <div className="flex items-center gap-2">
                                <span>🎁</span>
                                <span>
                                    <strong>20% Special Celebration Perk:</strong> Active on your registered Birthday & Anniversary!
                                </span>
                            </div>
                            <span className="bg-red-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                20% OFF
                            </span>
                        </div>
                    )}

                    {/* Status Message Notification */}
                    {statusMessage.text && (
                        <div
                            className={`mt-4 p-3 border-2 font-typewriter text-xs font-bold text-center rounded newspaper-shadow-sm animate-fadeIn ${
                                statusMessage.type === "success"
                                    ? "bg-green-100 border-green-900 text-green-900"
                                    : "bg-red-100 border-red-900 text-red-900"
                            }`}
                        >
                            {statusMessage.text}
                        </div>
                    )}

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-typewriter text-xs">
                        {/* Verified Email Field (Read Only) */}
                        <div>
                            <label className="font-bold uppercase text-[#1a1612] block mb-1">
                                Verified Telegraph Email:
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={displayEmail}
                                    disabled
                                    readOnly
                                    className="w-full bg-[#ded4be]/40 border-2 border-[#1a1612] px-3.5 py-2.5 text-xs text-[#5c5346] font-bold select-all cursor-not-allowed"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-900 bg-green-100 border border-green-800 px-2 py-0.5 rounded">
                                    ✓ OTP VERIFIED
                                </span>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="font-bold uppercase text-[#1a1612] flex items-center justify-between mb-1">
                                <span>Full Patron Name:</span>
                                <span className="text-[#8a7c6a] font-normal lowercase">(optional)</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Vishal Kumar"
                                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2.5 text-xs text-[#1a1612] font-semibold placeholder-[#8a7c6a] focus:outline-none focus:bg-[#fffcf7] focus:border-red-900"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="font-bold uppercase text-[#1a1612] flex items-center justify-between mb-1">
                                <span>Mobile Telephone Number:</span>
                                <span className="text-[#8a7c6a] font-normal lowercase">(optional)</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g., 9876543210"
                                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3.5 py-2.5 text-xs text-[#1a1612] font-semibold placeholder-[#8a7c6a] focus:outline-none focus:bg-[#fffcf7] focus:border-red-900"
                            />
                        </div>

                        {/* Date of Birth & Anniversary Date Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Date of Birth */}
                            <div>
                                <label className="font-bold uppercase text-[#1a1612] flex items-center justify-between mb-1">
                                    <span>🎂 Date of Birth (DOB):</span>
                                    {dobLocked ? (
                                        <span className="text-red-800 font-bold text-[10px]">🔒 LOCKED</span>
                                    ) : (
                                        <span className="text-amber-800 font-bold text-[10px]">⚡ 1-TIME SET</span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    disabled={dobLocked}
                                    className={`w-full border-2 border-[#1a1612] px-3.5 py-2.5 text-xs font-semibold focus:outline-none ${
                                        dobLocked
                                            ? "bg-[#e5decb] text-[#554e45] cursor-not-allowed"
                                            : "bg-[#eee7d7] text-[#1a1612] focus:bg-[#fffcf7] cursor-pointer"
                                    }`}
                                />
                                {dobLocked && (
                                    <p className="text-[10px] text-[#71695f] mt-1 italic">
                                        Locked. To modify, visit Cashier Billing Desk.
                                    </p>
                                )}
                            </div>

                            {/* Anniversary Date */}
                            <div>
                                <label className="font-bold uppercase text-[#1a1612] flex items-center justify-between mb-1">
                                    <span>💍 Anniversary Date:</span>
                                    {anniversaryLocked ? (
                                        <span className="text-red-800 font-bold text-[10px]">🔒 LOCKED</span>
                                    ) : (
                                        <span className="text-amber-800 font-bold text-[10px]">⚡ 1-TIME SET</span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    name="anniversaryDate"
                                    value={formData.anniversaryDate}
                                    onChange={handleChange}
                                    disabled={anniversaryLocked}
                                    className={`w-full border-2 border-[#1a1612] px-3.5 py-2.5 text-xs font-semibold focus:outline-none ${
                                        anniversaryLocked
                                            ? "bg-[#e5decb] text-[#554e45] cursor-not-allowed"
                                            : "bg-[#eee7d7] text-[#1a1612] focus:bg-[#fffcf7] cursor-pointer"
                                    }`}
                                />
                                {anniversaryLocked && (
                                    <p className="text-[10px] text-[#71695f] mt-1 italic">
                                        Locked. To modify, visit Cashier Billing Desk.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Patron Policy Notice */}
                        <div className="p-3 bg-[#eee7d7] border border-[#1a1612] rounded text-[11px] font-editorial text-[#3a3229] leading-relaxed">
                            <span className="font-bold font-typewriter uppercase text-red-900 block mb-0.5">
                                📜 Patron Loyalty Policy:
                            </span>
                            Every payment made at the billing counter returns <strong>10% as Instant Balance</strong> into your wallet.
                            On your DOB and Anniversary, you receive an exclusive <strong>20% Celebration Discount</strong>!
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t-2 border-[#1a1612] flex flex-col sm:flex-row items-center gap-2.5">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:flex-1 bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-typewriter font-bold py-3 px-6 text-xs uppercase tracking-wider border-2 border-black newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {saving ? (
                                    <span>SAVING DOSSIER...</span>
                                ) : (
                                    <>
                                        <span>💾 UPDATE PATRON PROFILE</span>
                                        <span>➔</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full sm:w-auto bg-red-900 hover:bg-red-950 active:scale-95 text-white font-typewriter font-bold py-3 px-5 text-xs uppercase border-2 border-black rounded newspaper-shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span>🚪 LOG OUT</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/all-menu")}
                                className="w-full sm:w-auto bg-[#eee7d7] hover:bg-[#e4dac5] text-[#1a1612] font-typewriter font-bold py-3 px-4 text-xs uppercase border-2 border-[#1a1612] rounded transition cursor-pointer text-center"
                            >
                                🗞️ Menu
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <BottomBar />
        </div>
    );
};

export default Profile;

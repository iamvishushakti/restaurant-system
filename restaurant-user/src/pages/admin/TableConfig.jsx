import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkInTableApi } from "../../api/auth";
import logo from "../../assets/image/logo.png";

const DEFAULT_PIN = import.meta.env.VITE_DEVICE_LOCK_PIN || "1234";

// 1 to 20 Tables + VIP/Special Sections
const PRESET_TABLES = [
    "1", "2", "3", "4", "5",
    "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15",
    "16", "17", "18", "19", "20"
];

const SPECIAL_TABLES = [
    "VIP-1", "VIP-2", "VIP-3", "VIP-4",
    "Rooftop-1", "Rooftop-2", "Garden-1", "Garden-2"
];

const TableConfig = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlTableParam = searchParams.get("table") || "";

    // Device Master Password stored in localStorage or fallback to default
    const storedPin = localStorage.getItem("device_lock_pin") || DEFAULT_PIN;
    const currentTableNo = localStorage.getItem("restaurant_table_no") || "4";

    // Component states
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [inputPin, setInputPin] = useState("");
    const [selectedTable, setSelectedTable] = useState(urlTableParam || currentTableNo);
    const [customTable, setCustomTable] = useState("");
    
    // Change PIN states
    const [newPin, setNewPin] = useState("");
    const [confirmNewPin, setConfirmNewPin] = useState("");
    const [isChangingPin, setIsChangingPin] = useState(false);

    // Alert & Message states
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // If table param was in URL, initialize it
    useEffect(() => {
        if (urlTableParam) {
            setSelectedTable(urlTableParam);
        }
    }, [urlTableParam]);

    // Handle PIN Verification (Unlock)
    const handleVerifyPin = (e) => {
        if (e) e.preventDefault();
        setError("");

        if (inputPin === storedPin || inputPin === "9999") { // 9999 as master recovery PIN
            setIsUnlocked(true);
            setInputPin("");
            setError("");
        } else {
            setError("⚠️ INCORRECT SECURITY PASSCODE! Access Denied.");
            setInputPin("");
        }
    };

    // Handle Numeric Keypad Click
    const handleKeypadPress = (val) => {
        if (val === "DEL") {
            setInputPin((prev) => prev.slice(0, -1));
        } else if (val === "CLEAR") {
            setInputPin("");
        } else {
            if (inputPin.length < 8) {
                setInputPin((prev) => prev + val);
            }
        }
    };

    // Save Table Assignment
    const handleSaveTable = (e) => {
        if (e) e.preventDefault();
        setError("");
        setSuccessMessage("");

        const finalTable = (customTable.trim() || selectedTable || "4").toUpperCase();

        if (!finalTable) {
            setError("Please select or enter a valid Table Identifier.");
            return;
        }

        // Save Table Number to LocalStorage
        localStorage.setItem("restaurant_table_no", finalTable);
        setSelectedTable(finalTable);
        setCustomTable("");

        // Immediately check in table to backend
        const savedEmail = localStorage.getItem("user_email") || "";
        const savedUser = localStorage.getItem("user");
        let parsedName = "Patron";
        let parsedPhone = "";
        try {
            if (savedUser) {
                const u = JSON.parse(savedUser);
                parsedName = u.name || (u.email ? u.email.split("@")[0] : "Patron");
                parsedPhone = u.phone || "";
            }
        } catch (e) {}

        checkInTableApi({
            tableNo: finalTable,
            customerEmail: savedEmail,
            customerName: parsedName,
            customerPhone: parsedPhone,
        }).catch(() => {});

        setSuccessMessage(`✅ Terminal successfully assigned and locked to TABLE #${finalTable}!`);

        setTimeout(() => {
            setSuccessMessage("");
        }, 3500);
    };

    // Save New Security Passcode
    const handleSaveNewPin = (e) => {
        if (e) e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!newPin || newPin.length < 4) {
            setError("New Passcode must be at least 4 digits/characters long.");
            return;
        }

        if (newPin !== confirmNewPin) {
            setError("Confirmation Passcode does not match.");
            return;
        }

        localStorage.setItem("device_lock_pin", newPin);
        setNewPin("");
        setConfirmNewPin("");
        setIsChangingPin(false);
        setSuccessMessage("🔐 Master Security Passcode updated successfully!");

        setTimeout(() => {
            setSuccessMessage("");
        }, 3500);
    };

    return (
        <div className="min-h-screen bg-[#f7f3eb] text-[#1a1612] flex flex-col font-editorial selection:bg-[#1a1612] selection:text-[#f7f3eb]">
            {/* Masthead Header */}
            <header className="bg-[#1a1612] text-[#f7f3eb] py-3.5 px-4 sm:px-8 border-b-4 border-amber-400 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <h1 className="font-headline text-lg sm:text-xl font-black uppercase tracking-wider text-amber-300">
                                Terminal Security Desk
                            </h1>
                            <p className="font-typewriter text-[10px] sm:text-xs text-[#ded4be]">
                                Device & Table Assignment Control System
                            </p>
                        </div>
                    </div>

                    <div className="font-typewriter text-xs text-right">
                        <span className="text-[10px] text-[#a89d8f] uppercase block">Assigned Table:</span>
                        <span className="font-black text-amber-300 text-sm sm:text-base">
                            #{localStorage.getItem("restaurant_table_no") || "4"}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
                {/* Notice / Alert */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-2 border-red-900 text-red-900 font-typewriter font-bold text-xs text-center rounded newspaper-shadow-sm animate-bounce">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 border-2 border-green-900 text-green-900 font-typewriter font-bold text-xs text-center rounded newspaper-shadow-sm animate-fadeIn">
                        {successMessage}
                    </div>
                )}

                {/* ======================================================== */}
                {/* 1. LOCKED STATE: ENTER MASTER PASSCODE                   */}
                {/* ======================================================== */}
                {!isUnlocked ? (
                    <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-6 sm:p-8 newspaper-shadow-lg text-center relative overflow-hidden">
                        {/* Archival Security Stamp */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red-900 text-white font-typewriter text-[10px] uppercase font-bold px-4 py-1 border border-black tracking-widest whitespace-nowrap shadow">
                            ★ AUTHORIZED PERSONNEL ONLY ★
                        </div>

                        <div className="w-16 h-16 rounded-full bg-[#eee7d7] border-2 border-[#1a1612] flex items-center justify-center text-3xl mx-auto mt-2 mb-3 shadow-inner">
                            🔒
                        </div>

                        <h2 className="font-headline text-2xl sm:text-3xl font-black uppercase text-[#1a1612]">
                            Device Passcode Lock
                        </h2>
                        <p className="font-typewriter text-xs text-[#5c5346] mt-1 max-w-sm mx-auto">
                            Enter the Master Device Security PIN to modify table terminal assignment.
                        </p>

                        <form onSubmit={handleVerifyPin} className="mt-5 space-y-4">
                            <div>
                                <input
                                    type="password"
                                    maxLength={8}
                                    value={inputPin}
                                    onChange={(e) => setInputPin(e.target.value)}
                                    placeholder="• • • •"
                                    autoFocus
                                    className="w-full text-center text-3xl sm:text-4xl tracking-[0.4em] font-headline font-black py-3 px-4 bg-[#eee7d7] border-2 border-[#1a1612] text-[#1a1612] focus:outline-none focus:bg-[#fffcf7] focus:border-red-900 rounded"
                                />
                                <span className="font-typewriter text-[10px] text-[#6b5f50] block mt-1.5">
                                    [ Default Master Passcode: 1234 ]
                                </span>
                            </div>

                            {/* Numeric Keypad for Tablet & Mobile Staff */}
                            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1 font-typewriter">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleKeypadPress(String(num))}
                                        className="py-3 bg-[#eee7d7] hover:bg-[#ded4be] active:scale-95 text-[#1a1612] font-black text-lg border-2 border-[#1a1612] rounded newspaper-shadow-sm transition cursor-pointer"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => handleKeypadPress("CLEAR")}
                                    className="py-3 bg-[#e5dbca] hover:bg-[#d5c7b2] active:scale-95 text-red-950 font-bold text-xs uppercase border-2 border-[#1a1612] rounded transition cursor-pointer"
                                >
                                    CLR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleKeypadPress("0")}
                                    className="py-3 bg-[#eee7d7] hover:bg-[#ded4be] active:scale-95 text-[#1a1612] font-black text-lg border-2 border-[#1a1612] rounded newspaper-shadow-sm transition cursor-pointer"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleKeypadPress("DEL")}
                                    className="py-3 bg-[#e5dbca] hover:bg-[#d5c7b2] active:scale-95 text-[#1a1612] font-bold text-sm border-2 border-[#1a1612] rounded transition cursor-pointer"
                                >
                                    ⌫
                                </button>
                            </div>

                            <div className="pt-3 flex flex-col gap-2 font-typewriter">
                                <button
                                    type="submit"
                                    className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold py-3 text-xs sm:text-sm uppercase tracking-wider border-2 border-black newspaper-shadow transition cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>🔓 UNLOCK & CONFIGURE TERMINAL</span>
                                    <span>➔</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/all-menu")}
                                    className="w-full bg-[#eee7d7] hover:bg-[#ded4be] text-[#1a1612] font-bold py-2.5 text-xs uppercase border-2 border-[#1a1612] rounded transition cursor-pointer text-center"
                                >
                                    🗞️ Return to Customer Menu
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* ======================================================== */
                    /* 2. UNLOCKED STATE: TABLE ASSIGNMENT & CONFIGURATION      */
                    /* ======================================================== */
                    <div className="bg-[#fffdf9] border-4 border-[#1a1612] p-5 sm:p-8 newspaper-shadow-lg space-y-6 relative">
                        {/* Top Unlocked Ribbon Stamp */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-800 text-white font-typewriter text-[10px] uppercase font-bold px-4 py-1 border border-black tracking-widest whitespace-nowrap shadow">
                            ★ TERMINAL UNLOCKED FOR MANAGEMENT ★
                        </div>

                        {/* Current Status */}
                        <div className="p-3.5 bg-[#eee7d7] border-2 border-[#1a1612] rounded flex items-center justify-between font-typewriter">
                            <div>
                                <span className="text-[10px] text-[#5c5346] uppercase font-bold block">
                                    Current Terminal Binding:
                                </span>
                                <span className="font-headline text-2xl font-black text-red-900">
                                    TABLE #{localStorage.getItem("restaurant_table_no") || "4"}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsUnlocked(false)}
                                className="bg-[#1a1612] hover:bg-red-900 text-[#f7f3eb] text-xs font-bold px-3 py-1.5 border border-black rounded transition cursor-pointer"
                            >
                                🔒 Re-Lock
                            </button>
                        </div>

                        {/* Standard Tables 1 to 20 Selection Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="font-typewriter font-bold text-xs uppercase text-[#1a1612] flex items-center gap-1.5">
                                    <span>🪑</span>
                                    <span>Standard Dining Tables (1 to 20):</span>
                                </label>
                                <span className="font-typewriter text-[10px] bg-[#eee7d7] border border-[#1a1612] px-2 py-0.5 rounded font-bold">
                                    20 TABLES
                                </span>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 font-typewriter">
                                {PRESET_TABLES.map((tbl) => {
                                    const isSelected = (selectedTable || "").toUpperCase() === tbl.toUpperCase();
                                    return (
                                        <button
                                            key={tbl}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTable(tbl);
                                                setCustomTable("");
                                            }}
                                            className={`py-2.5 px-2 text-center font-black text-xs sm:text-sm border-2 rounded transition cursor-pointer flex flex-col items-center justify-center ${
                                                isSelected
                                                    ? "bg-[#1a1612] text-[#f7f3eb] border-black scale-105 shadow-md"
                                                    : "bg-[#eee7d7] hover:bg-[#ded4be] text-[#1a1612] border-[#1a1612]"
                                            }`}
                                        >
                                            <span className="text-[9px] uppercase font-semibold text-[#8a7c6a] block leading-none">
                                                Table
                                            </span>
                                            <span className="text-base sm:text-lg leading-tight font-headline font-black">
                                                #{tbl}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Special VIP & Rooftop Tables */}
                        <div>
                            <label className="font-typewriter font-bold text-[11px] uppercase text-[#5c5346] block mb-1.5">
                                ★ Special Sections & VIP Suites:
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-typewriter">
                                {SPECIAL_TABLES.map((tbl) => {
                                    const isSelected = (selectedTable || "").toUpperCase() === tbl.toUpperCase();
                                    return (
                                        <button
                                            key={tbl}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTable(tbl);
                                                setCustomTable("");
                                            }}
                                            className={`py-2 px-2 text-center font-bold text-xs border-2 rounded transition cursor-pointer ${
                                                isSelected
                                                    ? "bg-red-900 text-[#f7f3eb] border-black scale-105 shadow-md"
                                                    : "bg-[#fffdf9] hover:bg-[#eee7d7] text-[#1a1612] border-[#1a1612]"
                                            }`}
                                        >
                                            {tbl}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Table Input */}
                        <div className="font-typewriter text-xs">
                            <label className="font-bold uppercase text-[#1a1612] block mb-1">
                                Or Enter Custom Table / Section Name:
                            </label>
                            <input
                                type="text"
                                value={customTable}
                                onChange={(e) => {
                                    setCustomTable(e.target.value);
                                    setSelectedTable(e.target.value);
                                }}
                                placeholder="e.g., T-15, Garden-2, VIP-Suite"
                                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-3 py-2 text-xs font-bold text-[#1a1612] placeholder-[#8a7c6a] focus:outline-none focus:bg-[#fffcf7] focus:border-red-900"
                            />
                        </div>

                        {/* Main Save & Apply Button */}
                        <div className="pt-2 font-typewriter flex flex-col sm:flex-row gap-2.5">
                            <button
                                onClick={handleSaveTable}
                                className="flex-1 bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold py-3 text-xs sm:text-sm uppercase tracking-wider border-2 border-black newspaper-shadow transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>💾 ASSIGN & LOCK TABLE #{selectedTable || "4"}</span>
                                <span>➔</span>
                            </button>

                            <button
                                onClick={() => navigate("/all-menu")}
                                className="bg-green-800 hover:bg-green-900 active:scale-95 text-white font-bold py-3 px-5 text-xs uppercase border-2 border-black rounded transition cursor-pointer text-center"
                            >
                                🗞️ Launch Menu
                            </button>
                        </div>

                        {/* Collapsible: Change Security Passcode */}
                        <div className="border-t-2 border-dashed border-[#1a1612]/30 pt-4 font-typewriter text-xs">
                            {!isChangingPin ? (
                                <button
                                    type="button"
                                    onClick={() => setIsChangingPin(true)}
                                    className="text-[#6b5f50] hover:text-black font-bold underline cursor-pointer text-xs"
                                >
                                    ⚙️ Change Master Device Security Passcode (PIN)
                                </button>
                            ) : (
                                <form onSubmit={handleSaveNewPin} className="space-y-3 bg-[#eee7d7] border-2 border-[#1a1612] p-4 rounded">
                                    <div className="flex items-center justify-between border-b border-[#1a1612]/30 pb-1">
                                        <span className="font-bold uppercase text-red-900">
                                            🔐 Update Device Passcode
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsChangingPin(false)}
                                            className="text-[10px] text-[#6b5f50] underline cursor-pointer"
                                        >
                                            [Cancel]
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase mb-0.5">
                                                New Passcode:
                                            </label>
                                            <input
                                                type="password"
                                                maxLength={8}
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value)}
                                                placeholder="New 4-8 Digit PIN"
                                                className="w-full bg-[#fffdf9] border border-[#1a1612] p-2 text-xs font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase mb-0.5">
                                                Confirm New Passcode:
                                            </label>
                                            <input
                                                type="password"
                                                maxLength={8}
                                                value={confirmNewPin}
                                                onChange={(e) => setConfirmNewPin(e.target.value)}
                                                placeholder="Re-enter New PIN"
                                                className="w-full bg-[#fffdf9] border border-[#1a1612] p-2 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#1a1612] hover:bg-[#332c25] text-[#f7f3eb] font-bold py-2 text-xs uppercase border border-black rounded transition cursor-pointer"
                                    >
                                        Update Master Security Passcode
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TableConfig;

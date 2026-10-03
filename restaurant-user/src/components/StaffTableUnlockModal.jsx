import React, { useState } from "react";
import { verifyDevicePasscodeApi } from "../api/auth";

const TABLES_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const StaffTableUnlockModal = ({ isOpen, onClose, currentTable, onTableUpdated }) => {
    const [step, setStep] = useState(1); // 1 = PIN Prompt, 2 = Table Select
    const [passcode, setPasscode] = useState("");
    const [selectedTable, setSelectedTable] = useState(currentTable || "4");
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    if (!isOpen) return null;

    const handleVerifyPin = async (e) => {
        if (e) e.preventDefault();
        setErrorMessage("");

        if (!passcode) {
            setErrorMessage("Please enter the Master Device Passcode");
            return;
        }

        try {
            setIsVerifying(true);
            const res = await verifyDevicePasscodeApi(passcode);
            if (res.success && res.valid) {
                setStep(2);
                setErrorMessage("");
            } else {
                setErrorMessage(res.message || "Invalid passcode. Please check with Manager.");
            }
        } catch (err) {
            const msg = err?.response?.data?.message || "Invalid Passcode. Authorization Failed.";
            setErrorMessage(msg);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSaveNewTable = () => {
        localStorage.setItem("restaurant_table_no", String(selectedTable));
        window.dispatchEvent(new Event("table_no_changed"));
        setSuccessMessage(`✓ Device successfully assigned & locked to Table #${selectedTable}!`);
        
        if (onTableUpdated) {
            onTableUpdated(String(selectedTable));
        }

        setTimeout(() => {
            setSuccessMessage("");
            setStep(1);
            setPasscode("");
            onClose();
        }, 1500);
    };

    const handleModalClose = () => {
        setStep(1);
        setPasscode("");
        setErrorMessage("");
        setSuccessMessage("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-typewriter">
            <div 
                className="bg-[#fffdf9] border-4 border-[#1a1612] rounded-2xl p-6 max-w-md w-full newspaper-shadow-lg text-[#1a1612] relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleModalClose}
                    className="absolute top-4 right-4 text-xs font-bold bg-[#eee7d7] hover:bg-red-900 hover:text-white px-2 py-1 rounded border border-[#1a1612] transition cursor-pointer"
                >
                    ✕ CLOSE
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1a1612] pb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1a1612] text-amber-300 flex items-center justify-center text-2xl shadow border-2 border-amber-400 flex-shrink-0">
                        🔒
                    </div>
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-red-900 text-white px-2 py-0.5 rounded">
                            STAFF AUTHORIZATION ONLY
                        </span>
                        <h3 className="font-headline text-xl font-black uppercase text-[#1a1612] leading-tight mt-0.5">
                            Table Number Device Lock
                        </h3>
                    </div>
                </div>

                {/* Error & Success Alerts */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-100 border-2 border-red-900 text-red-900 text-xs font-bold rounded animate-fadeIn">
                        ⚠️ {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 border-2 border-green-900 text-green-900 text-xs font-bold rounded animate-fadeIn">
                        {successMessage}
                    </div>
                )}

                {/* Step 1: Staff Enter Manager Passcode */}
                {step === 1 && (
                    <form onSubmit={handleVerifyPin} className="space-y-4 text-xs">
                        <p className="text-[#554e45] leading-relaxed">
                            Patrons cannot alter table numbers. Server / Waiter must enter the <strong>Master Device Passcode</strong> from the General Manager.
                        </p>

                        <div className="bg-[#eee7d7] p-3 rounded-lg border border-[#1a1612] flex items-center justify-between">
                            <span className="text-[11px] text-[#554e45]">Current Assigned Table:</span>
                            <span className="font-headline font-black text-lg text-[#1a1612]">
                                TABLE #{currentTable || "4"}
                            </span>
                        </div>

                        <div>
                            <label className="font-bold uppercase text-[#1a1612] block mb-1.5">
                                Enter Master Device PIN / Passcode:
                            </label>
                            <input
                                type="password"
                                maxLength="8"
                                autoFocus
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter Manager Passcode"
                                className="w-full bg-[#eee7d7] border-2 border-[#1a1612] px-4 py-2.5 text-center font-bold text-lg tracking-widest text-[#1a1612] focus:outline-none focus:bg-white rounded"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-amber-300 font-extrabold py-3.5 px-4 text-xs uppercase rounded-xl border-2 border-amber-400 shadow cursor-pointer disabled:opacity-50 transition flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <span>VERIFYING PASSCODE...</span>
                            ) : (
                                <>
                                    <span>🔓 UNLOCK & REASSIGN TABLE</span>
                                    <span>➔</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: Select New Table & Re-lock */}
                {step === 2 && (
                    <div className="space-y-4 text-xs">
                        <div className="bg-emerald-50 border border-emerald-700 p-2.5 rounded text-emerald-900 font-bold text-center">
                            ✓ Authorization Granted! Choose target dining table.
                        </div>

                        <div>
                            <label className="font-bold uppercase text-[#1a1612] block mb-2">
                                Select Dining Table (1 - 12):
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {TABLES_LIST.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setSelectedTable(String(t))}
                                        className={`py-2.5 rounded-lg font-headline font-black text-sm border-2 cursor-pointer transition ${
                                            String(selectedTable) === String(t)
                                                ? "bg-[#1a1612] text-amber-300 border-[#1a1612] shadow"
                                                : "bg-[#eee7d7] text-[#1a1612] border-[#c4b9a3] hover:bg-[#e4dac5]"
                                        }`}
                                    >
                                        #{t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleSaveNewTable}
                                className="w-full bg-green-800 hover:bg-green-700 active:scale-95 text-white font-extrabold py-3.5 px-4 text-xs uppercase rounded-xl border-2 border-black shadow cursor-pointer transition flex items-center justify-center gap-2"
                            >
                                <span>🔒 LOCK DEVICE TO TABLE #{selectedTable}</span>
                                <span>✓</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffTableUnlockModal;

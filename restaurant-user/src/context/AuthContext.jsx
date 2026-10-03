import { createContext, useContext, useState, useEffect } from "react";
import { checkInTableApi } from "../api/auth";
import { getSocket } from "../utils/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("user");
            if (savedUser) return JSON.parse(savedUser);

            const savedEmail = localStorage.getItem("user_email") || sessionStorage.getItem("user_email");
            if (savedEmail) return { email: savedEmail };

            return null;
        } catch (e) {
            console.error("Failed to parse user from storage:", e);
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || null;
    });

    const [settledBillNotice, setSettledBillNotice] = useState(null);

    // Auto check-in to backend on startup if table or user exists
    useEffect(() => {
        const tableNo = localStorage.getItem("restaurant_table_no") || "4";
        const email = user?.email || localStorage.getItem("user_email") || "";
        const name = user?.name || (email ? email.split("@")[0] : "Patron");
        const phone = user?.phone || "";

        checkInTableApi({
            tableNo,
            customerEmail: email,
            customerName: name,
            customerPhone: phone,
        }).catch(() => {});
    }, []);

    // Real-time bill settlement & automatic logout handler
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleBillSettled = (settledBill) => {
            const currentTableNo = localStorage.getItem("restaurant_table_no") || "4";
            const currentUserEmail = localStorage.getItem("user_email") || "";

            const isMatchTable = settledBill && String(settledBill.tableNo) === String(currentTableNo);
            const isMatchEmail =
                settledBill &&
                settledBill.customerEmail &&
                currentUserEmail &&
                settledBill.customerEmail.toLowerCase() === currentUserEmail.toLowerCase();

            if (isMatchTable || isMatchEmail) {
                console.log(
                    `💰 [Bill Settled]: Bill #${settledBill?.billId || ""} settled for Table #${currentTableNo}. Auto-logging out table device...`
                );

                // Show visual settlement appreciation notice
                setSettledBillNotice({
                    billId: settledBill?.billId || `BILL-${Date.now()}`,
                    finalPaid: settledBill?.finalPaid || 0,
                    tableNo: currentTableNo,
                    cashbackEarned: settledBill?.cashbackEarned || 0,
                    customerEmail: settledBill?.customerEmail || currentUserEmail,
                });

                // Auto logout session after 3 seconds so patron sees thank you notice
                setTimeout(() => {
                    logout();
                    setSettledBillNotice(null);
                    window.location.href = "/";
                }, 3200);
            }
        };

        socket.on("bill_settled", handleBillSettled);

        return () => {
            socket.off("bill_settled", handleBillSettled);
        };
    }, [user]);

    // Login handler
    const login = (userData, authToken) => {
        const normalizedUser = typeof userData === "string" ? { email: userData } : userData;
        setUser(normalizedUser);
        if (authToken) {
            setToken(authToken);
            localStorage.setItem("token", authToken);
        }
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        if (normalizedUser?.email) {
            localStorage.setItem("user_email", normalizedUser.email);
            sessionStorage.setItem("user_email", normalizedUser.email);
        }

        // Immediately check in table to mark occupied on staff console
        const tableNo = localStorage.getItem("restaurant_table_no") || "4";
        checkInTableApi({
            tableNo,
            customerEmail: normalizedUser?.email || "",
            customerName: normalizedUser?.name || (normalizedUser?.email ? normalizedUser.email.split("@")[0] : "Patron"),
            customerPhone: normalizedUser?.phone || "",
        }).catch(() => {});
    };

    // Update user profile handler
    const updateUser = (updatedData) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...updatedData };
            localStorage.setItem("user", JSON.stringify(next));
            if (next.email) {
                localStorage.setItem("user_email", next.email);
            }
            return next;
        });
    };

    // Logout handler
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("user_email");
        sessionStorage.removeItem("user_email");
        localStorage.removeItem("restaurant_cart");
        localStorage.removeItem("active_kitchen_orders");
        localStorage.removeItem("active_kitchen_order");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token || !!user,
                login,
                updateUser,
                logout,
                settledBillNotice,
            }}
        >
            {children}

            {/* Bill Settled & Device Auto-Logout Appreciation Overlay */}
            {settledBillNotice && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white border-4 border-[#1a1612] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center mx-auto text-3xl animate-bounce">
                            🎉
                        </div>

                        <div>
                            <span className="bg-[#1a1612] text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                BILL SETTLED • TABLE #{settledBillNotice.tableNo}
                            </span>
                            <h3 className="font-headline text-2xl font-black text-[#1a1612] uppercase mt-2">
                                Thank You For Dining With Us!
                            </h3>
                            <p className="font-editorial text-sm text-[#554e45] mt-1">
                                Your payment of <strong>₹{settledBillNotice.finalPaid}</strong> has been received by the Cashier.
                            </p>
                        </div>

                        {settledBillNotice.cashbackEarned > 0 && (
                            <div className="bg-amber-100/90 border border-amber-900 rounded-xl p-2.5 text-xs text-amber-950 font-typewriter">
                                💰 <strong>+₹{settledBillNotice.cashbackEarned} (10% Cashback)</strong> credited to your patron wallet!
                            </div>
                        )}

                        <div className="pt-2 border-t border-zinc-200 text-xs text-zinc-500 font-typewriter flex items-center justify-center gap-2">
                            <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                            <span>Logging out table device for next patron...</span>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;

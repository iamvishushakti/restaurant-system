import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { callWaiterApi } from "../api/auth";
import { getSocket } from "../utils/socket";
import StaffTableUnlockModal from "./StaffTableUnlockModal";

const quickRequests = [
    { id: "water", label: "💧 Mineral / Ice Water" },
    { id: "cutlery", label: "🍽️ Extra Plates & Cutlery" },
    { id: "clean", label: "🧹 Clean The Table" },
    { id: "bill", label: "🧾 Present The Bill" },
    { id: "help", label: "🙋 Server Assistance" },
];

// Active Kitchen Order Card with independent live timer & 4-stage pipeline
const ActiveOrderCard = ({ order, onDismiss }) => {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        const update = () => {
            let readyTime = 0;
            if (order.readyAt) {
                readyTime = new Date(order.readyAt).getTime();
            } else if (order.orderedAt) {
                readyTime = new Date(order.orderedAt).getTime() + (Number(order.prepMinutes) || 15) * 60000;
            } else if (order.createdAt) {
                readyTime = new Date(order.createdAt).getTime() + (Number(order.prepMinutes) || 15) * 60000;
            } else {
                readyTime = Date.now() + (Number(order.prepMinutes) || 15) * 60000;
            }

            if (isNaN(readyTime) || readyTime <= 0) {
                readyTime = Date.now() + 15 * 60000;
            }

            const diff = Math.max(0, Math.floor((readyTime - Date.now()) / 1000));
            setSecondsLeft(isNaN(diff) ? 0 : diff);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [order.readyAt, order.orderedAt, order.createdAt, order.prepMinutes]);

    const mins = isNaN(secondsLeft) ? 0 : Math.floor(secondsLeft / 60);
    const secs = isNaN(secondsLeft) ? 0 : secondsLeft % 60;
    const timeString = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
    const isReady = secondsLeft === 0;

    const prepMins = Number(order.prepMinutes) || 15;
    const totalSecs = (isNaN(prepMins) || prepMins <= 0 ? 15 : prepMins) * 60;
    const elapsed = Math.max(0, totalSecs - (isNaN(secondsLeft) ? 0 : secondsLeft));
    const progress = Math.min(100, Math.round((elapsed / totalSecs) * 100));

    return (
        <div className="p-3.5 bg-[#fffdf9] border-2 border-[#1a1612] newspaper-shadow-sm space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1a1612]/30 pb-2">
                <div className="flex items-center gap-2">
                    <span className="bg-[#1a1612] text-amber-300 font-typewriter text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        {order.roundNumber ? `ROUND #${order.roundNumber}` : "DISPATCH"}
                    </span>
                    <span className="font-typewriter text-xs font-bold text-[#1a1612]">
                        ORDER #{order.orderId}
                    </span>
                </div>
                <span className="font-typewriter text-[10px] bg-red-900 text-white px-2 py-0.5 rounded font-bold">
                    {(order.assignedChefs || (order.items?.length > 1 ? 2 : 1)) === 1
                        ? "1 DEDICATED CHEF"
                        : "2 PARALLEL CHEFS"}
                </span>
            </div>

            {/* Real-Time Cooking Status Alert Badge */}
            <div className="my-1">
                {order.status === 'In Preparation' ? (
                    <div className="bg-amber-100 border-2 border-amber-900 p-2 rounded-lg text-center font-typewriter">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center justify-center gap-1.5 animate-pulse">
                            <span>👨‍🍳</span>
                            <span>CHEF STARTED PREPARING YOUR DISHES!</span>
                        </span>
                        <span className="text-[10.5px] text-[#554e45] block mt-0.5 font-bold">
                            Kitchen fires are ablaze • Cooking in progress
                        </span>
                    </div>
                ) : order.status === 'Ready to Serve' ? (
                    <div className="bg-emerald-100 border-2 border-emerald-900 p-2 rounded-lg text-center font-typewriter">
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center justify-center gap-1.5 animate-bounce">
                            <span>🍲</span>
                            <span>FOOD IS COOKED & READY FOR SERVING!</span>
                        </span>
                        <span className="text-[10.5px] text-emerald-900 block mt-0.5 font-bold">
                            Floor Server is bringing the order to Table #{order.tableNo}
                        </span>
                    </div>
                ) : (
                    <div className="bg-[#eee7d7] border border-[#1a1612] p-1.5 rounded text-center font-typewriter text-[11px] text-[#554e45]">
                        <span>⏳ Order received at kitchen press • Chef queueing prep</span>
                    </div>
                )}
            </div>

            {/* Headline & Countdown */}
            <div className="text-center py-1">
                <h5 className="font-headline text-lg sm:text-xl font-black uppercase text-[#1a1612]">
                    {order.status === 'Ready to Serve' || isReady
                        ? "🎉 Food Ready For Table Service!"
                        : order.status === 'In Preparation'
                        ? "👨‍🍳 Chef Actively Cooking Your Order"
                        : "⏳ Order Queued In Kitchen"}
                </h5>
                <div className="my-1.5 font-typewriter">
                    <span className="text-2xl sm:text-3xl font-black text-red-900 block font-headline">
                        {order.status === 'Ready to Serve' || isReady ? "00m 00s (READY!)" : timeString}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[#6b5f50] font-bold block mt-0.5">
                        (Total Estimated Time: Upto {order.prepMinutes} Mins • Table #{order.tableNo})
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#eee7d7] border border-[#1a1612] h-3.5 overflow-hidden rounded-full my-2">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${
                            order.status === 'Ready to Serve' || isReady
                                ? 'bg-emerald-700'
                                : order.status === 'In Preparation'
                                ? 'bg-amber-600'
                                : 'bg-[#1a1612]'
                        }`}
                        style={{
                            width: `${
                                order.status === 'Ready to Serve' || isReady
                                    ? 100
                                    : order.status === 'In Preparation'
                                    ? Math.max(50, progress)
                                    : Math.max(15, progress)
                            }%`,
                        }}
                    ></div>
                </div>

                {/* 4-Stage Newspaper Cooking Timeline */}
                <div className="grid grid-cols-4 gap-1 text-[8.5px] sm:text-[9.5px] font-typewriter text-[#4a4237] mt-2 font-bold">
                    <div className="text-green-800">
                        🖨️ 1. Received
                    </div>
                    <div className={order.status === 'In Preparation' || order.status === 'Ready to Serve' || progress >= 40 ? "text-green-800 font-black" : "opacity-50"}>
                        👨‍🍳 2. Chef Cooking
                    </div>
                    <div className={order.status === 'In Preparation' || order.status === 'Ready to Serve' || progress >= 75 ? "text-green-800 font-black" : "opacity-50"}>
                        🔥 3. Tandoor
                    </div>
                    <div className={order.status === 'Ready to Serve' || progress >= 100 ? "text-green-800 font-black" : "opacity-50"}>
                        🍽️ 4. Ready
                    </div>
                </div>
            </div>

            {/* Dishes list */}
            <div className="bg-[#eee7d7] border border-[#1a1612] p-2.5 rounded font-typewriter text-xs space-y-1">
                <div className="font-bold text-[10px] text-[#5c5346] uppercase border-b border-[#1a1612]/20 pb-0.5 mb-1 flex justify-between">
                    <span>Dishes in this order ({order.items?.length || 0}):</span>
                    <span>₹{order.totalAmount}/-</span>
                </div>
                {order.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-bold">{it.price}</span>
                    </div>
                ))}
                {order.specialNote && (
                    <div className="text-[10px] italic text-[#5c5346] pt-1 border-t border-[#1a1612]/20">
                        Note: "{order.specialNote}"
                    </div>
                )}
            </div>

            {isReady && (
                <div className="text-right pt-1">
                    <button
                        onClick={() => onDismiss(order.orderId)}
                        className="bg-green-800 hover:bg-green-900 active:scale-95 text-white font-typewriter text-[11px] font-bold px-3 py-1.5 rounded cursor-pointer uppercase border border-black shadow"
                    >
                        ✓ Mark as Served & Clear
                    </button>
                </div>
            )}
        </div>
    );
};

const BottomBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        cartItems,
        totalCount,
        totalAmount,
        addToCart,
        removeFromCart,
        clearCart,
        tablePrepTime,
        tablePrepDetails,
        activeOrder,
        activeOrders = [],
        placeKitchenOrder,
        cancelActiveOrder,
    } = useCart();

    const isAboutPage = location.pathname === "/about" || location.pathname === "/about-us";

    // Modals state
    const [isFoodPrepOpen, setIsFoodPrepOpen] = useState(false);
    const [isWaiterOpen, setIsWaiterOpen] = useState(false);
    const [isStaffUnlockOpen, setIsStaffUnlockOpen] = useState(false);

    // Food Prep states
    const [specialNote, setSpecialNote] = useState("");
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderSuccessNotice, setOrderSuccessNotice] = useState(false);

    // Waiter states
    const [tableNo, setTableNo] = useState(() => {
        return localStorage.getItem("restaurant_table_no") || "4";
    });
    const [selectedRequest, setSelectedRequest] = useState("help");
    const [isWaiterSubmitting, setIsWaiterSubmitting] = useState(false);
    const [waiterNotification, setWaiterNotification] = useState("");

    // Listen for table number changes
    useEffect(() => {
        const handleTableChange = () => {
            setTableNo(localStorage.getItem("restaurant_table_no") || "4");
        };
        window.addEventListener("table_no_changed", handleTableChange);
        return () => window.removeEventListener("table_no_changed", handleTableChange);
    }, []);

    // Listen for live Waiter Attending & Resolved status from Staff App
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.emit("join_room", `table_${tableNo}`);

        const handleCallUpdate = (callData) => {
            if (callData && String(callData.tableNo) === String(tableNo)) {
                if (callData.status === "ATTENDING") {
                    const attendantName = callData.handledBy || "Senior Attendant Arjun";
                    setWaiterNotification(`🏃 Attendant ${attendantName} is arriving at Table #${tableNo}!`);
                    setTimeout(() => setWaiterNotification(""), 6000);
                } else if (callData.status === "RESOLVED") {
                    setWaiterNotification(`✅ Service request resolved by ${callData.handledBy || "Staff"}. Enjoy your meal!`);
                    setTimeout(() => setWaiterNotification(""), 5000);
                }
            }
        };

        socket.on("waiter_call_updated", handleCallUpdate);
        return () => {
            socket.off("waiter_call_updated", handleCallUpdate);
        };
    }, [tableNo]);

    // Live kitchen countdown timer state for the primary active order
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (!activeOrder) {
            setRemainingSeconds(0);
            return;
        }

        const updateTimer = () => {
            let readyTime = 0;
            if (activeOrder.readyAt) {
                readyTime = new Date(activeOrder.readyAt).getTime();
            } else if (activeOrder.orderedAt) {
                readyTime = new Date(activeOrder.orderedAt).getTime() + (Number(activeOrder.prepMinutes) || 15) * 60000;
            } else if (activeOrder.createdAt) {
                readyTime = new Date(activeOrder.createdAt).getTime() + (Number(activeOrder.prepMinutes) || 15) * 60000;
            } else {
                readyTime = Date.now() + (Number(activeOrder.prepMinutes) || 15) * 60000;
            }

            if (isNaN(readyTime) || readyTime <= 0) {
                readyTime = Date.now() + 15 * 60000;
            }

            const diff = Math.max(0, Math.floor((readyTime - Date.now()) / 1000));
            setRemainingSeconds(isNaN(diff) ? 0 : diff);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeOrder]);

    const minutesLeft = isNaN(remainingSeconds) ? 0 : Math.floor(remainingSeconds / 60);
    const secondsLeft = isNaN(remainingSeconds) ? 0 : remainingSeconds % 60;
    const formattedTimeLeft = `${minutesLeft}m ${secondsLeft < 10 ? "0" : ""}${secondsLeft}s`;
    const isFoodReady = activeOrder && remainingSeconds === 0;

    // Place Order handler
    const handlePlaceOrder = () => {
        if (cartItems.length === 0) return;
        setIsOrdering(true);

        setTimeout(() => {
            setIsOrdering(false);
            const order = placeKitchenOrder(specialNote);
            setOrderSuccessNotice(true);
            setSpecialNote("");

            setTimeout(() => {
                setOrderSuccessNotice(false);
            }, 3500);
        }, 800);
    };

    // Call Waiter handler
    const handleCallWaiter = async (e) => {
        if (e) e.preventDefault();
        setIsWaiterSubmitting(true);
        const currentSavedTable = localStorage.getItem("restaurant_table_no") || tableNo;
        const reqObj = quickRequests.find((r) => r.id === selectedRequest) || { label: "Server Assistance" };

        const payload = {
            tableNo: String(currentSavedTable),
            requestType: selectedRequest,
            requestLabel: reqObj.label,
            note: "Service Requested from Table",
            customerEmail: localStorage.getItem("user_email") || "patron@newspaper.com",
            timestamp: new Date().toISOString(),
        };

        try {
            const socket = getSocket();
            if (socket) {
                socket.emit("call_waiter", payload);
            }
            await callWaiterApi(payload);
        } catch (err) {
            console.error("Waiter call error:", err);
        } finally {
            setIsWaiterSubmitting(false);
            setWaiterNotification(`🛎️ Waiter Bell Ringing for Table #${currentSavedTable} (${reqObj.label})! Staff notified.`);
            setTimeout(() => {
                setWaiterNotification("");
                setIsWaiterOpen(false);
            }, 3500);
        }
    };


    const hasActiveOrders = activeOrders && activeOrders.length > 0;

    return (
        <>
            {/* Waiter Dispatch Toast Notification */}
            {waiterNotification && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a1612] text-[#f7f3eb] border-2 border-amber-400 px-5 py-3 rounded newspaper-shadow-lg flex items-center gap-3 font-typewriter animate-bounce">
                    <span className="text-xl">⚡</span>
                    <span className="font-bold text-xs md:text-sm">{waiterNotification}</span>
                </div>
            )}

            {/* Order Placed Success Notification */}
            {orderSuccessNotice && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a1612] text-[#f7f3eb] border-2 border-green-500 px-5 py-3 rounded newspaper-shadow-lg flex items-center gap-3 font-typewriter animate-bounce">
                    <span className="text-xl">🖨️</span>
                    <span className="font-bold text-xs md:text-sm text-green-300">
                        Order Dispatched to Kitchen Press! Master Chefs are at work.
                    </span>
                </div>
            )}



            {/* ========================================================= */}
            {/* BOTTOM FIXED DOCK: LEFT (Kitchen Wire) & RIGHT (Waiter)   */}
            {/* ========================================================= */}
            <div className="fixed bottom-4 left-0 right-0 z-40 px-3 md:px-8 pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-end justify-between gap-2.5">
                    {/* LEFT BUTTON: Kitchen Wire (Food Preparation / Cart) */}
                    <div className="pointer-events-auto">
                        <button
                            onClick={() => setIsFoodPrepOpen(true)}
                            className="bg-[#1a1612] hover:bg-[#2e2720] active:scale-95 text-[#f7f3eb] font-typewriter font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-2 border-[#1a1612] rounded-lg newspaper-shadow flex items-center gap-2 transition duration-150 cursor-pointer group max-w-[185px] sm:max-w-[230px]"
                        >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#f7f3eb] text-[#1a1612] flex items-center justify-center text-base sm:text-lg border border-black rounded relative flex-shrink-0">
                                <span>👨‍🍳</span>
                                {(totalCount > 0 || hasActiveOrders) && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                    </span>
                                )}
                            </div>

                            <div className="text-left min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#f7f3eb] truncate">
                                        Kitchen Wire
                                    </span>
                                    {totalCount > 0 && (
                                        <span className="bg-red-800 text-white text-[9px] sm:text-[10px] px-1 py-0.2 rounded font-bold">
                                            +{totalCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] sm:text-[11px] text-[#ded4be] block leading-tight truncate">
                                    {hasActiveOrders ? (
                                        <span className="text-amber-300 font-bold">
                                            {isFoodReady ? "Food Ready!" : `Cook: ${formattedTimeLeft}`}
                                        </span>
                                    ) : totalCount > 0 ? (
                                        `₹${totalAmount}/- • Upto ${tablePrepTime}m`
                                    ) : (
                                        "0 in press"
                                    )}
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* RIGHT COLUMN: 1) Page Switch Button (ABOVE) + 2) Wire Waiter (BELOW) */}
                    <div className="pointer-events-auto flex flex-col items-end gap-2">
                        {/* Dynamic Page Switch Button (Placed directly ABOVE Wire Waiter) */}
                        {isAboutPage ? (
                            <button
                                onClick={() => navigate("/all-menu")}
                                className="bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-typewriter font-bold text-[11px] sm:text-xs uppercase px-3.5 py-1.5 border-2 border-black rounded-lg newspaper-shadow-sm transition cursor-pointer flex items-center gap-1.5 shadow"
                            >
                                <span>🗞️</span>
                                <span>View Full Menu</span>
                                <span>➔</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/about")}
                                className="bg-[#fffdf9] hover:bg-[#eee7d7] active:scale-95 text-[#1a1612] font-typewriter font-bold text-[11px] sm:text-xs uppercase px-3.5 py-1.5 border-2 border-[#1a1612] rounded-lg newspaper-shadow-sm transition cursor-pointer flex items-center gap-1.5 shadow"
                            >
                                <span>📜</span>
                                <span>Our Story (About)</span>
                                <span>➔</span>
                            </button>
                        )}

                        {/* Wire Waiter Button */}
                        <button
                            onClick={() => setIsWaiterOpen(true)}
                            className="bg-[#eee7d7] hover:bg-[#e4dbca] active:scale-95 text-[#1a1612] font-typewriter font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-2 border-[#1a1612] rounded-lg newspaper-shadow flex items-center gap-2 transition duration-150 cursor-pointer group max-w-[175px] sm:max-w-[210px]"
                        >
                            <span className="text-base sm:text-lg group-hover:rotate-12 transition-transform flex-shrink-0">
                                🛎️
                            </span>
                            <div className="text-left min-w-0">
                                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#1a1612] block truncate">
                                    Wire Waiter
                                </span>
                                <span className="text-[9px] sm:text-[11px] text-[#5c5346] block leading-tight font-semibold truncate">
                                    Table #{tableNo} • Call
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* 1. KITCHEN WIRE / EDITORIAL PROOF MODAL (2 SECTIONS)      */}
            {/* ========================================================= */}
            {isFoodPrepOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => !isOrdering && setIsFoodPrepOpen(false)}
                >
                    <div
                        className="bg-[#f7f3eb] border-4 border-[#1a1612] max-w-xl w-full max-h-[92vh] flex flex-col newspaper-shadow-lg overflow-hidden text-[#1a1612]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* News Galley Header */}
                        <div className="p-3.5 sm:p-4 bg-[#eee7d7] border-b-2 border-[#1a1612] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🖨️</span>
                                <div>
                                    <h3 className="font-headline text-lg sm:text-2xl font-black uppercase tracking-tight">
                                        Kitchen Editorial Proof
                                    </h3>
                                    <p className="font-typewriter text-[11px] sm:text-xs text-[#5c5346]">
                                        Table #{tableNo} • {hasActiveOrders ? `${activeOrders.length} Order(s) Cooking` : "Draft Galley"} • {totalCount} Items in Draft
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => !isOrdering && setIsFoodPrepOpen(false)}
                                className="font-typewriter font-bold text-xs sm:text-sm bg-[#1a1612] text-[#f7f3eb] px-2.5 py-1 border border-black hover:bg-red-900 transition cursor-pointer"
                            >
                                [✕ CLOSE]
                            </button>
                        </div>

                        {/* Modal Body: Two Sections Layout */}
                        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-6 font-editorial">
                            
                            {/* ======================================================= */}
                            {/* SECTION 1: ACTIVE ORDER(S) IN KITCHEN PRESS            */}
                            {/* ======================================================= */}
                            {hasActiveOrders && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-[#1a1612] text-[#f7f3eb] px-3 py-2 border-2 border-black">
                                        <div className="flex items-center gap-2">
                                            <span className="animate-pulse text-amber-400">🔥</span>
                                            <span className="font-typewriter font-black text-xs uppercase tracking-wider text-amber-300">
                                                SECTION 1: ACTIVE IN KITCHEN PRESS ({activeOrders.length})
                                            </span>
                                        </div>
                                        <span className="font-typewriter text-[10px] bg-red-800 px-2 py-0.5 rounded font-bold">
                                            LIVE COOKING
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {activeOrders.map((ord) => (
                                            <ActiveOrderCard
                                                key={ord.orderId}
                                                order={ord}
                                                onDismiss={cancelActiveOrder}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ======================================================= */}
                            {/* SECTION 2: NEW / ADDITIONAL ORDER (DRAFT / CART)       */}
                            {/* ======================================================= */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-[#eee7d7] text-[#1a1612] px-3 py-2 border-2 border-[#1a1612]">
                                    <div className="flex items-center gap-2">
                                        <span>📝</span>
                                        <span className="font-typewriter font-black text-xs uppercase tracking-wider">
                                            {hasActiveOrders
                                                ? "SECTION 2: NEW / ADDITIONAL ORDER (DRAFT)"
                                                : "SECTION 1: ORDER GALLEY (DRAFT)"}
                                        </span>
                                    </div>
                                    {cartItems.length > 0 && (
                                        <span className="font-typewriter text-[10px] bg-[#1a1612] text-[#f7f3eb] px-2 py-0.5 rounded font-bold">
                                            {totalCount} ITEMS IN DRAFT
                                        </span>
                                    )}
                                </div>

                                {cartItems.length === 0 ? (
                                    <div className="text-center py-6 px-4 bg-[#fffdf9] border-2 border-dashed border-[#1a1612]/40 font-typewriter text-[#6b5f50] rounded">
                                        <span className="text-3xl block mb-1">📰</span>
                                        <p className="font-bold text-xs sm:text-sm uppercase text-[#1a1612]">
                                            {hasActiveOrders
                                                ? "+ ADD EXTRA DISHES OR NEXT COURSE"
                                                : "The Galley is Currently Empty"}
                                        </p>
                                        <p className="text-[11px] mt-1 text-[#5c5346]">
                                            {hasActiveOrders
                                                ? "Want to order more tea, breads, sides or dessert while your food is cooking?"
                                                : "Select articles from the menu to compile your dining edition!"}
                                        </p>
                                        <button
                                            onClick={() => setIsFoodPrepOpen(false)}
                                            className="mt-3 bg-[#1a1612] text-[#f7f3eb] px-4 py-1.5 font-typewriter font-bold text-xs uppercase border border-black hover:bg-[#383129] cursor-pointer transition rounded"
                                        >
                                            📜 Browse Menu & Add Dishes ➔
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Cart Items List */}
                                        <div className="divide-y divide-[#1a1612]/20 bg-[#fffdf9] border-2 border-[#1a1612] p-3 rounded">
                                            {cartItems.map((item) => {
                                                const rawPrice =
                                                    typeof item.price === "string"
                                                        ? parseFloat(item.price.replace(/[^\d.]/g, "")) || 0
                                                        : Number(item.price) || 0;
                                                const subtotal = rawPrice * item.quantity;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                                                    >
                                                        {/* Item Details */}
                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                            {item.image && (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="w-11 h-11 rounded object-cover border border-[#1a1612] grayscale-[30%] flex-shrink-0"
                                                                    onError={(e) => {
                                                                        e.target.src =
                                                                            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80";
                                                                    }}
                                                                />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        className={`w-2 h-2 rounded-full ${
                                                                            item.veg ? "bg-green-700" : "bg-red-700"
                                                                        }`}
                                                                    ></span>
                                                                    <h4 className="font-headline font-black text-sm truncate">
                                                                        {item.name}
                                                                    </h4>
                                                                </div>
                                                                <span className="font-typewriter text-[10.5px] text-[#5c5346] block">
                                                                    Rate: {item.price} • ⏱️ {item.prepTime ? (item.prepTime.startsWith("Upto") ? item.prepTime : `Upto ${item.prepTime}`) : "Upto 15 Mins"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Quantity Controls & Total */}
                                                        <div className="flex items-center gap-2.5 font-typewriter">
                                                            <div className="flex items-center bg-[#eee7d7] border border-[#1a1612]">
                                                                <button
                                                                    onClick={() => addToCart(item, -1)}
                                                                    className="px-2 py-0.5 text-[#1a1612] hover:bg-[#ded4be] font-bold text-xs cursor-pointer"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="px-2 py-0.5 bg-[#1a1612] text-[#f7f3eb] font-bold text-xs">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => addToCart(item, 1)}
                                                                    className="px-2 py-0.5 text-[#1a1612] hover:bg-[#ded4be] font-bold text-xs cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <div className="text-right min-w-[55px]">
                                                                <span className="font-headline font-black text-sm sm:text-base block">
                                                                    ₹{subtotal}
                                                                </span>
                                                                <button
                                                                    onClick={() => removeFromCart(item.id)}
                                                                    className="text-[9.5px] text-red-900 hover:underline uppercase font-bold cursor-pointer"
                                                                >
                                                                    [Drop]
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Chef's Instructions Note */}
                                        <div className="font-typewriter text-xs">
                                            <label className="font-bold text-[#1a1612] uppercase block mb-1">
                                                📝 Telegraphic Instructions to Chef for this Order:
                                            </label>
                                            <input
                                                type="text"
                                                value={specialNote}
                                                onChange={(e) => setSpecialNote(e.target.value)}
                                                placeholder="e.g., Less spicy, extra crispy, no onions"
                                                className="w-full bg-[#eee7d7] border border-[#1a1612] px-3 py-2 text-xs text-[#1a1612] placeholder-[#8a7c6a] focus:outline-none focus:bg-[#fffcf7]"
                                            />
                                        </div>

                                        {/* Table Prep Time Estimate Calculation for New Batch */}
                                        <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-2.5 font-typewriter text-xs flex items-center justify-between">
                                            <div>
                                                <span className="font-bold uppercase text-red-900 block">
                                                    ⏱️ THIS ORDER ESTIMATED TIME:
                                                </span>
                                                <span className="text-[10px] text-[#5c5346]">
                                                    {tablePrepDetails?.assignedChefs === 1
                                                        ? "Calculated for 1 Dedicated Master Chef"
                                                        : "Calculated for 2 Parallel Master Chefs"}
                                                </span>
                                            </div>
                                            <span className="font-headline font-black text-base sm:text-lg text-[#1a1612]">
                                                Upto {tablePrepTime} Mins
                                            </span>
                                        </div>

                                        {/* Price & Send Button */}
                                        <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-3 flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-headline text-sm font-black uppercase">
                                                    {hasActiveOrders ? "Additional Order Total:" : "Net Edition Cost:"}
                                                </span>
                                                <span className="font-headline text-xl sm:text-2xl font-black">
                                                    ₹{totalAmount}/-
                                                </span>
                                            </div>

                                            <button
                                                onClick={handlePlaceOrder}
                                                disabled={isOrdering}
                                                className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-typewriter font-bold py-3 text-xs sm:text-sm uppercase tracking-wider border-2 border-black newspaper-shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isOrdering ? (
                                                    <span>Transmitting Order to Kitchen Press...</span>
                                                ) : (
                                                    <>
                                                        <span>
                                                            {hasActiveOrders
                                                                ? `CONFIRM & SEND ADDITIONAL ORDER (UPTO ${tablePrepTime} MINS)`
                                                                : `CONFIRM & SEND TO KITCHEN PRESS (UPTO ${tablePrepTime} MINS)`}
                                                        </span>
                                                        <span>➔</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 2. TELEGRAPHIC WIRE DESK / WAIT CALL MODAL               */}
            {/* ========================================================= */}
            {isWaiterOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                    onClick={() => !isWaiterSubmitting && setIsWaiterOpen(false)}
                >
                    <div
                        className="bg-[#f7f3eb] border-4 border-[#1a1612] p-6 max-w-md w-full newspaper-shadow-lg text-[#1a1612] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => !isWaiterSubmitting && setIsWaiterOpen(false)}
                            className="absolute top-4 right-4 font-typewriter font-bold text-xs bg-[#1a1612] text-[#f7f3eb] px-2 py-1 hover:bg-red-900 transition cursor-pointer"
                        >
                            [✕]
                        </button>

                        <div className="flex items-center gap-3 mb-3 border-b-2 border-[#1a1612] pb-3">
                            <span className="text-3xl">🛎️</span>
                            <div>
                                <h3 className="font-headline text-2xl font-black uppercase">
                                    Telegraphic Wire
                                </h3>
                                <p className="font-typewriter text-xs text-[#5c5346]">
                                    Direct Dispatch to Floor Manager & Server
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCallWaiter} className="flex flex-col gap-3.5 font-typewriter text-xs">
                            {/* LOCKED Table Number Card (Patron cannot edit) */}
                            <div className="bg-[#eee7d7] border-2 border-[#1a1612] p-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🔒</span>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase block text-[#71695f]">
                                            Assigned Table (Device Locked):
                                        </label>
                                        <span className="font-headline font-black text-base text-[#1a1612]">
                                            TABLE #{tableNo}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsWaiterOpen(false);
                                        setIsStaffUnlockOpen(true);
                                    }}
                                    title="Waiters can unlock with Master Passcode"
                                    className="text-[10px] bg-[#1a1612] hover:bg-amber-500 hover:text-black text-amber-300 font-bold px-2 py-1 rounded cursor-pointer transition border border-amber-400"
                                >
                                    Staff Unlock 🔓
                                </button>
                            </div>

                            {/* Service Type Selection */}
                            <div>
                                <label className="font-bold uppercase block mb-1.5">
                                    Select Telegram Subject:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {quickRequests.map((req) => (
                                        <button
                                            key={req.id}
                                            type="button"
                                            onClick={() => setSelectedRequest(req.id)}
                                            className={`p-2 border-2 text-left font-bold transition cursor-pointer ${
                                                selectedRequest === req.id
                                                    ? "bg-[#1a1612] text-[#f7f3eb] border-[#1a1612]"
                                                    : "bg-[#eee7d7] text-[#1a1612] border-[#1a1612]/70 hover:bg-[#e2d8c3]"
                                            }`}
                                        >
                                            {req.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Send Wire Button */}
                            <button
                                type="submit"
                                disabled={isWaiterSubmitting}
                                className="w-full bg-[#1a1612] hover:bg-[#332c25] active:scale-95 text-[#f7f3eb] font-bold py-3 px-4 text-sm uppercase tracking-wider border-2 border-black newspaper-shadow transition cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                            >
                                {isWaiterSubmitting ? (
                                    <span>Transmitting Wire...</span>
                                ) : (
                                    <>
                                        <span>Transmit Wire to Table #{tableNo}</span>
                                        <span>⚡</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff Passcode Reassign Modal */}
            <StaffTableUnlockModal
                isOpen={isStaffUnlockOpen}
                onClose={() => setIsStaffUnlockOpen(false)}
                currentTable={tableNo}
                onTableUpdated={(newT) => setTableNo(newT)}
            />
        </>
    );
};

export default BottomBar;

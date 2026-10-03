import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { calculateTablePrepDetails } from "../utils/kitchenEstimate";
import { syncCartApi, placeOrderApi, getOrdersApi } from "../api";
import { getSocket } from "../utils/socket";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    // Load initial cart from localStorage
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem("restaurant_cart");
            return savedCart ? JSON.parse(savedCart) : {};
        } catch (error) {
            console.error("Failed to load cart from localStorage:", error);
            return {};
        }
    });

    // Load active kitchen orders
    const [activeOrders, setActiveOrders] = useState(() => {
        try {
            const savedOrders = localStorage.getItem("active_kitchen_orders");
            if (savedOrders) {
                const parsed = JSON.parse(savedOrders);
                if (Array.isArray(parsed)) {
                    return parsed.filter((o) => Date.now() - new Date(o.orderedAt).getTime() < 3 * 60 * 60 * 1000);
                }
            }
            return [];
        } catch (error) {
            console.error("Failed to load active kitchen orders:", error);
            return [];
        }
    });

    const activeOrder = activeOrders.length > 0 ? activeOrders[activeOrders.length - 1] : null;
    const syncDebounceTimer = useRef(null);

    // Synchronize Cart with Redis in background (flushes to DB in 5 min)
    useEffect(() => {
        try {
            localStorage.setItem("restaurant_cart", JSON.stringify(cart));
        } catch (error) {
            console.error("Failed to save cart to localStorage:", error);
        }

        // Debounced Redis Sync (500ms debounce to avoid spamming while tapping buttons)
        if (syncDebounceTimer.current) clearTimeout(syncDebounceTimer.current);
        syncDebounceTimer.current = setTimeout(() => {
            const tableNo = localStorage.getItem("restaurant_table_no") || "4";
            const email = localStorage.getItem("user_email") || "";
            const totalCount = Object.values(cart).reduce((sum, item) => sum + (typeof item === "object" ? item?.quantity || 0 : Number(item) || 0), 0);
            const totalAmount = Object.values(cart).reduce((sum, item) => {
                if (typeof item === "object" && item) {
                    const qty = item.quantity || 1;
                    const price = typeof item.price === "string" ? parseFloat(item.price.replace(/[^\d.]/g, "")) || 0 : Number(item.price) || 0;
                    return sum + price * qty;
                }
                return sum;
            }, 0);

            syncCartApi({
                tableNo,
                email,
                items: cart,
                totalCount,
                totalAmount,
            }).catch(() => {});
        }, 500);

        return () => {
            if (syncDebounceTimer.current) clearTimeout(syncDebounceTimer.current);
        };
    }, [cart]);

    // Save active orders updates to localStorage
    useEffect(() => {
        try {
            if (activeOrders.length > 0) {
                localStorage.setItem("active_kitchen_orders", JSON.stringify(activeOrders));
                localStorage.setItem("active_kitchen_order", JSON.stringify(activeOrders[activeOrders.length - 1]));
            } else {
                localStorage.removeItem("active_kitchen_orders");
                localStorage.removeItem("active_kitchen_order");
            }
        } catch (error) {
            console.error("Failed to save active orders:", error);
        }
    }, [activeOrders]);

    // Real-time WebSocket Listeners for Order updates
    useEffect(() => {
        const tableNo = localStorage.getItem("restaurant_table_no") || "4";
        
        // Initial fetch of active orders from backend
        getOrdersApi(tableNo)
            .then((res) => {
                if (res?.orders && res.orders.length > 0) {
                    const tableUnpaid = res.orders.filter(o => o.tableNo === String(tableNo) && o.paymentStatus !== "PAID");
                    if (tableUnpaid.length > 0) {
                        setActiveOrders(tableUnpaid);
                    }
                }
            })
            .catch(() => {});

        const socket = getSocket();
        if (socket) {
            socket.emit("join_room", `table_${tableNo}`);

            // Real-time status update from Chef / KDS
            socket.on("order_status_changed", (updatedOrder) => {
                if (updatedOrder && String(updatedOrder.tableNo) === String(tableNo)) {
                    setActiveOrders((prev) => {
                        const exists = prev.some((o) => o.orderId === updatedOrder.orderId);
                        if (exists) {
                            return prev.map((o) => (o.orderId === updatedOrder.orderId ? { ...o, ...updatedOrder } : o));
                        }
                        return [...prev, updatedOrder];
                    });
                }
            });

            // Real-time bill settlement
            socket.on("bill_settled", (settledBill) => {
                if (settledBill && String(settledBill.tableNo) === String(tableNo)) {
                    setActiveOrders([]);
                    localStorage.removeItem("active_kitchen_orders");
                    localStorage.removeItem("active_kitchen_order");
                }
            });
        }
    }, []);

    // Add / Update item quantity
    const addToCart = (item, delta = 1) => {
        if (!item || !item.id) return;

        setCart((prev) => {
            const existing = prev[item.id];
            const currentQty = typeof existing === "object" ? existing.quantity || 0 : typeof existing === "number" ? existing : 0;
            const newQty = Math.max(0, currentQty + delta);
            const updated = { ...prev };

            if (newQty === 0) {
                delete updated[item.id];
            } else {
                updated[item.id] = {
                    ...item,
                    quantity: newQty,
                };
            }

            return updated;
        });
    };

    // Remove single item completely
    const removeFromCart = (itemId) => {
        setCart((prev) => {
            const updated = { ...prev };
            delete updated[itemId];
            return updated;
        });
    };

    // Clear entire cart
    const clearCart = () => {
        setCart({});
    };

    // Get quantity of a single item
    const getItemQuantity = (itemId) => {
        const item = cart[itemId];
        if (!item) return 0;
        return typeof item === "object" ? item.quantity || 0 : typeof item === "number" ? item : 0;
    };

    // Array of selected items with quantities
    const cartItems = useMemo(() => {
        return Object.values(cart)
            .map((val) => {
                if (typeof val === "object" && val !== null) {
                    return val;
                }
                return null;
            })
            .filter(Boolean);
    }, [cart]);

    // Total quantity of all items
    const totalCount = useMemo(() => {
        return Object.values(cart).reduce((sum, item) => {
            const qty = typeof item === "object" ? item?.quantity || 0 : typeof item === "number" ? item : 0;
            return sum + qty;
        }, 0);
    }, [cart]);

    // Total Amount calculated from items
    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const qty = item.quantity || 0;
            const rawPrice = item.price;
            const numPrice =
                typeof rawPrice === "string"
                    ? parseFloat(rawPrice.replace(/[^\d.]/g, "")) || 0
                    : Number(rawPrice) || 0;
            return sum + numPrice * qty;
        }, 0);
    }, [cartItems]);

    // Live estimated preparation time and chef assignment
    const tablePrepDetails = useMemo(() => {
        return calculateTablePrepDetails(cartItems);
    }, [cartItems]);

    const tablePrepTime = tablePrepDetails.estimatedMinutes;

    // Place Kitchen Order
    const placeKitchenOrder = async (specialNote = "") => {
        if (cartItems.length === 0) return null;

        const details = calculateTablePrepDetails(cartItems);
        const prepMinutes = details.estimatedMinutes;
        const assignedChefs = details.assignedChefs;
        const chefLabel = details.chefLabel;
        const roundNumber = activeOrders.length + 1;
        const orderId = `PRESS-${Math.floor(1000 + Math.random() * 9000)}`;
        const tableNo = localStorage.getItem("restaurant_table_no") || "4";
        const email = localStorage.getItem("user_email") || "";
        const name = localStorage.getItem("user_name") || "";
        const now = Date.now();

        const orderPayload = {
            orderId,
            roundNumber,
            tableNo,
            items: [...cartItems],
            totalCount,
            totalAmount,
            specialNote,
            prepMinutes,
            assignedChefs,
            chefLabel,
            customerEmail: email,
            customerName: name,
            orderedAt: new Date(now).toISOString(),
            readyAt: new Date(now + prepMinutes * 60 * 1000).toISOString(),
            status: "Pending",
        };

        // Post to Backend
        try {
            await placeOrderApi(orderPayload);
        } catch (err) {
            console.warn("Backend order placement fallback:", err.message);
        }

        setActiveOrders((prev) => [...prev, orderPayload]);
        clearCart();
        return orderPayload;
    };

    // Cancel / Dismiss Active Order
    const cancelActiveOrder = (orderId = null) => {
        if (orderId) {
            setActiveOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        } else {
            setActiveOrders([]);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                cartItems,
                addToCart,
                removeFromCart,
                clearCart,
                getItemQuantity,
                totalCount,
                totalAmount,
                tablePrepTime,
                tablePrepDetails,
                activeOrder,
                activeOrders,
                placeKitchenOrder,
                cancelActiveOrder,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

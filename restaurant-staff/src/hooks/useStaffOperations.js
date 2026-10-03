import { useState, useEffect, useCallback } from 'react';
import { getOrders, getWaiterCalls, getTableStatusApi } from '../api/staffApi';
import { getStaffSocket } from '../utils/socket';
import { sounds } from '../utils/audio';

/**
 * Hook to manage operational restaurant data (Orders, Waiter Calls, Tables)
 * with periodic background sync and real-time WebSocket updates.
 */
export function useStaffOperations() {
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [tableSessions, setTableSessions] = useState([]);
  const [liveToast, setLiveToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync operations with backend API
  const refreshOperations = useCallback(async () => {
    try {
      setLoading(true);
      const [oRes, wRes, tRes] = await Promise.all([
        getOrders().catch(() => null),
        getWaiterCalls().catch(() => null),
        getTableStatusApi().catch(() => null),
      ]);

      if (oRes?.success) setOrders(oRes.orders || []);
      if (wRes?.success) setWaiterCalls(wRes.calls || []);
      if (tRes?.success) setTableSessions(tRes.tables || []);
    } catch (err) {
      console.error('Error synchronizing operations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Periodic polling fallback (every 4 seconds)
  useEffect(() => {
    refreshOperations();
    const interval = setInterval(refreshOperations, 4000);
    return () => clearInterval(interval);
  }, [refreshOperations]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    const socket = getStaffSocket();
    if (!socket) return;

    // Waiter Calling Bell Alert
    const handleWaiterAlert = (callData) => {
      sounds.playWaiterBell();
      setWaiterCalls((prev) => [callData, ...prev.filter((c) => c.callId !== callData.callId)]);
      setLiveToast({
        title: `🛎️ TABLE #${callData.tableNo} SERVICE BELL!`,
        message: `${callData.requestLabel} (${callData.note || 'Service Requested'})`,
        type: 'bell',
        call: callData,
      });
    };

    // Waiter Call State Updated
    const handleWaiterCallUpdated = (callData) => {
      setWaiterCalls((prev) =>
        prev.map((c) => (c.callId === callData.callId ? { ...c, ...callData } : c))
      );
      refreshOperations();
    };

    // Table Session Changed
    const handleTableSessionUpdated = (data) => {
      if (data?.allSessions) {
        setTableSessions(data.allSessions);
      } else {
        refreshOperations();
      }
    };

    // Kitchen Order Dispatched
    const handleNewOrder = (orderData) => {
      sounds.playNewOrderAlert();
      setOrders((prev) => [orderData, ...prev.filter((o) => o.orderId !== orderData.orderId)]);
      setLiveToast({
        title: `🍳 NEW ORDER: Table #${orderData.tableNo}`,
        message: `${orderData.items?.length || 1} items (${orderData.customerName || 'Guest'})`,
        type: 'order',
        order: orderData,
      });
    };

    // Kitchen Order Status Changed
    const handleOrderStatusUpdated = (orderData) => {
      if (orderData.status === 'Ready to Serve') {
        sounds.playFoodReadyChime();
        setLiveToast({
          title: `🍲 DISH READY: Table #${orderData.tableNo}`,
          message: `Order #${orderData.orderId} prepared & ready to serve!`,
          type: 'ready',
        });
      }
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderData.orderId ? { ...o, ...orderData } : o))
      );
      refreshOperations();
    };

    // Bill Settled
    const handleBillSettled = (billData) => {
      sounds.playCashRegister();
      refreshOperations();
    };

    socket.on('waiter_alert', handleWaiterAlert);
    socket.on('waiter_call_updated', handleWaiterCallUpdated);
    socket.on('table_session_updated', handleTableSessionUpdated);
    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleOrderStatusUpdated);
    socket.on('bill_settled', handleBillSettled);

    return () => {
      socket.off('waiter_alert', handleWaiterAlert);
      socket.off('waiter_call_updated', handleWaiterCallUpdated);
      socket.off('table_session_updated', handleTableSessionUpdated);
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleOrderStatusUpdated);
      socket.off('bill_settled', handleBillSettled);
    };
  }, [refreshOperations]);

  return {
    orders,
    setOrders,
    waiterCalls,
    setWaiterCalls,
    tableSessions,
    setTableSessions,
    liveToast,
    setLiveToast,
    loading,
    refreshOperations,
  };
}

export default useStaffOperations;

import React, { useState, useEffect } from 'react';
import { StaffAuthProvider, useStaffAuth } from './context/StaffAuthContext';
import { useStaffOperations } from './hooks/useStaffOperations';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { AppRoutes } from './routes/AppRoutes';
import LoginPage from './pages/LoginPage';
import FloatingStaffDock from './components/FloatingStaffDock';
import NotificationHubModal from './components/NotificationHubModal';
import { updateCallStatus } from './api/staffApi';
import { sounds } from './utils/audio';

function StaffAppContent() {
  const { staffUser, isAuthenticated, logoutStaff } = useStaffAuth();
  
  // URL Hash Route Sync
  const getInitialSection = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('food') || hash.includes('kitchen')) return 'kitchen';
    if (hash.includes('coupon')) return 'coupons';
    if (hash.includes('manager')) return 'manager';
    if (hash.includes('root')) return 'root';
    return 'main';
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [selectedTable, setSelectedTable] = useState('4');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Inactivity auto-logout hook
  useInactivityTimer(isAuthenticated, logoutStaff);

  // Live operational data hook (Orders, Waiter Calls, Table Sessions, WebSockets)
  const {
    orders,
    waiterCalls,
    tableSessions,
    liveToast,
    setLiveToast,
    refreshOperations,
  } = useStaffOperations();

  // Navigation handler
  const handleNavigate = (section) => {
    setActiveSection(section);
    if (section === 'kitchen') {
      window.location.hash = '#/food-control';
    } else if (section === 'coupons') {
      window.location.hash = '#/coupons';
    } else if (section === 'manager') {
      window.location.hash = '#/manager';
    } else if (section === 'root') {
      window.location.hash = '#/root';
    } else {
      window.location.hash = '#/dashboard';
    }
  };

  // Browser hash change listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('food') || hash.includes('kitchen')) {
        setActiveSection('kitchen');
      } else if (hash.includes('coupon')) {
        setActiveSection('coupons');
      } else if (hash.includes('manager')) {
        setActiveSection('manager');
      } else if (hash.includes('root')) {
        setActiveSection('root');
      } else {
        setActiveSection('main');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Quick attend / resolve handlers from notifications
  const handleAttendCall = async (call) => {
    try {
      sounds.playTick();
      await updateCallStatus(call.callId, 'ATTENDING', staffUser?.name || 'Floor Attendant');
      await refreshOperations();
      setLiveToast(null);
    } catch (e) {
      console.error('Error attending call:', e);
    }
  };

  const handleResolveCall = async (call) => {
    try {
      sounds.playTick();
      await updateCallStatus(call.callId, 'RESOLVED', staffUser?.name || 'Floor Attendant');
      await refreshOperations();
      setLiveToast(null);
    } catch (e) {
      console.error('Error resolving call:', e);
    }
  };

  const activeOrdersCount = orders.filter((o) => o.status !== 'Completed').length;
  const pendingCalls = waiterCalls.filter((c) => c.status === 'PENDING');
  const activeCallsCount = pendingCalls.length;

  // Unauthenticated Lock Screen
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={refreshOperations}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#1a1612] flex flex-col font-editorial selection:bg-[#1a1612] selection:text-[#f7f3eb] pb-28 pt-3 sm:pt-4">
      {/* 1. Floating Live Toast Alerts */}
      {liveToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-[#140e0a]/95 backdrop-blur-xl text-amber-300 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl animate-bounce font-ui">
          <div className="flex items-start justify-between">
            <span className="font-bold text-xs">{liveToast.title}</span>
            <button
              onClick={() => setLiveToast(null)}
              className="text-amber-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-amber-100/90 mt-1">{liveToast.message}</p>
          {liveToast.call && liveToast.call.status === 'PENDING' && (
            <div className="mt-2 pt-2 border-t border-amber-900/40 flex items-center gap-2">
              <button
                onClick={() => handleAttendCall(liveToast.call)}
                className="bg-amber-400 hover:bg-yellow-300 text-black font-bold px-3 py-1 rounded-xl text-xs uppercase cursor-pointer"
              >
                🏃 Attend Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Main Page Content View */}
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-2 max-w-7xl mx-auto">
        <AppRoutes
          activeSection={activeSection}
          orders={orders}
          waiterCalls={waiterCalls}
          tableSessions={tableSessions}
          onSelectTable={(t) => setSelectedTable(t)}
          onSwitchSection={handleNavigate}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onRefreshTables={refreshOperations}
        />
      </main>

      {/* 3. Floating Operations Dock */}
      <FloatingStaffDock
        activeSection={activeSection}
        onNavigate={handleNavigate}
        activeCallsCount={activeCallsCount}
        activeOrdersCount={activeOrdersCount}
        onOpenNotifications={() => setIsNotificationOpen((prev) => !prev)}
        isNotificationOpen={isNotificationOpen}
        onLogout={logoutStaff}
      />

      {/* 4. Notification Hub Modal */}
      <NotificationHubModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        waiterCalls={waiterCalls}
        orders={orders}
        onAttendCall={handleAttendCall}
        onResolveCall={handleResolveCall}
        onNavigateKitchen={() => handleNavigate('kitchen')}
      />
    </div>
  );
}

export function App() {
  return (
    <StaffAuthProvider>
      <StaffAppContent />
    </StaffAuthProvider>
  );
}

export default App;


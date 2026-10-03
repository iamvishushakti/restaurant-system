import React from 'react';
import MainDashboard from '../components/MainDashboard';

/**
 * Dashboard Page - Main Floor Operations & Table Seating Radar
 */
export const DashboardPage = ({
  orders,
  waiterCalls,
  tableSessions,
  onSelectTable,
  onSwitchSection,
  onOpenNotifications,
  onRefreshTables,
}) => {
  return (
    <div className="w-full">
      <MainDashboard
        orders={orders}
        waiterCalls={waiterCalls}
        tableSessions={tableSessions}
        onSelectTable={onSelectTable}
        onSwitchSection={onSwitchSection}
        onOpenNotifications={onOpenNotifications}
        onRefreshTables={onRefreshTables}
      />
    </div>
  );
};

export default DashboardPage;
